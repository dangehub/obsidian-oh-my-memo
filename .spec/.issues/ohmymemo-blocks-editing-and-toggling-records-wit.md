---
concern: OhMyMemo blocks editing and toggling records without Obsidian block IDs
by: unknown
status: open
nodes: project
created: 2026-07-20T15:19:41.666Z
---

Pure-Markdown records created when block IDs are disabled must remain editable and toggleable. The existing implementation displays a missing-block-ID notice instead. Need reproduce/fail eval, location-based safe mutation fallback, tests, and user validation. Spec: project.

<!-- reply: unknown @ 2026-07-20T17:23:16.290Z -->
Implementation is merged at 41a71d6. Follow-up: build the merged plugin and deploy its runtime artifacts to the local 测试用OB vault for user verification before closing the issue. Spec: project.
