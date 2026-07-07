# Type Safety

> TypeScript patterns in this Obsidian plugin.

## The VaultLike interface pattern

The most important type safety pattern: all services depend on the `VaultLike` interface, not on Obsidian's concrete `Vault`:

```typescript
// src/types.ts — the adapter interface
interface VaultLike {
  read(path: string): Promise<string>;
  modify(path: string, content: string): Promise<void>;
  create(path: string, content: string): Promise<void>;
  exists(path: string): Promise<boolean>;
  listMarkdownFiles(): Promise<string[]>;
  stat(path: string): Promise<Stat | null>;
}
```

- `main.ts` provides `ObsidianVaultAdapter` to bridge the real Obsidian API.
- `FakeVault` provides an in-memory implementation for tests.
- Every new vault operation must be added to all three: `VaultLike` interface, `FakeVault`, `ObsidianVaultAdapter`.

## TypeScript configuration

- Strict mode enabled (implied by `tsconfig.json` conventions).
- Skip lib check for faster compilation: `--skipLibCheck`.
- No emit: `--noEmit` for typecheck-only runs.

## `any` avoidance

Public interfaces must avoid `any`. Use explicit interfaces, generics, or typed utility types instead:

```typescript
// Bad
function process(data: any): any { ... }

// Good
function process<T>(data: T): Result { ... }

// Good (explicit interface)
interface QuickMemoRecord {
  id: string;
  content: string;
  type: '闪念' | '记录' | '待办';
  done: boolean;
  time: string;
  tags: string[];
  filePath: string;
  lineStart: number;
}
```

## Dynamic settings pattern

The parser uses a dynamic getter for its heading configuration — not a captured string:

```typescript
// Good: settings are read at call time
new QuickMemoParser(() => settings.quickMemoHeading);
```

This avoids stale config and makes typechecking straightforward. Apply this pattern for any component that reads settings during operation, not at construction.
