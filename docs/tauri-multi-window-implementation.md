# Tauri v2 多窗口实现技术总结

## 文档信息
- **创建时间**: 2026-04-07
- **相关分支**: 001-frontend-spec-template
- **相关提交**: b676662

## 需求背景
实现一个游戏平台，要求点击游戏后在新窗口中打开，新窗口具有独立的界面（GameHeader + 游戏内容），支持主题切换，与主窗口解耦。

## 技术方案选型

### 方案对比
| 方案 | 优点 | 缺点 | 结论 |
|------|------|------|------|
| SPA 路由切换 | 简单 | 不是真窗口，无法独立最小化 | ❌ 不满足需求 |
| iframe 嵌入 | 简单 | 样式隔离困难，性能差 | ❌ 不满足需求 |
| Tauri Window API | 真窗口，独立进程 | v2 已弃用 | ❌ API 过时 |
| **Tauri WebviewWindow** | 真窗口，v2 推荐 | 需要独立 HTML 入口 | ✅ 采用 |

## 核心实现

### 1. 多入口架构
```
项目结构:
├── index.html          # 主窗口入口
├── game.html           # 游戏窗口入口 (新增)
├── src/
│   ├── main.ts         # 主窗口 Vue 应用
│   ├── game-main.ts    # 游戏窗口 Vue 应用 (新增)
│   └── ...
```

**为什么选择独立 HTML 入口？**
- 避免 Vue Router 在多窗口中的复杂性
- 游戏窗口可以独立初始化主题和状态
- 更符合 Tauri 多窗口设计哲学

### 2. 窗口创建代码

```typescript
import { WebviewWindow } from '@tauri-apps/api/webviewWindow'
import { isTauri } from '@tauri-apps/api/core'

async function createGameWindow(gameId: number) {
  // 1. 检测是否在 Tauri 环境
  if (!isTauri()) {
    // 网页版回退
    window.location.href = `/#/game/${gameId}`
    return
  }
  
  // 2. 检查窗口是否已存在
  const existing = await WebviewWindow.getByLabel(`game-${gameId}`)
  if (existing) {
    await existing.setFocus()
    return
  }
  
  // 3. 创建新窗口
  new WebviewWindow(`game-${gameId}`, {
    url: '/game.html',           // 独立 HTML 入口
    title: '游戏',
    width: 1280,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    center: true,                // 居中显示
    resizable: true,             // 可调整大小
    decorations: true,           // 显示标题栏按钮
  })
}
```

### 3. 游戏窗口 Vue 应用

```typescript
// game-main.ts
import { createApp, h, ref } from 'vue'
import { Quasar } from 'quasar'
import GameHeader from './components/layout/GameHeader.vue'
import { useTheme } from './composables/useTheme'

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
        background: 'var(--color-bg-primary)'
      }
    }, [
      h(GameHeader, {
        modelValue: this.activeTab,
        'onUpdate:modelValue': (val: string) => { this.activeTab = val }
      }),
      h('main', { style: { paddingTop: '56px' } }, [
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

**为什么不用 Vue Router？**
- 游戏窗口功能简单，不需要路由
- 避免路由配置错误导致白屏
- 直接从 URL hash 获取游戏 ID

## 遇到的问题及解决方案

### 问题 1: Tauri 环境检测失败

**现象:**
```
⚠️ 非 Tauri 环境，使用网页版
```
即使在 Tauri 应用内也显示此消息。

**原因:**
Tauri v2 不再注入 `window.__TAURI__` 全局变量。

**错误代码:**
```typescript
// ❌ Tauri v1 方式，v2 已失效
const isTauri = typeof window !== 'undefined' && (window as any).__TAURI__
```

**正确代码:**
```typescript
// ✅ Tauri v2 方式
import { isTauri } from '@tauri-apps/api/core'
const inTauri = isTauri()  // 返回 boolean
```

**教训:**
- 查阅 Tauri v2 迁移文档
- 使用官方提供的 API 而非内部变量

---

### 问题 2: 窗口纯黑/纯白

**现象:**
窗口创建成功，但内容区域纯黑或纯白，Vue 组件未渲染。

**原因分析:**
1. CSS 变量未定义 → 背景色缺失
2. 使用了错误的 API → `Window` 而非 `WebviewWindow`
3. URL 格式错误 → 相对路径无法解析

**排查过程:**

1. **检查 Vue 是否挂载**
   ```typescript
   // 在 game-main.ts 中添加
   console.log('[GameWindow] App mounted')
   // 结果：有输出，说明 Vue 已挂载
   ```

2. **检查 CSS 变量**
   ```typescript
   // 检查变量是否存在
   getComputedStyle(document.documentElement).getPropertyValue('--color-bg-primary')
   // 结果：空值，变量未定义
   ```

3. **解决问题**
   ```html
   <!-- 在 game.html 中内联默认样式 -->
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

**教训:**
- 主题初始化是异步的，需要默认值
- 在 HTML 中预定义关键 CSS 变量
- 逐步排查：HTML → CSS → Vue → 组件

---

### 问题 3: 组件渲染失败

**现象:**
有背景色，但 GameHeader 不显示。

**原因:**
路由配置复杂，GamePlayerView 组件渲染失败。

**错误代码:**
```typescript
// ❌ 复杂路由配置
const routes = [
  { path: '/', redirect: '/game/:id' },
  { path: '/game/:id', component: GamePlayerView }
]
const router = createRouter({ history: createWebHashHistory(), routes })
app.use(router)
```

**简化方案:**
```typescript
// ✅ 直接渲染，不使用路由
const GameApp = {
  render() {
    return h('div', [h(GameHeader, ...), h('main', ...)])
  }
}
app.mount('#app')
```

**教训:**
- 对于简单窗口，避免过度工程化
- 优先保证可用性，再追求架构完美

---

### 问题 4: Hash 路由模式

**现象:**
在开发环境中路由正常，打包后路由失效。

**原因:**
`createWebHistory` 需要服务器配置，Tauri 多窗口不支持。

**解决方案:**
```typescript
// ❌ 错误
import { createWebHistory } from 'vue-router'
const router = createRouter({
  history: createWebHistory(),
  routes
})

// ✅ 正确
import { createWebHashHistory } from 'vue-router'
const router = createRouter({
  history: createWebHashHistory(),  // 必须!
  routes
})
```

**教训:**
- Tauri 多窗口必须使用 hash 模式
- 开发环境和生产环境行为可能不同

## 关键配置

### Vite 多页面配置
```typescript
// vite.config.ts
import { resolve } from 'path'

export default {
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        game: resolve(__dirname, 'game.html'),
      },
    },
  },
}
```

### Tauri 权限配置
```json
// src-tauri/capabilities/game-window.json
{
  "identifier": "game-window",
  "windows": ["game-*"],
  "permissions": [
    "core:window:allow-close",
    "core:window:allow-minimize",
    "core:window:allow-maximize",
    "core:window:allow-set-focus"
  ]
}
```

### Window 选项说明
| 选项 | 类型 | 说明 |
|------|------|------|
| `url` | string | 加载的 URL，相对于应用根目录 |
| `label` | string | 窗口唯一标识，用于查找 |
| `title` | string | 窗口标题栏显示的文本 |
| `width/height` | number | 窗口初始尺寸 |
| `minWidth/minHeight` | number | 最小可调整尺寸 |
| `center` | boolean | 是否在屏幕居中 |
| `resizable` | boolean | 是否可调整大小 |
| `decorations` | boolean | 是否显示系统标题栏 |

## 最佳实践

### 1. 窗口复用
```typescript
// 检查窗口是否已存在，避免重复创建
const existing = await WebviewWindow.getByLabel(`game-${gameId}`)
if (existing) {
  await existing.setFocus()
  return
}
```

### 2. 主题同步
```typescript
// 游戏窗口独立初始化主题，与主窗口解耦
const { initTheme } = useTheme()
initTheme()  // 从 localStorage 读取保存的主题
```

### 3. 错误处理
```typescript
try {
  const win = new WebviewWindow('game-1', { ... })
} catch (err) {
  // 回退到网页版
  window.location.href = `/#/game/${gameId}`
}
```

### 4. CSS 变量预定义
```html
<!-- 在 HTML 中预定义关键变量 -->
<style>
  :root {
    --color-bg-primary: #0f0f0f;
    --color-text-primary: #ffffff;
  }
</style>
```

## 调试技巧

### 1. 检查窗口列表
在 DevTools Console 中：
```javascript
// 获取所有窗口（需要在 Rust 端实现命令）
await __TAURI__.invoke('get_all_windows')
```

### 2. 检查 CSS 变量
```javascript
// 获取计算后的变量值
getComputedStyle(document.documentElement)
  .getPropertyValue('--color-bg-primary')
```

### 3. Vue DevTools
游戏窗口也可以连接 Vue DevTools，需要单独打开 DevTools：
```javascript
// 在创建窗口时启用 DevTools
new WebviewWindow('game-1', {
  // ... 其他配置
})
// 然后按 F12 打开 DevTools
```

## 参考资料

- [Tauri v2 Window API](https://tauri.app/reference/javascript/api/namespacewindow/)
- [Tauri v2 WebviewWindow](https://tauri.app/reference/javascript/api/namespacewebviewwindow/)
- [Vue Router - Hash Mode](https://router.vuejs.org/guide/essentials/history-mode.html#hash-mode)
- [Vite Multi-Page App](https://vitejs.dev/guide/build.html#multi-page-app)

## 总结

Tauri v2 多窗口实现的关键点：
1. 使用 `WebviewWindow` API 创建窗口
2. 每个窗口使用独立的 HTML 入口
3. 使用 `isTauri()` 检测环境，而非 `window.__TAURI__`
4. 使用 `createWebHashHistory` 路由模式
5. 在 HTML 中预定义 CSS 变量防止白屏/黑屏
6. 简化游戏窗口逻辑，避免复杂路由
