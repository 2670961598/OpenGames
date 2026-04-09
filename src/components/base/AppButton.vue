<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  variant?: 'default' | 'primary' | 'secondary' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
  size: 'md',
})

const emit = defineEmits<{
  click: [e: MouseEvent]
}>()

const classes = computed(() => [
  'app-button',
  `variant-${props.variant}`,
  `size-${props.size}`,
  {
    'is-disabled': props.disabled,
    'is-loading': props.loading,
  },
])

const handleClick = (e: MouseEvent) => {
  if (!props.disabled && !props.loading) {
    emit('click', e)
  }
}
</script>

<template>
  <button :class="classes" @click="handleClick">
    <span v-if="loading" class="loading-indicator"></span>
    <slot />
  </button>
</template>

<style scoped>
.app-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-xs);
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  font-weight: 500;
  border: 1px solid transparent;
  cursor: pointer;
  transition: var(--theme-transition);
  white-space: nowrap;
}

/* Size variants */
.size-sm {
  padding: var(--space-xs) var(--space-sm);
  border-radius: var(--radius-sm);
  min-height: 32px;
}

.size-md {
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--radius-md);
  min-height: 40px;
}

.size-lg {
  padding: var(--space-md) var(--space-lg);
  border-radius: var(--radius-lg);
  min-height: 48px;
  font-size: var(--text-base);
}

/* Color variants */
.variant-default {
  background: var(--color-bg-secondary);
  color: var(--color-text-primary);
  border-color: var(--color-border);
}

.variant-default:hover:not(.is-disabled) {
  background: var(--color-bg-tertiary);
}

.variant-primary {
  background: var(--color-accent);
  color: var(--color-text-inverse);
}

.variant-primary:hover:not(.is-disabled) {
  background: var(--color-accent-hover);
}

.variant-secondary {
  background: transparent;
  color: var(--color-accent);
  border-color: var(--color-accent);
}

.variant-secondary:hover:not(.is-disabled) {
  background: var(--color-accent);
  color: var(--color-text-inverse);
}

.variant-danger {
  background: var(--color-error);
  color: var(--color-text-inverse);
}

.variant-danger:hover:not(.is-disabled) {
  opacity: 0.9;
}

/* States */
.is-disabled,
.is-loading {
  opacity: 0.5;
  cursor: not-allowed;
}

.loading-indicator {
  width: 16px;
  height: 16px;
  border: 2px solid currentColor;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
