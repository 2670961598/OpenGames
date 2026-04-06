<script setup lang="ts">
interface Props {
  title?: string
  subtitle?: string
}

defineProps<Props>()
</script>

<template>
  <div class="app-card">
    <div v-if="title || subtitle" class="card-header">
      <h3 v-if="title" class="card-title">{{ title }}</h3>
      <p v-if="subtitle" class="card-subtitle">{{ subtitle }}</p>
    </div>
    <div class="card-content">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.app-card {
  background: var(--color-bg-secondary);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--color-border);
  overflow: hidden;
  transition: var(--theme-transition);
}

.card-header {
  padding: var(--space-md);
  border-bottom: 1px solid var(--color-divider);
  background: var(--color-bg-tertiary);
}

.card-title {
  margin: 0;
  font-size: var(--text-lg);
  font-weight: 600;
  color: var(--color-text-primary);
}

.card-subtitle {
  margin: var(--space-xs) 0 0;
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
}

.card-content {
  padding: var(--space-md);
}

/* ====== 森林主题定制样式 ====== */

/* 森林主题：卡片更有机，圆角更大 */
[data-theme="forest"] .app-card {
  border-radius: var(--radius-lg);
  border: none;
  /* 顶部添加一条绿色渐变线 */
  position: relative;
}

[data-theme="forest"] .app-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, var(--color-accent), #4caf50);
}

/* 森林主题：标题区域不同 */
[data-theme="forest"] .card-header {
  background: transparent;
  border-bottom: 1px dashed var(--color-border);
}

[data-theme="forest"] .card-title {
  /* 森林主题用更柔和的字体粗细 */
  font-weight: 500;
  letter-spacing: 0.5px;
}

/* ====== 赛博朋克主题定制样式 ====== */

[data-theme="cyberpunk"] .app-card {
  border: 1px solid var(--color-accent);
  box-shadow:
    0 0 10px rgba(0, 243, 255, 0.1),
    inset 0 0 20px rgba(0, 243, 255, 0.02);
  clip-path: polygon(
    0 10px,
    10px 0,
    calc(100% - 10px) 0,
    100% 10px,
    100% calc(100% - 10px),
    calc(100% - 10px) 100%,
    10px 100%,
    0 calc(100% - 10px)
  );
}

[data-theme="cyberpunk"] .card-header {
  background: rgba(0, 243, 255, 0.05);
  border-bottom: 1px solid var(--color-accent);
}

[data-theme="cyberpunk"] .card-title {
  text-transform: uppercase;
  letter-spacing: 2px;
  font-family: var(--font-sans);
}
</style>
