---
description: "服务端功能规范模板 (Rust + Axum)"
type: template
scope: server
---

# Feature Specification: [FEATURE NAME]

**Feature Branch**: `[###-feature-name]`  
**Created**: [DATE]  
**Status**: Draft  
**Scope**: src-server/ + crates/shared/

---

## 技术上下文

- **语言**: Rust 1.75+
- **框架**: Axum 0.7+
- **异步**: Tokio 1.35+
- **数据库**: PostgreSQL 15+ (sqlx)
- **缓存**: Redis 7+
- **消息队列**: NATS 2.x

**原则**: 与 src-tauri 共享 `crates/shared/`，HTTP Handler 保持薄层

---

## 用户场景 *(mandatory)*

### User Story 1 - [标题] (Priority: P1)

[描述此功能在服务端侧的价值]

**Acceptance Scenarios**:

1. **Given** [状态], **When** [API 被调用], **Then** [预期结果]

**与客户端后端差异**:
- 服务端特有: [说明]
- 复用逻辑: [说明]

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: [HTTP API 行为]
- **FR-002**: [数据库事务要求]
- **FR-003**: [缓存策略]

### 共享代码要求

- **SH-001**: 业务逻辑放在 `crates/shared/src/services/`
- **SH-002**: 数据模型放在 `crates/shared/src/models/`
- **SH-003**: 服务端特定实现放在 `crates/shared-server/`

---

## 文件清单

```
src-server/
├── src/handlers/[feature].rs           # HTTP Handler (薄层)
├── src/middleware/
├── migrations/[timestamp]_[feature].sql
└── Cargo.toml

crates/
├── shared/src/
│   ├── models/[feature].rs
│   ├── services/[feature].rs
│   └── traits/repositories.rs
│
└── shared-server/src/
    ├── repositories/[feature].rs
    └── cache/[feature].rs
```

---

## API 契约

```yaml
# OpenAPI 片段
/api/v1/[feature]:
  post:
    requestBody:
      content:
        application/json:
          schema: { }
    responses:
      200: { description: 成功 }
```

---

## 数据库设计

### 迁移脚本

```sql
-- migrations/[timestamp]_[feature].sql
CREATE TABLE [feature_table] (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 检查清单

- [ ] 业务逻辑放在 `crates/shared/`?
- [ ] Repository Trait 与客户端一致?
- [ ] 提供了 OpenAPI 文档?
- [ ] 数据库迁移脚本?

---

## 依赖

**依赖**: [功能编号]  
**被依赖**: [功能编号]
