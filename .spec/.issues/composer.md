---
concern: 收紧 composer 布局并移除冗余格式入口
by: unknown
status: open
nodes: overview-timeline
created: 2026-07-21T17:23:46.460Z
---

用户在真实测试库验收提出三项 UI 问题，必须在保持 NativeEditor、Save、Editing Toolbar 兼容的前提下修复。\n\n1. composer 左上角的闪念/待办切换按钮移入底部工具栏，并以与普通工具按钮不同的可辨识样式呈现；删除右上角冗余的时间/时钟按钮，避免两端独占一行。\n2. 扩大 composer 编辑区域的可用宽度，消除不必要的内缩；顶部、工具栏、编辑区和底栏采用一致内容对齐。\n3. Editing Toolbar 已接管完整格式命令，移除 OMM 底部“三点/更多格式”入口及其不再可达的格式菜单；保留附件、手动时间、标签、链接和保存所需操作。\n\n验收：移动端不溢出；闪念/待办切换仍可用；Save 与 Cmd/Ctrl+Enter 不回归；Editing Toolbar toolbar 可正常工作；typecheck/test/build/diff check 通过，部署测试库时不覆盖 data.json。
