---
description: "功能规范通用模板 - 根据 scope 选择专用模板"
type: template
---

# Feature Specification: [FEATURE NAME]

**Feature Branch**: `[###-feature-name]`  
**Created**: [DATE]  
**Status**: Draft  
**Scope**: [src (前端) / src-tauri (客户端后端) / src-server (服务端)]  
**Input**: User description: "$ARGUMENTS"

> **提示**: 根据 scope 选择专用模板：
> - `src` (前端) → 使用 `spec-template-client-frontend.md`
> - `src-tauri` (客户端后端) → 使用 `spec-template-client-backend.md`  
> - `src-server` (服务端) → 使用 `spec-template-server.md`

---

## 技术上下文

> 参考 `.specify/templates/project-context.md`

---

## 用户场景 & 测试 *(mandatory)*

<!--
  用户故事按重要性排序，每个必须是可独立测试的。
  P1 为最高优先级。
-->

### User Story 1 - [Brief Title] (Priority: P1)

[用通俗易懂的语言描述这个用户旅程]

**Why this priority**: [解释其价值]

**Independent Test**: [如何独立测试此故事]

**Acceptance Scenarios**:

1. **Given** [初始状态], **When** [动作], **Then** [预期结果]
2. **Given** [初始状态], **When** [动作], **Then** [预期结果]

---

### User Story 2 - [Brief Title] (Priority: P2)

...

---

### Edge Cases

- 当 [边界条件] 发生时系统如何表现？
- 系统如何处理 [错误场景]？

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: 系统必须 [具体能力]
- **FR-002**: 系统必须 [具体能力]
- **FR-003**: 用户必须能够 [关键交互]

### Key Entities *(如果功能涉及数据)*

- **[Entity 1]**: [它代表什么，关键属性]
- **[Entity 2]**: [与其他实体的关系]

---

## 契约定义 *(与其他端的接口)*

| 接口 | 输入 | 输出 | 错误 |
|-----|------|------|------|
| [接口名] | [类型] | [类型] | [场景] |

---

## 依赖关系

**依赖的其他功能**:
- [ ] `[###-dependency]` - [说明]

**被谁依赖**:
- [ ] `[###-dependent]` - [说明]

---

## 文件清单 *(预计)*

根据 scope 参考 `project-structure-reference.md`

---

## 备注

- [其他说明]
