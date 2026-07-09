# Quality Guidelines

> Code quality standards for this Obsidian plugin.

## Required commands (run after every code change)

```bash
npm run typecheck     # tsc -noEmit -skipLibCheck — THE gate; must pass first
npm test              # vitest run (jsdom env, all tests under tests/**/*.test.ts)
npm run build         # typecheck + esbuild production → main.js
```

- `typecheck` is the primary quality gate — it must pass before any commit.
- `npm test` runs the full vitest suite (jsdom environment). All tests must pass.
- `npm run build` produces the production `main.js` artifact. `main.js` is **gitignored** — never commit it.
- Before each Claude Code analysis (e.g. `Claude Code`), run `npm run typecheck && npm test` to establish the baseline.

## Test architecture

- **`VaultLike` is the test seam.** See `src/test/fakeVault.ts` — an in-memory implementation of the `VaultLike` interface. Every service depends on `VaultLike`, not on Obsidian's `Vault`. This makes all services unit-testable without loading Obsidian.
- When adding vault operations, update `VaultLike` + `FakeVault` + `ObsidianVaultAdapter` together.
- Test files mirror source structure: `tests/QuickMemoParser.test.ts` tests `src/markdown/QuickMemoParser.ts`.
- All tests run in a jsdom environment (no browser needed).

## CSS conventions

- Use Obsidian theme variables only: `--background-*`, `--text-*`, `--interactive-accent*`, `--size-4-*`, `--radius-*`, `--font-ui-*`, etc.
- No hardcoded colors.
- Respect `prefers-reduced-motion`.
- All styles go in `styles.css` at the project root.

## Git conventions

- Conventional Commits format, English descriptions.
- `main.js` is gitignored — build artifact only.
- `.claude/skills/`, `__pycache__/`, and `*.pyc` are gitignored.
- Version tag format: `X.Y.Z` (semver).
- **Commit after user confirms fix works.** Don't wait to be reminded. Once the user confirms a change is effective, commit immediately with a proper Conventional Commits message. The user should never have to prompt "你还没commit".
