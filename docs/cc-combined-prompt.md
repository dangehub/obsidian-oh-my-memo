请阅读 src/view/QuickMemoView.ts src/view/render.ts styles.css tests/render.test.ts 了解当前代码结构。

然后根据 docs/cm6-editor-requirements.md 中的需求，实现 CM6 原生编辑器嵌入。

实施步骤：
1. 新建 src/editor/native-editor.ts — 封装隐藏 leaf 管理
2. 修改 src/view/render.ts — composer 改用 div.omm-cm6-host + textarea 降级
3. 修改 src/view/QuickMemoView.ts — 生命周期集成
4. 修改 styles.css — CM6 样式
5. 完成后执行 npx tsc -noEmit -skipLibCheck 和 npx vitest run 验证

关键陷阱（已踩过的坑）：
- .omm-scratch.md 文件存在检查：先 adapter.exists() 判断，不要盲目 vault.create()
- 自动保存必须禁用。设置 (leaf.view as any).editor.autoSave = false 或等效
- onOpen 中延迟 init（requestAnimationFrame 或 Promise.resolve().then()）
- 重渲染时不要销毁重建 CM6，只迁移 DOM
- 初始化失败静默降级到 textarea，不要弹 Notice
- 清理时先移回 CM6 DOM 再关闭 leaf
