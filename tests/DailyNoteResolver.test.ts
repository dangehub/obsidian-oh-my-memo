import { describe, expect, it } from 'vitest';
import { DailyNoteResolver } from '../src/daily-notes/DailyNoteResolver';
import { DEFAULT_SETTINGS } from '../src/settings/settings';
import { FakeVault } from '../src/test/fakeVault';

describe('DailyNoteResolver', () => {
  it('uses fallback folder and date format when Daily Notes config is absent', async () => {
    const vault = new FakeVault();
    const resolver = new DailyNoteResolver(vault, undefined, DEFAULT_SETTINGS);
    const result = await resolver.resolve('2026-06-18');
    expect(result).toEqual({ date: '2026-06-18', filePath: 'Daily Notes/2026-06-18.md', source: 'fallback' });
  });

  it('uses daily notes config when present', async () => {
    const vault = new FakeVault();
    const resolver = new DailyNoteResolver(vault, { folder: 'Journal', format: 'YYYY/MM/DD' }, DEFAULT_SETTINGS);
    const result = await resolver.resolve('2026-06-18');
    expect(result).toEqual({ date: '2026-06-18', filePath: 'Journal/2026/06/18.md', source: 'daily-notes' });
  });

  it('creates missing files and appends Quick Memo heading', async () => {
    const vault = new FakeVault();
    const resolver = new DailyNoteResolver(vault, undefined, DEFAULT_SETTINGS);
    const path = await resolver.ensureDailyNote('2026-06-18');
    expect(path).toBe('Daily Notes/2026-06-18.md');
    expect(await vault.read(path)).toBe('\n## Quick Memo\n');
  });

  it('adds Quick Memo heading to existing files without one', async () => {
    const vault = new FakeVault({ 'Daily Notes/2026-06-18.md': '# 2026-06-18\nBody\n' });
    const resolver = new DailyNoteResolver(vault, undefined, DEFAULT_SETTINGS);
    await resolver.ensureDailyNote('2026-06-18');
    expect(await vault.read('Daily Notes/2026-06-18.md')).toBe('# 2026-06-18\nBody\n\n## Quick Memo\n');
  });

  it('uses a custom formatter so year/month subfolders match the Daily Notes config', async () => {
    const vault = new FakeVault();
    // Mimic Obsidian moment formatting `YYYY/MM/DD` -> nested year/month folders.
    const momentLike = (date: string, format: string): string => {
      const [year, month, day] = date.split('-');
      return format.replace(/YYYY/gu, year).replace(/MM/gu, month).replace(/DD/gu, day);
    };
    const resolver = new DailyNoteResolver(
      vault,
      { folder: '日志', format: 'YYYY/MM/DD' },
      DEFAULT_SETTINGS,
      momentLike,
    );
    const result = await resolver.resolve('2026-06-19');
    expect(result.filePath).toBe('日志/2026/06/19.md');
    expect(result.source).toBe('daily-notes');
  });
});
