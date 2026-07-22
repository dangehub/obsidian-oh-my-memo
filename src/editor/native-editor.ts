import type { App, Editor } from 'obsidian';

/**
 * Native Obsidian Markdown editor for OhMyMemo's composer.
 *
 * This class leverages Obsidian's internal ``embedRegistry`` to create a
 * genuine ``MarkdownEditor`` instance — the very same editor that powers
 * Obsidian's note editing surface. By doing so we automatically inherit:
 *
 *   • Live Preview rendering (bold, italic, strikethrough, code blocks …)
 *   • EditorSuggest auto-completion for ``[[`` (vault files) and ``#`` (tags)
 *   • Third-party CM6 extensions registered via
 *     ``Plugin.registerEditorExtension()`` (e.g. easy-typing)
 *   • Mobile toolbar and all other native editing conveniences
 *
 * The approach mirrors what the Thino plugin does internally:
 *
 *   1. Call ``app.embedRegistry.embedByExtension.md()`` to create a markdown
 *      embed in our container element.
 *   2. Set ``editable = true`` and call ``showEditor()`` to switch to edit
 *      mode (rather than preview mode).
 *   3. Use ``embed.set('')`` / ``embed.editMode.get()`` /
 *      ``embed.editMode.editor`` to read and write content.
 *
 * Because we use Obsidian's own CM6 instance (bundled inside Obsidian) we no
 * longer need to ship ``@codemirror/*`` packages — ``main.js`` shrinks from
 * ~1 MB back to ~60 KB.
 *
 * Usage:
 *   const editor = new NativeEditor(hostDiv, app, () => this.onSave());
 *   const value = editor.getValue();
 *   editor.clear();
 *   editor.destroy();
 */
export class NativeEditor {
  private embed: any = null;
  private editMode: any = null;
  private editor: Editor | null = null;
  private host: HTMLElement;
  private app: App;
  private onCtrlEnter?: () => void;
  private keyHandler: ((e: KeyboardEvent) => void) | null = null;

  constructor(
    parent: HTMLElement,
    app: App,
    onCtrlEnter?: () => void,
  ) {
    this.host = parent;
    this.app = app;
    this.onCtrlEnter = onCtrlEnter;
    this.create();
  }

  private create(): void {
    try {
      // Access Obsidian's internal embedRegistry — not in the public type
      // declarations, so we go through ``any``.
      const embedRegistry = (this.app as any).embedRegistry;
      if (!embedRegistry?.embedByExtension?.md) {
        console.error('[OhMyMemo] embedRegistry.embedByExtension.md not found');
        return;
      }

      // Create a markdown embed inside our host element.
      this.embed = embedRegistry.embedByExtension.md(
        { app: this.app, containerEl: this.host },
        null, // file — null = create without a real file
        null, // parent
      );

      // Activate editable edit mode (CM6 Live Preview).
      this.embed.editable = true;
      this.embed.set('');
      this.embed.showEditor();

      // Grab the edit mode — this is the MarkdownEditor that wraps the CM6
      // EditorView and carries editorSuggest, livePreviewPlugin, etc.
      this.editMode = this.embed.editMode;
      this.editor = this.editMode?.editor ?? null;

      // The Obsidian MarkdownEditor embed ships with an inline-title input
      // and a metadata (properties) editor above the CM6 content area. On
      // desktop they're easy to overlook, but on mobile the inline-title
      // occupies the first line — the mobile toolbar won't activate on it
      // and the cursor can't cross between the title and body — making it
      // feel like "the first line is a title bar, the second line is where
      // editing actually starts". We hide both so the composer is a single
      // continuous editing surface.
      this.hideEmbedChrome();

      // Hook Cmd/Ctrl+Enter to trigger save — listen on the CM6 content DOM.
      if (this.editMode) {
        const cm = this.editMode.cm; // CM6 EditorView
        if (cm?.contentDOM) {
          this.keyHandler = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
              e.preventDefault();
              this.onCtrlEnter?.();
            }
          };
          cm.contentDOM.addEventListener('keydown', this.keyHandler);
        }
      }
    } catch (e) {
      console.error('[OhMyMemo] NativeEditor creation failed:', e);
    }
  }

  /** Hide the Obsidian embed's inline-title, metadata editor, and embed-link.
   *
   *  The ``MarkdownEditor`` embed created via ``embedRegistry`` includes:
   *    • ``inlineTitleEl`` — an inline title input above the CM6 body
   *    • ``metadataEditor`` — a properties panel (frontmatter editor)
   *    • ``markdown-embed-link`` — a "maximize" button in the top-right corner
   *
   *  On mobile the inline-title occupies the first line — the mobile toolbar
   *  won't activate on it and the cursor can't cross between the title and
   *  body — making it feel like "the first line is a title bar, the second
   *  line is where editing actually starts". The embed-link button opens the
   *  embed's source file in a new pane, but we have no file (``null``), so it
   *  navigates to a blank page. Hiding all three via ``display:none`` makes the
   *  composer a single contiguous editing surface with no stray UI. */
  private hideEmbedChrome(): void {
    if (!this.embed) return;
    try {
      const inlineTitle: HTMLElement | undefined = this.embed.inlineTitleEl;
      if (inlineTitle) {
        inlineTitle.style.display = 'none';
      }
    } catch { /* inlineTitleEl may not exist on all versions */ }
    try {
      const metadataEditor: any = this.embed.metadataEditor;
      const container: HTMLElement | undefined =
        metadataEditor?.containerEl ?? metadataEditor;
      if (container) {
        container.style.display = 'none';
      }
    } catch { /* metadataEditor may not exist on all versions */ }
    // Hide the "open in new pane" link button — we have no file to open.
    try {
      const embedLink = this.host.querySelector('.markdown-embed-link');
      if (embedLink) {
        (embedLink as HTMLElement).style.display = 'none';
      }
    } catch { /* embed-link may not exist */ }
  }

  /** Set the editor content to the given text. */
  setValue(value: string): void {
    if (this.editMode?.set) {
      try {
        this.editMode.set(value);
        return;
      } catch {
        /* fall through */
      }
    }
    if (this.editor) this.editor.setValue(value);
  }

  /** Returns the current editor content as plain text. */
  getValue(): string {
    if (this.editMode?.get) {
      try {
        return this.editMode.get() as string;
      } catch {
        /* fall through */
      }
    }
    if (this.editor) return this.editor.getValue();
    return '';
  }

  /** Clear all content from the editor. */
  clear(): void {
    if (this.editMode?.set) {
      try {
        this.editMode.set('');
        return;
      } catch {
        /* fall through */
      }
    }
    if (this.editor) this.editor.setValue('');
  }

  /** Focus the editor. */
  focus(): void {
    if (this.editMode?.focus) {
      try {
        this.editMode.focus();
        return;
      } catch {
        /* fall through */
      }
    }
    this.editor?.focus();
  }

  /** Insert text at the current cursor position. */
  insertAtCursor(text: string): void {
    if (this.editor) {
      this.editor.replaceSelection(text);
      this.editor.focus();
    }
  }

  /** The actual Obsidian Editor used by the composer integration bridge. */
  get obsidianEditor(): Editor | null {
    return this.editor;
  }

  /** Destroy the editor and release all resources. */
  destroy(): void {
    // Detach keyboard handler.
    if (this.keyHandler && this.editMode?.cm?.contentDOM) {
      this.editMode.cm.contentDOM.removeEventListener('keydown', this.keyHandler);
      this.keyHandler = null;
    }
    // Unload the embed — this cleans up CM6, event listeners, child components.
    if (this.embed?.onunload) {
      try {
        this.embed.onunload();
      } catch {
        /* already unloaded */
      }
    }
    // Clear the host DOM.
    this.host.innerHTML = '';
    this.embed = null;
    this.editMode = null;
    this.editor = null;
  }
}
