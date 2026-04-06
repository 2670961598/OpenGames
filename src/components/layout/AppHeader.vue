<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

interface Tab {
  id: string
  label: string
}

interface Props {
  modelValue: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const scrollY = ref(0)

const headerOpacity = computed(() => {
  const start = 50
  const end = 200
  if (scrollY.value <= start) return 1
  if (scrollY.value >= end) return 0
  return 1 - (scrollY.value - start) / (end - start)
})

const bgOpacity = computed(() => {
  const start = 100
  const end = 300
  if (scrollY.value <= start) return 1
  if (scrollY.value >= end) return 0.3
  return 1 - (scrollY.value - start) / (end - start) * 0.7
})

const tabs: Tab[] = [
  { id: 'recommend', label: '推荐' },
  { id: 'library', label: '游戏库' },
  { id: 'developer', label: '开发者页面' },
]

const activeTab = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

const setActiveTab = (tabId: string) => {
  activeTab.value = tabId
}

const handleScroll = () => {
  scrollY.value = window.scrollY || document.documentElement.scrollTop
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll, { passive: true })
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<template>
  <header
    class="app-header"
    :style="{
      opacity: headerOpacity,
      '--bg-opacity': bgOpacity,
    }"
  >
    <div class="header-inner">
      <!-- 左侧：Logo + Tab -->
      <div class="header-left">
        <span class="logo">OpenGames</span>
        <nav class="tabs">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            class="tab"
            :class="{ active: activeTab === tab.id }"
            @click="setActiveTab(tab.id)"
          >
            {{ tab.label }}
          </button>
        </nav>
      </div>

      <!-- 右侧：搜索 + 用户 -->
      <div class="header-right">
        <div class="search">
          <input type="text" placeholder="搜索游戏..." />
        </div>
        <button class="user">
          <span class="avatar">👤</span>
          <span class="name">登录</span>
        </button>
      </div>
    </div>
  </header>
</template>

<style scoped>
.app-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: var(--z-dropdown);
  height: 56px;
  background: rgba(var(--color-bg-secondary-rgb), var(--bg-opacity));
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--color-border);
  transition: var(--theme-transition);
}

.header-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 100%;
  padding: 0 var(--space-lg);
}

/* 左侧 */
.header-left {
  display: flex;
  align-items: center;
  gap: var(--space-lg);
}

.logo {
  font-size: var(--text-xl);
  font-weight: 700;
  color: var(--color-accent);
  white-space: nowrap;
}

.tabs {
  display: flex;
  gap: var(--space-xs);
}

.tab {
  padding: var(--space-sm) var(--space-md);
  background: transparent;
  border: none;
  color: var(--color-text-secondary);
  font-size: var(--text-sm);
  font-weight: 500;
  cursor: pointer;
  transition: var(--theme-transition);
  border-radius: var(--radius-md);
  white-space: nowrap;
}

.tab:hover {
  color: var(--color-text-primary);
  background: var(--color-bg-tertiary);
}

.tab.active {
  color: var(--color-accent);
}

/* 右侧 */
.header-right {
  display: flex;
  align-items: center;
  gap: var(--space-md);
}

.search input {
  width: 240px;
  padding: var(--space-xs) var(--space-md);
  background: var(--color-bg-tertiary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-full);
  color: var(--color-text-primary);
  font-size: var(--text-sm);
  transition: var(--theme-transition);
}

.search input:focus {
  outline: none;
  border-color: var(--color-accent);
  background: var(--color-bg-elevated);
}

.search input::placeholder {
  color: var(--color-text-tertiary);
}

.user {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-xs) var(--space-sm);
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-full);
  color: var(--color-text-primary);
  cursor: pointer;
  transition: var(--theme-transition);
  white-space: nowrap;
}

.user:hover {
  background: var(--color-bg-tertiary);
  border-color: var(--color-accent);
}

.avatar {
  font-size: 14px;
}

.name {
  font-size: var(--text-sm);
  font-weight: 500;
}

/* 响应式 */
@media (max-width: 768px) {
  .tabs {
    display: none;
  }
}

@media (max-width: 480px) {
  .search {
    display: none;
  }
}
</style>
