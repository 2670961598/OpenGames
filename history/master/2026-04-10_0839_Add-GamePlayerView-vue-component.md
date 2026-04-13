# 2026-04-10 08:39 - Add missing GamePlayerView.vue component and relocate docs

## 提交信息
```
Commit: f94914c
Author: Ye QingXin
Date: 2026-04-10 08:39:41 -0700
Branch: master
```

## 变更概述
1. 修复 Vite 构建错误：创建缺失的 `GamePlayerView.vue` 组件
2. 将 `docs/documentation-guidelines.md` 移至根目录 `readme.md`，便于 AI 访问
3. 删除原 `docs/documentation-guidelines.md` 文件

## 问题背景

### 错误信息
```
[plugin:vite:import-analysis] Failed to resolve import "../views/GamePlayerView.vue" from "src/router/index.ts". Does the file exist?
```

### 原因分析
在实现多窗口游戏平台时，router/index.ts 中配置了游戏播放器路由，引用了 `GamePlayerView.vue` 组件，但实际文件未被创建：

```typescript
// src/router/index.ts
{
  path: '/game/:id',
  name: 'GamePlayer',
  component: () => import('../views/GamePlayerView.vue'),  // ← 文件不存在
  props: true
}
```

## 文件变更

### 新增文件

#### 1. 游戏播放器视图组件
**`src/views/GamePlayerView.vue`**
- 游戏独立窗口视图组件
- 支持路由参数接收游戏 ID
- 包含加载状态、游戏头部栏、关闭按钮

#### 2. 项目文档规范指南（根目录）
**`readme.md`**
- 从 `docs/documentation-guidelines.md` 移至根目录
- 便于 AI 代理快速访问项目文档规范
- 内容保持不变

### 删除文件

#### 3. 原文档规范文件
**`docs/documentation-guidelines.md`**
- 已移至根目录 `readme.md`
- 避免重复维护

---

## 组件详情

### 游戏播放器视图组件
**`src/views/GamePlayerView.vue`**

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface Props {
  id: string
}

const props = defineProps<Props>()

const isLoading = ref(true)
const gameTitle = ref('游戏加载中...')

onMounted(() => {
  setTimeout(() => {
    isLoading.value = false
    gameTitle.value = `游戏 #${props.id}`
  }, 1000)
})

const handleClose = () => {
  window.close()
}
</script>

<template>
  <div class="game-player-view">
    <header class="game-bar">
      <div class="game-info">
        <span class="game-title">{{ gameTitle }}</span>
      </div>
      <div class="game-actions">
        <button class="action-btn" title="设置">...</button>
        <button class="action-btn close" title="关闭" @click="handleClose">...</button>
      </div>
    </header>
    <div class="game-container">
      <!-- 游戏内容区域 -->
    </div>
  </div>
</template>
```

## 组件功能

### 核心特性
| 功能 | 说明 |
|------|------|
| 路由参数接收 | 通过 `props: true` 接收游戏 ID |
| 加载状态 | 显示加载动画，1秒后展示游戏内容 |
| 窗口控制 | 支持关闭按钮调用 `window.close()` |
| 主题适配 | 使用 CSS 变量适配多主题系统 |

### 样式设计
- **游戏头部栏**: 40px 高度，深色背景，包含标题和操作按钮
- **拖拽区域**: `-webkit-app-region: drag` 支持 Tauri 窗口拖拽
- **加载动画**: CSS 旋转动画，主题色边框
- **响应式**: 适配独立游戏窗口尺寸

## 路由配置说明

该组件配合 `router/index.ts` 的两处路由使用：

```typescript
// 主窗口路由（备用）
{
  path: '/game/:id',
  name: 'GamePlayer',
  component: () => import('../views/GamePlayerView.vue'),
  props: true
}

// 独立窗口路由
export const gameWindowRoutes = [{
  path: '/game/:id',
  name: 'GamePlayerWindow',
  component: () => import('../views/GamePlayerView.vue'),
  props: true
}]
```

## 关联任务
- [FIX-001] 修复缺失的 GamePlayerView.vue 组件
- [WINDOW-005] 完善游戏播放器视图

## 经验教训
1. **引用完整性检查**: 在提交路由配置前，确保引用的组件文件已存在
2. **编译时验证**: 使用 `vite build` 或开发服务器验证无导入错误
3. **组件占位**: 即使是占位组件，也应包含基础结构和样式，保证页面正常渲染
