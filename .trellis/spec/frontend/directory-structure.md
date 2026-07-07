# Directory Structure

> How source code is organized in this Obsidian plugin.

## Source layout

```
src/
├── main.ts                       # Plugin entry: assembly only, no business logic
├── types.ts                      # Shared TypeScript types and interfaces
├── constants.ts                  # Plugin-wide constants
├── daily-notes/
│   ├── DailyNoteResolver.ts      # Date → file path resolution
│   ├── path.ts                   # Filename suffix + path pattern utils
│   └── obsidianInternal.ts       # Internal daily-notes config reader
├── editor/
│   └── native-editor.ts          # MarkdownEditor wrapper (embedRegistry)
├── index/
│   └── IndexService.ts           # Rebuildable in-memory cache
├── markdown/
│   ├── QuickMemoParser.ts        # Parse/serialize markdown records
│   ├── MarkdownRecordRepository.ts # CRUD on markdown files
│   └── id.ts                     # Block ID generation and extraction
├── settings/
│   ├── settings.ts               # Plugin settings type + defaults
│   └── SettingsTab.ts            # Obsidian settings tab UI
├── test/
│   ├── fakeVault.ts              # VaultLike test seam (in-memory)
│   └── fixtures.ts               # Test fixture helpers
├── view/
│   ├── QuickMemoView.ts          # ItemView — owns view state + lifecycle
│   ├── render.ts                 # Pure DOM renderer (jsdom-compatible)
│   └── viewState.ts              # Filter/sort/range helpers
└── vaultEvents.ts                # File change event handlers

tests/                            # Vitest test files (mirrors src/)
```

## Key architectural rules

- **`main.ts` is assembly only** — it wires services to Obsidian APIs but contains no business logic. Every service depends on `VaultLike` (defined in `src/types.ts`), not on Obsidian's `Vault`.
- **`src/view/render.ts` uses standard DOM API** (`document.createElement`), NOT Obsidian's `createDiv`/`createEl`. This lets it run under jsdom in tests.
- **`src/daily-notes/` is self-contained** — the resolver, path utils, and Obsidian config reader are in one package with clear boundaries.
- **Test files mirror source** — `tests/QuickMemoParser.test.ts` tests `src/markdown/QuickMemoParser.ts`, etc.
