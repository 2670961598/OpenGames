# Feature Specification: [FEATURE NAME]

**Feature Branch**: `[###-feature-name]`
**Created**: [DATE]
**Status**: Draft
**Input**: User description: "$ARGUMENTS"

## User Scenarios & Testing *(mandatory)*

<!--
  重要提示：用户故事应按照重要性排序为独立的用户旅程。
  每个用户故事/旅程必须是可独立测试的——这意味着如果只实现其中一个，
  仍然应该有一个可行的 MVP（最小可行产品）来交付价值。

  为每个故事分配优先级（P1、P2、P3 等），P1 为最高优先级。
  将每个故事视为可以独立开发、测试、部署和演示的功能切片。
-->

### User Story 1 - [Brief Title] (Priority: P1)

[用通俗易懂的语言描述这个用户旅程]

**Why this priority**: [解释其价值以及为何具有此优先级]

**Independent Test**: [描述如何独立测试此故事——例如，"可以通过 [具体动作] 完整测试，并交付 [具体价值]"]

**Acceptance Scenarios**:

1. **Given** [初始状态], **When** [动作], **Then** [预期结果]
2. **Given** [初始状态], **When** [动作], **Then** [预期结果]

---

### User Story 2 - [Brief Title] (Priority: P2)

[用通俗易懂的语言描述这个用户旅程]

**Why this priority**: [解释其价值以及为何具有此优先级]

**Independent Test**: [描述如何独立测试此故事]

**Acceptance Scenarios**:

1. **Given** [初始状态], **When** [动作], **Then** [预期结果]

---

### User Story 3 - [Brief Title] (Priority: P3)

[用通俗易懂的语言描述这个用户旅程]

**Why this priority**: [解释其价值以及为何具有此优先级]

**Independent Test**: [描述如何独立测试此故事]

**Acceptance Scenarios**:

1. **Given** [初始状态], **When** [动作], **Then** [预期结果]

---

[根据需要添加更多用户故事，每个都须分配优先级]

### Edge Cases

<!--
  需要行动：以下内容为代表性占位符，请根据实际情况填充。
-->

- 当 [边界条件] 发生时系统如何表现？
- 系统如何处理 [错误场景]？

## Requirements *(mandatory)*

<!--
  需要行动：以下内容为代表性占位符，请根据实际情况填充。
-->

### Functional Requirements

- **FR-001**: 系统必须 [具体能力，例如"允许用户创建账户"]
- **FR-002**: 系统必须 [具体能力，例如"验证邮箱地址"]
- **FR-003**: 用户必须能够 [关键交互，例如"重置密码"]
- **FR-004**: 系统必须 [数据需求，例如"持久化用户偏好设置"]
- **FR-005**: 系统必须 [行为需求，例如"记录所有安全事件"]

*标记不明确需求的示例：*

- **FR-006**: 系统必须认证用户，方式 [NEEDS CLARIFICATION: 未指定认证方法——邮箱/密码、SSO、OAuth？]
- **FR-007**: 系统必须保留用户数据 [NEEDS CLARIFICATION: 未指定保留期限]

### Key Entities *(如果功能涉及数据则包含)*

- **[Entity 1]**: [它代表什么，关键属性（不含实现细节）]
- **[Entity 2]**: [它代表什么，与其他实体的关系]

## Success Criteria *(mandatory)*

<!--
  需要行动：定义可衡量的成功标准。
  这些标准必须是技术无关且可量化的。
-->

### Measurable Outcomes

- **SC-001**: [可衡量指标，例如"用户能在 2 分钟内完成账户创建"]
- **SC-002**: [可衡量指标，例如"系统在不降级的情况下支持 1000 名并发用户"]
- **SC-003**: [用户满意度指标，例如"90% 的用户首次尝试即可成功完成主要任务"]
- **SC-004**: [业务指标，例如"将与 [X] 相关的支持工单减少 50%"]

## Assumptions

<!--
  需要行动：基于功能描述中未明确指定细节时选择的合理默认值，填充以下假设。
-->

- [关于目标用户的假设，例如"用户拥有稳定的互联网连接"]
- [关于范围边界的假设，例如"v1 暂不支持移动端"]
- [关于数据/环境的假设，例如"将复用现有认证系统"]
- [对现有系统/服务的依赖，例如"需要访问现有用户资料 API"]
