import { describe, expect, it } from 'vitest';
import { FakeVault } from '../src/test/fakeVault';
import { QuickMemoParser } from '../src/markdown/QuickMemoParser';
import { MarkdownRecordRepository } from '../src/markdown/MarkdownRecordRepository';
import { DailyNoteResolver } from '../src/daily-notes/DailyNoteResolver';
import { DEFAULT_SETTINGS } from '../src/settings/settings';

/**
 * Tests verifying that pure-Markdown records (without block IDs) can be
 * mutated via the location-based fallback methods.
 */
describe('Pure-Markdown location-based mutation', () => {
  function makeRepo(vault: FakeVault) {
    const settings = { ...DEFAULT_SETTINGS, enableBlockIds: false, quickMemoHeading: '## Quick Memo' };
    const parser = new QuickMemoParser(settings.quickMemoHeading);
    const resolver = new DailyNoteResolver(vault, undefined, settings);
    return new MarkdownRecordRepository(vault, resolver, parser, settings);
  }

  it('toggleTodoByLocation toggles a todo record without a block ID', async () => {
    const vault = new FakeVault({
      '2026-06-18.md': '# Day\n\n## Quick Memo\n\n- [ ] 10:20 task without id\n',
    });
    const repo = makeRepo(vault);
    const records = await repo.readRecords('2026-06-18');
    expect(records[0].id).toBeUndefined();

    await repo.toggleTodoByLocation(records[0]);
    const content = await vault.read('2026-06-18.md');
    expect(content).toContain('- [x] 10:20 task without id');
  });

  it('updateRecordByLocation updates a record without a block ID', async () => {
    const vault = new FakeVault({
      '2026-06-18.md': '# Day\n\n## Quick Memo\n\n- 09:12 original content\n',
    });
    const repo = makeRepo(vault);
    const records = await repo.readRecords('2026-06-18');
    expect(records[0].id).toBeUndefined();

    await repo.updateRecordByLocation(records[0], { content: 'updated content', body: 'new body' });
    const content = await vault.read('2026-06-18.md');
    expect(content).toContain('- 09:12\n  updated content\n  new body');
  });

  it('ID-based toggleTodo is ambiguous for records without block IDs', async () => {
    const vault = new FakeVault({
      '2026-06-18.md': '# Day\n\n## Quick Memo\n\n- [ ] 10:20 first task\n- [ ] 11:00 second task\n',
    });
    const repo = makeRepo(vault);
    const records = await repo.readRecords('2026-06-18');

    expect(records).toHaveLength(2);
    expect(records[0].id).toBeUndefined();
    expect(records[1].id).toBeUndefined();

    // toggleTodo(undefined) silently toggles the FIRST id-less record
    // (locateById finds the first candidate with id === undefined).
    // This is why location-based methods exist — they target a specific record.
    await repo.toggleTodo(undefined as unknown as string);
    const content = await vault.read('2026-06-18.md');
    expect(content).toContain('- [x] 10:20 first task');
    expect(content).toContain('- [ ] 11:00 second task');
  });

  it('location-based mutation methods exist on the repository', () => {
    const vault = new FakeVault({ '2026-06-18.md': '# Day\n\n## Quick Memo\n\n- 10:20 task\n' });
    const repo = makeRepo(vault);
    expect(typeof (repo as unknown as Record<string, unknown>)['toggleTodoByLocation']).toBe('function');
    expect(typeof (repo as unknown as Record<string, unknown>)['updateRecordByLocation']).toBe('function');
  });
});
