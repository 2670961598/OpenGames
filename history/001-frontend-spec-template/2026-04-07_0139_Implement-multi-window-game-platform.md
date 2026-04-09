# 2026-04-07 01:39 - Implement multi-window game platform with independent game windows

## 提交信息
```
Commit: b6766621697d0fed782ccce2f903a9cbd5f61cb7
Author: Ye QingXin
Date: 2026-04-07 01:39:57 +0800
Branch: 001-frontend-spec-template
```

## 变更概述
实现多窗口游戏平台，每个游戏可以在独立的 Tauri 窗口中打开。游戏窗口使用独立的 HTML 入口，避免与主窗口路由冲突，支持完整的主题系统和 GameHeader 导航。

## 核心功能
- 点击"开始游戏"创建独立游戏窗口
- 游戏窗口使用 GameHeader (游戏/社区/模组 Tab)
- 支持主题切换
- 窗口标题栏控制按钮

## 技术架构

### 多窗口架构
```
主窗口 (index.html)
├── Vue App (main.ts)
├── 路由: /recommend, /library, /developer
├── Header: AppHeader (推荐/游戏库/开发者)
└── 游戏列表 → 点击创建新窗口

游戏窗口 (game.html) ← 独立入口
├── Vue App (game-main.ts) ← 简化渲染
├── 无路由（直接使用 render 函数）
├── Header: GameHeader (游戏/社区/模组)
└── 独立主题初始化
```

## 遇到的问题及解决方案

### 问题 1: Tauri 环境检测失败
**现象:** `window.__TAURI__` 返回 undefined，判断为非 Tauri 环境
**原因:** Tauri v2 不再注入 `__TAURI__` 全局变量
**解决:** 使用 `@tauri-apps/api/core` 的 `isTauri()` 函数

```typescript
// ❌ 错误 - Tauri v1 方式
const isTauri = typeof window !== 'undefined' && (window as any).__TAURI__

// ✅ 正确 - Tauri v2 方式
import { isTauri } from '@tauri-apps/api/core'
const inTauri = isTauri()
```

### 问题 2: 窗口显示纯白/纯黑
**现象:** 新窗口创建成功但内容空白，只有白色或黑色背景
**原因:**
1. URL 格式不正确（不能使用相对路径 `/#/game/:id`）
2. CSS 变量未初始化（主题加载前无背景色）
3. 使用了错误的 API（`Window` 而非 `WebviewWindow`）

**解决方案:**
```typescript
// ❌ 错误 - 相对路径无法解析
new Window('game-1', { url: '/#/game/1' })

// ❌ 错误 - Tauri v2 已弃用 Window API
new Window('game-1', { url: '...' })

// ✅ 正确 - 独立 HTML 入口 + WebviewWindow API
import { WebviewWindow } from '@tauri-apps/api/webviewWindow'
new WebviewWindow('game-1', { url: '/game.html' })
```

**预防措施:**
- 在 `game.html` 中内联默认 CSS 变量，防止加载前黑屏
```html
<style>
  :root {
    --color-bg-primary: #0f0f0f;
    --color-text-primary: #ffffff;
  }
  html, body {
    background: #0f0f0f;
    color: #ffffff;
  }
</style>
```

### 问题 3: Vue 组件未渲染
**现象:** 窗口有背景色但 Vue 组件不显示
**原因:** 路由配置复杂，组件渲染失败
**解决:** 简化 `game-main.ts`，不使用路由，直接用 render 函数

```typescript
// ❌ 复杂 - 使用路由
const routes = [{ path: '/', component: GamePlayerView }]
const router = createRouter({ history: createWebHashHistory(), routes })
app.use(router)

// ✅ 简化 - 直接渲染
const GameApp = {
  render() {
    return h('div', [h(GameHeader, ...), h('main', ...)])
  }
}
app.mount('#app')
```

## 文件变更

### 新增文件

#### 1. 游戏窗口入口
**`game.html`**
```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <title>游戏窗口 - OpenGames</title>
    <style>
      /* 防止加载期间黑屏/白屏 */
      html, body {
        margin: 0;
        padding: 0;
        background: #0f0f0f;
        color: #ffffff;
      }
      /* 默认 CSS 变量 */
      :root {
        --color-bg-primary: #0f0f0f;
        --color-bg-secondary: #1a1a1a;
        --color-text-primary: #ffffff;
        --color-accent: #8b5cf6;
      }
    </style>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/game-main.ts"></script>
  </body>
</html>
```

#### 2. 游戏窗口启动脚本
**`src/game-main.ts`**
```typescript
import { createApp, h, ref } from 'vue'
import { Quasar } from 'quasar'
import '@quasar/extras/material-icons/material-icons.css'
import 'quasar/src/css/index.sass'
import './styles/variables.css'

import GameHeader from './components/layout/GameHeader.vue'
import { useTheme } from './composables/useTheme.ts'

// 从 URL hash 提取游戏 ID
function getGameIdFromUrl(): string {
  const hash = window.location.hash
  const match = hash.match(/game\/([^/]+)/)
  return match ? match[1] : 'unknown'
}

// 简化版游戏应用
const GameApp = {
  setup() {
    const activeTab = ref('game')
    const gameId = getGameIdFromUrl()
    return { activeTab, gameId }
  },
  render() {
    return h('div', {
      style: {
        minHeight: '100vh',
        background: 'var(--color-bg-primary)',
        color: 'var(--color-text-primary)'
      }
    }, [
      h(GameHeader, {
        modelValue: this.activeTab,
        'onUpdate:modelValue': (val: string) => { this.activeTab = val }
      }),
      h('main', {
        style: { paddingTop: '56px' }
      }, [
        h('h1', '游戏窗口'),
        h('p', `游戏ID: ${this.gameId}`)
      ])
    ])
  }
}

const app = createApp(GameApp)
app.use(Quasar, { config: { dark: true } })

// 初始化主题
const { initTheme } = useTheme()
initTheme()

app.mount('#app')
```

#### 3. 路由配置
**`src/router/index.ts`**
```typescript
import { createRouter, createWebHashHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  { path: '/', redirect: '/recommend' },
  { path: '/recommend', component: () => import('../views/RecommendView.vue') },
  { path: '/library', component: () => import('../views/LibraryView.vue') },
  { path: '/developer', component: () => import('../views/CreatorView.vue') },
  { path: '/game/:id', component: () => import('../views/GamePlayerView.vue') }
]

export const router = createRouter({
  history: createWebHashHistory(), // Tauri 多窗口需要 hash 模式
  routes
})
```

**注意:** 必须使用 `createWebHashHistory` 而非 `createWebHistory`，因为 Tauri 多窗口不支持 history 模式的路径解析。

#### 4. 权限配置
**`src-tauri/capabilities/game-window.json`**
```json
{
  "$schema": "../gen/schemas/desktop-schema.json",
  "identifier": "game-window",
  "description": "Capabilities for game windows",
  "windows": ["game-*"],
  "permissions": [
    "core:default",
    "core:window:allow-minimize",
    "core:window:allow-maximize",
    "core:window:allow-close",
    "core:window:allow-set-focus",
    "core:window:allow-start-dragging"
  ]
}
```

### 修改文件

#### 5. 推荐页面 - 添加游戏创建功能
**`src/views/RecommendView.vue`**
```typescript
const playGame = async (gameId: number) => {
  const { isTauri } = await import('@tauri-apps/api/core')
  
  if (isTauri()) {
    const { WebviewWindow } = await import('@tauri-apps/api/webviewWindow')
    
    // 检查窗口是否已存在
    const existing = await WebviewWindow.getByLabel(`game-${gameId}`)
    if (existing) {
      await existing.setFocus()
      return
    }
    
    // 创建新窗口
    new WebviewWindow(`game-${gameId}`, {
      url: '/game.html',
      title: '游戏',
      width: 1280,
      height: 800,
      minWidth: 800,
      minHeight: 600,
      center: true,
      resizable: true,
      decorations: true, // 显示标题栏按钮
    })
  } else {
    // 网页版回退
    window.location.href = `/#/game/${gameId}`
  }
}
```

#### 6. Vite 配置 - 多页面入口
**`vite.config.ts`**
```typescript
import { resolve } from "path"

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        game: resolve(__dirname, "game.html"),
      },
    },
  },
})
```

## 关键配置说明

### 窗口创建参数
| 参数 | 值 | 说明 |
|------|-----|------|
| `url` | `/game.html` | 独立 HTML 入口，避免路由问题 |
| `label` | `game-${id}` | 窗口唯一标识，用于查找和聚焦 |
| `decorations` | `true` | 显示系统标题栏（最小化/最大化/关闭） |
| `center` | `true` | 窗口在屏幕居中 |
| `resizable` | `true` | 允许调整大小 |

### 窗口查找与聚焦
```typescript
// 检查窗口是否已存在
const existing = await WebviewWindow.getByLabel(`game-${gameId}`)
if (existing) {
  await existing.setFocus() // 聚焦已有窗口
  return
}
```

## 使用方法

### 主窗口打开游戏
```vue
<q-btn label="开始游戏" @click="playGame(game.id)" />
```

### 检测 Tauri 环境
```typescript
import { isTauri } from '@tauri-apps/api/core'
if (isTauri()) {
  // Tauri 特有逻辑
}
```

### 关闭当前窗口
```typescript
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow'
const win = getCurrentWebviewWindow()
await win.close()
```

## 关联任务
- [WINDOW-001] 调研 Tauri v2 多窗口 API
- [WINDOW-002] 实现游戏窗口创建
- [WINDOW-003] 解决窗口白屏问题
- [WINDOW-004] 集成主题系统到游戏窗口

## 经验教训
1. **Tauri v2 API 变化大**: Window API 已改为 WebviewWindow，需要更新代码
2. **多窗口用独立 HTML**: 避免 SPA 路由在多窗口中的复杂性
3. **CSS 变量预定义**: 在 HTML 中内联默认变量，防止加载前样式异常
4. **Hash 路由模式**: Tauri 多窗口必须使用 createWebHashHistory
