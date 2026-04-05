---
description: "任务列表模板 - 基于 spec 和 plan 生成"
type: template
---

# Tasks: [FEATURE NAME]

**Input**: 设计文档来自 `/specs/[###-feature-name]/`
**Scope**: [src (前端) / src-tauri (客户端后端) / src-server (服务端)]

---

## 格式说明

- `[P]`: 可并行执行
- `[Story]`: 所属用户故事 (US1, US2...)
- 任务须包含精确的文件路径

---

## Phase 1: Setup

**目的**: 项目初始化和基础结构

- [ ] T001 创建功能目录结构
- [ ] T002 初始化/更新依赖
- [ ] T003 [P] 配置工具链

**检查点**: 目录和依赖就绪

---

## Phase 2: Foundational

**目的**: 核心基础设施

⚠️ **关键**: 此阶段完成前不得开始用户故事

- [ ] T004 定义数据模型 (参考 `project-context.md` 中的共享模型位置)
- [ ] T005 [P] 实现 Repository 接口
- [ ] T006 实现核心服务 (放在 `crates/shared/` 如适用)

**检查点**: 基础设施就绪

---

## Phase 3: User Story 1 - [Title] (Priority: P1) 🎯 MVP

**目标**: [简述]

### 实现

- [ ] T0XX [P] [US1] 实现 [组件/模块]
- [ ] T0XX [US1] 实现 [功能]
- [ ] T0XX [US1] 集成和错误处理

### 测试

- [ ] T0XX [P] [US1] 编写单元测试 (参考 `testing-strategy.md`)

**检查点**: User Story 1 可独立运行

---

## Phase 4: User Story 2 - [Title] (Priority: P2)

...

---

## Phase N: Polish

- [ ] TXXX 代码清理
- [ ] TXXX 文档更新
- [ ] TXXX 运行测试验证

---

## Dependencies & Execution Order

### Phase 依赖

```
Setup → Foundational → User Stories (P1 → P2 → P3) → Polish
```

### 并行机会

- Setup 中标记 [P] 的任务
- Foundational 中标记 [P] 的任务
- 不同 User Story 之间（如果无依赖）

---

## Implementation Strategy

### MVP First（仅 User Story 1）

1. 完成 Setup + Foundational
2. 完成 User Story 1
3. **停止并验证**
4. 如已就绪，进行演示

### 增量交付

每个 Story 完成后独立测试，不破坏之前功能。

---

## 参考

- 项目上下文: `.specify/templates/project-context.md`
- 测试策略: `.specify/templates/testing-strategy.md`
- 目录结构: `.specify/templates/project-structure-reference.md`
