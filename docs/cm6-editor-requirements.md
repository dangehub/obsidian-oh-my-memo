# CM6 原生编辑器嵌入 — 需求文档

## 目标

将 OhMyMemo 闪念输入区的 `<textarea>` 替换为 Obsidian 原生 CodeMirror 6 编辑器实例，使其具备和 Obsidian 编辑器一致的编辑能力（语法高亮、`[[` 双链补全、`#` 标签补全、快捷键等）。

## 方案：Sneaky Leaf（隐藏 Leaf）

不自己创建 CM6 实例，而是利用 Obsidian 内部已运行的 CM6。

### 原理

1. 在视图初始化时，通过 `app.workspace.getLeaf('split', 'hidden')` 创建一个隐藏的 split leaf
2. 让该 leaf 打开一个**不可见的载体文件** `.omm-scratch.md`（在 vault 根目录）
3. Obsidian 内部会为这个 leaf 创建一个 CM6 编辑器实例（`leaf.view.editor.cm`）
4. 把 CM6 的 DOM 容器（`.cm-editor` 元素）从该 leaf 的 DOM 树中摘取，**reparent** 到 OMM 的 composer 区域
5. 用户输入时，CM6 的内容实时更新在载体文件中，但**禁止自动保存**——不要污染载体文件
6. 用户按 Cmd+Enter 时，通过 `editor.getValue()` 取内容，写入当天的 Daily Note

### 关键文件

- `src/view/QuickMemoView.ts` — 视图生命周期管理
- `src/view/render.ts` — DOM 渲染（composer 区域）
- `styles.css` — 样式
- `src/editor/native-editor.ts`（新建）— 封装隐藏 leaf + CM6 管理

---

## 详细需求

### 1. 初始化流程 (`initNativeEditor`)

```
async function initNativeEditor(containerEl: HTMLElement): Promise<EditorView | null>
```

1. 检查是否移动端（`window.innerWidth < 900`）→ 如果移动端直接返回 null，保持 textarea
2. 通过 `app.workspace.getLeaf('split', 'hidden')` 创建隐藏 leaf
3. 检查 `.omm-scratch.md` 是否存在：
   - 先用 `app.vault.adapter.exists('.omm-scratch.md')` 检查
   - 如果存在 → `app.vault.getAbstractFileByPath('.omm-scratch.md')` 获取
   - 如果不存在 → `app.vault.create('.omm-scratch.md', '')` 创建
   - ⚠️ **不要用 `vault.read` + `vault.create` 的两步方式**——create 在文件已存在时会抛 `FileAlreadyExists`
4. 用 `leaf.openFile(scratchFile)` 打开载体文件
5. 获取编辑器实例：`(leaf.view as any).editor.cm` — 这是 CM6 的 `EditorView`
   - 如果取不到，降级到 textarea
6. 把 CM6 的 DOM 容器（`.cm-editor`）从 leaf 的 DOM 中 reparent 到 `containerEl`
7. 禁用自动保存（关键！）：设置 `leaf.view.editor.autoSave = false` 或等效方式
   - Obsidian 的 `MarkdownEditView` 有 `saveOnClickOutside` / `saveInterval` 等属性
   - 目标是：载体文件内容被修改但 Obsidian 不会自动写盘
   - 需要确保每次 OMM 视图关闭时也不保存载体文件
   - 可选方案：`leaf.view.editor.setAutoSave(false)` 或覆写 `editor.save` 为空函数
8. 把 CM6 的焦点事件与 OMM 的 Cmd+Enter 保存快捷键连接
9. 返回 EditorView 引用

### 2. 获取内容

```
function getComposerValue(editorView: EditorView | null): string
```

- 如果有 CM6 EditorView → `editorView.state.doc.toString()`
- 如果是 textarea 降级 → `textarea.value`

### 3. 清空编辑器

```
function clearEditor(editorView: EditorView | null): void
```

- 切换日期时调用
- CM6: `editorView.dispatch({changes: {from: 0, to: editorView.state.doc.length, insert: ''}})`
- textarea: `textarea.value = ''`

### 4. 清理 (`cleanupNativeEditor`)

```
async function cleanupNativeEditor(): Promise<void>
```

1. 把 CM6 的 DOM 从 composer 移回隐藏 leaf 的容器（恢复原状，防止 Obsidian 报错）
2. 关闭隐藏 leaf：`leaf.detach()` 或 `leaf.getWindow().close()`
3. 清空内部引用

### 5. 视图生命周期集成 (`QuickMemoView.ts`)

**`onOpen()`:**
- 正常渲染 composer（此时 composer 区域是一个 `div.omm-cm6-host`）
- 在 `onOpen()` 或首次渲染后异步调用 `initNativeEditor`（因为需要等到 DOM 真正挂载）

**`onClose()`:**
- 调用 `cleanupNativeEditor()`

**日期切换时（`openDate` 等）:**
- 调用 `clearEditor()`

**Cmd+Enter / 保存时:**
- 调用 `getComposerValue()` 取内容 → 写入 Daily Note → 清空编辑器

**重渲染（`refreshView` 等）:**
- 不要销毁重建 CM6！只重新挂载 CM6 的 DOM 到新的 composer 容器
- 维护一个 `nativeEditorView` 引用，重渲染时 `containerEl.appendChild(cmEditorDom)`

### 6. render.ts 改动

- 把 `<textarea>` 改为一个 `<div class="omm-cm6-host"></div>`
- 保留 textarea 作为移动端/降级回退（用 `display: none` 切换）
- 新增标志位 `isNativeEditor = boolean` 控制显示哪个

### 7. styles.css 改动

- `.omm-cm6-host` — CM6 容器的布局样式（高度、内边距、滚动）
- `.omm-native-hidden` — 隐藏 leaf 的容器样式（`display: none`，但保留尺寸）
- 移动端回退：`@media (max-width: 900px)` 时隐藏 CM6 容器、显示 textarea
- 全部使用 `--var-*` Obsidian 主题变量，不要硬编码颜色

### 8. 移动端回退

```
const isMobile = window.innerWidth < 900 || leaf.viewState.mobile;
```

- 移动端：显示 textarea（保持现有关键词输入、自动补全功能不变）
- 桌面端：显示 CM6 原生编辑器

### 9. 错误处理

- 任何步骤失败都要**静默降级到 textarea**（不要弹 Notice 打扰用户）
- 控制台输出 `[OhMyMemo] Native editor init failed: <reason>` 以便调试

### 10. 不做的

- ❌ 不做编辑器内容的自动保存到 Daily Note（用户手动 Cmd+Enter 才保存）
- ❌ 不做载体文件 `.omm-scratch.md` 的用户可见性处理（Obsidian 内部文件，用户看不到）
- ❌ 不要在设置页加开关——这个功能默认启用，失败自动降级
- ❌ 不要保存编辑器状态到磁盘——切换日期就清空

---

## 载体文件约定

| 属性 | 值 |
|------|-----|
| 文件名 | `.omm-scratch.md` |
| 位置 | vault 根目录 |
| 生命周期 | Obsidian 启动时创建，持续存在 |
| 内容 | 临时输入缓存，不重要 |
| 自动保存 | **禁用** — 不要写盘 |

## 已踩过的坑（必读）

1. **文件已存在检查**：不要 `vault.read` + 检查错误 → `vault.create`。`vault.create` 在文件存在时抛 `FileAlreadyExists` 且错误前缀是字符串。正确做法是 `adapter.exists` 判断。
2. **vault 索引 vs 文件系统**：`.omm-scratch.md` 可能存在于磁盘但不在 vault 索引中（`getAbstractFileByPath` 返回 null）。这时需要用 `adapter.exists` 检查文件系统，再用 `vault.create` 创建——但如果文件系统上已有，`vault.create` 还是会抛。所以逻辑应该是：
   - `adapter.exists('.omm-scratch.md')` → 存在则用 `vault.getAbstractFileByPath('.omm-scratch.md')`（返回 null 时尝试 `app.vault.getRoot().children.find(...)` 等方式找）
   - 不存在 → `vault.create('.omm-scratch.md', '')`
   - 兜底：如果都失败，降级到 textarea
3. **不要用 `source` 反查**：`app.vault.getMarkdownFiles().find(f => f.path === '.omm-scratch.md')` 是可行的后备方案。
4. **生命周期问题**：`onOpen()` 中调用 `getLeaf` 时 view 还没有完全挂载到 DOM。需要在 `onOpen()` 里用 `requestAnimationFrame` 或 `nextTick` 延迟初始化。
5. **重渲染时的 DOM 迁移**：`refreshView` 会重建 composer 的 DOM。CM6 的 `.cm-editor` 需要从旧容器取出、插入新容器。不要让 CM6 被销毁重建。
