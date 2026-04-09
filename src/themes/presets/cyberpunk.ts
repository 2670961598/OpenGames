import type { Theme } from '../types.ts'

export const cyberpunkTheme: Theme = {
  name: 'cyberpunk',
  label: '赛博朋克',
  tokens: {
    // 背景 - 深紫黑
    'color-bg-primary': '#0a0a0f',
    'color-bg-secondary': '#1a1a2e',
    'color-bg-tertiary': '#16213e',
    'color-bg-elevated': '#0f3460',
    'color-bg-secondary-rgb': '26, 26, 46',

    // 文字
    'color-text-primary': '#e0e0e0',
    'color-text-secondary': '#a0a0b0',
    'color-text-tertiary': '#707080',
    'color-text-inverse': '#0a0a0f',

    // 强调 - 霓虹青
    'color-accent': '#00f3ff',
    'color-accent-hover': '#00d4e0',
    'color-accent-active': '#00b5bf',

    // 边框 - 霓虹紫
    'color-border': '#e94560',
    'color-divider': '#533483',

    // 功能色
    'color-success': '#00ff9f',
    'color-warning': '#ffee00',
    'color-error': '#ff0055',
    'color-info': '#00f3ff',

    // 圆角 - 更锐利
    'radius-none': '0px',
    'radius-sm': '2px',
    'radius-md': '4px',
    'radius-lg': '8px',
    'radius-xl': '12px',
    'radius-full': '9999px',

    // 阴影 - 霓虹发光
    'shadow-none': 'none',
    'shadow-sm': '0 0 4px rgba(0, 243, 255, 0.3)',
    'shadow-md': '0 0 8px rgba(0, 243, 255, 0.4), 0 0 16px rgba(233, 69, 96, 0.2)',
    'shadow-lg': '0 0 16px rgba(0, 243, 255, 0.5), 0 0 32px rgba(233, 69, 96, 0.3)',
    'shadow-xl': '0 0 32px rgba(0, 243, 255, 0.6), 0 0 64px rgba(233, 69, 96, 0.4)',

    // 字体 - 科技感
    'font-sans': '"Rajdhani", "Orbitron", system-ui, sans-serif',
    'font-mono': '"JetBrains Mono", "Share Tech Mono", monospace',

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
