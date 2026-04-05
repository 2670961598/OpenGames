---
description: "客户端后端功能规范模板 (Tauri + Rust)"
type: template
scope: client-backend
---

# Feature Specification: [FEATURE NAME]

**Feature Branch**: `[###-feature-name]`  
**Created**: [DATE]  
**Status**: Draft  
**Scope**: src-tauri/ + crates/shared/

---

## 技术上下文

- **语言**: Rust 1.75+
- **框架**: Tauri 2.0
- **HTTP**: Axum 0.7+
- **异步**: Tokio 1.35+

**原则**: 业务逻辑放 `crates/shared/`，Tauri 命令保持薄层

---

## 用户场景 *(mandatory)*

### User Story 1 - [标题] (Priority: P1)

[描述此功能在客户端侧的价值]

**Acceptance Scenarios**:

1. **Given** [状态], **When** [Tauri 命令被调用], **Then** [预期结果]

**与服务端差异**:
- 客户端特有: [说明]
- 复用逻辑: [说明]

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: [Tauri 命令行为]
- **FR-002**: [本地存储要求]
- **FR-003**: [离线场景要求]

### 共享代码要求

- **SH-001**: 业务逻辑放在 `crates/shared/src/services/`
- **SH-002**: 数据模型放在 `crates/shared/src/models/`
- **SH-003**: 客户端特定实现放在 `crates/shared-client/`

---

## 文件清单

```
src-tauri/
├── src/commands/[feature]_commands.rs    # Tauri 命令 (薄层)
├── src/lib.rs
└── Cargo.toml

crates/
├── shared/src/
│   ├── models/[feature].rs
│   ├── services/[feature].rs
│   └── traits/repositories.rs
│
└── shared-client/src/repositories/[feature].rs
```

---

## 契约定义

### Tauri 命令

```rust
#[tauri::command]
pub async fn [cmd_name](
    state: State<AppState>,
    param: String,
) -> Result<[ResponseType], String>
```

---

## 检查清单

- [ ] 业务逻辑放在 `crates/shared/`?
- [ ] 定义了 Repository Trait?
- [ ] 错误类型在 `shared/src/errors.rs`?
- [ ] 与服务端结构一致?

---

## 依赖

**依赖**: [功能编号]  
**被依赖**: [功能编号]
