import type { Theme } from '../types.ts'

export const forestTheme: Theme = {
  name: 'forest',
  label: '森林',
  tokens: {
    // 背景 - 森林色系
    'color-bg-primary': '#0d1f0d',
    'color-bg-secondary': '#1a3a1a',
    'color-bg-tertiary': '#2d5a2d',
    'color-bg-elevated': '#3d7a3d',
    'color-bg-secondary-rgb': '26, 58, 26',

    // 文字
    'color-text-primary': '#e8f5e8',
    'color-text-secondary': '#a8d5a8',
    'color-text-tertiary': '#6b9e6b',
    'color-text-inverse': '#0d1f0d',

    // 强调 - 嫩芽绿
    'color-accent': '#7cb342',
    'color-accent-hover': '#689f38',
    'color-accent-active': '#558b2f',

    // 边框 - 树皮色
    'color-border': '#4a7c4a',
    'color-divider': '#2d5a2d',

    // 功能色
    'color-success': '#66bb6a',
    'color-warning': '#ffa726',
    'color-error': '#ef5350',
    'color-info': '#42a5f5',

    // 圆角 - 自然圆润
    'radius-none': '0px',
    'radius-sm': '6px',
    'radius-md': '12px',
    'radius-lg': '20px',
    'radius-xl': '28px',
    'radius-full': '9999px',

    // 阴影 - 柔和的光晕
    'shadow-none': 'none',
    'shadow-sm': '0 2px 4px rgba(124, 179, 66, 0.1)',
    'shadow-md': '0 4px 12px rgba(124, 179, 66, 0.15)',
    'shadow-lg': '0 8px 24px rgba(124, 179, 66, 0.2)',
    'shadow-xl': '0 16px 48px rgba(124, 179, 66, 0.25)',

    // 字体
    'font-sans': 'system-ui, -apple-system, "Segoe UI", sans-serif',
    'font-mono': '"JetBrains Mono", monospace',

    // 字号
    'text-xs': '12px',
    'text-sm': '14px',
    'text-base': '16px',
    'text-lg': '18px',
    'text-xl': '20px',
    'text-2xl': '24px',
    'text-3xl': '30px',
    'text-4xl': '36px',

    // 间距
    'space-xs': '4px',
    'space-sm': '8px',
    'space-md': '16px',
    'space-lg': '24px',
    'space-xl': '32px',
    'space-2xl': '48px',
    'space-3xl': '64px',

    // 透明度
    'opacity-disabled': '0.5',
    'opacity-hover': '0.8',

    // Z-Index 层级
    'z-dropdown': '1000',
    'z-modal': '2000',
    'z-toast': '3000',
  }
}
