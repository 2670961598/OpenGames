import type { Theme } from '../types.ts'

export const lightTheme: Theme = {
  name: 'light',
  label: '明亮',
  tokens: {
    // 背景
    'color-bg-primary': '#ffffff',
    'color-bg-secondary': '#f5f5f5',
    'color-bg-tertiary': '#e8e8e8',
    'color-bg-elevated': '#ffffff',

    // 文字
    'color-text-primary': '#1a1a1a',
    'color-text-secondary': '#666666',
    'color-text-tertiary': '#999999',
    'color-text-inverse': '#ffffff',

    // 强调
    'color-accent': '#6366f1',
    'color-accent-hover': '#4f46e5',
    'color-accent-active': '#4338ca',

    // 边框
    'color-border': '#e0e0e0',
    'color-divider': '#e8e8e8',

    // 功能色
    'color-success': '#22c55e',
    'color-warning': '#f59e0b',
    'color-error': '#ef4444',
    'color-info': '#3b82f6',

    // 圆角
    'radius-none': '0px',
    'radius-sm': '4px',
    'radius-md': '8px',
    'radius-lg': '12px',
    'radius-xl': '16px',
    'radius-full': '9999px',

    // 阴影
    'shadow-none': 'none',
    'shadow-sm': '0 1px 2px rgba(0, 0, 0, 0.05)',
    'shadow-md': '0 4px 6px rgba(0, 0, 0, 0.1)',
    'shadow-lg': '0 10px 15px rgba(0, 0, 0, 0.1)',
    'shadow-xl': '0 20px 25px rgba(0, 0, 0, 0.15)',

    // 字体
    'font-sans': 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    'font-mono': '"JetBrains Mono", "Fira Code", monospace',

    // 字号
    'text-xs': '12px',
    'text-sm': '14px',
    'text-base': '16px',
    'text-lg': '18px',
    'text-xl': '20px',
    'text-2xl': '24px',

    // 间距
    'space-xs': '4px',
    'space-sm': '8px',
    'space-md': '16px',
    'space-lg': '24px',
    'space-xl': '32px',
  }
}
