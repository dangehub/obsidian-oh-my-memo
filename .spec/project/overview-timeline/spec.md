---
title: OMM 采集编辑器与时间线
desc: 原生编辑器兼容、采集工具和响应式时间线契约
hue: 38
code:
  - src/view/render.ts
related:
  - src/view/QuickMemoView.ts
  - src/editor/native-editor.ts
  - src/editor/editor-bridge.ts
  - src/settings/settings.ts
  - src/types.ts
  - styles.css
  - tests/render.test.ts
  - tests/settings.test.ts
---

OMM 的采集编辑器始终使用 Obsidian 原生 CM6 编辑器。保存、Cmd/Ctrl+Enter、草稿、图片粘贴、标签和链接插入必须继续可用。

编辑器 host 是 Editing Toolbar 等集成可发现的稳定锚点；当 OMM composer 获得可用 Editor 或 host 重新挂载时，bridge 必须发布其生命周期，使集成能够使用同一个原生 Editor，且不得改变 OMM 的 view type 或伪装其他插件。

类型选择是底栏中一个可辨识的单 SVG 按钮。时间、附件、标签、链接和保存与其共享紧凑的响应式底栏；OMM 不重复提供已由 Editing Toolbar 接管的格式菜单。

桌面端可拖拽的仅是编辑区纵向高度。高度以 `composerHeight` 持久化，范围为至少 80px、最多 600px 且不超过视口的 70%。composer 横向始终适应内容区，禁止 `composerWidth` 或横向拖拽。移动端不显示手柄，编辑区可自然增长且不横向溢出。
