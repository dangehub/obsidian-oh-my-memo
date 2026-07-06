import { App } from 'obsidian';
import { EditorView, keymap, placeholder } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import {
  defaultKeymap,
  historyKeymap,
  history,
  indentWithTab,
} from '@codemirror/commands';
import { markdown, markdownLanguage, commonmarkLanguage } from '@codemirror/lang-markdown';
import {
  syntaxHighlighting,
  defaultHighlightStyle,
} from '@codemirror/language';
import {
  autocompletion,
  CompletionContext,
  CompletionResult,
  startCompletion,
} from '@codemirror/autocomplete';
import { GFM, Strikethrough, Subscript, Superscript } from '@lezer/markdown';

/**
 * CM6-based Markdown editor for OhMyMemo's composer.
 *
 * Replaces the plain `<textarea>` with a full CodeMirror 6 instance that
 * renders **bold**, *italic*, `code` and other Markdown formatting inline.
 * Autocomplete for `[[` (vault files) and `#` (tags) is provided through
 * CM6's built-in completion engine.
 *
 * Usage:
 *   const editor = new Cm6Editor(hostDiv, app, () => this.index.tags().map(...));
 *   const value = editor.getValue();
 *   editor.clear();
 *   editor.destroy();
 */
export class Cm6Editor {
  private view: EditorView;

  constructor(
    parent: HTMLElement,
    private app: App,
    private getTags: () => string[],
    private onCtrlEnter?: () => void,
  ) {
    const extensions = [
      // ── Editor behaviour ──
      keymap.of([
        ...defaultKeymap,
        ...historyKeymap,
        indentWithTab,
        // Cmd/Ctrl + Enter to save
        { key: 'Mod-Enter', run: () => { this.onCtrlEnter?.(); return true; } },
      ]),
      history(),
      EditorView.lineWrapping,
      EditorView.domEventHandlers({
        // Forward image paste to the custom handler
        paste: (event: ClipboardEvent) => {
          const items = event.clipboardData?.items;
          if (!items) return false;
          for (const item of Array.from(items)) {
            if (item.type.startsWith('image/')) {
              return false;
            }
          }
          return false;
        },
        // Trigger completion when user types [[ — CM6's activateOnTyping
        // ignores non-word characters like [, so we detect it here in the
        // DOM input handler and manually call startCompletion after the
        // next animation frame (by which time CM6 has synced its state).
        input: () => {
          requestAnimationFrame(() => {
            const v = this.view;
            const pos = v.state.selection.main.head;
            const before = v.state.sliceDoc(Math.max(0, pos - 2), pos);
            if (before === '[[') {
              startCompletion(v);
            }
          });
          return false;
        },
      }),
      placeholder('输入 Markdown，Cmd/Ctrl + Enter 保存'),

      // ── Markdown language (with GFM extensions for strikethrough etc.) ──
      markdown({
        base: markdownLanguage,
        codeLanguages: [],
        addKeymap: true,
        extensions: [GFM, Strikethrough, Subscript, Superscript],
      }),
      syntaxHighlighting(defaultHighlightStyle, { fallback: true }),

      // ── Autocomplete ([[ files, # tags) ──
      // activateOnTyping is true (default) so CM6 auto-triggers on word chars.
      // For non-word triggers like [[ we use a DOM input listener below.
      autocompletion({
        override: [this.completionSource.bind(this)],
        defaultKeymap: true,
        closeOnBlur: false,
      }),
    ];

    const state = EditorState.create({ doc: '', extensions });
    this.view = new EditorView({ state, parent });
  }

  /** Returns the current editor content as plain text. */
  getValue(): string {
    return this.view.state.doc.toString();
  }

  /** Clears all content from the editor. */
  clear(): void {
    const doc = this.view.state.doc;
    if (doc.length === 0) return;
    this.view.dispatch({
      changes: { from: 0, to: doc.length, insert: '' },
    });
  }

  /** Focus the editor. */
  focus(): void {
    this.view.focus();
  }

  /** Insert text at the current cursor position. */
  insertAtCursor(text: string): void {
    const { from } = this.view.state.selection.main;
    this.view.dispatch({
      changes: { from, insert: text },
      selection: { anchor: from + text.length },
    });
    this.view.focus();
  }

  /** Destroy the editor and release resources. */
  destroy(): void {
    this.view.destroy();
  }

  /* ------------------------------------------------------------------ */
  /*  Autocomplete source                                                 */
  /* ------------------------------------------------------------------ */

  private completionSource(
    context: CompletionContext,
  ): CompletionResult | null {
    const pos = context.pos;
    const textBefore = context.state.sliceDoc(0, pos);

    // ── [[ link completion ──
    const linkIdx = textBefore.lastIndexOf('[[');
    if (linkIdx >= 0) {
      const afterLink = textBefore.slice(linkIdx + 2);
      if (!afterLink.includes(']')) {
        const partial = afterLink.toLowerCase();
        const files = this.getFiles()
          .filter((f) => f.toLowerCase().includes(partial))
          .slice(0, 10)
          .map((f) => ({
            label: f,
            type: 'file',
            detail: '文件',
            apply: `[[${f}]]`,
          }));
        if (files.length > 0) {
          // filter:false + no validFor: CM6 won't filter or invalidate
          // our results on subsequent keystrokes, re-querying instead.
          return { from: linkIdx, options: files, filter: false, validFor: undefined as any };
        }
      }
    }

    // ── # tag completion ──
    const hashTail = textBefore.match(/(?:^|\s)(#[\w\u4e00-\u9fff\-]*)$/u);
    if (hashTail) {
      const rawTag = hashTail[1];
      const partial = rawTag.slice(1).toLowerCase();
      const stripHash = (t: string): string => t.startsWith('#') ? t.slice(1) : t;
      const tags = this.getTags()
        .map(stripHash)
        .filter((t) => t.toLowerCase().includes(partial))
        .slice(0, 10)
        .map((t) => ({
          label: `#${t}`,
          type: 'tag',
          detail: '标签',
          apply: `#${t} `,
        }));
      if (tags.length > 0) {
        const hashPos = textBefore.lastIndexOf('#', pos - 1);
        return {
          from: hashPos,
          options: tags,
          filter: false,
          validFor: undefined as any,
        };
      }
    }

    return null;
  }

  /** Get markdown file paths from the vault, stripped of `.md` extension. */
  private getFiles(): string[] {
    try {
      return this.app.vault
        .getMarkdownFiles()
        .map((f) => f.path.replace(/\.md$/u, ''))
        .sort();
    } catch (e) {
      console.warn('OhMyMemo Cm6Editor.getFiles() failed:', e);
      return [];
    }
  }
}
