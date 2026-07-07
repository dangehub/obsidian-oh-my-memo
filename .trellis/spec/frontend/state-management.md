# State Management

> How state is managed in this Obsidian plugin.

## Principle: Markdown is the only source of truth

There is no database. The Daily Note Markdown file is the single source of truth. The plugin reads/writes one `## <heading>` section per daily note and keeps a rebuildable in-memory cache for search, filter, and heatmap performance.

```
Markdown files  →  IndexService (in-memory cache, rebuildable)
                →  QuickMemoView (read from index, write to repo)
```

## IndexService (in-memory cache)

`IndexService` provides:
- `rebuild()` — full reconstruction from Markdown
- `refreshChangedFiles(paths)` — incremental mtime-delta updates
- `query(filters)` — filtered record search
- `heatmap(dateRange)` — record count per day
- `tags` — aggregated tag list with counts
- `warnings` — parse warnings from last rebuild

**The cache is disposable.** `rebuild()` reconstructs everything from Markdown. Always treat cache as replaceable — never persist state outside Markdown.

Internal record order is ascending by time. Display order is applied separately:

```typescript
sortRecordsForDisplay(records, settings.sortDirection);
```

## View state (ephemeral)

`QuickMemoView` owns ephemeral UI state:

| State | Type | Purpose |
|-------|------|---------|
| `selectedDate` | string (YYYY-MM-DD) | Currently viewed date |
| `filters` | FilterState | Active search/text/tag filters |
| `editingRecordId` | string \| null | Record currently being edited |
| `openMenuRecordId` | string \| null | Record with open dropdown menu |

View state is never persisted — it resets when the view is closed.

## Settings reactivity

`QuickMemoPlugin.saveSettings()` triggers:
1. Settings written to Obsidian's plugin data.
2. IndexService rebuilt (full `rebuild()`).
3. Open view refreshed.

This works because the parser and resolver read settings at call time via dynamic getters:

```typescript
// The heading is not captured at construction
new QuickMemoParser(() => settings.quickMemoHeading);
```

## Data flow for mutations

```
User action in view
  → QuickMemoView calls MarkdownRecordRepository method
    → Repository reads file content (via VaultLike)
    → Parser parses the section
    → Mutates in-memory (append/toggle/delete)
    → Serializes back to markdown
    → Writes file (via VaultLike)
  → QuickMemoView triggers IndexService refresh
→ View re-renders
```
