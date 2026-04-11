# Tasks: UI Miro Theme Redesign

## 里程碑 1 — CSS Token 体系 & ThemeProvider

- [x] **T1** `src/app/globals.css` — 在 `@theme inline` 中添加 Miro 原始色板 token（Blue 450、pastel 色组、ink、success、border-miro 等）
- [x] **T2** `src/app/globals.css` — 重写 `:root` 块为 light 语义 token（`--color-surface`、`--color-text-primary`、`--color-interactive` 等全套）
- [x] **T3** `src/app/globals.css` — 添加 `.dark` 规则块覆盖所有语义 token 为暗色值；保留现有 canvas 专用 token（`--color-bg-dark`、`--color-accent` 等）
- [x] **T4** 新建 `src/components/providers/ThemeProvider.tsx` — 客户端组件，useEffect 同步 themeStore → `html.dark` class
- [x] **T5** `src/app/layout.tsx` — 移除 `html` 上的硬编码 `dark` class；添加防闪内联 script（读取 localStorage `theme-storage`）；用 `ThemeProvider` 包裹 children
- [x] **T6** 验证：`npx tsc --noEmit` 无报错（预存 fluent-ffmpeg 错误与本次无关）

## 里程碑 2 — App Shell 重构

- [x] **T7** `src/app/(app)/layout.tsx` — 侧边栏背景/边框换用语义 token
- [x] **T8** `src/app/(app)/layout.tsx` — Nav active/hover 状态换用 `--color-interactive-subtle` / `--color-interactive`
- [x] **T9** `src/app/(app)/layout.tsx` — User section 边框换用 `--color-border`
- [x] **T10** `src/app/(app)/layout.tsx` — 主内容区 `bg-[#0a0a0a]` 换用 `bg-ui-bg`
- [x] **T11** 验证 light/dark 下侧边栏视觉正确

## 里程碑 3 — UI Primitives 重构

- [x] **T12** `src/components/ui/primitives.tsx` — `UiButton` primary/muted/ghost 三个变体换用语义 token
- [x] **T13** `src/components/ui/primitives.tsx` — `UiIconButton`、`UiChipButton` 换用语义 token
- [x] **T14** `src/components/ui/primitives.tsx` — `UiPanel` 背景/边框/阴影换用语义 token；保留 backdrop-filter
- [x] **T15** `src/components/ui/primitives.tsx` — `UiInput`、`UiTextArea`、`UiTextAreaField` 换用语义 token
- [x] **T16** `src/components/ui/primitives.tsx` — `UiModal` 分隔线边框换用 `--color-border`
- [x] **T17** `src/components/ui/primitives.tsx` — `UiSelect` 触发器、下拉菜单换用语义 token
- [x] **T18** `src/app/globals.css` — 更新 `.ui-panel` 和 `.ui-field` CSS 类使用语义 token
- [x] **T19** 验证：`npx tsc --noEmit` 无报错

## 里程碑 4 — Settings 页面

- [x] **T20** `src/app/(app)/settings/page.tsx` — `SectionCard` 边框/背景换用语义 token
- [x] **T21** `src/app/(app)/settings/page.tsx` — 在 Language 区块前添加 Appearance 区块（Light / Dark 切换按钮，调用 `useThemeStore`）
- [x] **T22** `src/app/(app)/settings/page.tsx` — 主题按钮样式符合 DESIGN.md（Blue 450 高亮 active 状态、正确 border-radius）
- [x] **T23** `src/i18n/locales/zh.json` 和 `en.json` — 添加 `settings.appearance`、`settings.themeLight`、`settings.themeDark` 键
- [x] **T24** 验证：light 模式下 Settings 页面所有 input、button、card 正确显示

## 里程碑 5 — Dashboard 页面

- [x] **T25** `src/app/(app)/dashboard/page.tsx` — 页面背景、标题字体换用语义 token
- [x] **T26** `src/app/(app)/dashboard/page.tsx` — 项目卡片换用 `--color-surface`、`--color-border`、`rounded-xl`
- [x] **T27** `src/app/(app)/dashboard/page.tsx` — 卡片 hover ring 使用 `--color-interactive`
- [x] **T28** `src/app/(app)/dashboard/page.tsx` — 空状态和操作按钮换用语义 token
- [x] **T29** 验证：light/dark 下 Dashboard 卡片视觉正确

## 里程碑 6 — 最终验证

- [x] **T30** `npx tsc --noEmit` — 零新增错误（2 个预存 fluent-ffmpeg 错误与本次无关）
- [ ] **T31** `npm run lint` — 零新增警告
- [ ] **T32** 手动测试：Settings 切换 light↔dark，持久化（刷新页面后保持）
- [ ] **T33** 手动测试：Dashboard、Settings 在两种主题下无明显视觉 bug
- [ ] **T34** 确认 Canvas 页面核心功能（打开项目、节点操作）不受影响
