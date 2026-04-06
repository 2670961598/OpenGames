<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import DevTestView from './views/DevTestView.vue'
import RecommendView from './views/RecommendView.vue'
import LibraryView from './views/LibraryView.vue'
import CreatorView from './views/CreatorView.vue'
import AppHeader from './components/layout/AppHeader.vue'
import { useKeyboardInterceptor } from './composables/useKeyboardInterceptor.ts'
import { useTheme } from './composables/useTheme.ts'

// 当前激活的 Tab
const activeTab = ref('recommend')

// 开发者测试模式
const isDevMode = ref(false)

// 启用快捷键拦截
useKeyboardInterceptor()

// 初始化主题
const { initTheme } = useTheme()

// 组件映射
const viewComponents: Record<string, any> = {
  recommend: RecommendView,
  library: LibraryView,
  developer: CreatorView,
}

const currentView = () => viewComponents[activeTab.value] || RecommendView

// 监听 `~ 键切换开发者模式
const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === '`' || e.key === '~') {
    e.preventDefault()
    isDevMode.value = !isDevMode.value
    console.log('[DevMode]', isDevMode.value ? '进入开发者模式' : '退出开发者模式')
  }
}

onMounted(() => {
  initTheme()
  window.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
})
</script>

<template>
  <!-- 开发者测试模式 -->
  <DevTestView v-if="isDevMode" />

  <!-- 正常应用界面 -->
  <q-layout v-else view="hHh lpR fFf" class="app-layout">
    <!-- 自定义 Header -->
    <AppHeader
      mode="home"
      v-model="activeTab"
    />

    <!-- 主内容区域 -->
    <q-page-container class="page-container">
      <q-page class="page-content">
        <component :is="currentView()" />
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<style>
/* 全局重置 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html,
body {
  height: 100%;
  background: var(--color-bg-primary);
  color: var(--color-text-primary);
}

#app {
  height: 100%;
}

/* Quasar 布局适配 */
.app-layout {
  background: var(--color-bg-primary) !important;
}

:deep(.q-page-container) {
  background: var(--color-bg-primary) !important;
  padding-top: 56px !important;
}

:deep(.q-page) {
  background: var(--color-bg-primary) !important;
  color: var(--color-text-primary) !important;
  min-height: calc(100vh - 56px) !important;
}

/* 移动端适配 */
@media (max-width: 768px) {
  :deep(.q-page-container) {
    padding-top: 48px !important;
  }

  :deep(.q-page) {
    min-height: calc(100vh - 48px) !important;
  }
}
</style>
