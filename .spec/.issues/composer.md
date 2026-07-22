---
concern: 收紧 composer 布局并移除冗余格式入口
by: unknown
status: landed
nodes: overview-timeline
created: 2026-07-21T17:23:46.460Z
---

用户在真实测试库验收提出三项 UI 问题，必须在保持 NativeEditor、Save、Editing Toolbar 兼容的前提下修复。\n\n1. composer 左上角的闪念/待办切换按钮移入底部工具栏，并以与普通工具按钮不同的可辨识样式呈现；删除右上角冗余的时间/时钟按钮，避免两端独占一行。\n2. 扩大 composer 编辑区域的可用宽度，消除不必要的内缩；顶部、工具栏、编辑区和底栏采用一致内容对齐。\n3. Editing Toolbar 已接管完整格式命令，移除 OMM 底部“三点/更多格式”入口及其不再可达的格式菜单；保留附件、手动时间、标签、链接和保存所需操作。\n\n验收：移动端不溢出；闪念/待办切换仍可用；Save 与 Cmd/Ctrl+Enter 不回归；Editing Toolbar toolbar 可正常工作；typecheck/test/build/diff check 通过，部署测试库时不覆盖 data.json。

<!-- reply: unknown @ 2026-07-21T18:17:57.033Z -->
用户已在真实 Obsidian 验收确认 Editing Toolbar 可正确嵌入，先前 bridge 改动有效。新增验收：composer 太窄，桌面端需允许用户自由拖拽调整 composer 整体宽度；调整对象必须是同时包住 、Editing Toolbar 注入目标、编辑区和 footer 的统一容器，不能只改变 CM6 editor 宽度。宽度保存至 OMM settings 并在重启后恢复；受页面内容区上限约束且有合理最小宽度；移动端强制 100% 宽度、隐藏 resize handle、不得横向溢出。保持 bridge、Save、Cmd/Ctrl+Enter、类型单 SVG、附件/时间/标签/链接、自动保存状态和当前测试库 data.json 保护。

<!-- reply: unknown @ 2026-07-21T18:28:25.158Z -->
纠正：用户说输入框“太窄”指**纵向高度不足**，不是横向宽度。取消任何横向宽度拖拽/持久化方案。桌面端改为 composer 编辑区域的底部或右下角可访问拖拽手柄，调整纵向高度并保存到 OMM settings；横向继续占据响应式内容区全宽，Editing Toolbar、 与 footer 同宽对齐。高度需 min/max 且不遮住时间线/超出视口；移动端隐藏手柄，舒适最小高度+内容自然增长，无布局溢出。
