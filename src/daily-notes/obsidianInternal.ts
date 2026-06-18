import type { App } from 'obsidian';

export interface DailyNotesConfig {
  folder?: string;
  format?: string;
}

interface DailyNotesOptions {
  folder?: string;
  format?: string;
}

interface InternalDailyNotesPlugin {
  instance?: {
    options?: DailyNotesOptions;
  };
  options?: DailyNotesOptions;
}

interface AppWithInternalPlugins extends App {
  internalPlugins?: {
    plugins?: {
      'daily-notes'?: InternalDailyNotesPlugin;
    };
  };
}

/**
 * Read the core Daily Notes plugin config. Obsidian versions differ in where the
 * options live (instance.options vs top-level options), so check both. Returns
 * undefined when Daily Notes is not configured, so the caller falls back to the
 * plugin's own folder/format settings.
 */
export function getDailyNotesConfig(app: App): DailyNotesConfig | undefined {
  const dailyNotes = (app as AppWithInternalPlugins).internalPlugins?.plugins?.['daily-notes'];
  const options = dailyNotes?.instance?.options ?? dailyNotes?.options;
  if (!options) return undefined;
  return {
    folder: options.folder,
    format: options.format,
  };
}
