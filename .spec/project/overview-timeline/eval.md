---
scenarios:
  - name: composer-bridge-and-height
    description: >
      通过真实 Obsidian 测试 Vault 打开 OMM composer，确认 Editing Toolbar 可作用于原生编辑器，
      桌面端拖拽编辑区高度后重启仍恢复，且移动端没有手柄或横向溢出。
    expected: >
      OMM host 可被集成发现，保存与快捷键可用；高度只以 composerHeight 持久化并受边界约束；
      不存在 composerWidth，移动布局保持完整。
    tags:
      - desktop
      - mobile
      - frontend-e2e
    code:
      - src/view/render.ts
    related:
      - src/editor/editor-bridge.ts
      - src/view/QuickMemoView.ts
    test:
      path: tests/render.test.ts
      name: renders the single-SVG composer toggle and native host
---

先执行自动化测试和构建，再用真实测试 Vault 验证动态集成和拖拽。部署前后比较插件目录中 `data.json` 的 SHA-256；该文件不可被发布流程修改。
