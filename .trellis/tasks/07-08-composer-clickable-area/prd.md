# Composer: Make Empty Area Clickable

## Goal

The main composer (`.omm-editor-host`) has the same issue as the inline edit editor did: only the first line of text is clickable to focus the CM6 editor. Clicking the blank space below does nothing.

## Fix

Apply the same pattern that was successful for `.omm-edit-editor-host`:
1. CSS: Add same min-height chain to ensure `.cm-editor`/`.cm-scroller`/`.cm-content` fill the host
2. JS: Add click-forwarding handler in `initEditor()` — when clicking on `.omm-editor-host` but not on `.cm-content`, programmatically focus `.cm-content`

## Acceptance Criteria

- [ ] Clicking anywhere in `.omm-editor-host` (including blank space) focuses the CM6 editor
- [ ] Typecheck passes
- [ ] All tests pass
