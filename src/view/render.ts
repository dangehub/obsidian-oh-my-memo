import type { HeatmapDay, QuickMemoRecord, QuickMemoSettings, QuickMemoType } from '../types';
import type { TodoStatusFilter, TypeFilter, ViewFilters } from './viewState';

/** Markdown render bridge — render.ts stays free of Obsidian. The view injects
 *  the real MarkdownRenderer; tests fall back to the plain-text default. */
export interface MarkdownApi {
  render(source: string, el: HTMLElement): void;
}

const TEXT_MARKDOWN: MarkdownApi = {
  render: (source, el) => {
    el.textContent = source;
  },
};

export interface OverviewStats {
  /** Distinct dates that have at least one record. */
  days: number;
  /** Total record count across all dates. */
  total: number;
  memo: number;
  todo: number;
  /** Completed todos (subset of `todo`). */
  todoDone: number;
}

export interface OverviewState {
  settings: QuickMemoSettings;
  records: QuickMemoRecord[];
  tags: Array<[string, number]>;
  heatmap: HeatmapDay[];
  selectedDate: string;
  todayDate: string;
  editingRecordId?: string;
  openMenuRecordId?: string;
  /** Record ID whose delete button is in confirmation state (second click deletes). */
  confirmingDeleteId?: string;
  inputMode?: 'memo' | 'todo';
  filters: ViewFilters;
  stats: OverviewStats;
  markdown?: MarkdownApi;
  warningCount: number;
  sortDirection: 'asc' | 'desc';
  sidebarCollapsed: boolean;
  /** Datetime text displayed in the composer header (e.g. "2026-07-09 14:30"). */
  composerDatetime?: string;
  /** Whether the datetime picker popup is shown. */
  datetimePickerOpen?: boolean;
  /** Draft auto-save status indicator. */
  draftStatus?: 'idle' | 'saving' | 'saved';
  /** Number of total filtered records (before lazy load slice). */
  recordsTotal: number;
  /** View mode: 'all', 'date' (single day), or 'range' (date range). */
  viewMode: 'all' | 'date' | 'range';
  /** Start of the date range (inclusive). Only set when viewMode === 'range'. */
  dateRangeStart?: string;
  /** End of the date range (inclusive). Only set when viewMode === 'range'. */
  dateRangeEnd?: string;
  /** Whether the inline date range expansion panel is visible. */
  dateRangeExpanded: boolean;
  /** Start date for the expansion panel editor (pre-filled). */
  dateRangeEditStart?: string;
  /** End date for the expansion panel editor (pre-filled when editing). */
  dateRangeEditEnd?: string;
}

export interface OverviewCallbacks {
  onSave(draft: { type: QuickMemoType; content: string }): void;
  /** Native CM6 composer: return the current text. When undefined, the renderer
   *  reads the fallback `<textarea>` directly. */
  getComposerValue?(): string;
  /** Native CM6 composer: clear the current text. When undefined, the renderer
   *  clears the fallback `<textarea>` directly. */
  clearComposer?(): void;
  onSelectDate(date: string): void;
  onToggleTodo(record: QuickMemoRecord): void;
  onEdit(record: QuickMemoRecord): void;
  onSaveEdit(record: QuickMemoRecord): void;
  onCancelEdit(): void;
  onDelete(record: QuickMemoRecord): void;
  onCopyBlock(record: QuickMemoRecord): void;
  onOpenSource(record: QuickMemoRecord): void;
  onFilterChange(filters: Partial<ViewFilters>): void;
  onToggleMenu(recordId: string): void;
  onTagContext(tag: string, event: MouseEvent): void;
  onToggleSidebar(): void;
  onToggleSort(): void;
  onLoadMore(): void;
  onShowAll(): void;
  /** Apply a date range filter (inclusive). */
  onApplyDateRange(start: string, end: string): void;
  /** Expand the inline date range editor (single-date mode). */
  onExpandDateRange(start: string): void;
  /** Open the inline date range editor for editing an existing range. */
  onEditDateRange(start: string, end: string): void;
  /** Dismiss the inline date range expansion panel without applying. */
  onCancelDateRange(): void;
  onHeatmapPrevMonth(): void;
  onHeatmapNextMonth(): void;
  onAttachFile(file: File, editor: HTMLElement): void;
  /** Switch the composer type between memo and todo. */
  onTypeChange?(type: QuickMemoType): void;
  /** Open/close the datetime picker popup. */
  onToggleDatetimePicker?(): void;
  /** Apply a new datetime from the picker. */
  onDatetimeChange?(datetime: string): void;
  /** Confirm deletion after the user clicked "删除" a second time. */
  onConfirmDelete?(record: QuickMemoRecord): void;
}

/** Type filter option values, including composite todo-status filters. */
type TypeFilterValue = TypeFilter | 'todo-done' | 'todo-open';

const TYPE_FILTER_OPTIONS: ReadonlyArray<readonly [TypeFilterValue, string]> = [
  ['all', '全部'],
  ['memo', '闪念'],
  ['todo', '待办'],
  ['todo-done', '已完成待办'],
  ['todo-open', '未完成待办'],
];

/* ── SVG Icons (Lucide-style inline paths) ── */

const SVG_ICONS: Record<string, string> = {
  pen: '<path d="M17 3a2.85 2.83 0 0 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/>',
  'check-square': '<rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><polyline points="9 12 12 15 15 9"/>',
  clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
  image: '<rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>',
  edit: '<path d="M17 3a2.85 2.83 0 0 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>',
  'more-h': '<circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>',
  search: '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
  tag: '<circle cx="7.5" cy="7.5" r="1.5"/><path d="m20.59 13.41-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82Z"/>',
  save: '<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>',
};

function svgIconHtml(name: string, cls = 'omm-icon'): string {
  const paths = SVG_ICONS[name] ?? '';
  return `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`;
}

/**
 * Format a tag for display:
 * - #tag → return as-is
 * - [[path/to/page]] → [[page]] (last path segment)
 * - [[path/to/page|Display Text]] → [[Display Text]]
 * - otherwise → return as-is
 */
function displayTag(tag: string): string {
  if (tag.startsWith('#')) {
    return tag;
  }
  if (tag.startsWith('[[')) {
    const inner = tag.slice(2, -2);
    const pipeIdx = inner.indexOf('|');
    if (pipeIdx !== -1) {
      return `[[${inner.slice(pipeIdx + 1)}]]`;
    }
    const segments = inner.split('/');
    return `[[${segments[segments.length - 1]}]]`;
  }
  return tag;
}

export function renderOverview(root: HTMLElement, state: OverviewState, callbacks: OverviewCallbacks): void {
  root.innerHTML = '';
  root.classList.add('omm-root');
  // Always toggle based on state — class may be stale from previous renders
  root.classList.toggle('omm-sidebar-collapsed', state.sidebarCollapsed);

  const markdown = state.markdown ?? TEXT_MARKDOWN;
  const layout = appendDiv(root, 'omm-layout');
  renderSidebar(appendDiv(layout, 'omm-sidebar'), state, callbacks);

  /* Desktop sidebar toggle — visible when sidebar is collapsed so the user
     can always re-open it. Sits as a small floating button on the left edge. */
  const desktopToggle = appendEl(root, 'button', 'omm-desktop-sidebar-toggle');
  desktopToggle.type = 'button';
  desktopToggle.textContent = '☰';
  desktopToggle.title = '展开侧边栏';
  desktopToggle.setAttribute('aria-label', '展开侧边栏');
  desktopToggle.onclick = () => callbacks.onToggleSidebar();

  /* Mobile drawer backdrop — tapping it closes the sidebar. */
  const backdrop = appendDiv(root, 'omm-sidebar-backdrop');
  backdrop.addEventListener('click', () => callbacks.onToggleSidebar());

  renderMain(appendDiv(layout, 'omm-main'), state, callbacks, markdown);
}

function renderSidebar(container: HTMLElement, state: OverviewState, callbacks: OverviewCallbacks): void {
  const profile = appendDiv(container, 'omm-profile');
  if (state.settings.avatar) {
    const avatar = appendEl(profile, 'img', 'omm-avatar');
    avatar.src = state.settings.avatar;
    avatar.alt = state.settings.userName;
  }
  const profileText = appendDiv(profile, 'omm-profile-text');
  appendEl(profileText, 'h2', '', state.settings.userName);
  appendEl(profileText, 'p', '', state.settings.userSlogan);

  // Collapse toggle button in the profile area
  const collapseBtn = appendEl(profile, 'button', 'omm-sidebar-collapse-btn');
  collapseBtn.type = 'button';
  collapseBtn.textContent = state.sidebarCollapsed ? '☰' : '✕';
  collapseBtn.title = state.sidebarCollapsed ? '展开侧边栏' : '折叠侧边栏';
  collapseBtn.onclick = () => callbacks.onToggleSidebar();

  // Heatmap sits between the profile/slogan and the filter controls.
  renderHeatmap(container, state.heatmap, state.todayDate, state.selectedDate, callbacks);

  // Stats
  renderStats(container, state.stats);

  const filterLabel = appendDiv(container, 'omm-section-label');
  filterLabel.innerHTML = `${svgIconHtml('search', 'omm-icon-sm')} 筛选`;

  const typeSelect = appendEl(container, 'select', 'omm-type-filter');
  for (const [value, label] of TYPE_FILTER_OPTIONS) {
    appendOption(typeSelect, label, value);
  }
  typeSelect.value = filterValueFromState(state.filters);
  typeSelect.onchange = () => {
    const value = typeSelect.value as TypeFilterValue;
    if (value === 'todo-done') {
      callbacks.onFilterChange({ type: 'todo', todoStatus: 'completed' as TodoStatusFilter });
    } else if (value === 'todo-open') {
      callbacks.onFilterChange({ type: 'todo', todoStatus: 'open' as TodoStatusFilter });
    } else {
      callbacks.onFilterChange({ type: value as TypeFilter, todoStatus: undefined });
    }
  };

  const search = appendEl(container, 'input', 'omm-search');
  search.type = 'search';
  search.placeholder = '关键词搜索（回车搜索）';
  search.value = state.filters.text ?? '';
  // No search while typing: it interrupts IME/Chinese composition and rebuilds the
  // DOM per keystroke. Search runs on Enter — but not the Enter that confirms an
  // IME candidate — and on blur (deferred so the click that stole focus completes).
  const runSearch = (): void => {
    callbacks.onFilterChange({ text: search.value });
  };
  search.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.isComposing && event.keyCode !== 229) {
      event.preventDefault();
      runSearch();
    }
  });
  search.addEventListener('blur', () => {
    window.setTimeout(runSearch, 0);
  });

  if (state.tags.length > 0) {
    const tagLabel = appendDiv(container, 'omm-section-label');
    tagLabel.innerHTML = `${svgIconHtml('tag', 'omm-icon-sm')} 标签`;
    const tags = appendDiv(container, 'omm-tags');
    for (const [tag, count] of state.tags) {
      const selected = state.filters.tag === tag;
      const button = appendEl(tags, 'button', selected ? 'omm-tag-selected' : '', `${displayTag(tag)} ${count}`);
      button.setAttribute('aria-pressed', String(selected));
      button.title = selected ? '再次点击取消标签筛选' : '按此标签筛选';
      button.onclick = () => callbacks.onFilterChange({ tag: selected ? undefined : tag });
      button.oncontextmenu = (event: MouseEvent) => {
        event.preventDefault();
        callbacks.onTagContext(tag, event);
      };
    }
  }

  // Warnings: show a gentle badge at the bottom when the parser found incompatible content
  if (state.warningCount > 0) {
    const warnDiv = appendDiv(container, 'omm-warnings');
    appendDiv(warnDiv, '', `${state.warningCount} 条记录格式与本插件不兼容，未显示。`);
  }
}

function renderMain(container: HTMLElement, state: OverviewState, callbacks: OverviewCallbacks, markdown: MarkdownApi): void {
  /* ── Mobile top bar: ☰ | title | sort ── */
  const topBar = appendDiv(container, 'omm-mobile-topbar');
  const menuBtn = appendEl(topBar, 'button', 'omm-mobile-menu-btn');
  menuBtn.type = 'button';
  menuBtn.setAttribute('aria-label', state.sidebarCollapsed ? '打开侧边栏' : '关闭侧边栏');
  menuBtn.textContent = state.sidebarCollapsed ? '☰' : '✕';
  menuBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    callbacks.onToggleSidebar();
  });

  const titleSpan = appendEl(topBar, 'span', 'omm-mobile-title');
  const hasFilter = Boolean(state.filters.tag) || Boolean(state.filters.text?.trim());
  if (hasFilter) {
    titleSpan.textContent = '筛选结果';
  } else if (state.viewMode === 'all') {
    titleSpan.textContent = `全部记录 · ${state.recordsTotal} 条`;
  } else if (state.viewMode === 'range') {
    titleSpan.textContent = `${state.dateRangeStart} 至 ${state.dateRangeEnd}`;
  } else {
    titleSpan.textContent = `${state.selectedDate} 时间线`;
  }

  const sortBtn = appendEl(topBar, 'button', 'omm-mobile-sort-btn');
  sortBtn.type = 'button';
  sortBtn.setAttribute('aria-label', '切换排序');
  sortBtn.textContent = state.sortDirection === 'asc' ? '↑' : '↓';
  sortBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    callbacks.onToggleSort();
  });

  const composer = appendDiv(container, 'omm-composer');

  // ── Composer header: pill toggle + datetime ──
  const header = appendDiv(composer, 'omm-composer-header');

  // Type pills replacing the old dropdown
  const pills = appendDiv(header, 'omm-type-pills');
  const memoPill = appendEl(pills, 'button', `omm-type-pill${state.inputMode === 'todo' ? '' : ' active'}`);
  memoPill.type = 'button';
  memoPill.setAttribute('data-type', 'memo');
  memoPill.innerHTML = `${svgIconHtml('pen')} 闪念`;
  memoPill.onclick = () => callbacks.onTypeChange?.('memo');

  const todoPill = appendEl(pills, 'button', `omm-type-pill${state.inputMode === 'todo' ? ' active' : ''}`);
  todoPill.type = 'button';
  todoPill.setAttribute('data-type', 'todo');
  todoPill.innerHTML = `${svgIconHtml('check-square')} 待办`;
  todoPill.onclick = () => callbacks.onTypeChange?.('todo');

  // Datetime display (right side of header)
  const dtWrap = appendDiv(header, 'omm-datetime-wrap');
  dtWrap.style.whiteSpace = 'nowrap';

  const hasCustomTime = state.composerDatetime && state.composerDatetime.trim() !== '';
  const dtBtn = appendDiv(dtWrap, 'omm-datetime-btn');
  if (hasCustomTime) {
    dtBtn.innerHTML = `${svgIconHtml('clock')}<span class="omm-datetime-text">${state.composerDatetime}</span>`;
  } else {
    dtBtn.innerHTML = `${svgIconHtml('clock')}`;
    dtBtn.title = '设置自定义日期时间';
  }
  dtBtn.onclick = () => callbacks.onToggleDatetimePicker?.();

  // Datetime picker popup (shown when toggled)
  if (state.datetimePickerOpen) {
    const popup = appendDiv(dtWrap, 'omm-datetime-popup');

    // Row container for date + time side by side
    const row = appendDiv(popup, 'omm-datetime-row');

    const dateInput = appendEl(row, 'input', 'omm-datetime-date');
    dateInput.type = 'date';
    const timeInput = appendEl(row, 'input', 'omm-datetime-time');
    timeInput.type = 'time';

    if (state.composerDatetime && state.composerDatetime.includes(' ')) {
      const [d, t] = state.composerDatetime.split(' ');
      dateInput.value = d;
      timeInput.value = t;
    } else {
      const n = new Date();
      const p2 = (v: number) => String(v).padStart(2, '0');
      dateInput.value = `${n.getFullYear()}-${p2(n.getMonth() + 1)}-${p2(n.getDate())}`;
      timeInput.value = `${p2(n.getHours())}:${p2(n.getMinutes())}`;
    }

    const pa = appendDiv(popup, 'omm-datetime-picker-actions');
    const okBtn = appendEl(pa, 'button', 'omm-datetime-ok', '确定');
    okBtn.type = 'button';
    okBtn.onclick = () => {
      const d = dateInput.value;
      const t = timeInput.value;
      if (d && t) callbacks.onDatetimeChange?.(`${d} ${t}`);
    };
    const cancelBtn = appendEl(pa, 'button', 'omm-datetime-cancel', '取消');
    cancelBtn.type = 'button';
    cancelBtn.onclick = () => callbacks.onToggleDatetimePicker?.();
  }

  // If custom time, add reset button
  if (hasCustomTime) {
    const resetBtn = appendEl(dtWrap, 'button', 'omm-datetime-reset');
    resetBtn.type = 'button';
    resetBtn.textContent = '✕';
    resetBtn.title = '重置为当前时间';
    resetBtn.onclick = (e: MouseEvent) => {
      e.stopPropagation();
      callbacks.onDatetimeChange?.('');
    };
  }

  // ── Editor body ──
  const body = appendDiv(composer, 'omm-composer-body');
  const input = appendEl(body, 'div', 'omm-editor-host');
  input.style.minHeight = '80px';

  // Hidden file input for image attachment
  const attachInput = appendEl(composer, 'input', 'omm-attach-input');
  attachInput.type = 'file';
  attachInput.accept = 'image/*';
  attachInput.style.display = 'none';
  attachInput.onchange = () => {
    const file = attachInput.files?.[0];
    if (file) callbacks.onAttachFile(file, input);
    attachInput.value = '';
  };

  // ── Composer footer: image button + draft status + save ──
  const footer = appendDiv(composer, 'omm-composer-footer');
  const footerLeft = appendDiv(footer, 'omm-composer-footer-left');

  // Image attach button
  const attachBtn = appendEl(footerLeft, 'button', 'omm-attach-btn');
  attachBtn.type = 'button';
  attachBtn.title = '插入图片';
  attachBtn.innerHTML = svgIconHtml('image');
  attachBtn.onclick = () => attachInput.click();

  // Draft auto-save status
  const draftStatus = appendDiv(footerLeft, 'omm-draft-status');
  appendEl(draftStatus, 'span', 'omm-draft-dot');
  const statusText = appendEl(draftStatus, 'span', '');
  statusText.textContent = state.draftStatus === 'saved'
    ? '已自动保存' : state.draftStatus === 'saving'
    ? '正在保存…' : '自动保存草稿';
  if (state.draftStatus === 'saved') draftStatus.classList.add('saved');

  // Save button (right-aligned)
  const save = appendEl(footer, 'button', 'omm-save');
  save.type = 'button';
  save.innerHTML = `${svgIconHtml('save', 'omm-icon-sm')} 保存`;
  const submit = (): void => {
    const raw = callbacks.getComposerValue ? callbacks.getComposerValue() : '';
    const content = raw.replace(/\r\n/gu, '\n').trim();
    if (!content) return;
    callbacks.onSave({ type: state.inputMode ?? 'memo', content });
    if (callbacks.clearComposer) callbacks.clearComposer();
  };
  save.onclick = submit;

  // ── Progressive filter chip row ──
  // Shows when a date/range filter or tag filter is active.
  // Date chip: single-day mode shows [date ✕] [+ 结束日期],
  // range mode shows [date 至 MM-DD ✕].
  // Tag chip: shows [displayTag(tag) ✕] when a tag filter is set.
  const hasDateFilter = state.viewMode === 'date' || state.viewMode === 'range';
  const hasTagFilter = Boolean(state.filters.tag);
  if (hasDateFilter || hasTagFilter) {
    const chipRow = appendDiv(container, 'omm-filter-chip-row');

    // Date / range chip
    if (hasDateFilter) {
      const chip = appendDiv(chipRow, 'omm-filter-chip');
      const chipDateBtn = appendEl(chip, 'button', 'omm-filter-chip-date');
      chipDateBtn.type = 'button';
      if (state.viewMode === 'range' && state.dateRangeStart && state.dateRangeEnd) {
        const endShort = state.dateRangeEnd.slice(5);
        chipDateBtn.textContent = `${state.dateRangeStart} 至 ${endShort}`;
        chipDateBtn.title = '点击编辑日期范围';
        chipDateBtn.onclick = () => callbacks.onEditDateRange(state.dateRangeStart!, state.dateRangeEnd!);
      } else {
        chipDateBtn.textContent = state.selectedDate;
        chipDateBtn.title = '点击切换日期';
        chipDateBtn.onclick = () => {
          // Open a hidden date input's picker
          const picker = appendEl(chipRow, 'input', 'omm-filter-chip-picker');
          picker.type = 'date';
          picker.value = state.selectedDate;
          picker.style.cssText = 'position:absolute;opacity:0;pointer-events:none;width:1px;height:1px';
          picker.onchange = () => { if (picker.value) callbacks.onSelectDate(picker.value); };
          if (picker.showPicker) { picker.showPicker(); } else { picker.click(); }
        };
      }
      const chipClose = appendEl(chip, 'button', 'omm-filter-chip-close', '✕');
      chipClose.type = 'button';
      chipClose.title = '清除日期筛选';
      chipClose.onclick = () => callbacks.onShowAll();

      // In single mode, show [+ 结束日期] trigger
      if (state.viewMode === 'date') {
        const expandBtn = appendEl(chipRow, 'button', 'omm-filter-expand-trigger', '+ 结束日期');
        expandBtn.type = 'button';
        expandBtn.onclick = () => callbacks.onExpandDateRange(state.selectedDate);
      }
    }

    // Tag filter chip
    if (hasTagFilter) {
      const tagChip = appendDiv(chipRow, 'omm-filter-chip');
      const tagLabel = appendEl(tagChip, 'span', 'omm-filter-chip-tag', displayTag(state.filters.tag!));
      const tagClose = appendEl(tagChip, 'button', 'omm-filter-chip-close', '✕');
      tagClose.type = 'button';
      tagClose.title = '清除标签筛选';
      tagClose.onclick = () => callbacks.onFilterChange({ tag: undefined });
    }
  }

  // ── Inline date range expansion panel ──
  if (state.dateRangeExpanded) {
    const panel = appendDiv(container, 'omm-filter-expand-panel');
    appendEl(panel, 'span', 'omm-filter-expand-label', '从');
    const startInput = appendEl(panel, 'input', 'omm-filter-expand-start');
    startInput.type = 'date';
    startInput.value = state.dateRangeEditStart ?? state.selectedDate;
    appendEl(panel, 'span', 'omm-filter-expand-label', '至');
    const endInput = appendEl(panel, 'input', 'omm-filter-expand-end');
    endInput.type = 'date';
    endInput.value = state.dateRangeEditEnd ?? '';
    const confirmBtn = appendEl(panel, 'button', 'omm-filter-expand-confirm', '确定');
    confirmBtn.type = 'button';
    confirmBtn.title = '应用日期范围';
    confirmBtn.onclick = () => {
      const start = state.dateRangeEditStart ?? state.selectedDate;
      const end = endInput.value;
      if (end) callbacks.onApplyDateRange(start, end);
    };
    const cancelBtn = appendEl(panel, 'button', 'omm-filter-expand-cancel', '取消');
    cancelBtn.type = 'button';
    cancelBtn.title = '取消';
    cancelBtn.onclick = () => callbacks.onCancelDateRange();
  }

  // Tag / keyword filters are vault-wide: group the results by date instead of
  // showing a single-day timeline. Otherwise it's the normal single-day view.
  const crossDate = Boolean(state.filters.tag) || Boolean(state.filters.text?.trim());

  // Sort direction toggle + date heading row
  const headingRow = appendDiv(container, 'omm-heading-row');
  if (crossDate || state.viewMode === 'all') {
    if (crossDate) {
      appendEl(headingRow, 'h3', '', '筛选结果');
    } else {
      appendEl(headingRow, 'h3', '', `全部记录 · ${state.recordsTotal} 条`);
    }
    const sortBtn = appendEl(headingRow, 'button', 'omm-sort-toggle');
    sortBtn.type = 'button';
    sortBtn.textContent = state.sortDirection === 'asc' ? '↑ 升序' : '↓ 降序';
    sortBtn.title = state.sortDirection === 'asc' ? '切换为降序' : '切换为升序';
    sortBtn.onclick = () => callbacks.onToggleSort();
    renderCrossDateTimeline(container, state, callbacks, markdown);
    if (state.records.length < state.recordsTotal) {
      const loadMoreDiv = appendDiv(container, 'omm-load-more');
      const loadBtn = appendEl(loadMoreDiv, 'button', 'omm-load-more-btn');
      loadBtn.type = 'button';
      loadBtn.textContent = `加载更多（已显示 ${state.records.length} / ${state.recordsTotal}）`;
      loadBtn.onclick = () => callbacks.onLoadMore();
      observeLoadMore(loadBtn, () => callbacks.onLoadMore());
    }
    return;
  }

  // date / range mode: single-day or date-range timeline
  const dateLabel = state.viewMode === 'date'
    ? `${state.selectedDate} 时间线`
    : `${state.dateRangeStart} 至 ${state.dateRangeEnd}`;
  appendEl(headingRow, 'h3', '', dateLabel);
  const sortBtn2 = appendEl(headingRow, 'button', 'omm-sort-toggle');
  sortBtn2.type = 'button';
  sortBtn2.textContent = state.sortDirection === 'asc' ? '↑ 升序' : '↓ 降序';
  sortBtn2.title = state.sortDirection === 'asc' ? '切换为降序' : '切换为升序';
  sortBtn2.onclick = () => callbacks.onToggleSort();

  if (crossDate) {
    renderCrossDateTimeline(container, state, callbacks, markdown);
    return;
  }

  // Range mode: group by date with date headings (like cross-date), not a flat list.
  if (state.viewMode === 'range') {
    renderRangeTimeline(container, state, callbacks, markdown);
    return;
  }

  // Single-date mode: flat list, no date grouping needed.

  const list = appendDiv(container, 'omm-record-list');
  if (state.records.length === 0) {
    appendDiv(list, 'omm-empty', '这一天还没有 Quick Memo。');
    return;
  }

  for (const record of state.records) {
    const key = recordKey(record);
    renderRecord(list, record, state.editingRecordId === key, state.openMenuRecordId === key, state.confirmingDeleteId === key, callbacks, markdown);
  }

  // Lazy load: show "load more" button when there are more records
  if (state.records.length < state.recordsTotal) {
    const loadMoreDiv = appendDiv(container, 'omm-load-more');
    const loadBtn = appendEl(loadMoreDiv, 'button', 'omm-load-more-btn');
    loadBtn.type = 'button';
    loadBtn.textContent = `加载更多（已显示 ${state.records.length} / ${state.recordsTotal}）`;
    loadBtn.onclick = () => callbacks.onLoadMore();
    observeLoadMore(loadBtn, () => callbacks.onLoadMore());
  }
}

function renderRangeTimeline(container: HTMLElement, state: OverviewState, callbacks: OverviewCallbacks, markdown: MarkdownApi): void {
  if (state.records.length === 0) {
    const list = appendDiv(container, 'omm-record-list');
    appendDiv(list, 'omm-empty', '该时间段内还没有 Quick Memo。');
    return;
  }

  // Records arrive already sorted (newest first). Group them by date.
  const groups = new Map<string, QuickMemoRecord[]>();
  for (const record of state.records) {
    const bucket = groups.get(record.date) ?? [];
    bucket.push(record);
    groups.set(record.date, bucket);
  }

  const list = appendDiv(container, 'omm-record-list');
  for (const [date, groupRecords] of groups) {
    const group = appendDiv(list, 'omm-date-group');
    appendDiv(group, 'omm-date-group-heading', date);
    const cards = appendDiv(group, 'omm-date-group-cards');
    for (const record of groupRecords) {
      const key = recordKey(record);
      renderRecord(cards, record, state.editingRecordId === key, state.openMenuRecordId === key, state.confirmingDeleteId === key, callbacks, markdown);
    }
  }

  // Lazy load
  if (state.records.length < state.recordsTotal) {
    const loadMoreDiv = appendDiv(container, 'omm-load-more');
    const loadBtn = appendEl(loadMoreDiv, 'button', 'omm-load-more-btn');
    loadBtn.type = 'button';
    loadBtn.textContent = `加载更多（已显示 ${state.records.length} / ${state.recordsTotal}）`;
    loadBtn.onclick = () => callbacks.onLoadMore();
    observeLoadMore(loadBtn, () => callbacks.onLoadMore());
  }
}

function renderCrossDateTimeline(container: HTMLElement, state: OverviewState, callbacks: OverviewCallbacks, markdown: MarkdownApi): void {
  if (state.records.length === 0) {
    const list = appendDiv(container, 'omm-record-list');
    appendDiv(list, 'omm-empty', '没有匹配的 Quick Memo。');
    return;
  }

  // Records arrive already sorted (newest first). Group them by date, preserving
  // that order, so each heading is followed by its day's records.
  const groups = new Map<string, QuickMemoRecord[]>();
  for (const record of state.records) {
    const bucket = groups.get(record.date) ?? [];
    bucket.push(record);
    groups.set(record.date, bucket);
  }

  const list = appendDiv(container, 'omm-record-list');
  for (const [date, groupRecords] of groups) {
    const group = appendDiv(list, 'omm-date-group');
    appendDiv(group, 'omm-date-group-heading', date);
    const cards = appendDiv(group, 'omm-date-group-cards');
    for (const record of groupRecords) {
      const key = recordKey(record);
      renderRecord(cards, record, state.editingRecordId === key, state.openMenuRecordId === key, state.confirmingDeleteId === key, callbacks, markdown);
    }
  }
}

function renderRecord(list: HTMLElement, record: QuickMemoRecord, editing: boolean, menuOpen: boolean, confirmingDelete: boolean, callbacks: OverviewCallbacks, markdown: MarkdownApi): void {
  const card = appendDiv(list, `omm-record omm-record-${record.type}${record.completed ? ' is-done' : ''}`);

  // Head: meta row + menu trigger
  const head = appendDiv(card, 'omm-record-head');

  const meta = appendDiv(head, 'omm-record-meta');
  appendEl(meta, 'span', 'omm-record-time', record.time);
  const badge = appendEl(meta, 'span', 'omm-record-badge') as HTMLElement;
  badge.innerHTML = `${svgIconHtml(record.type === 'memo' ? 'pen' : 'check-square', 'omm-icon-sm')} ${typeLabel(record.type)}`;

  const trigger = appendEl(head, 'button', 'omm-record-menu-trigger');
  trigger.type = 'button';
  trigger.innerHTML = svgIconHtml('more-h');
  trigger.setAttribute('aria-label', '更多操作');
  trigger.setAttribute('aria-haspopup', 'true');
  trigger.setAttribute('aria-expanded', String(menuOpen));
  trigger.onclick = () => callbacks.onToggleMenu(recordKey(record));

  if (editing) {
    const editType = appendEl(card, 'select', 'omm-edit-type');
    for (const [value, label] of TYPE_OPTIONS) {
      appendOption(editType, label, value);
    }
    editType.value = record.type;

    const editor = appendEl(card, 'div', 'omm-edit-editor-host');
    editor.style.minHeight = '80px';
    window.setTimeout(() => editor.focus(), 0);

    const editActions = appendDiv(card, 'omm-record-actions');
    (appendEl(editActions, 'button', '', '保存')).onclick = () => {
      callbacks.onSaveEdit(record);
    };
    (appendEl(editActions, 'button', '', '取消')).onclick = () => callbacks.onCancelEdit();
    return;
  }

  // Rendered markdown content. Todo records get a checkbox that toggles the
  // record's completion, which syncs the `- [ ]`/`- [x]` marker in the file.
  const body = appendDiv(card, 'omm-record-body');
  if (record.type === 'todo') {
    const checkbox = appendEl(body, 'input', 'omm-record-checkbox');
    checkbox.type = 'checkbox';
    checkbox.checked = Boolean(record.completed);
    checkbox.setAttribute('aria-label', record.completed ? '标记为未完成' : '标记为完成');
    checkbox.onchange = () => callbacks.onToggleTodo(record);
  }
  const contentEl = appendDiv(body, 'omm-record-content');
  markdown.render(record.body ? `${record.content}\n${record.body}` : record.content, contentEl);

  // Attach image lightbox to any <img> rendered inside the card body.
  const images = contentEl.querySelectorAll('img');
  for (let i = 0; i < images.length; i++) {
    const img = images[i];
    img.classList.add('omm-img-zoomable');
    img.style.cursor = 'zoom-in';
    img.addEventListener('click', (event: MouseEvent) => {
      event.stopPropagation();
      showImageLightbox(img.src, img.alt || '');
    });
  }

  // Card tags footer
  if (record.tags.length > 0) {
    const tagsEl = appendDiv(card, 'omm-record-tags');
    tagsEl.innerHTML = svgIconHtml('tag', 'omm-icon-sm');
    for (const tag of record.tags) {
      const tagBtn = appendEl(tagsEl, 'span', 'omm-record-tag', `${displayTag(tag)}`);
      tagBtn.onclick = (): void => callbacks.onFilterChange({ tag });
    }
  }

  // Reactions area (hidden, for future use)
  const reactionsDiv = appendDiv(card, 'omm-record-reactions');
  reactionsDiv.style.display = 'none';

  if (menuOpen) {
    const menu = appendDiv(card, 'omm-record-menu');
    if (record.type === 'todo') {
      addMenuItem(menu, record.completed ? '标记未完成' : '标记完成', () => callbacks.onToggleTodo(record));
    }
    addMenuItem(menu, '编辑', () => callbacks.onEdit(record));
    addMenuItem(menu, '复制块链接', () => callbacks.onCopyBlock(record));
    addMenuItem(menu, '打开源文件', () => callbacks.onOpenSource(record));
    appendDiv(menu, 'omm-record-menu-divider');
    if (confirmingDelete) {
      addMenuItem(menu, '确认删除？', () => callbacks.onConfirmDelete?.(record), 'omm-record-menu-item-danger omm-record-menu-item-danger--confirm');
    } else {
      addMenuItem(menu, '删除', () => callbacks.onDelete(record), 'omm-record-menu-item-danger');
    }
  }
}

function addMenuItem(menu: HTMLElement, label: string, handler: () => void, cls?: string): void {
  const item = appendEl(menu, 'button', `omm-record-menu-item${cls ? ` ${cls}` : ''}`, label);
  item.type = 'button';
  item.onclick = handler;
}

/** Stable per-record key for view state (editing/open-menu). Falls back to a
 *  file+line locator when a record has no block id (pure-markdown mode). */
export function recordKey(record: QuickMemoRecord): string {
  return record.id ?? `${record.filePath}:${record.lineStart}`;
}

function renderStats(container: HTMLElement, stats: OverviewStats): void {
  const block = appendDiv(container, 'omm-stats');
  const ratioPct = stats.todo > 0 ? Math.round((stats.todoDone / stats.todo) * 1000) / 10 : 0;

  // Top row: the two record types (memo / todo).
  const typesRow = appendDiv(block, 'omm-stats-row omm-stats-types');
  addStatCard(typesRow, String(stats.memo), '闪念');
  addStatCard(typesRow, String(stats.todo), '待办');

  // Bottom row: usage breadth — days used and total records, each filling half.
  const breadthRow = appendDiv(block, 'omm-stats-row omm-stats-breadth');
  addStatCard(breadthRow, String(stats.days), '使用天数');
  addStatCard(breadthRow, String(stats.total), '总记录');

  // Completion ratio: a thin progress bar with just the done/total figure.
  const ratio = appendDiv(block, 'omm-stats-ratio');
  const bar = appendDiv(ratio, 'omm-stats-ratio-bar');
  const fill = appendDiv(bar, 'omm-stats-ratio-fill');
  fill.style.width = `${ratioPct}%`;
  appendDiv(ratio, 'omm-stats-ratio-text', `${stats.todoDone}/${stats.todo}`);
}

function addStatCard(parent: HTMLElement, num: string, label: string): void {
  const card = appendDiv(parent, 'omm-stat-card');
  appendDiv(card, 'omm-stat-num', num);
  appendDiv(card, 'omm-stat-label', label);
}

function renderHeatmap(container: HTMLElement, heatmap: HeatmapDay[], todayDate: string, selectedDate: string, callbacks: OverviewCallbacks): void {
  const counts = new Map<string, number>();
  for (const day of heatmap) counts.set(day.date, day.count);
  const max = Math.max(1, ...heatmap.map((day) => day.count));

  // ── Header: arrows (left) | month-year (center) | today (right) ──
  const header = appendDiv(container, 'omm-heatmap-header');

  const navGroup = appendDiv(header, 'omm-heatmap-nav-group');
  const prevBtn = appendEl(navGroup, 'button', 'omm-heatmap-nav', '◀');
  prevBtn.type = 'button';
  prevBtn.title = '上一个月';
  prevBtn.onclick = () => callbacks.onHeatmapPrevMonth();
  const nextBtn = appendEl(navGroup, 'button', 'omm-heatmap-nav', '▶');
  nextBtn.type = 'button';
  nextBtn.title = '下一个月';
  nextBtn.onclick = () => callbacks.onHeatmapNextMonth();

  const [selYear, selMonth] = selectedDate.split('-').map((part) => Number(part));
  appendDiv(header, 'omm-heatmap-month-title', `${selYear}年${selMonth}月`);

  const isCurrentMonth = selectedDate === todayDate;
  const todayBtn = appendEl(header, 'button', `omm-heatmap-today${isCurrentMonth ? ' omm-heatmap-today--current' : ''}`, '今天');
  todayBtn.type = 'button';
  if (isCurrentMonth) {
    todayBtn.disabled = true;
    todayBtn.title = '当前月份';
  } else {
    todayBtn.title = '回到今天';
    todayBtn.onclick = () => callbacks.onSelectDate(todayDate);
  }

  // ── Single-month calendar grid ──
  const cal = appendDiv(container, 'omm-heatmap-calendar');
  const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
  for (const wd of weekdays) appendDiv(cal, 'omm-heatmap-weekday', wd);

  const firstDay = new Date(selYear, selMonth - 1, 1);
  const firstWeekday = firstDay.getDay();
  for (let i = 0; i < firstWeekday; i += 1) {
    appendDiv(cal, 'omm-heatmap-empty');
  }

  const daysInMonth = new Date(selYear, selMonth, 0).getDate();
  for (let d = 1; d <= daysInMonth; d += 1) {
    const dateObj = new Date(selYear, selMonth - 1, d);
    const dateStr = formatDay(dateObj);

    const count = counts.get(dateStr) ?? 0;
    const level = count === 0 ? 0 : Math.min(4, Math.max(1, Math.ceil((count / max) * 4)));
    const isToday = dateStr === todayDate;
    const isSelected = dateStr === selectedDate;

    const cls = [
      'omm-heatmap-day',
      `omm-heatmap-level-${level}`,
      isToday ? 'omm-heatmap-day-today' : '',
      isSelected ? 'omm-heatmap-selected' : '',
    ].filter(Boolean).join(' ');

    const cell = appendEl(cal, 'button', cls, String(d));
    cell.type = 'button';
    cell.title = `${dateStr}：${count} 条`;
    cell.setAttribute('aria-label', `${dateStr}，${count} 条记录`);
    cell.onclick = () => callbacks.onSelectDate(dateStr);
  }
}

function formatDay(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

function typeLabel(type: QuickMemoType): string {
  return type === 'memo' ? '闪念' : '待办';
}

const TYPE_OPTIONS: ReadonlyArray<readonly [QuickMemoType, string]> = [
  ['memo', '闪念'],
  ['todo', '待办'],
];

/** Map the current view filters back to a composite select value. */
function filterValueFromState(filters: ViewFilters): TypeFilterValue {
  if (filters.type === 'todo' && filters.todoStatus === 'completed') return 'todo-done';
  if (filters.type === 'todo' && filters.todoStatus === 'open') return 'todo-open';
  return filters.type ?? 'all';
}

function appendDiv(parent: HTMLElement, cls: string, text?: string): HTMLDivElement {
  return appendEl(parent, 'div', cls, text);
}

function appendEl<K extends keyof HTMLElementTagNameMap>(
  parent: HTMLElement,
  tag: K,
  cls: string,
  text?: string,
): HTMLElementTagNameMap[K] {
  const el = activeDocument.createElement(tag);
  if (cls) el.className = cls;
  if (text !== undefined) el.textContent = text;
  parent.appendChild(el);
  return el;
}

function appendOption(select: HTMLSelectElement, label: string, value: string): void {
  const option = activeDocument.createElement('option');
  option.textContent = label;
  option.value = value;
  select.appendChild(option);
}

/** Auto-trigger load-more when the button scrolls into view. */
function observeLoadMore(btn: HTMLElement, onLoad: () => void): void {
  if (typeof IntersectionObserver === 'undefined') return; // jsdom / SSR
  const observer = new IntersectionObserver((entries) => {
    if (entries[0]?.isIntersecting) {
      observer.disconnect();
      onLoad();
    }
  }, { rootMargin: '200px' });
  observer.observe(btn);
}

/* ────────── Image Lightbox ────────── */

interface LightboxState {
  scale: number;
  translateX: number;
  translateY: number;
  overlay: HTMLElement | null;
  imgEl: HTMLImageElement | null;
}

const lightbox: LightboxState = { scale: 1, translateX: 0, translateY: 0, overlay: null, imgEl: null };

function applyLightboxTransform(): void {
  if (lightbox.imgEl) {
    lightbox.imgEl.style.transform =
      `scale(${lightbox.scale}) translate(${lightbox.translateX}px, ${lightbox.translateY}px)`;
  }
}

function ensureLightbox(): HTMLElement {
  if (lightbox.overlay) return lightbox.overlay;

  const overlay = activeDocument.createElement('div');
  overlay.className = 'omm-lightbox';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-label', '图片查看器');
  overlay.addEventListener('click', closeLightbox);

  const backdrop = activeDocument.createElement('div');
  backdrop.className = 'omm-lightbox-backdrop';
  overlay.appendChild(backdrop);

  const wrapper = activeDocument.createElement('div');
  wrapper.className = 'omm-lightbox-wrapper';
  overlay.appendChild(wrapper);

  const img = activeDocument.createElement('img');
  img.className = 'omm-lightbox-img';
  img.draggable = false;
  wrapper.appendChild(img);

  const closeBtn = activeDocument.createElement('button');
  closeBtn.className = 'omm-lightbox-close';
  closeBtn.type = 'button';
  closeBtn.setAttribute('aria-label', '关闭');
  closeBtn.textContent = '✕';
  closeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    closeLightbox();
  });
  overlay.appendChild(closeBtn);

  const hint = activeDocument.createElement('div');
  hint.className = 'omm-lightbox-hint';
  hint.textContent = '滚轮缩放 · 拖拽平移 · 双击切换 · 点击空白关闭';
  overlay.appendChild(hint);

  activeDocument.body.appendChild(overlay);
  lightbox.overlay = overlay;
  lightbox.imgEl = img;

  // ── Drag state (shared across mouse + touch) ──
  let dragging = false;
  let dragStartX = 0;
  let dragStartY = 0;
  let dragOrigTx = 0;
  let dragOrigTy = 0;

  const startDrag = (clientX: number, clientY: number): void => {
    dragging = true;
    dragStartX = clientX;
    dragStartY = clientY;
    dragOrigTx = lightbox.translateX;
    dragOrigTy = lightbox.translateY;
    wrapper.style.cursor = 'grabbing';
  };

  const moveDrag = (clientX: number, clientY: number): void => {
    if (!dragging) return;
    lightbox.translateX = dragOrigTx + (clientX - dragStartX) / lightbox.scale;
    lightbox.translateY = dragOrigTy + (clientY - dragStartY) / lightbox.scale;
    applyLightboxTransform();
  };

  const endDrag = (): void => {
    dragging = false;
    wrapper.style.cursor = lightbox.scale > 1 ? 'grab' : '';
  };

  // ── Mouse drag ──
  wrapper.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return; // left button only
    startDrag(e.clientX, e.clientY);
    e.preventDefault();
  });
  activeDocument.addEventListener('mousemove', (e) => {
    moveDrag(e.clientX, e.clientY);
  });
  activeDocument.addEventListener('mouseup', endDrag);

  // ── Mouse cursor hint when zoomed ──
  wrapper.addEventListener('mouseenter', () => {
    if (lightbox.scale > 1 && !dragging) wrapper.style.cursor = 'grab';
  });
  wrapper.addEventListener('mouseleave', () => {
    if (!dragging) wrapper.style.cursor = '';
  });

  // Desktop: wheel zoom
  wrapper.addEventListener('wheel', (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.15 : 0.15;
    setZoom(lightbox.scale + delta);
  }, { passive: false });

  // Double-click: toggle between fit (1) and 2x
  wrapper.addEventListener('dblclick', (e) => {
    e.stopPropagation();
    setZoom(lightbox.scale === 1 ? 2 : 1);
  });

  // ── Touch: pinch zoom (2 fingers) + single-finger drag ──
  let pinchStart = 0;
  wrapper.addEventListener('touchstart', (e) => {
    if (e.touches.length === 2) {
      pinchStart = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY,
      );
    } else if (e.touches.length === 1) {
      startDrag(e.touches[0].clientX, e.touches[0].clientY);
    }
  }, { passive: true });
  wrapper.addEventListener('touchmove', (e) => {
    if (e.touches.length === 2 && pinchStart > 0) {
      const current = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY,
      );
      const newScale = lightbox.scale * (current / pinchStart);
      setZoom(newScale);
      pinchStart = current;
    } else if (e.touches.length === 1 && dragging) {
      moveDrag(e.touches[0].clientX, e.touches[0].clientY);
    }
  }, { passive: true });
  wrapper.addEventListener('touchend', () => {
    pinchStart = 0;
    endDrag();
  });

  // Escape key
  activeDocument.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && lightbox.overlay?.classList.contains('omm-lightbox--open')) {
      closeLightbox();
    }
  });

  return overlay;
}

let currentLightboxSrc = '';

function showImageLightbox(src: string, alt: string): void {
  const overlay = ensureLightbox();
  const img = lightbox.imgEl!;
  if (currentLightboxSrc === src && overlay.classList.contains('omm-lightbox--open')) {
    closeLightbox();
    return;
  }
  currentLightboxSrc = src;
  img.src = src;
  img.alt = alt;
  lightbox.scale = 1;
  lightbox.translateX = 0;
  lightbox.translateY = 0;
  img.style.transform = 'scale(1)';
  overlay.classList.add('omm-lightbox--open');
}

function setZoom(scale: number): void {
  const clamped = Math.max(0.5, Math.min(5, Math.round(scale * 100) / 100));
  lightbox.scale = clamped;
  applyLightboxTransform();
}

function closeLightbox(): void {
  if (lightbox.overlay) {
    lightbox.overlay.classList.remove('omm-lightbox--open');
  }
  currentLightboxSrc = '';
}
