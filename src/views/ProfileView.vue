<script setup lang="ts">
</script>

<template>
  <div class="profile-view">
    <div class="placeholder">
      <div class="placeholder-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
      </div>
      <h2>个人页面</h2>
      <p>这里将展示用户个人信息和设置</p>
    </div>
  </div>
</template>

<style scoped>
.profile-view {
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
  background: linear-gradient(135deg, var(--color-warning), var(--color-error));
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
  box-shadow: 0 0 20px rgba(233, 69, 96, 0.3);
  opacity: 0.7;
}

/* 森林主题：更柔和的圆角 */
[data-theme="forest"] .placeholder-icon {
  border-radius: var(--radius-lg);
}
</style>
