# Hook Guidelines

> How this project uses Obsidian plugin hooks and extension points.

This is an Obsidian plugin — not a React app — so the "hooks" here refer to **Obsidian lifecycle hooks and extension APIs**, not React hooks.

## Plugin lifecycle hooks

The plugin registers all lifecycle behavior in `main.ts`:

```typescript
// Plugin lifecycle — assembly only, no business logic
export default class QuickMemoPlugin extends Plugin {
  async onload() {
    // 1. Load settings
    // 2. Register view (registerView with VIEW_TYPE_OMM)
    // 3. Register settings tab
    // 4. Register vault event handlers (vaultEvents.ts)
    // 5. Registerribbon icon / command
  }

  async onunload() {
    // Clean up timers, detach leaves
  }
}
```

## View registration (ItemView)

The plugin registers a custom view type via `registerView`:

```typescript
// In main.ts
this.registerView(VIEW_TYPE_OMM, (leaf) => new QuickMemoView(leaf, this));
```

`QuickMemoView` extends `ItemView` and manages its own lifecycle (timers, event listeners). Clean up in `onClose()`:

```typescript
onClose() {
  if (this.pollInterval) clearInterval(this.pollInterval);
  // Remove any additional event listeners
}
```

## Settings tab

`SettingsTab` extends `PluginSettingTab` and is registered once in `onload()`. Every field change calls `plugin.saveSettings()`:

```typescript
// In SettingsTab.ts
new Setting(containerEl)
  .setName('Quick Memo heading')
  .addText(text => text
    .setValue(this.plugin.settings.quickMemoHeading)
    .onChange(async (value) => {
      this.plugin.settings.quickMemoHeading = value || DEFAULT_SETTINGS.quickMemoHeading;
      await this.plugin.saveSettings(); // triggers index rebuild + view refresh
    })
  );
```

## Observer pattern (vault events)

File changes are subscribed via the Obsidian vault event system in `src/vaultEvents.ts`:

```typescript
// Registered in onload()
this.registerEvent(
  this.app.vault.on('modify', (file) => {
    if (isQuickMemoPath(file.path)) {
      indexService.refreshChangedFiles([file.path]);
      view.refresh();
    }
  })
);
```

## Backward compatibility patterns

- The plugin checks `settings.overrideDailyNotesConfig` to decide whether to read Obsidian's daily-notes core config or use its own fallback — because the internal API is unreliable across Obsidian versions.
- Dynamic getters (`() => settings.quickMemoHeading`) are used instead of captured values so changes take effect without restart.
