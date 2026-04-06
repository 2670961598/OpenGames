<script setup lang="ts">
import { computed } from 'vue'

interface Tab {
  id: string
  label: string
  icon?: string
}

const props = defineProps<{
  modelValue: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const tabs: Tab[] = [
  { id: 'recommend', label: '推荐' },
  { id: 'library', label: '游戏库' },
  { id: 'profile', label: '个人页面' },
  { id: 'creator', label: '创作者页面' },
]

const activeTab = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const setActiveTab = (tabId: string) => {
  activeTab.value = tabId
}
</script>

<template>
  <nav class="tab-navigation">
    <div class="tabs-container">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        class="tab-button"
        :class="{ active: activeTab === tab.id }"
        @click="setActiveTab(tab.id)"
      >
        <span class="tab-label">{{ tab.label }}</span>
        <div class="tab-indicator"></div>
      </button>
    </div>
  </nav>
</template>

<style scoped>
.tab-navigation {
  display: flex;
  align-items: center;
  height: 48px;
  background: #1a1a1a;
  border-bottom: 1px solid #2a2a2a;
  padding: 0 24px;
}

.tabs-container {
  display: flex;
  gap: 8px;
  height: 100%;
}

.tab-button {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0 16px;
  background: transparent;
  border: none;
  color: #71717a;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  height: 100%;
}

.tab-button:hover {
  color: #a1a1aa;
}

.tab-button.active {
  color: #e5e5e5;
}

.tab-label {
  position: relative;
  z-index: 1;
}

.tab-indicator {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%) scaleX(0);
  width: calc(100% - 20px);
  height: 3px;
  background: linear-gradient(90deg, #6366f1, #8b5cf6);
  border-radius: 3px 3px 0 0;
  transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.tab-button.active .tab-indicator {
  transform: translateX(-50%) scaleX(1);
}

/* 悬停时显示微弱的指示器 */
.tab-button:not(.active):hover .tab-indicator {
  transform: translateX(-50%) scaleX(1);
  background: rgba(99, 102, 241, 0.3);
  height: 2px;
}
</style>
