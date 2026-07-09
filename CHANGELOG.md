# Changelog

## 0.8.0 (2026-07-09)

### Features
- **Memos-inspired UI redesign**: Cleaner card design, softer shadows, improved spacing
- **Pill toggle** replaces dropdown for 闪念/待办 type switching
- **Editable date/time**: Composer shows clickable datetime, allows custom timestamps for backfilling
- **Draft auto-save**: Real-time localStorage persistence with blur + onClose safeguards
- **Color state indicators**: Active pill type (amber/blue) and custom datetime (orange) shown visually
- **Lucide SVG icons**: All emoji replaced with stroke-based Obsidian-native style icons

### Bug Fixes
- Editor content preserved across re-render cycles
- Save properly uses custom datetime when set
- Mobile layout uses full screen width
- Type switch now updates UI immediately

## 0.7.3 (2026-07-08)

### Features
- Native editor clickable area: clicking blank space in composer and edit cards focuses CM6
