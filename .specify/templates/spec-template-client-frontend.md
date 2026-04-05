---
description: "客户端前端功能规范模板 (Vue 3 + Tauri)"
type: template
scope: client-frontend
---

# Feature Specification: [FEATURE NAME]

**Feature Branch**: `[###-feature-name]`  
**Created**: [DATE]  
**Status**: Draft  
**Scope**: src/ (客户端前端)

---

## 技术上下文

- **框架**: Vue 3.4+ (Composition API)
- **语言**: TypeScript 5.3+
- **状态**: Pinia 2.1+
- **UI**: shadcn-vue + Tailwind CSS
- **构建**: Vite 5.0+
- **测试**: Vitest + Playwright

---

## 用户场景 *(mandatory)*

### User Story 1 - [标题] (Priority: P1)

[描述用户旅程]

**Acceptance Scenarios**:

1. **Given** [初始状态], **When** [动作], **Then** [预期结果]
2. **Given** [初始状态], **When** [动作], **Then** [预期结果]

**Tauri 集成点**:
- 调用命令: `[command_name]`
- 监听事件: `[event_name]`

---

### User Story 2 - [标题] (Priority: P2)

...

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: [功能要求]
- **FR-002**: [功能要求]
- **FR-003**: [IPC 要求]

### TypeScript 类型

```typescript
// 核心类型定义
interface [Feature]State { }
interface [Feature]DTO { }
```

---

## 文件清单

```
src/
├── components/[feature]/
├── composables/use[Feature].ts
├── stores/[feature].ts
├── types/[feature].ts
├── services/tauri/[feature].ts
└── views/[Feature]Page.vue
```

---

## Tauri 契约

| 命令 | 输入 | 输出 | 错误处理 |
|-----|------|------|---------|
| `[cmd_name]` | `{ }` | `Result<T>` | Toast |

---

## 检查清单

- [ ] 使用了已有的 composable?
- [ ] Store 命名规范?
- [ ] 类型与 Rust 端一致?

---

## 依赖

**依赖**: [功能编号]  
**被依赖**: [功能编号]
