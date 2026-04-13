# 新组件创建规范

> 本规范适用于所有新建组件，确保组件与主题系统完全兼容。

---

## 一、基础要求

### 1.1 必须使用 CSS 变量

**禁止**在组件中使用硬编码颜色值（如 `#1a1a1a`, `#e5e5e5`）。

**正确做法：**
```css
.my-component {
  background: var(--color-bg-secondary);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  padding: var(--space-md);
}
```

**可用变量清单：**
- 颜色：`--color-bg-*`, `--color-text-*`, `--color-accent`, `--color-border`, `--color-divider`, `--color-success/warning/error/info`
- 圆角：`--radius-none/sm/md/lg/xl/full`
- 阴影：`--shadow-none/sm/md/lg/xl`
- 字体：`--font-sans`, `--font-mono`, `--text-xs/sm/base/lg/xl/2xl`
- 间距：`--space-xs/sm/md/lg/xl`

### 1.2 过渡动画

组件必须支持主题切换时的平滑过渡：
```css
.my-component {
  transition: var(--theme-transition);
}
```

---

## 二、主题兼容策略

### 2.1 默认兼容所有主题

组件必须能在所有预设主题（light、dark、cyberpunk、forest 等）下正常显示，无需额外配置。

### 2.2 特殊主题定制（可选）

当某个主题需要组件呈现特殊形态时，使用属性选择器覆盖：

```css
/* 基础样式（所有主题通用） */
.app-card {
  background: var(--color-bg-secondary);
  border-radius: var(--radius-md);
}

/* 赛博朋克主题特殊处理：切角卡片 */
[data-theme="cyberpunk"] .app-card {
  clip-path: polygon(...);
  border: 1px solid var(--color-accent);
  box-shadow: 0 0 10px rgba(0, 243, 255, 0.1);
}

/* 森林主题特殊处理：顶部渐变线 */
[data-theme="forest"] .app-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, var(--color-accent), #4caf50);
}
```

### 2.3 何时需要特殊定制

- **形态变化**：卡片从圆角变切角、按钮从矩形变圆形
- **装饰元素**：添加发光效果、边框动画、背景纹理
- **布局调整**：间距变大/变小、排列方式改变
- **字体变化**：需要特殊字间距、大小写转换

---

## 三、组件分类标准

### 3.1 基础组件（Base Components）

位于 `src/components/base/`，完全自绘，不依赖 Quasar：
- 必须 100% 使用 CSS 变量
- 必须考虑所有主题的特殊表现

**示例：** `AppButton.vue`, `AppCard.vue`, `AppInput.vue`

### 3.2 复合组件（Composite Components）

基于基础组件组合而成：
- 优先使用基础组件
- 局部样式使用 CSS 变量

### 3.3 Quasar 包装组件（Wrapper Components）

必须包装 Quasar 组件时：
- 创建同名包装组件（如 `AppSelect` 包装 `q-select`）
- 使用 `:deep()` 覆盖 Quasar 的硬编码样式
- 在 `App.vue` 或组件内确保 Quasar 组件跟随主题

---

## 四、检查清单

创建组件前，确认以下事项：

- [ ] 所有颜色使用 `var(--color-*)`
- [ ] 所有尺寸（圆角、间距）使用 `var(--radius-*)` 或 `var(--space-*)`
- [ ] 添加了 `transition: var(--theme-transition)`
- [ ] 在 light 主题下测试正常
- [ ] 在 dark 主题下测试正常
- [ ] 在 cyberpunk 主题下测试正常（检查是否有特殊定制需求）
- [ ] 在 forest 主题下测试正常（检查是否有特殊定制需求）
- [ ] 对比度检查（文字可读）

---

## 五、示例模板

```vue
<script setup lang="ts">
interface Props {
  variant?: 'default' | 'primary'
}

defineProps<Props>()
</script>

<template>
  <div class="app-component">
    <slot />
  </div>
</template>

<style scoped>
/* 基础样式 - 使用 CSS 变量 */
.app-component {
  background: var(--color-bg-secondary);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--space-md);
  transition: var(--theme-transition);
}

/* 特殊主题定制区域 */
[data-theme="cyberpunk"] .app-component {
  /* 赛博朋克特殊样式 */
}

[data-theme="forest"] .app-component {
  /* 森林主题特殊样式 */
}
</style>
```

---

## 六、维护责任

- **组件作者**：确保创建时符合本规范
- **主题作者**：如需对组件进行特殊定制，修改对应组件文件（非主题文件）
- **Code Review**：重点检查硬编码颜色和 CSS 变量使用情况
