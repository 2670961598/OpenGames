# 新主题创建规范

> 本规范适用于所有新建主题，确保主题与现有组件完美兼容。

---

## 一、创建流程

### 1.1 步骤清单

1. **复制基础文件**：从 `light.ts` 或 `dark.ts` 复制
2. **修改元信息**：`name`（英文标识）、`label`（显示名称）
3. **调整 Tokens**：覆盖颜色、圆角、阴影、字体等值
4. **注册主题**：在 `presets/index.ts` 中添加导入和导出
5. **组件适配检查**：检查现有组件是否需要特殊样式覆盖
6. **全面测试**：在所有使用场景下验证

---

## 二、Token 设计规范

### 2.1 必填 Tokens

以下 Tokens 必须定义，否则会影响组件显示：

```ts
// 背景色（至少 4 级）
'color-bg-primary'      // 最底层背景
'color-bg-secondary'    // 卡片、面板背景
'color-bg-tertiary'     // 悬浮、选中背景
'color-bg-elevated'     // 弹出层、菜单背景

// 文字色（至少 4 级）
'color-text-primary'    // 主要文字
'color-text-secondary'  // 次要文字、描述
'color-text-tertiary'   // 占位符、禁用文字
'color-text-inverse'    // 深色背景上的白字

// 强调色（至少 3 级）
'color-accent'          // 主按钮、链接、高亮
'color-accent-hover'    // 悬停状态
'color-accent-active'   // 激活状态

// 边框/分割线
'color-border'          // 边框
'color-divider'         // 分割线

// 功能色
'color-success'         // 成功状态
'color-warning'         // 警告状态
'color-error'           // 错误状态
'color-info'            // 信息提示
```

### 2.2 Token 设计原则

**对比度原则**：
- `color-text-primary` 在 `color-bg-primary` 上必须清晰可读
- `color-text-inverse` 在 `color-accent` 上必须清晰可读

**层级原则**：
- `primary < secondary < tertiary < elevated`（背景由暗到亮或反之）
- 确保视觉层级清晰

**一致性原则**：
- 同类型 Token 保持相同语义（如 `success` 总是绿色系）

---

## 三、组件适配检查

### 3.1 必须检查的基础组件

创建主题后，逐一检查以下组件的显示效果：

| 组件 | 检查要点 |
|------|----------|
| `AppButton` | 各 variant 颜色、hover/active 状态 |
| `AppCard` | 背景色、边框、是否需要特殊形态 |
| `AppInput` | 背景、边框聚焦状态、placeholder 颜色 |
| Quasar 组件 | q-btn、q-card、q-input、q-menu 等 |

### 3.2 何时需要组件级覆盖

在主题文件中只定义 Tokens，**不直接写组件样式**。

如果某组件在当前主题下需要特殊表现，修改对应组件的 `.vue` 文件，添加：

```css
[data-theme="你的主题名"] .组件类名 {
  /* 特殊样式 */
}
```

**常见需要覆盖的场景：**
- **赛博朋克**：卡片需要切角、发光边框
- **森林**：卡片需要顶部渐变线、自然圆角
- **高对比**：增加边框粗细、强化阴影

### 3.3 覆盖流程

1. 先测试组件用 CSS 变量的默认效果
2. 如不满意，在对应组件中添加 `[data-theme="xxx"]` 覆盖
3. **不要**在主题文件中添加组件相关样式

---

## 四、主题风格指南

### 4.1 风格分类

| 风格 | 特征 | 示例 |
|------|------|------|
| 专业/商务 | 低饱和、锐利圆角、浅阴影 | light、dark |
| 游戏/娱乐 | 高饱和、发光效果、大胆造型 | cyberpunk |
| 自然/有机 | 暖色调、大圆角、柔和阴影 | forest |

### 4.2 各风格建议值

**圆角策略：**
- 专业风：`4px-8px`（小圆角）
- 自然风：`12px-20px`（大圆角）
- 锐利风：`2px-4px` 或 `0px`（切角）

**阴影策略：**
- 扁平风：少用或不用阴影
- 层次风：明显的多层阴影
- 发光风：带颜色的发光阴影（如赛博朋克）

---

## 五、测试检查清单

创建主题后，完成以下测试：

### 5.1 基础检查
- [ ] 主题出现在切换菜单中
- [ ] 切换后控制台输出 `[Theme] Applied: xxx`
- [ ] 背景色正确变化
- [ ] 文字颜色正确变化

### 5.2 组件检查
- [ ] AppButton 各 variant 正常显示
- [ ] AppCard 背景和边框正常
- [ ] 输入框聚焦状态可见
- [ ] 下拉菜单背景正确
- [ ] 头像、图标颜色正确

### 5.3 可读性检查
- [ ] 主要文字清晰可读（对比度 > 4.5:1）
- [ ] 次要文字可辨识（对比度 > 3:1）
- [ ] 禁用状态有明显视觉区分

### 5.4 特殊场景
- [ ] 滚动条样式（如有自定义）
- [ ] 空状态/占位符显示
- [ ] 加载状态样式

---

## 六、示例模板

```ts
// themes/presets/my-theme.ts
import type { Theme } from '../types.ts'

export const myTheme: Theme = {
  name: 'mytheme',        // 英文，小写，无空格
  label: '我的主题',       // 显示名称
  tokens: {
    // === 背景色 ===
    'color-bg-primary': '#xxx',
    'color-bg-secondary': '#xxx',
    'color-bg-tertiary': '#xxx',
    'color-bg-elevated': '#xxx',

    // === 文字色 ===
    'color-text-primary': '#xxx',
    'color-text-secondary': '#xxx',
    'color-text-tertiary': '#xxx',
    'color-text-inverse': '#xxx',

    // === 强调色 ===
    'color-accent': '#xxx',
    'color-accent-hover': '#xxx',
    'color-accent-active': '#xxx',

    // === 边框/分割线 ===
    'color-border': '#xxx',
    'color-divider': '#xxx',

    // === 功能色 ===
    'color-success': '#22c55e',
    'color-warning': '#f59e0b',
    'color-error': '#ef4444',
    'color-info': '#3b82f6',

    // === 圆角 ===
    'radius-none': '0px',
    'radius-sm': '4px',
    'radius-md': '8px',
    'radius-lg': '12px',
    'radius-xl': '16px',
    'radius-full': '9999px',

    // === 阴影 ===
    'shadow-none': 'none',
    'shadow-sm': '0 1px 2px rgba(0,0,0,0.05)',
    'shadow-md': '0 4px 6px rgba(0,0,0,0.1)',
    'shadow-lg': '0 10px 15px rgba(0,0,0,0.1)',
    'shadow-xl': '0 20px 25px rgba(0,0,0,0.15)',

    // === 字体 ===
    'font-sans': 'system-ui, sans-serif',
    'font-mono': '"JetBrains Mono", monospace',

    // === 字号 ===
    'text-xs': '12px',
    'text-sm': '14px',
    'text-base': '16px',
    'text-lg': '18px',
    'text-xl': '20px',
    'text-2xl': '24px',

    // === 间距 ===
    'space-xs': '4px',
    'space-sm': '8px',
    'space-md': '16px',
    'space-lg': '24px',
    'space-xl': '32px',
  }
}
```

---

## 七、协作规范

### 7.1 与组件作者的分工

| 责任 | 主题作者 | 组件作者 |
|------|----------|----------|
| Token 定义 | ✅ | ❌ |
| 组件默认样式 | ❌ | ✅ |
| 特殊主题覆盖 | 提需求 | 实现 |

### 7.2 需求沟通

如果新主题需要某组件的特殊表现：
1. 先尝试用现有 Tokens 实现
2. 如无法实现，在组件文件中添加 `[data-theme="xxx"]` 覆盖
3. 提交 PR 时说明设计意图

---

## 八、禁止事项

- ❌ 在主题文件中写组件选择器（如 `.app-card { ... }`）
- ❌ 使用未定义的 CSS 变量
- ❌ 跳过组件测试直接提交
- ❌ 对比度过低导致文字难以阅读
