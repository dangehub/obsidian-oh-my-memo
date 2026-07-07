# Component Guidelines

> How UI components are built in this Obsidian plugin.

## Renderer pattern

The view uses a **pure DOM renderer** pattern — not a framework (React, Vue, etc.):

```typescript
// Good: pure render function driven by state + callbacks
function renderOverview(state: OverviewState, callbacks: OverviewCallbacks): HTMLElement {
  const container = document.createElement('div');
  container.className = 'omm-overview';
  container.appendChild(renderHeader(state, callbacks));
  container.appendChild(renderRecordList(state, callbacks));
  return container;
}
```

Key rules:
- Renderers use `document.createElement` (NOT Obsidian's `createDiv`/`createEl`) so they work under jsdom in tests.
- State flows in as plain objects (`OverviewState`), never via direct DOM reads.
- User actions flow out via typed callbacks (`OverviewCallbacks`).
- The renderer never touches files — it's emitted HTML only.

## View state ownership

`QuickMemoView` (an Obsidian `ItemView`) owns all mutable view state:

```typescript
// In QuickMemoView — single source of truth for UI state
private selectedDate: string;       // 'YYYY-MM-DD'
private filters: FilterState;
private editingRecordId: string | null;
private openMenuRecordId: string | null;
```

- Every mutation goes through the view → repository/index, never directly in the renderer.
- `recordKey(record)` from `render.ts` is used for identity (falls back to `filePath:lineStart` for id-less records) — don't use raw `record.id` directly.

## Record actions

Per-record actions (edit, delete, copy, open, toggle todo) live behind a **top-right ⋮ dropdown menu** on each card:

- The open dropdown is tracked via `openMenuRecordId` in view state.
- Clicking outside or pressing Escape closes the open menu.
- Only one menu can be open at a time.

## Midnight behavior

The view is long-lived and polls the local date once per minute. It rolls `selectedDate` to the new day at midnight — but only if the user is currently viewing "today" (browsing a historical date is never interrupted). Clean up all timers in `onClose`.

## Settings-driven reactivity

`saveSettings()` rebuilds the entire index and refreshes the view. This works because the parser, resolver, and index read settings at call time (dynamic getters, not captured strings). Do not add direct DOM manipulation for settings changes — let the rebuild cycle handle it.
