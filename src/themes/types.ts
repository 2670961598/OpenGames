// 主题类型定义

export interface ThemeTokens {
  // 背景色
  'color-bg-primary': string
  'color-bg-secondary': string
  'color-bg-tertiary': string
  'color-bg-elevated': string

  // 背景色 RGB 格式（用于 rgba 透明度）
  'color-bg-secondary-rgb': string

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
  'radius-none': string
  'radius-sm': string
  'radius-md': string
  'radius-lg': string
  'radius-xl': string
  'radius-full': string

  // 阴影
  'shadow-none': string
  'shadow-sm': string
  'shadow-md': string
  'shadow-lg': string
  'shadow-xl': string

  // 字体
  'font-sans': string
  'font-mono': string

  // 字号
  'text-xs': string
  'text-sm': string
  'text-base': string
  'text-lg': string
  'text-xl': string
  'text-2xl': string
  'text-3xl': string
  'text-4xl': string

  // 间距
  'space-xs': string
  'space-sm': string
  'space-md': string
  'space-lg': string
  'space-xl': string
  'space-2xl': string
  'space-3xl': string

  // 透明度
  'opacity-disabled': string
  'opacity-hover': string

  // Z-Index 层级
  'z-dropdown': string
  'z-modal': string
  'z-toast': string
}

export interface Theme {
  name: string
  label: string
  tokens: Partial<ThemeTokens>
}

export type ThemeName = string
