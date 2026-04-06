<script setup lang="ts">
</script>

<template>
  <div class="creator-view">
    <div class="placeholder">
      <div class="placeholder-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M12 19l7-7 3 3-7 7-3-3z"/>
          <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/>
          <path d="M2 2l7.586 7.586"/>
          <circle cx="11" cy="11" r="2"/>
        </svg>
      </div>
      <h2>创作者页面</h2>
      <p>这里将展示游戏上传和管理功能</p>
    </div>
  </div>
</template>

<style scoped>
.creator-view {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-xl);
  background: var(--color-bg-primary);
}

.placeholder {
  text-align: center;
  color: var(--color-text-secondary);
}

.placeholder-icon {
  width: 80px;
  height: 80px;
  margin: 0 auto var(--space-lg);
  background: linear-gradient(135deg, var(--color-accent), var(--color-info));
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
  box-shadow: 0 0 20px rgba(139, 92, 246, 0.3);
  opacity: 0.7;
}

/* 森林主题：更柔和的圆角 */
[data-theme="forest"] .placeholder-icon {
  border-radius: var(--radius-lg);
}
</style>
