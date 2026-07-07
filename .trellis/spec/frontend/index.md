# OhMyMemo Development Guidelines

> An Obsidian plugin for fast daily capture — Markdown-native, no database.

This project is a **TypeScript Obsidian plugin** extending the Obsidian note-taking app. It is not a traditional web frontend. These specs document the real patterns found in the codebase at `src/`.

## Spec Files (all filled from real code)

| File | What it documents |
|------|-------------------|
| [Directory Structure](./directory-structure.md) | `src/` layout, file organization, architectural rules |
| [Component Guidelines](./component-guidelines.md) | Pure DOM renderer, view state ownership, record actions |
| [Hook Guidelines](./hook-guidelines.md) | Obsidian plugin lifecycle, ItemView, settings, vault events |
| [State Management](./state-management.md) | Markdown-native, IndexService cache, data flow |
| [Quality Guidelines](./quality-guidelines.md) | Typecheck, test, build, CSS conventions, git conventions |
| [Type Safety](./type-safety.md) | VaultLike interface, TypeScript patterns, dynamic settings |

All specs are extracted from actual code patterns. Each rule can be traced to real files in `src/`.
