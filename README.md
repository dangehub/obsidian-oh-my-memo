# Quick Memo — Obsidian micro-memo plugin

**English:** Quick Memo is a Markdown-native Obsidian plugin for fast daily capture of micro-records (闪念/待办). Database-free — your daily note Markdown file is the single source of truth. Records are stored as plain list items under a configurable heading inside your existing diary files. An in-memory index powers search, filters, tags, and a 90-day activity heatmap.

**中文：** 一个 Markdown 原生的 Obsidian 闪念/待办快速记录插件，类似 Thino 的轻量捕获体验。**不依赖任何数据库**——你的日记 `.md` 文件就是唯一数据源。记录直接写入你现有的日记文件中（可配置标题、写入位置、处理范围），并维护可随时重建的内存索引。

---

## 一、核心功能

- **直接写入日记**：记录写入你现有的日记文件（如 `2026-06-30.md`），不再生成独立文件
- **可配置存储**：指定标题（如 `### memos`）、写入位置（标题下/日记末尾）、处理范围（仅标题内/整篇日记）
- **全部记录视图**：默认按日期分组显示所有记录，支持懒加载（每 50 条）
- **输入区**：文本区直接输入 Markdown，`Cmd/Ctrl+Enter` 保存，支持粘贴图片附件
- **附件管理**：图片粘贴上传，链接格式可配置（Wiki/Markdown，路径简写/相对/绝对），默认跟随 Obsidian 全局设置
- **待办管理**：`- [ ]` / `- [x]` 勾选回写文件
- **筛选搜索**：按类型/标签/关键词筛选，搜索不打断中文输入法
- **热力图**：近 90 天活动热力图，点击日期跳转
- **标签系统**：自动提取 `#tag`，支持按标签筛选和批量删除
- **操作菜单**：每条记录 `⋮` 菜单支持编辑/删除/复制块链接/打开源文件
- **跨午夜自动刷新**：停留在「今天」时自动滚动到新日期

### 移动端

- **抽屉侧边栏**：≤900px 侧边栏变为从左侧滑入的遮罩抽屉，类似 Thino
- **顶部导航栏**：☰ 按钮 + 标题 + 排序按钮，始终可见
- **图片灯箱**：点击图片全屏查看，支持滚轮/双指缩放 (0.5x–5x)，双击切换

### 格式兼容

- 兼容 **Tab 缩进**、**2 空格缩进** 的多行续行（Thino 迁移数据）
- 兼容 **blockquote/callout**（`> [!type]`）续行（QQ 空间导入数据）
- 多行记录块 ID 自动从尾部提取

---

## 二、安装方式

### 方式 A：手动安装（本压缩包已包含运行所需文件）

本压缩包内的 `aqu-quick-memos` 文件夹已经包含 Obsidian 加载插件所需的全部文件：

```
aqu-quick-memos/
├── manifest.json
├── main.js
└── styles.css
```

安装步骤：

1. 解压本压缩包，得到 `aqu-quick-memos` 文件夹；
2. 把这个文件夹整个复制到你 vault 的插件目录：
   ```
   <你的vault>/.obsidian/plugins/aqu-quick-memos/
   ```
   如果 `.obsidian/plugins` 目录不存在，手动创建即可；
3. 打开 Obsidian → 设置 → 第三方插件（Community plugins）；
4. 关闭「安全模式」（如果尚未关闭）；
5. 在已安装插件列表里找到 **Quick Memo**，打开开关启用它；
6. 启用后，左侧栏会出现一个笔记本图标（notebook-pen），点击即可打开 Quick Memo 总览面板。

> 说明：`main.js`、`styles.css`、`manifest.json` 这三个文件必须放在同一个名为 `aqu-quick-memos` 的文件夹里，文件夹名要与 `manifest.json` 中的 `id` 一致，否则 Obsidian 无法识别。

### 方式 B：从源码构建（开发者）

```bash
npm install
npm run build          # 生成 main.js
```

然后将 `manifest.json`、`main.js`、`styles.css` 复制到 vault 的插件目录即可。

---

## 三、使用方式

### 1. 打开面板

- 点击左侧栏的 Quick Memo 图标；
- 或执行命令 `Quick Memo: Open overview`（`Ctrl/Cmd + P` 搜索）。

移动端：顶部 ☰ 按钮唤出侧边栏抽屉。

### 2. 新建记录

1. 输入区选择类型：普通 / 待办；
2. 输入 Markdown 内容，支持多行（`Enter` 换行）；
3. 点击「保存」或按 `Cmd/Ctrl + Enter`。

内容写入当天日记文件中（位置取决于「写入位置」设置）。

### 3. Markdown 格式

```
### memos

- 09:12 单行记录 #灵感 ^oqm-20260621-091200-a1b2
- 22:05
  多行记录第一行
  多行续行 ^oqm-20260630-220500-x1y2
- [ ] 10:20 待办事项 #todo ^oqm-...
- [x] 11:00 已完成 ^oqm-...
- 20:47
> [!microblog] ![](avatar.png) text · 20:47
> 你好
```

- 普通记录：`- HH:MM 内容`
- 多行记录：首行 `- HH:MM`，续行缩进（2 空格 / Tab / `> ` 均可）
- 待办：`- [ ]` / `- [x]`
- `^oqm-…` 为可选块 ID，用于编辑/删除/勾选/块链接

### 4. 卡片操作

每条记录右上角 `⋮` → 编辑 / 复制块链接 / 打开源文件 / 删除。待办可直接点击左侧勾选框切换状态。

### 5. 筛选与搜索

侧边栏（桌面）或抽屉（移动端）提供：

- **类型**：全部 / 普通 / 待办 / 已完成 / 未完成
- **搜索**：回车触发，不打断中文输入法
- **标签**：点击筛选，右键删除标签

### 6. 排序与懒加载

- 排序按钮 ↑↓ 切换最新/最早在上
- 初始显示 50 条，底部「加载更多」每次追加 50 条

### 7. 全部记录视图

默认显示所有日期的记录，按日期分组。点击热力图某天可切到单日时间线，点击「显示全部」返回。

面板会每分钟检查一次本地日期；如果你正停留在「今天」，跨过午夜后会自动滚动到新的一天，不会打断你正在浏览的历史日期。

---

## 四、设置项

| 设置 | 说明 |
| --- | --- |
| 用户名称 / Slogan / 头像 | 侧边栏个人信息 |
| Memos 标题 | 插件读写的标题，默认 `### memos` |
| 写入位置 | 新记录插入位置：标题下 / 日记末尾 |
| 处理范围 | 扫描范围：仅标题内 / 整篇日记（兼容不同标题的历史数据） |
| 使用自定义日记路径 | 开启后按下方文件夹和格式定位 |
| 日记文件夹 / 日期格式 | 自定义日记路径，如 `101-日记/YYYY/YYYY-MM-DD` |
| 启用块 ID | 默认开启，关闭后进入纯净 Markdown 模式 |
| 记录排序 | 最新在上 / 最早在上 |
| 附件存放路径 | 五种模式（含「遵循 Obsidian 设置」） |
| 链接语法 | Wiki / Markdown / 遵循 Obsidian |
| 链接路径格式 | 简写 / 相对 / 绝对 / 遵循 Obsidian |
| 启动时打开 | 是否在 Obsidian 启动时自动打开面板（默认关闭） |

---

## 五、特点

- **Markdown 原生，无数据库**：文件即数据，索引可随时重建
- **写入现有日记**：不生成独立文件，与你现有的日记文件共存
- **可配置范围**：标题/写入位置/处理范围均可自定义
- **格式兼容**：2 空格缩进、Tab 缩进、blockquote/callout 续行均支持
- **移动端友好**：抽屉侧边栏、顶部导航栏、图片灯箱缩放
- **本地日期**：使用本地时间，不会 UTC 跨天错位
- **主题自适应**：样式使用 Obsidian 主题变量，自动跟随亮色/暗色主题
- **可测试**：核心逻辑（解析器、索引、仓库、渲染）有 72 个单元测试覆盖

---

## 六、命令

| 命令 | 作用 |
| --- | --- |
| Quick Memo: Open Quick Memo overview | 打开总览面板 |
| Quick Memo: Rebuild Quick Memo index | 手动重建索引 |
| Quick Memo: Backfill missing Quick Memo block IDs for today | 为今天缺少块 ID 的记录补全 ID |

---

## 七、数据存储

记录直接写入你的日记文件（如 `101-日记/2026/2026-06-30.md`），默认标题 `### memos`，格式：

```
### memos

- 09:12 记录内容 ^oqm-...
- [ ] 10:20 待办 #tag ^oqm-...
```

写入位置和处理范围可在设置中调整。插件配置存于 `<vault>/.obsidian/plugins/aqu-quick-memos/data.json`。

卸载插件后，已写入的 Markdown 记录保留在日记文件中，不会丢失。

---

## 八、技术信息

- 最低 Obsidian 版本：1.7.2
- 桌面端 / 移动端均可使用
- 作者：dangehub
- 72 个单元测试覆盖核心逻辑

---

## 九、FAQ

**Q：为什么改了标题后记录都不见了？**
A：设置 →「处理范围」切到「整篇日记」即可扫描所有标题下的记录。

**Q：历史日记里标题不一样怎么办？**
A：将「处理范围」设为「整篇日记」，插件会扫描文件中所有符合格式的记录。

**Q：勾选待办后文件里会同步吗？**
A：会。勾选自动把 `- [ ]` 改写成 `- [x]`（需记录有块 ID）。

**Q：卸载插件会丢数据吗？**
A：不会。所有记录都是普通 Markdown，留在日记文件里。

---

## 十、致谢

本项目基于 [swz-quick-memos](https://github.com/songwz/swz-quick-memos) 二次开发（fork）。感谢原作者 [songwz](https://github.com/songwz) 提供的优秀基础架构与设计理念。
