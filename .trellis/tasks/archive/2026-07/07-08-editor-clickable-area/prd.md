# Inline Editor: Make Empty Area Clickable

## Goal

When editing a record (`.omm-edit-editor-host`), clicking anywhere in the editor's host div should focus the CM6 editor — not just on the first line of text. Currently only the text content area is clickable; the blank space below is not part of the editable area.

## Root Cause

The CM6 `.cm-content` element only occupies the height of the actual text content. The `.omm-edit-editor-host` div has `min-height: 80px`, but CM6's internal structure doesn't fill that space, leaving the bottom portion of the host div unresponsive to clicks/focus.

The composer (`.omm-editor-host`) may have the same CSS setup but hasn't been reported as broken — likely because it's at the top of the view and the user clicks on the text directly.

## Acceptance Criteria

- [x] Clicking anywhere in `.omm-edit-editor-host` (including blank space below text) focuses the CM6 editor and shows the cursor
- [x] Clicking on the host div but outside `.cm-content` still focuses the editor
- [x] The composer (`.omm-editor-host`) is NOT affected by these changes
- [x] Typecheck passes (`npm run typecheck`)
- [x] All tests pass (`npm test`)

## Approach

Choose the correct approach:

### Option A: CSS-only
If possible, make `.cm-content` stretch to fill the host div height so all of it is natively clickable. This requires the CM6 flex chain to receive an explicit height rather than relying on content-based sizing.

Potential CSS:
```css
.omm-edit-editor-host,
.omm-edit-editor-host .cm-editor,
.omm-edit-editor-host .cm-scroller {
  height: 80px; /* explicit height, not min-height */
}
.omm-edit-editor-host .cm-content {
  height: calc(80px - 24px); /* minus padding */
}
```

### Option B: JS click-to-focus
Add a click event listener on `.omm-edit-editor-host` that forwards clicks to the CM6 editor's `.cm-content`:

```typescript
host.addEventListener('click', (e: MouseEvent) => {
  if ((e.target as HTMLElement).closest('.cm-content')) return; // already clicking on content
  const cmContent = host.querySelector<HTMLElement>('.cm-content');
  if (cmContent) {
    e.preventDefault();
    cmContent.focus();
  }
});
```

### Option C: Both
Try CSS first, and if that's not reliable cross-platform, add JS as a fallback.

## Files to modify

- `styles.css` — add `.omm-edit-editor-host` styling (mirroring `.omm-editor-host` but with explicit heights)
- `src/view/QuickMemoView.ts` — may need click handler on the edit editor host

## Out of scope

- Changing the composer's `.omm-editor-host` behavior
- Any other CSS refactoring
