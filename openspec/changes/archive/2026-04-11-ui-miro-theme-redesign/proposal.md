# Proposal: UI Miro Theme Redesign with Dark/Light Mode

## 为什么要做

当前产品 UI 存在以下问题：

1. **仅支持暗色模式** — `layout.tsx` 中 `dark` class 硬编码，用户无法切换主题，`themeStore` 虽已存在但无实际效果。
2. **设计语言缺乏一致性** — 侧边栏、面板使用硬编码颜色（`bg-[#111113]`、`border-white/8`），没有语义化 CSS token，难以维护。
3. **不符合 DESIGN.md 规范** — 当前调色板与 Miro 美学标准相差较远，缺少 Blue 450 (#5b76fe) 为主的交互色、pastel 强调色系、充足的 border-radius 层级。
4. **缺少明色主题** — 产品面向创意人群，明色主题有助于白天工作场景下的视觉舒适度。

## 改什么

- **建立完整的 CSS 设计 token 体系**：light/dark 双模式 CSS 变量，覆盖 surface、text、border、accent、pastel 色组。
- **启用 ThemeProvider**：移除 HTML 硬编码 `dark`，在客户端组件中同步 `themeStore` 到 `html` class。
- **重构 App Shell（侧边栏 + 主区域）**：用语义 token 替换所有硬编码颜色，符合 DESIGN.md 布局原则（radius、spacing）。
- **重构 UI 基础组件**（`primitives.tsx`）：`UiButton`、`UiPanel`、`UiInput`、`UiModal` 等使用 token，light/dark 均正确渲染。
- **重构 Settings 页面**：使用新 token，并添加主题切换开关（light / dark）。
- **重构 Dashboard 页面**：符合 DESIGN.md card、spacing、typography 规范。
- **字体升级**：保留现有 Geist Sans（body），将 Display role 切换到 Syne（已加载），应用 Miro 同等的 letter-spacing 负值。
- **不改动 Canvas 页面核心逻辑** — Canvas 节点/边/工具栏的业务功能保持不变，只更新配色 token。

## 成功标准

- [ ] `html` 无 `dark` 硬编码；主题通过 Settings 开关实时切换且持久化
- [ ] 所有 app 页面（dashboard/settings）在 light 和 dark 下均视觉正确
- [ ] CSS token 命名规范：`--color-surface`, `--color-text-primary`, `--color-interactive` 等
- [ ] 构建无 TS/lint 错误
- [ ] 现有功能（auth、canvas、API keys、i18n）不受影响
