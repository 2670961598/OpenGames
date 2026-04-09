import type { Theme, ThemeTokens } from './types.ts'
import { themePresets, defaultTheme } from './presets/index.ts'

// 合并主题 tokens（用默认主题补全缺失的值）
function mergeWithDefault(theme: Theme): Theme {
  return {
    ...theme,
    tokens: {
      ...defaultTheme.tokens,
      ...theme.tokens,
    } as ThemeTokens,
  }
}

// 将主题 tokens 应用到 DOM
export function applyTheme(theme: Theme): void {
  const merged = mergeWithDefault(theme)
  const html = document.documentElement

  // 设置 data-theme 属性（用于 CSS 选择器）
  html.setAttribute('data-theme', theme.name)

  // 将所有 tokens 设置为 CSS 变量
  Object.entries(merged.tokens).forEach(([key, value]) => {
    html.style.setProperty(`--${key}`, value)
  })

  console.log(`[Theme] Applied: ${theme.label} (${theme.name})`)
}

// 清除主题
export function clearTheme(): void {
  const html = document.documentElement
  html.removeAttribute('data-theme')

  // 清除所有 CSS 变量
  const merged = mergeWithDefault(defaultTheme)
  Object.keys(merged.tokens).forEach((key) => {
    html.style.removeProperty(`--${key}`)
  })
}

// 获取所有预设主题
export function getAvailableThemes(): Theme[] {
  return themePresets
}

// 通过名称查找主题
export function findThemeByName(name: string): Theme | undefined {
  return themePresets.find((t) => t.name === name)
}

// 获取默认主题
export function getDefaultTheme(): Theme {
  return defaultTheme
}
