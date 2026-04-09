<script setup lang="ts">
</script>

<template>
  <div class="library-view">
    <div class="placeholder">
      <div class="placeholder-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
          <line x1="8" y1="21" x2="16" y2="21"/>
          <line x1="12" y1="17" x2="12" y2="21"/>
        </svg>
      </div>
      <h2>游戏库</h2>
      <p>这里将展示您的游戏收藏</p>
    </div>
  </div>
</template>

<style scoped>
.library-view {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: calc(var(--space-xl) + 56px) var(--space-xl) var(--space-xl);
  background: var(--color-bg-primary);
}

@media (max-width: 768px) {
  .library-view {
    padding-top: calc(var(--space-xl) + 48px);
  }
}

.placeholder {
  text-align: center;
  color: var(--color-text-secondary);
}

.placeholder-icon {
  width: 80px;
  height: 80px;
  margin: 0 auto var(--space-lg);
  background: linear-gradient(135deg, var(--color-success), var(--color-info));
  border-radius: var(--radius-xl);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.5;
  transition: var(--theme-transition);
}

.placeholder-icon svg {
  width: 40px;
  height: 40px;
  color: var(--color-text-inverse);
}

.placeholder h2 {
  font-size: var(--text-2xl);
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: var(--space-sm);
  transition: var(--theme-transition);
}

.placeholder p {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
}

/* 赛博朋克主题：图标发光 */
[data-theme="cyberpunk"] .placeholder-icon {
  box-shadow: 0 0 20px rgba(0, 243, 255, 0.3);
  opacity: 0.7;
}

/* 森林主题：更柔和的圆角 */
[data-theme="forest"] .placeholder-icon {
  border-radius: var(--radius-lg);
}
</style>
