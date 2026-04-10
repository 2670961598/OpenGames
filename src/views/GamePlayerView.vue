<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface Props {
  id: string
}

const props = defineProps<Props>()

const isLoading = ref(true)
const gameTitle = ref('游戏加载中...')

onMounted(() => {
  // 模拟游戏加载
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
    <!-- 游戏头部 -->
    <header class="game-bar">
      <div class="game-info">
        <span class="game-title">{{ gameTitle }}</span>
      </div>
      <div class="game-actions">
        <button class="action-btn" title="设置">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="3"/>
            <path d="M12 1v6m0 6v6m4.22-10.22l4.24-4.24M6.34 6.34L2.1 2.1m17.8 17.8l-4.24-4.24M6.34 17.66l-4.24 4.24M23 12h-6m-6 0H1m20.07-4.93l-4.24 4.24M6.34 6.34l-4.24-4.24"/>
          </svg>
        </button>
        <button class="action-btn close" title="关闭" @click="handleClose">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
    </header>

    <!-- 游戏容器 -->
    <div class="game-container">
      <div v-if="isLoading" class="loading">
        <div class="loading-spinner"></div>
        <p>正在加载游戏...</p>
      </div>
      <div v-else class="game-content">
        <!-- 游戏内容区域 -->
        <div class="game-placeholder">
          <div class="placeholder-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <polygon points="5 3 19 12 5 21 5 3"/>
            </svg>
          </div>
          <h2>游戏运行中</h2>
          <p>游戏 ID: {{ id }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.game-player-view {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--color-bg-primary);
}

/* 游戏头部 */
.game-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 40px;
  padding: 0 var(--space-md);
  background: var(--color-bg-secondary);
  border-bottom: 1px solid var(--color-border);
  -webkit-app-region: drag;
}

.game-info {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  -webkit-app-region: no-drag;
}

.game-title {
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--color-text-primary);
}

.game-actions {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  -webkit-app-region: no-drag;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  background: transparent;
  border: none;
  border-radius: var(--radius-md);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: var(--theme-transition);
}

.action-btn:hover {
  background: var(--color-bg-tertiary);
  color: var(--color-text-primary);
}

.action-btn.close:hover {
  background: var(--color-error);
  color: var(--color-text-inverse);
}

.action-btn svg {
  width: 14px;
  height: 14px;
}

/* 游戏容器 */
.game-container {
  flex: 1;
  position: relative;
  overflow: hidden;
}

.loading {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-md);
  color: var(--color-text-secondary);
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--color-border);
  border-top-color: var(--color-accent);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading p {
  font-size: var(--text-sm);
}

.game-content {
  width: 100%;
  height: 100%;
}

.game-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
  color: var(--color-text-secondary);
}

.placeholder-icon {
  width: 120px;
  height: 120px;
  margin-bottom: var(--space-xl);
  background: linear-gradient(135deg, var(--color-accent), var(--color-info));
  border-radius: var(--radius-xl);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.5;
}

.placeholder-icon svg {
  width: 60px;
  height: 60px;
  color: var(--color-text-inverse);
}

.game-placeholder h2 {
  font-size: var(--text-2xl);
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: var(--space-sm);
}

.game-placeholder p {
  font-size: var(--text-sm);
  color: var(--color-text-tertiary);
}
</style>
