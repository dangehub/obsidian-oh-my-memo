/**
 * Exposes OMM's native composer Editor to integrations such as Editing Toolbar
 * without changing the OMM view type or impersonating another plugin.
 */
import type { App, Editor, ItemView } from 'obsidian';

export interface EditorBridgeHandle {
  activate(editor: Editor, view: ItemView): void;
  notifyReattached(view: ItemView): void;
  cleanup(): void;
}

interface BridgeState {
  editor: Editor;
  view: ItemView;
  host: HTMLElement | null;
}

type WorkspaceWithActiveEditor = object & { activeEditor?: unknown };

const originals = new WeakMap<WorkspaceWithActiveEditor, PropertyDescriptor | null>();
const bridgeStates = new WeakMap<WorkspaceWithActiveEditor, BridgeState | null>();

function originalActiveEditor(workspace: WorkspaceWithActiveEditor): unknown {
  return originals.get(workspace)?.get?.call(workspace) ?? null;
}

function installGetter(workspace: WorkspaceWithActiveEditor): void {
  const prototype = Object.getPrototypeOf(workspace);
  originals.set(
    workspace,
    Object.getOwnPropertyDescriptor(prototype, 'activeEditor')
      ?? Object.getOwnPropertyDescriptor(workspace, 'activeEditor')
      ?? null,
  );
  Object.defineProperty(workspace, 'activeEditor', {
    configurable: true,
    get: () => {
      const realEditor = originalActiveEditor(workspace);
      if (realEditor) return realEditor;
      const bridge = bridgeStates.get(workspace);
      return bridge ? { editor: bridge.editor, view: bridge.view } : null;
    },
  });
}

function findHost(view: ItemView): HTMLElement | null {
  return view.contentEl.querySelector<HTMLElement>('.omm-native-editor-host');
}

function dispatch(host: HTMLElement, name: string, detail: Record<string, unknown>): void {
  host.dispatchEvent(new CustomEvent(name, { bubbles: true, detail }));
}

export function installEditorBridge(app: App): EditorBridgeHandle {
  const workspace = app.workspace as unknown as WorkspaceWithActiveEditor;
  if (!originals.has(workspace)) installGetter(workspace);

  return {
    activate(editor, view): void {
      const host = findHost(view);
      bridgeStates.set(workspace, { editor, view, host });
      if (host) dispatch(host, 'omm-editor-created', { editor, view, host });
    },
    notifyReattached(view): void {
      const bridge = bridgeStates.get(workspace);
      if (!bridge) return;
      const host = findHost(view);
      if (!host) return;
      bridgeStates.set(workspace, { ...bridge, view, host });
      dispatch(host, 'omm-editor-created', { editor: bridge.editor, view, host, reattached: true });
    },
    cleanup(): void {
      const bridge = bridgeStates.get(workspace);
      bridgeStates.set(workspace, null);
      if (bridge?.host) dispatch(bridge.host, 'omm-editor-destroyed', {});
    },
  };
}
