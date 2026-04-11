# Design: UI Miro Theme Redesign

## 架构决策

### 1. 主题策略：CSS class + CSS 变量

采用 Tailwind 推荐的 `class` 策略（已在 `globals.css` 中配置 `@variant dark (&:where(.dark, .dark *))`）：

- `html` 无 class = **light mode**
- `html.dark` = **dark mode**
- `themeStore` 控制 `html.dark` class 的添加/移除
- 通过 `ThemeProvider` 客户端组件在 hydration 后同步，避免 SSR 闪白

### 2. CSS Token 体系（语义化双层）

#### Layer 1 — 原始色板（`globals.css` 中 `@theme inline`）

```css
/* Miro Blue 450 主色 */
--color-blue-450: #5b76fe;
--color-blue-450-pressed: #2a41b6;

/* 近黑/近白 */
--color-ink: #1c1c1e;
--color-white: #ffffff;

/* Pastel accents */
--color-coral-light: #ffc6c6;
--color-coral-dark:  #600000;
--color-teal-light:  #c3faf5;
--color-teal-dark:   #187574;
--color-rose-light:  #ffd8f4;
--color-orange-light: #ffe6cd;

/* Neutral slate */
--color-slate: #555a6a;
--color-slate-placeholder: #a5a8b5;
--color-border-miro: #c7cad5;
--color-ring: rgb(224,226,232);
--color-success: #00b473;
```

#### Layer 2 — 语义 token（`:root` light + `.dark` override）

| Token | Light | Dark |
|-------|-------|------|
| `--color-surface` | `#ffffff` | `#111113` |
| `--color-surface-2` | `#f5f6fa` | `#1c1c21` |
| `--color-surface-raised` | `#ffffff` | `#1a1a24` |
| `--color-text-primary` | `#1c1c1e` | `#e2e8f0` |
| `--color-text-secondary` | `#555a6a` | `#94a3b8` |
| `--color-text-placeholder` | `#a5a8b5` | `#64748b` |
| `--color-border` | `#e9eaef` | `rgba(255,255,255,0.10)` |
| `--color-border-strong` | `#c7cad5` | `rgba(255,255,255,0.20)` |
| `--color-interactive` | `#5b76fe` | `#5b76fe` |
| `--color-interactive-pressed` | `#2a41b6` | `#2a41b6` |
| `--color-interactive-subtle` | `rgba(91,118,254,0.08)` | `rgba(91,118,254,0.15)` |

同时保留现有 canvas 专用 token（`--color-bg-dark`、`--color-accent` 等）不变，避免影响 Canvas 页面。

### 3. ThemeProvider 组件

新建 `src/components/providers/ThemeProvider.tsx`：

```tsx
'use client';
import { useEffect } from 'react';
import { useThemeStore } from '@/stores/themeStore';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useThemeStore((s) => s.theme);
  
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);
  
  return <>{children}</>;
}
```

根 `layout.tsx` 移除硬编码 `dark`，包裹 `<ThemeProvider>`。

**初始化防闪**：在 `<head>` 注入内联 script，读取 `theme-storage` localStorage 并立即设置 class：

```html
<script dangerouslySetInnerHTML={{ __html: `
  (function() {
    try {
      var s = JSON.parse(localStorage.getItem('theme-storage') || '{}');
      if ((s.state || {}).theme === 'dark') document.documentElement.classList.add('dark');
    } catch(e) {}
  })();
`}} />
```

### 4. App Shell 重构

`src/app/(app)/layout.tsx`：

- 侧边栏：`bg-[var(--color-surface)]` + `border-[var(--color-border)]`
- Logo/Nav：使用 `text-[var(--color-text-primary)]`
- Active nav item：`bg-[var(--color-interactive-subtle)] text-[var(--color-interactive)]`
- User section：`border-[var(--color-border)]`

### 5. UI Primitives 重构

`UiButton`：
- `primary`：`bg-[var(--color-interactive)] text-white hover:bg-[var(--color-interactive-pressed)]`
- `muted`：`bg-[var(--color-surface-2)] text-[var(--color-text-primary)] border border-[var(--color-border)]`
- `ghost`：`text-[var(--color-text-secondary)] hover:bg-[var(--color-interactive-subtle)]`

`UiPanel`：`bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-[14px]`

`UiInput/UiTextArea`：`bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-primary)]`

`UiModal` 分隔线：`border-[var(--color-border)]`

### 6. Settings 页面——主题切换

在 Language 区块之前插入 **Appearance** 区块：

```tsx
<SectionCard title={t('settings.appearance')}>
  <div className="flex gap-2">
    {(['light', 'dark'] as Theme[]).map((t) => (
      <button key={t} onClick={() => setTheme(t)}
        className={activeTheme === t ? 'border-interactive ...' : '...'}>
        {t === 'light' ? <SunIcon /> : <MoonIcon />}
        {label}
      </button>
    ))}
  </div>
</SectionCard>
```

### 7. Dashboard 卡片符合 DESIGN.md

- 卡片：`rounded-xl`（12px）、`bg-[var(--color-surface)]`、`border border-[var(--color-border)]`
- hover：`ring-1 ring-[var(--color-interactive)] ring-offset-0`
- 标题：Syne 字体（已加载为 `--font-display`）

### 8. 字体应用

DESIGN.md 要求 Roobert PRO；项目已加载 Syne 作为 display 字体（视觉上近似）：

```css
/* Display 标题应用 Syne */
h1, h2, .font-display { font-family: var(--font-display), system-ui, sans-serif; }
```

Body 继续使用 Geist Sans（已配置）。

## 文件影响范围

| 文件 | 变更类型 | 风险 |
|------|----------|------|
| `src/app/globals.css` | 增加 token，修改 `:root` | 低 |
| `src/app/layout.tsx` | 移除 `dark` class，加 ThemeProvider | 低 |
| `src/components/providers/ThemeProvider.tsx` | 新建 | 低 |
| `src/app/(app)/layout.tsx` | 替换硬编码颜色 | 低 |
| `src/components/ui/primitives.tsx` | 替换颜色引用 | 低 |
| `src/app/(app)/settings/page.tsx` | 新增 Appearance 区块 | 低 |
| `src/app/(app)/dashboard/page.tsx` | 卡片 token 替换 | 低 |
| `src/stores/themeStore.ts` | 无变更 | — |

Canvas 页面（`src/app/(app)/canvas/[id]/page.tsx`）及所有 canvas feature 组件**不在本次变更范围内**，仅通过 token 被动受益。

## 不做什么

- 不修改 Canvas 内核逻辑
- 不更换字体文件（使用已有 Syne 近似代替 Roobert PRO）
- 不引入新的 UI 库
- 不修改 i18n 键（复用现有或最小扩充）
