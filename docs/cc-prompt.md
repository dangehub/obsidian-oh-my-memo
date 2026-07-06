你是一个 Obsidian 插件开发专家。请根据以下需求，在 /Users/qudange/Documents/code/aqu-quick-memos 仓库中实现 CM6 原生编辑器嵌入。

## 项目上下文

这个仓库是一个 Obsidian 插件（OhMyMemo），用于快速记录闪念和待办。

关键的架构约束：
- `VaultLike` 是测试隔离层（src/test/fakeVault.ts），但 CM6 功能直接操作 Obsidian API（不经过 VaultLike）
- `QuickMemoView.ts` 是 ItemView，`render.ts` 是纯 DOM 渲染器
- 日期处理一律本地时间，禁用 UTC
- styles.css 必须用 Obsidian theme variables
- main.js 是 gitignored 的构建产物

## 需求文档

完整需求见 `docs/cm6-editor-requirements.md` — 请先阅读该文件。

## 要求

### 实现步骤

1. **新建 `src/editor/native-editor.ts`** — 封装隐藏 leaf 管理（initNativeEditor / cleanupNativeEditor / getComposerValue / clearEditor）
2. **修改 `src/view/render.ts`** — 把 composer 的 textarea 改为 `div.omm-cm6-host` + 保留 textarea 作为降级
3. **修改 `src/view/QuickMemoView.ts`** — 在 onOpen 中调用 initNativeEditor，onClose 调用 cleanupNativeEditor，保存/清空时路由到 CM6
4. **修改 `styles.css`** — 添加 CM6 相关样式
5. **修改 `tests/render.test.ts`** — 如果原来有测试了 textarea，适配新的 DOM 结构（或者跳过测试先不动）

### 验收标准

1. `npx tsc -noEmit -skipLibCheck` 零错误
2. `npx vitest run` 全部通过（现有 76 个测试）
3. 桌面端（viewport > 900px）：composer 区域渲染 CM6 编辑器（有 `.cm-editor` 元素）
4. 移动端（viewport < 900px 模拟）：回退到 textarea
5. 初始化失败时静默降级 textarea，不弹 Notice

### 关键陷阱（反复读几遍）

- **文件存在性检查**：.omm-scratch.md 可能存在于文件系统但不被 vault 索引识别。先用 `adapter.exists()` 检查，如果存在但 `getAbstractFileByPath` 返回 null，尝试 `vault.getMarkdownFiles().find()`。如果都不行，降级。**不要在文件存在时调 `vault.create()`**——会抛 FileAlreadyExists。
- **自动保存必须禁用**：必须找到方式让载体文件的修改不触发 Obsidian 写盘。可以考虑 `(leaf.view as any).editor.autoSave = false` 或覆写 save 方法。
- **onOpen 时机**：onOpen 中 DOM 可能还没挂载完成。用 `requestAnimationFrame` 或 `Promise.resolve().then()` 延迟 init。
- **重渲染 DOM 迁移**：如果 render 被再次调用（refreshView），不要重建 CM6。从旧容器取出 .cm-editor DOM 再 append 到新容器。
- **清理顺序**：把 CM6 DOM 移回隐藏 leaf → 关闭 leaf → 清空引用。

### 不需要做的

- 不需要修改测试文件（除非编译不过）
- 不需要修改 manifest.json
- 不需要改 package.json、esbuild.config.mjs
- 不要提交 git，不要 push

### 完成后

执行 `npx tsc -noEmit -skipLibCheck` 验证编译，然后执行 `npm run build` 构建 main.js。
