# 2026-04-06 18:20 - Implement comprehensive theme system with CSS variables

## 提交信息
```
Commit: 097b35a18fd34cfffc40685f80cbd500696d7425
Author: Ye QingXin
Date: 2026-04-06 18:20:35 +0800
Branch: 001-frontend-spec-template
```

## 变更概述
使用 CSS 变量实现全面的主题系统，支持四种预设主题：亮色、暗色、赛博朋克、森林。主题系统支持运行时切换，所有组件使用 CSS 变量实现样式定义，确保主题切换即时生效。

## 文件变更

### 新增文件

#### 主题类型定义
**`src/themes/types.ts`**
```typescript
export interface ThemeTokens {
  // 背景色
  'color-bg-primary': string
  'color-bg-secondary': string
  'color-bg-tertiary': string
  'color-bg-elevated': string
  'color-bg-secondary-rgb': string  // 用于 rgba

  // 文字色
  'color-text-primary': string
  'color-text-secondary': string
  'color-text-tertiary': string
  'color-text-inverse': string

  // 强调色
  'color-accent': string
  'color-accent-hover': string
  'color-accent-active': string

  // 边框/分割线
  'color-border': string
  'color-divider': string

  // 功能色
  'color-success': string
  'color-warning': string
  'color-error': string
  'color-info': string

  // 圆角
  'radius-sm': string
  'radius-md': string
  'radius-lg': string
  'radius-xl': string

  // 阴影
  'shadow-sm': string
  'shadow-md': string
  'shadow-lg': string

  // 字体
  'font-sans': string
  'font-mono': string

  // 字号
  'text-sm': string
  'text-base': string
  'text-lg': string

  // 间距
  'space-sm': string
  'space-md': string
  'space-lg': string
}

export interface Theme {
  name: string
  label: string
  tokens: Partial<ThemeTokens>
}
```

#### 主题管理器
**`src/themes/manager.ts`**
核心函数:
```typescript
// 合并主题令牌（用默认主题补全缺失值）
function mergeWithDefault(theme: Theme): Theme

// 应用主题到 DOM
export function applyTheme(theme: Theme): void {
  const merged = mergeWithDefault(theme)
  const html = document.documentElement
  
  // 设置 data-theme 属性（用于 CSS 选择器）
  html.setAttribute('data-theme', theme.name)
  
  // 将所有 tokens 设置为 CSS 变量
  Object.entries(merged.tokens).forEach(([key, value]) => {
    html.style.setProperty(`--${key}`, value)
  })
}

// 获取所有预设主题
export function getAvailableThemes(): Theme[]

// 通过名称查找主题
export function findThemeByName(name: string): Theme | undefined

// 获取默认主题
export function getDefaultTheme(): Theme
```

#### 主题预设

**`src/themes/presets/light.ts`** - 亮色主题
```typescript
export const lightTheme: Theme = {
  name: 'light',
  label: '明亮',
  tokens: {
    'color-bg-primary': '#ffffff',
    'color-bg-secondary': '#f5f5f5',
    'color-text-primary': '#1a1a1a',
    'color-text-secondary': '#666666',
    'color-accent': '#6366f1',
    'color-border': '#e0e0e0'
  }
}
```

**`src/themes/presets/dark.ts`** - 暗色主题
```typescript
export const darkTheme: Theme = {
  name: 'dark',
  label: '暗黑',
  tokens: {
    'color-bg-primary': '#0f0f0f',
    'color-bg-secondary': '#1a1a1a',
    'color-text-primary': '#ffffff',
    'color-text-secondary': '#a1a1aa',
    'color-accent': '#8b5cf6',
    'color-border': '#3a3a3a'
  }
}
```

**`src/themes/presets/cyberpunk.ts`** - 赛博朋克主题
```typescript
export const cyberpunkTheme: Theme = {
  name: 'cyberpunk',
  label: '赛博朋克',
  tokens: {
    'color-bg-primary': '#0a0a0f',
    'color-bg-secondary': '#1a1a2e',
    'color-text-primary': '#e0e0e0',
    'color-accent': '#00f3ff',
    'color-border': '#e94560',
    // 霓虹发光阴影
    'shadow-md': '0 0 8px rgba(0, 243, 255, 0.4), 0 0 16px rgba(233, 69, 96, 0.2)',
    // 锐利圆角
    'radius-md': '4px',
    // 科技感字体
    'font-sans': '"Rajdhani", "Orbitron", system-ui, sans-serif'
  }
}
```

**`src/themes/presets/forest.ts`** - 森林主题
```typescript
export const forestTheme: Theme = {
  name: 'forest',
  label: '森林',
  tokens: {
    'color-bg-primary': '#0d1f0d',
    'color-bg-secondary': '#1a3a1a',
    'color-text-primary': '#e8f5e8',
    'color-accent': '#7cb342',
    'color-border': '#4a7c4a',
    // 柔和光晕阴影
    'shadow-md': '0 4px 12px rgba(124, 179, 66, 0.15)',
    // 自然圆润
    'radius-md': '12px'
  }
}
```

#### 组合式函数
**`src/composables/useTheme.ts`**
```typescript
import { ref, computed } from 'vue'
import type { Theme } from '../themes/types'

const STORAGE_KEY = 'app-theme'
const currentThemeName = ref<string>('dark')

export function useTheme() {
  // 获取所有可用主题
  const themes = computed(() => getAvailableThemes())
  
  // 当前主题
  const currentTheme = computed(() => {
    return findThemeByName(currentThemeName.value) || getDefaultTheme()
  })
  
  // 设置主题
  const setTheme = async (themeName: string) => {
    const theme = findThemeByName(themeName)
    if (!theme) return
    
    currentThemeName.value = themeName
    applyTheme(theme)
    localStorage.setItem(STORAGE_KEY, themeName)
  }
  
  // 初始化主题
  const initTheme = async () => {
    const saved = localStorage.getItem(STORAGE_KEY)
    const themeName = saved || getDefaultTheme().name
    await setTheme(themeName)
  }
  
  // 循环切换主题
  const cycleTheme = async () => {
    const available = getAvailableThemes()
    const currentIndex = available.findIndex(t => t.name === currentThemeName.value)
    const nextIndex = (currentIndex + 1) % available.length
    await setTheme(available[nextIndex].name)
  }
  
  return {
    themes,
    currentTheme,
    setTheme,
    initTheme,
    cycleTheme
  }
}
```

#### CSS 变量定义
**`src/styles/variables.css`**
```css
/* 滚动条样式 */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: var(--color-bg-secondary);
}

::-webkit-scrollbar-thumb {
  background: var(--color-border);
  border-radius: 4px;
}

/* 选中文字样式 */
::selection {
  background: var(--color-accent);
  color: var(--color-text-primary);
}
```

### 导出索引
**`src/themes/index.ts`**
```typescript
export * from './types'
export * from './manager'
export { lightTheme } from './presets/light'
export { darkTheme } from './presets/dark'
export { cyberpunkTheme } from './presets/cyberpunk'
export { forestTheme } from './presets/forest'
```

**`src/themes/presets/index.ts`**
```typescript
import { lightTheme } from './light'
import { darkTheme } from './dark'
import { cyberpunkTheme } from './cyberpunk'
import { forestTheme } from './forest'

export const defaultTheme = darkTheme

export const themePresets = [
  lightTheme,
  darkTheme,
  cyberpunkTheme,
  forestTheme
]
```

## 技术要点

### 1. CSS 变量命名规范
| 前缀 | 用途 | 示例 |
|------|------|------|
| `--color-*` | 颜色变量 | `--color-bg-primary` |
| `--radius-*` | 圆角变量 | `--radius-md` |
| `--shadow-*` | 阴影变量 | `--shadow-lg` |
| `--space-*` | 间距变量 | `--space-lg` |
| `--text-*` | 字号变量 | `--text-xl` |
| `--font-*` | 字体变量 | `--font-sans` |
| `--z-*` | 层级变量 | `--z-modal` |
| `--opacity-*` | 透明度变量 | `--opacity-hover` |

### 2. 主题切换机制
```
用户点击切换主题
    ↓
调用 setTheme(themeName)
    ↓
查找主题配置
    ↓
applyTheme(theme) 注入 CSS 变量
    ↓
设置 data-theme 属性
    ↓
所有组件自动更新样式
    ↓
保存到 localStorage
```

### 3. 主题特定覆盖
通过 `[data-theme]` 选择器实现主题特定的样式:
```css
/* 赛博朋克主题：卡片发光效果 */
[data-theme="cyberpunk"] .game-card {
  border: 1px solid var(--color-accent);
  box-shadow: 0 0 20px rgba(0, 243, 255, 0.15);
}

/* 森林主题：更圆润的卡片 */
[data-theme="forest"] .game-card {
  border-radius: var(--radius-lg);
}
```

## 使用方法

### 在组件中使用
```vue
<template>
  <div class="my-component">
    <h1>标题</h1>
  </div>
</template>

<style scoped>
.my-component {
  background: var(--color-bg-secondary);
  color: var(--color-text-primary);
  padding: var(--space-md);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
}
</style>
```

### 切换主题
```typescript
import { useTheme } from './composables/useTheme'

const { currentTheme, setTheme, cycleTheme } = useTheme()

// 设置特定主题
await setTheme('cyberpunk')

// 循环切换
await cycleTheme()
```

### 在 App 中初始化
```typescript
// main.ts
import { useTheme } from './composables/useTheme'

const { initTheme } = useTheme()
initTheme()  // 恢复上次保存的主题或默认主题
```

## 关联任务
- [THEME-001] 设计主题系统架构
- [THEME-002] 实现 CSS 变量注入机制
- [THEME-003] 创建四种主题预设
- [THEME-004] 实现 useTheme 组合式函数

## 备注
主题系统采用 CSS 变量方案而非 CSS-in-JS，原因:
1. 性能更好 - 无需运行时生成样式
2. 即时生效 - 修改变量后所有组件自动更新
3. 开发者友好 - 可在 DevTools 中直接调试变量
4. 与 Quasar 兼容 - Quasar 也支持 CSS 变量
