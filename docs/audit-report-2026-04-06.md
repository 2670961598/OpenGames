# 规范检查报告

**检查日期**: 2026-04-06  
**检查标准**: component-guidelines.md + theme-guidelines.md  
**检查范围**: 所有组件、主题、视图文件

---

## 一、组件检查结果

### ✅ 通过项

| 组件 | 状态 | 说明 |
|------|------|------|
| `AppButton.vue` | ✅ | 100% 使用 CSS 变量，有过渡动画，无硬编码颜色 |
| `AppCard.vue` | ✅ | 基础样式使用 CSS 变量，已添加 cyberpunk/forest 主题特殊覆盖 |

### ❌ 违规项

| 组件 | 严重程度 | 问题 | 位置 |
|------|----------|------|------|
| `RecommendView.vue` | 🔴 **严重** | 大量硬编码颜色 | 多处 |
| `LibraryView.vue` | 🔴 **严重** | 硬编码颜色 | 多处 |
| `ProfileView.vue` | 🔴 **严重** | 硬编码颜色 | 多处 |
| `CreatorView.vue` | 🔴 **严重** | 硬编码颜色 | 多处 |
| `DevTestView.vue` | 🔴 **严重** | 大量硬编码颜色 | 整个文件 |

#### RecommendView.vue 详细问题

```css
/* 第 142-153 行 - 硬编码颜色 */
.category-section {
  border-bottom: 1px solid #2a2a2a;    /* ❌ 应使用 var(--color-border) */
  background: #141414;                  /* ❌ 应使用 var(--color-bg-secondary) */
}

.content-area {
  background: #0f0f0f;                  /* ❌ 应使用 var(--color-bg-primary) */
}

.featured-card {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);  /* ❌ */
  border: 1px solid #2a2a3a;            /* ❌ */
}

.game-card {
  background: #1a1a1a;                  /* ❌ */
  border: 1px solid #2a2a2a;            /* ❌ */
}

.game-card:hover {
  border-color: #6366f1;                /* ❌ 应使用 var(--color-accent) */
}
```

**另有 Quasar 组件使用硬编码类**: `text-grey`, `bg-grey-8`, `text-grey-4`, `color="amber"`, `color="primary"` 等

#### LibraryView.vue / ProfileView.vue / CreatorView.vue 详细问题

```css
/* 三个文件结构相同，问题相同 */
.placeholder {
  color: #71717a;                       /* ❌ 应使用 var(--color-text-secondary) */
}

.placeholder-icon {
  background: linear-gradient(135deg, #10b981, #3b82f6);  /* ❌ 固定渐变 */
}

.placeholder h2 {
  color: #e5e5e5;                       /* ❌ 应使用 var(--color-text-primary) */
}

.placeholder-icon svg {
  color: #fff;                          /* ❌ 应使用 var(--color-text-inverse) */
}
```

#### DevTestView.vue 详细问题

```css
/* 整个文件都是硬编码的 #xxxxxx 颜色 */
.dev-test-view { background: #0a0a0a; }
.test-header { background: linear-gradient(90deg, #1a1a1a, #252525); border-bottom: 1px solid #333; }
/* ... 约 30+ 处硬编码颜色 */
```

---

## 二、主题检查结果

### ✅ 通过项

| 主题 | 状态 | 说明 |
|------|------|------|
| `light.ts` | ✅ | 所有必填 Token 已定义，值合理 |
| `dark.ts` | ✅ | 所有必填 Token 已定义，暗色值合理 |
| `cyberpunk.ts` | ✅ | 特殊风格 Token 定义完整，圆角锐利、阴影发光符合主题定位 |
| `forest.ts` | ✅ | 特殊风格 Token 定义完整，圆角圆润符合自然主题 |

### ⚠️ 建议改进

| 主题 | 建议 | 原因 |
|------|------|------|
| `dark.ts` | 完善独立 Token | 目前圆角/字体/字号/间距完全复用 light，建议独立定义以确保主题完整性 |
| `cyberpunk.ts` | 检查字体可用性 | `Rajdhani`, `Orbitron`, `Share Tech Mono` 需确保已加载 |
| `forest.ts` | 检查对比度 | `color-bg-elevated: #3d7a3d` 与 `color-text-primary: #e8f5e8` 需确保可读 |

---

## 三、App.vue 检查结果

### ✅ 通过项

| 检查项 | 状态 | 说明 |
|--------|------|------|
| CSS 变量使用 | ✅ | 所有样式使用 CSS 变量 |
| Quasar 覆盖 | ✅ | 使用 `:deep()` 覆盖 Quasar 组件样式 |
| 主题初始化 | ✅ | 正确调用 `initTheme()` |

### ⚠️ 注意事项

| 位置 | 说明 |
|------|------|
| 第 69 行 | `class="bg-dark-page"` 仍在使用，虽然被 `:deep(.q-header)` 覆盖，但建议移除 |
| 第 77 行 | `class="text-grey"` 仍在使用，虽然被覆盖，但建议移除 |

---

## 四、问题统计

| 类别 | 通过 | 违规 | 通过率 |
|------|------|------|--------|
| 基础组件 | 2 | 0 | 100% |
| 视图组件 | 0 | 5 | 0% |
| 主题定义 | 4 | 0 | 100% |
| 主布局 | 1 | - | - |
| **总计** | **7** | **5** | **58.3%** |

---

## 五、修复优先级

### P0 - 立即修复（影响主题切换核心体验）

1. **RecommendView.vue** - 用户主界面，硬编码颜色导致主题切换无效
2. **LibraryView.vue / ProfileView.vue / CreatorView.vue** - 同样问题

### P1 - 尽快修复（开发者界面）

3. **DevTestView.vue** - 开发者测试界面，虽非用户界面但应作为规范示例

### P2 - 建议优化

4. **App.vue** - 清理遗留的 Quasar 类名
5. **dark.ts** - 补全独立 Token 定义

---

## 六、修复示例

### RecommendView.vue 修复示例

```css
/* 修改前 ❌ */
.category-section {
  border-bottom: 1px solid #2a2a2a;
  background: #141414;
}

/* 修改后 ✅ */
.category-section {
  border-bottom: 1px solid var(--color-border);
  background: var(--color-bg-secondary);
}
```

### LibraryView.vue 修复示例

```css
/* 修改前 ❌ */
.placeholder h2 {
  color: #e5e5e5;
}

/* 修改后 ✅ */
.placeholder h2 {
  color: var(--color-text-primary);
}
```

---

## 七、合规文件示例

以下文件作为规范参考：

- `src/components/base/AppButton.vue` - 基础组件标杆
- `src/components/base/AppCard.vue` - 含主题特殊覆盖示例
- `src/themes/presets/cyberpunk.ts` - 特殊主题设计示例

---

**检查人**: Claude  
**下次检查建议**: 修复 P0 问题后复查
