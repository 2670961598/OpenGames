import type { Theme } from '../types.ts'

export const darkTheme: Theme = {
  name: 'dark',
  label: '暗黑',
  tokens: {
    // 背景
    'color-bg-primary': '#0f0f0f',
    'color-bg-secondary': '#1a1a1a',
    'color-bg-tertiary': '#252525',
    'color-bg-elevated': '#2a2a2a',
    'color-bg-secondary-rgb': '26, 26, 26',

    // 文字
    'color-text-primary': '#ffffff',
    'color-text-secondary': '#a1a1aa',
    'color-text-tertiary': '#71717a',
    'color-text-inverse': '#1a1a1a',

    // 强调
    'color-accent': '#8b5cf6',
    'color-accent-hover': '#7c3aed',
    'color-accent-active': '#6d28d9',

    // 边框
    'color-border': '#3a3a3a',
    'color-divider': '#2a2a2a',

    // 功能色
    'color-success': '#22c55e',
    'color-warning': '#f59e0b',
    'color-error': '#ef4444',
    'color-info': '#3b82f6',

    // 圆角（复用亮色）
    'radius-none': '0px',
    'radius-sm': '4px',
    'radius-md': '8px',
    'radius-lg': '12px',
    'radius-xl': '16px',
    'radius-full': '9999px',

    // 阴影（暗色模式更柔和的阴影）
    'shadow-none': 'none',
    'shadow-sm': '0 1px 2px rgba(0, 0, 0, 0.3)',
    'shadow-md': '0 4px 6px rgba(0, 0, 0, 0.4)',
    'shadow-lg': '0 10px 15px rgba(0, 0, 0, 0.5)',
    'shadow-xl': '0 20px 25px rgba(0, 0, 0, 0.6)',

    // 字体（复用）
    'font-sans': 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    'font-mono': '"JetBrains Mono", "Fira Code", monospace',

    // 字号（复用）
    'text-xs': '12px',
    'text-sm': '14px',
    'text-base': '16px',
    'text-lg': '18px',
    'text-xl': '20px',
    'text-2xl': '24px',
    'text-3xl': '30px',
    'text-4xl': '36px',

    // 间距（复用）
    'space-xs': '4px',
    'space-sm': '8px',
    'space-md': '16px',
    'space-lg': '24px',
    'space-xl': '32px',
    'space-2xl': '48px',
    'space-3xl': '64px',

    // 透明度（复用）
    'opacity-disabled': '0.5',
    'opacity-hover': '0.8',

    // Z-Index 层级（复用）
    'z-dropdown': '1000',
    'z-modal': '2000',
    'z-toast': '3000',
  }
}
