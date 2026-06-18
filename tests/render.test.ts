import { describe, expect, it, vi } from 'vitest';
import type { QuickMemoRecord } from '../src/types';
import { DEFAULT_SETTINGS } from '../src/settings/settings';
import { renderOverview } from '../src/view/render';

describe('renderOverview', () => {
  it('renders profile, input, records, filters, and heatmap', () => {
    const root = document.createElement('div');
    const callbacks = {
      onSave: vi.fn(),
      onSelectDate: vi.fn(),
      onToggleTodo: vi.fn(),
      onEdit: vi.fn(),
      onSaveEdit: vi.fn(),
      onCancelEdit: vi.fn(),
      onDelete: vi.fn(),
      onCopyBlock: vi.fn(),
      onOpenSource: vi.fn(),
      onFilterChange: vi.fn(),
    };

    renderOverview(root, {
      settings: { ...DEFAULT_SETTINGS, userName: 'Ada', userSlogan: 'Think clearly' },
      records: [makeRecord('oqm-1', '2026-06-18', '09:00', 'flash', 'idea #a')],
      tags: [['#a', 1]],
      heatmap: [{ date: '2026-06-18', count: 1 }],
      selectedDate: '2026-06-18',
      editingRecordId: undefined,
      filters: {},
    }, callbacks);

    expect(root.querySelector('.oqm-layout')).toBeTruthy();
    expect(root.textContent).toContain('Ada');
    expect(root.textContent).toContain('Think clearly');
    expect(root.textContent).toContain('idea #a');
    expect(root.textContent).toContain('#a');
    expect(root.querySelector<HTMLTextAreaElement>('.oqm-input')?.placeholder).toContain('Markdown');
    expect(root.querySelectorAll('.oqm-heatmap-day')).toHaveLength(1);
  });
});

function makeRecord(id: string, date: string, time: string, type: QuickMemoRecord['type'], content: string): QuickMemoRecord {
  return { id, date, time, type, content, tags: content.match(/#[a-z]/g) ?? [], filePath: `${date}.md`, lineStart: 1, lineEnd: 1, hasStableId: true, raw: content, contentHash: id };
}
