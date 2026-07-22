---
title: OhMyMemo (Quick Memo) Plugin
desc: Obsidian plugin for fast daily capture of records, flash thoughts, and todos
hue: 220
code:
  - src/markdown/MarkdownRecordRepository.ts
related:
  - src/types.ts
  - src/markdown/QuickMemoParser.ts
  - src/markdown/id.ts
  - src/index/IndexService.ts
  - src/daily-notes/DailyNoteResolver.ts
  - src/daily-notes/path.ts
  - src/settings/settings.ts
  - src/view/render.ts
  - src/view/QuickMemoView.ts
  - src/view/viewState.ts
  - src/main.ts
  - src/test/fakeVault.ts
  - src/settings/SettingsTab.ts
  - src/editor/native-editor.ts
  - src/editor/editor-bridge.ts
  - src/constants.ts
  - tests/MarkdownRecordRepository.test.ts
  - tests/QuickMemoParser.test.ts
  - tests/render.test.ts
  - tests/IndexService.test.ts
---

This is an Obsidian plugin that provides a daily capture system. It is **Markdown-native** — the Daily Note Markdown file is the only source of truth. The plugin reads and writes one `## <heading>` section per daily note and keeps a rebuildable in-memory index for search, filters, and the heatmap. There is no separate database.

## Record format

Records live under a `## <heading>` section in each date's Quick Memo file. Each record starts with a list item:

```
- 09:12 [闪念] content #tag ^oqm-YYYYMMDD-HHmmss-xxxx
  indented continuation = multi-line body
- [ ] 10:20 [待办] task #todo ^oqm-...
- [x] 11:00 [待办] done #todo ^oqm-...
```

The block id (`^oqm-...`) is **optional**. When `settings.enableBlockIds` is false, the plugin operates in **pure Markdown mode** — records are parsed, displayed, and indexed without block IDs, and all mutation operations (edit, toggle, delete) must work via a location-based fallback.

## Record identity and mutation contract

Records carry two forms of identity:

1. **Stable identity** (block ID, `^oqm-...`). When present, mutation operations use the block ID to locate the record in the file (by scanning all Quick Memo files for `candidate.id === id`). This is the primary and safest identity mechanism.

2. **Location-based identity** (file path + lineStart + lineEnd). When a record has no block ID, mutation operations MUST use the parsed record's `filePath`, `lineStart`, and `lineEnd` fields to locate and replace lines in the file. These values are captured by the parser at parse time and remain valid for a single read-modify-write cycle.

**Invariant**: Every mutation path (append, update, toggle, delete) MUST work for records both WITH and WITHOUT a block ID. The view layer MUST NOT block ID-less record mutations. The repository layer MUST provide location-based methods parallel to the ID-based ones.

**Safety**: The location-based methods (updateRecordByLocation, toggleTodoByLocation, deleteRecordByLocation) perform a targeted line range replacement. They assume the parsed location is correct for the current file content — this holds within a single index refresh cycle. If the file was modified externally, the next index rebuild will re-parse with corrected locations.

## Layer boundaries

```
main.ts (assembly) → services → VaultLike
```

- `VaultLike` is the test seam (defined in `src/test/fakeVault.ts`). Every service depends on `VaultLike`, not on Obsidian's `Vault`.
- `MarkdownRecordRepository` is the **only** module that mutates Markdown files. It provides append, update, toggle, and delete operations — each with both ID-based and location-based variants.
- `QuickMemoParser` is stateless — it parses Markdown into `QuickMemoRecord[]` and serializes `RecordDraft` back to Markdown lines.
- `IndexService` is a rebuildable cache. `rebuild()` reconstructs everything from Markdown.
- `QuickMemoView` owns view state and delegates all mutations to the repository.
- `render.ts` is a pure DOM renderer driven by `OverviewState` + `OverviewCallbacks`.

## Governing scope

This node is the root spec for the OhMyMemo plugin. Child nodes (when added) document subsystems.
