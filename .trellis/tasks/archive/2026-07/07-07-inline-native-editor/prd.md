# Inline Native Editor for Record Editing

## Goal

Replace the plain `<textarea>` used for editing existing records with the same Obsidian MarkdownEditor (`NativeEditor`) that powers the composer, so the editing experience matches the main editing surface (Live Preview, EditorSuggest, mobile toolbar, easy-typing, etc.).

## Current behavior

1. User clicks ⋮ → 编辑 on a record card
2. `render.ts` renders a `<textarea class="omm-edit-input">` + `<select>` for type + save/cancel buttons
3. User edits in a plain textarea (no markdown rendering, no suggestions, no mobile toolbar)
4. Cmd+Enter doesn't save (only the save button works)

## Desired behavior

1. User clicks ⋮ → 编辑 on a record card
2. Renderer outputs a container `<div class="omm-edit-editor-host">` instead of `<textarea>`
3. After DOM render, `QuickMemoView` creates a `NativeEditor` instance inside that container
4. The editor shows the record's existing content (first line = content, rest = body)
5. User gets full Obsidian MarkdownEditor experience: Live Preview, `[[` suggestions, `#` tag completion, mobile toolbar, easy-typing
6. Save button reads content from the NativeEditor, Cancel destroys it
7. Cmd/Ctrl+Enter also saves (like the composer)
8. Type selector (`<select>` for 闪念/待办) stays as a standard element outside the editor

## Acceptance criteria

- [x] Editing a record shows the NativeEditor (not a textarea)
- [x] Live Preview rendering (bold, italic, etc.) works inline while editing
- [x] `[[` auto-completion for vault files works in the edit editor
- [x] `#` tag auto-completion works
- [x] Mobile toolbar activates when focusing the edit editor
- [x] Cmd/Ctrl+Enter saves the edited record and exits edit mode
- [x] Save button works
- [x] Cancel button works (discards changes, returns to view mode)
- [x] No memory leaks — editors are properly destroyed on cancel/save/re-render
- [x] `captureFocusRestore` handled for the edit editor (not just the composer)

## Out of scope

- Batch editing multiple records
- Drag-and-drop file attachment in the edit editor (composer only)
- Changing the editor header/type selector to NativeEditor

## Implementation notes

- `NativeEditor` class already exists at `src/editor/native-editor.ts`
- Composer init pattern in `QuickMemoView.ts`: `initEditor()` creates one NativeEditor in `.omm-editor-host`
- Edit mode lifecycle: `onEdit()` sets `editingRecordId` → `render()` → DOM has `.omm-edit-editor-host` → `initEditEditor()`
- Need to track the edit editor instance separately (`editEditor: NativeEditor | null`)
- On cancel/save: destroy the edit editor, clear `editingRecordId`, re-render
- `getValue()` on NativeEditor returns plain text — content/body splitting (first line vs rest) is handled in the save callback
