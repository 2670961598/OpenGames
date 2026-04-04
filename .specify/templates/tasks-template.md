---

description: "任务列表模板，用于功能实现"
---

# Tasks: [FEATURE NAME]

**Input**: 设计文档来自 `/specs/[###-feature-name]/`
**先决条件**: plan.md（必需）, spec.md（用户故事必需）, research.md, data-model.md, contracts/

**测试**: 下方示例包含测试任务。测试是可选的——仅当功能规格明确要求或在对话中请求测试时才包含。

**组织方式**: 任务按用户故事分组，以便每个故事可以独立实现和测试。

## 格式说明: `[ID] [P?] [Story] 描述`

- **[P]**: 可并行执行（不同文件，无依赖关系）
- **[Story]**: 该任务所属的用户故事（例如 US1, US2, US3）
- 描述中须包含精确的文件路径

## 路径约定

- **单一项目**: `src/`, `tests/` 在仓库根目录
- **Web 应用**: `backend/src/`, `frontend/src/`
- **移动端**: `api/src/`, `ios/src/` 或 `android/src/`
- 下方路径假设为单一项目——请根据 plan.md 中的结构进行调整

<!--
  ============================================================================
  重要提示：下方任务仅为示例，用于演示目的。

  /speckit.tasks 命令必须基于以下内容替换为实际任务：
  - spec.md 中的用户故事（及其优先级 P1, P2, P3...）
  - plan.md 中的功能需求
  - data-model.md 中的实体
  - contracts/ 中的接口定义

  任务必须按用户故事组织，以便每个故事可以：
  - 独立实现
  - 独立测试
  - 作为 MVP 增量交付

  在生成的 tasks.md 文件中请勿保留这些示例任务。
  ============================================================================
-->

## Phase 1: Setup（共享基础设施）

**目的**: 项目初始化和基础结构搭建

- [ ] T001 按实现计划创建项目结构
- [ ] T002 使用 [框架] 依赖初始化 [语言] 项目
- [ ] T003 [P] 配置代码检查和格式化工具

---

## Phase 2: Foundational（阻塞性前置条件）

**目的**: 核心基础设施，必须在任何用户故事实现前完成

**⚠️ 关键**: 在完成此阶段之前，不得开始任何用户故事的工作

以下是基础任务的示例（请根据项目调整）：

- [ ] T004 设置数据库 Schema 和迁移框架
- [ ] T005 [P] 实现认证/授权框架
- [ ] T006 [P] 设置 API 路由和中间件结构
- [ ] T007 创建所有故事都依赖的基础模型/实体
- [ ] T008 配置错误处理和日志基础设施
- [ ] T009 设置环境配置管理

**检查点**: 基础已就绪——用户故事实现现在可以开始并行进行

---

## Phase 3: User Story 1 - [Title] (Priority: P1) 🎯 MVP

**目标**: [简述此故事交付的内容]

**独立测试**: [如何独立验证此故事]

### User Story 1 的测试（仅在明确要求时包含）⚠️

> **注意：先写这些测试，确保它们在实现前失败**

- [ ] T010 [P] [US1] 在 tests/contract/test_[name].py 中编写 [接口] 的契约测试
- [ ] T011 [P] [US1] 在 tests/integration/test_[name].py 中编写 [用户旅程] 的集成测试

### User Story 1 的实现

- [ ] T012 [P] [US1] 在 src/models/[entity1].py 中创建 [Entity1] 模型
- [ ] T013 [P] [US1] 在 src/models/[entity2].py 中创建 [Entity2] 模型
- [ ] T014 [US1] 在 src/services/[service].py 中实现 [Service]（依赖 T012, T013）
- [ ] T015 [US1] 在 src/[location]/[file].py 中实现 [接口/功能]
- [ ] T016 [US1] 添加验证和错误处理
- [ ] T017 [US1] 为用户故事 1 的操作添加日志

**检查点**: 此时，User Story 1 应该完全可用并可独立测试

---

## Phase 4: User Story 2 - [Title] (Priority: P2)

**目标**: [简述此故事交付的内容]

**独立测试**: [如何独立验证此故事]

### User Story 2 的测试（仅在明确要求时包含）⚠️

- [ ] T018 [P] [US2] 在 tests/contract/test_[name].py 中编写 [接口] 的契约测试
- [ ] T019 [P] [US2] 在 tests/integration/test_[name].py 中编写 [用户旅程] 的集成测试

### User Story 2 的实现

- [ ] T020 [P] [US2] 在 src/models/[entity].py 中创建 [Entity] 模型
- [ ] T021 [US2] 在 src/services/[service].py 中实现 [Service]
- [ ] T022 [US2] 在 src/[location]/[file].py 中实现 [接口/功能]
- [ ] T023 [US2] 如需要，与 User Story 1 的组件集成

**检查点**: 此时，User Stories 1 和 2 都应可独立工作

---

## Phase 5: User Story 3 - [Title] (Priority: P3)

**目标**: [简述此故事交付的内容]

**独立测试**: [如何独立验证此故事]

### User Story 3 的测试（仅在明确要求时包含）⚠️

- [ ] T024 [P] [US3] 在 tests/contract/test_[name].py 中编写 [接口] 的契约测试
- [ ] T025 [P] [US3] 在 tests/integration/test_[name].py 中编写 [用户旅程] 的集成测试

### User Story 3 的实现

- [ ] T026 [P] [US3] 在 src/models/[entity].py 中创建 [Entity] 模型
- [ ] T027 [US3] 在 src/services/[service].py 中实现 [Service]
- [ ] T028 [US3] 在 src/[location]/[file].py 中实现 [接口/功能]

**检查点**: 所有用户故事现在都应可独立工作

---

[根据需要添加更多用户故事阶段，遵循相同模式]

---

## Phase N: Polish & Cross-Cutting Concerns

**目的**: 影响多个用户故事的改进项

- [ ] TXXX [P] 更新 docs/ 中的文档
- [ ] TXXX 代码清理和重构
- [ ] TXXX 跨所有故事进行性能优化
- [ ] TXXX [P] 在 tests/unit/ 中补充单元测试（如要求）
- [ ] TXXX 安全加固
- [ ] TXXX 运行 quickstart.md 验证

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: 无依赖——可以立即开始
- **Foundational (Phase 2)**: 依赖 Setup 完成——阻塞所有用户故事
- **User Stories (Phase 3+)**: 都依赖 Foundational phase 完成
  - 用户故事之间可以并行进行（如果有足够人力）
  - 或者按优先级顺序依次执行（P1 → P2 → P3）
- **Polish (Final Phase)**: 依赖所有目标用户故事完成

### User Story Dependencies

- **User Story 1 (P1)**: Foundational (Phase 2) 完成后即可开始——不依赖其他故事
- **User Story 2 (P2)**: Foundational (Phase 2) 完成后即可开始——可与 US1 集成但应可独立测试
- **User Story 3 (P3)**: Foundational (Phase 2) 完成后即可开始——可与 US1/US2 集成但应可独立测试

### 每个用户故事内部

- 测试（如包含）必须在实现前写好并确保失败
- 先模型后服务
- 先服务后接口
- 先核心实现后集成
- 当前故事完成后再进入下一个优先级

### 并行机会

- Setup 中所有标记 [P] 的任务可并行执行
- Foundational 中所有标记 [P] 的任务可并行执行（在 Phase 2 内）
- Foundational 完成后，所有用户故事可以并行开始（如果团队容量允许）
- 每个用户故事的所有测试标记 [P] 的可并行执行
- 每个故事内标记 [P] 的模型创建任务可并行执行
- 不同的用户故事可由不同团队成员并行处理

---

## Parallel Example: User Story 1

```bash
# 一起启动 User Story 1 的所有测试（如果要求测试）：
Task: "在 tests/contract/test_[name].py 中编写 [接口] 的契约测试"
Task: "在 tests/integration/test_[name].py 中编写 [用户旅程] 的集成测试"

# 一起启动 User Story 1 的所有模型创建：
Task: "在 src/models/[entity1].py 中创建 [Entity1] 模型"
Task: "在 src/models/[entity2].py 中创建 [Entity2] 模型"
```

---

## Implementation Strategy

### MVP First（仅 User Story 1）

1. 完成 Phase 1: Setup
2. 完成 Phase 2: Foundational（关键——阻塞所有故事）
3. 完成 Phase 3: User Story 1
4. **停止并验证**: 独立测试 User Story 1
5. 如已就绪，进行部署/演示

### 增量交付

1. 完成 Setup + Foundational → 基础就绪
2. 添加 User Story 1 → 独立测试 → 部署/演示（MVP！）
3. 添加 User Story 2 → 独立测试 → 部署/演示
4. 添加 User Story 3 → 独立测试 → 部署/演示
5. 每个故事都在不破坏之前功能的前提下增加价值

### 多人团队策略

当有多名开发者时：

1. 团队一起完成 Setup + Foundational
2. 基础完成后：
   - 开发者 A: User Story 1
   - 开发者 B: User Story 2
   - 开发者 C: User Story 3
3. 各故事独立完成后再集成

---

## Notes

- [P] 任务 = 不同文件，无依赖
- [Story] 标签将任务映射到特定用户故事以便追溯
- 每个用户故事应可独立完成和测试
- 实现前验证测试是否失败
- 每个任务或逻辑组完成后提交
- 可随时在任何检查点停下来独立验证故事
- 避免：模糊的任务、同一文件冲突、破坏独立性的跨故事依赖
