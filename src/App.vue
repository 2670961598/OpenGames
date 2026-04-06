<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import DevTestView from './views/DevTestView.vue'
import RecommendView from './views/RecommendView.vue'
import LibraryView from './views/LibraryView.vue'
import ProfileView from './views/ProfileView.vue'
import CreatorView from './views/CreatorView.vue'
import { useKeyboardInterceptor } from './composables/useKeyboardInterceptor.ts'
import { useTheme } from './composables/useTheme.ts'

// 当前激活的 Tab
const activeTab = ref('recommend')

// 开发者测试模式
const isDevMode = ref(false)

// 启用快捷键拦截
useKeyboardInterceptor()

// 初始化主题
const { initTheme, setTheme, themes, currentTheme } = useTheme()

// Tab 列表
const tabs = [
  { name: 'recommend', label: '推荐', icon: 'star' },
  { name: 'library', label: '游戏库', icon: 'sports_esports' },
  { name: 'profile', label: '个人页面', icon: 'person' },
  { name: 'creator', label: '创作者页面', icon: 'brush' },
]

// 组件映射
const viewComponents: Record<string, any> = {
  recommend: RecommendView,
  library: LibraryView,
  profile: ProfileView,
  creator: CreatorView,
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
  <template v-else>
    <q-layout view="hHh lpR fFf" class="app-layout">
        <!-- 顶部导航栏 -->
        <q-header class="app-header" height-hint="56">
        <q-toolbar class="toolbar-custom">
          <q-space />

          <!-- Tab 导航 -->
          <q-tabs
            v-model="activeTab"
            dense
            class="app-tabs q-mr-md"
            active-color="primary"
            indicator-color="primary"
            align="right"
            narrow-indicator
          >
            <q-tab
              v-for="tab in tabs"
              :key="tab.name"
              :name="tab.name"
              :label="tab.label"
              :icon="tab.icon"
              class="tab-item"
            />
          </q-tabs>

          <!-- 用户信息 -->
          <div class="user-section">
            <q-btn flat round dense class="q-mr-sm">
              <q-avatar size="32px" color="primary" text-color="white">
                <q-icon name="person" size="18px" />
              </q-avatar>
              <q-menu auto-close>
                <q-list style="min-width: 150px">
                  <q-item-label header>主题</q-item-label>
                  <q-item
                    v-for="theme in themes"
                    :key="theme.name"
                    clickable
                    :active="currentTheme?.name === theme.name"
                    @click="setTheme(theme.name)"
                  >
                    <q-item-section>{{ theme.label }}</q-item-section>
                    <q-item-section side v-if="currentTheme?.name === theme.name">
                      <q-icon name="check" size="16px" />
                    </q-item-section>
                  </q-item>
                  <q-separator />
                  <q-item clickable>
                    <q-item-section>登录</q-item-section>
                  </q-item>
                  <q-item clickable>
                    <q-item-section>注册</q-item-section>
                  </q-item>
                </q-list>
              </q-menu>
            </q-btn>
          </div>
        </q-toolbar>
      </q-header>

      <!-- 主内容区域 -->
      <q-page-container class="page-container">
        <q-page class="page-content">
          <component :is="currentView()" />
        </q-page>
      </q-page-container>
    </q-layout>
  </template>
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
  overflow: hidden;
  background: var(--color-bg-primary);
  color: var(--color-text-primary);
}

#app {
  height: 100%;
}

/* 应用布局使用主题变量 */
.app-layout {
  background: var(--color-bg-primary) !important;
  color: var(--color-text-primary) !important;
}

:deep(.q-header),
.app-header {
  background: var(--color-bg-secondary) !important;
  border-bottom: 1px solid var(--color-border);
}

:deep(.q-tabs),
.app-tabs {
  color: var(--color-text-secondary) !important;
}

:deep(.q-toolbar) {
  background: var(--color-bg-secondary) !important;
  color: var(--color-text-primary) !important;
}

:deep(.q-tabs) {
  color: var(--color-text-secondary) !important;
}

:deep(.q-tab--active) {
  color: var(--color-accent) !important;
}

:deep(.q-tab__indicator) {
  background: var(--color-accent) !important;
}

:deep(.q-page-container) {
  background: var(--color-bg-primary) !important;
}

:deep(.q-page) {
  background: var(--color-bg-primary) !important;
  color: var(--color-text-primary) !important;
}

:deep(.q-menu) {
  background: var(--color-bg-elevated) !important;
  border: 1px solid var(--color-border);
}

:deep(.q-item) {
  color: var(--color-text-primary) !important;
}

:deep(.q-item__label--header) {
  color: var(--color-text-secondary) !important;
}

:deep(.q-separator) {
  background: var(--color-divider) !important;
}

:deep(.q-avatar) {
  background: var(--color-accent) !important;
  color: var(--color-text-inverse) !important;
}
</style>

<style scoped>
/* 工具栏自定义 */
.toolbar-custom {
  min-height: 48px;
  padding: 0 8px;
  background: var(--color-bg-secondary);
  border-bottom: 1px solid var(--color-border);
}

.tab-item {
  min-height: 48px;
  font-weight: 500;
  text-transform: none;
  color: var(--color-text-secondary);
}

.user-section {
  display: flex;
  align-items: center;
  padding: 0 8px;
  border-left: 1px solid var(--color-border);
}

/* 页面容器 */
.page-container {
  background: var(--color-bg-primary);
}

.page-content {
  height: calc(100vh - 48px);
  overflow: hidden;
  background: var(--color-bg-primary);
  color: var(--color-text-primary);
}
</style>

