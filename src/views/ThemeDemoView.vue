<script setup lang="ts">
import { useTheme } from '../composables/useTheme.ts'
import AppButton from '../components/base/AppButton.vue'
import AppCard from '../components/base/AppCard.vue'

const { themes, currentTheme, setTheme } = useTheme()

const testButtons = [
  { label: '默认按钮', variant: 'default' as const },
  { label: '主要按钮', variant: 'primary' as const },
  { label: '次要按钮', variant: 'secondary' as const },
  { label: '危险按钮', variant: 'danger' as const },
]
</script>

<template>
  <div class="theme-demo">
    <AppCard title="主题切换" subtitle="点击下方按钮切换不同主题">
      <div class="theme-buttons">
        <AppButton
          v-for="theme in themes"
          :key="theme.name"
          :variant="currentTheme?.name === theme.name ? 'primary' : 'default'"
          @click="setTheme(theme.name)"
        >
          {{ theme.label }}
          <span v-if="currentTheme?.name === theme.name">✓</span>
        </AppButton>
      </div>
    </AppCard>

    <AppCard title="组件展示" subtitle="观察不同主题下组件的变化">
      <div class="demo-section">
        <h4>按钮样式</h4>
        <div class="button-row">
          <AppButton
            v-for="btn in testButtons"
            :key="btn.variant"
            :variant="btn.variant"
          >
            {{ btn.label }}
          </AppButton>
        </div>
      </div>

      <div class="demo-section">
        <h4>CSS 变量预览</h4>
        <div class="token-grid">
          <div class="token-item" style="background: var(--color-bg-primary)">
            bg-primary
          </div>
          <div class="token-item" style="background: var(--color-bg-secondary)">
            bg-secondary
          </div>
          <div class="token-item" style="background: var(--color-accent)">
            accent
          </div>
          <div class="token-item" style="background: var(--color-success)">
            success
          </div>
          <div class="token-item" style="background: var(--color-warning)">
            warning
          </div>
          <div class="token-item" style="background: var(--color-error)">
            error
          </div>
        </div>
      </div>

      <div class="demo-section">
        <h4>卡片样式对比</h4>
        <div class="card-row">
          <div class="mini-card" style="border-radius: var(--radius-sm)">
            small
          </div>
          <div class="mini-card" style="border-radius: var(--radius-md)">
            medium
          </div>
          <div class="mini-card" style="border-radius: var(--radius-lg)">
            large
          </div>
        </div>
      </div>
    </AppCard>

    <AppCard title="当前主题信息">
      <pre class="theme-info">{{ JSON.stringify(currentTheme, null, 2) }}</pre>
    </AppCard>
  </div>
</template>

<style scoped>
.theme-demo {
  padding: var(--space-lg);
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
  max-width: 800px;
  margin: 0 auto;
}

.theme-buttons {
  display: flex;
  gap: var(--space-sm);
  flex-wrap: wrap;
}

.demo-section {
  margin-bottom: var(--space-lg);
}

.demo-section:last-child {
  margin-bottom: 0;
}

.demo-section h4 {
  margin: 0 0 var(--space-md);
  color: var(--color-text-secondary);
  font-size: var(--text-sm);
  text-transform: uppercase;
  letter-spacing: 1px;
}

.button-row {
  display: flex;
  gap: var(--space-sm);
  flex-wrap: wrap;
}

.token-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-sm);
}

.token-item {
  padding: var(--space-md);
  border-radius: var(--radius-md);
  color: white;
  font-size: var(--text-xs);
  text-align: center;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}

.card-row {
  display: flex;
  gap: var(--space-md);
}

.mini-card {
  flex: 1;
  padding: var(--space-md);
  background: var(--color-bg-tertiary);
  text-align: center;
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
}

.theme-info {
  background: var(--color-bg-tertiary);
  padding: var(--space-md);
  border-radius: var(--radius-md);
  font-size: var(--text-xs);
  overflow-x: auto;
  color: var(--color-text-secondary);
}
</style>
