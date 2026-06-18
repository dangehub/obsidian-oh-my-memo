import type { DateFileResolution, QuickMemoSettings } from '../types';
import type { VaultLike } from '../test/fakeVault';
import type { DailyNotesConfig } from './obsidianInternal';

export type DateFormatFn = (date: string, format: string) => string;

export class DailyNoteResolver {
  constructor(
    private readonly vault: VaultLike,
    private readonly dailyNotesConfig: DailyNotesConfig | undefined,
    private readonly settings: QuickMemoSettings,
    private readonly formatFn: DateFormatFn = formatDate,
  ) {}

  async resolve(date: string): Promise<DateFileResolution> {
    const config = this.dailyNotesConfig;
    const hasDailyNotesConfig = Boolean(config?.folder || config?.format);
    const folder = trimSlashes(hasDailyNotesConfig ? config?.folder ?? '' : this.settings.fallbackDailyNotesFolder);
    const format = hasDailyNotesConfig ? config?.format ?? this.settings.fallbackDateFormat : this.settings.fallbackDateFormat;
    const relative = `${this.formatFn(date, format)}.md`;
    return {
      date,
      filePath: folder ? `${folder}/${relative}` : relative,
      source: hasDailyNotesConfig ? 'daily-notes' : 'fallback',
    };
  }

  async ensureDailyNote(date: string): Promise<string> {
    const resolution = await this.resolve(date);
    const heading = `## ${this.settings.quickMemoHeading}`;

    if (!this.vault.exists(resolution.filePath)) {
      await this.vault.create(resolution.filePath, `\n${heading}\n`);
      return resolution.filePath;
    }

    const content = await this.vault.read(resolution.filePath);
    const headingPattern = new RegExp(`^##\\s+${escapeRegExp(this.settings.quickMemoHeading)}\\s*$`, 'mu');
    if (!headingPattern.test(content)) {
      const separator = content.endsWith('\n') ? '\n' : '\n\n';
      await this.vault.modify(resolution.filePath, `${content}${separator}${heading}\n`);
    }

    return resolution.filePath;
  }
}

export function formatDate(date: string, format: string): string {
  const [year, month, day] = date.split('-');
  return format
    .replace(/YYYY/gu, year)
    .replace(/MM/gu, month)
    .replace(/DD/gu, day);
}

function trimSlashes(value: string): string {
  return value.replace(/^\/+|\/+$/gu, '');
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
}
