# 服务端错误处理规范

## 概述

服务端所有层共享同一套错误类型 `AppError`，定义于 `og-core/src/error.rs`。错误处理的核心原则是：**语义化、可追溯、HTTP 无关**。业务层只关心错误语义，路由层才负责将语义映射为 HTTP 状态码。

## 错误类型定义

```rust
#[derive(Debug, Clone, Error, PartialEq)]
pub enum AppError {
    #[error("resource not found")]
    NotFound,

    #[error("bad request: {0}")]
    BadRequest(Cow<'static, str>),

    #[error("validation failed: {0}")]
    Validation(Cow<'static, str>),

    #[error("authentication required")]
    Unauthorized,

    #[error("permission denied")]
    Forbidden,

    #[error("conflict: {0}")]
    Conflict(Cow<'static, str>),

    #[error("rate limited")]
    TooManyRequests,

    #[error("external service error: {0}")]
    External(Cow<'static, str>),

    #[error("internal error")]
    Internal(Cow<'static, str>),
}
```

## 每种错误的使用场景

| 错误类型 | 使用场景 | HTTP 映射 |
|---------|---------|----------|
| `NotFound` | 资源不存在（游戏、用户、存档） | 404 |
| `BadRequest` | 请求格式错误、参数缺失、无法解析 | 400 |
| `Validation` | 参数校验失败（标题为空、密码太短） | 422 |
| `Unauthorized` | 未登录、Token 无效、Token 过期 | 401 |
| `Forbidden` | 已登录但无权限操作该资源 | 403 |
| `Conflict` | 资源冲突（重复注册、状态不允许） | 409 |
| `TooManyRequests` | 请求过于频繁，触发限流 | 429 |
| `External` | 调用外部服务失败（S3、邮件服务） | 502 |
| `Internal` | 未知的内部错误（DB 连接断开、代码 panic） | 500 |

## 便捷构造函数

为每种带参数的错误提供了便捷构造方法，避免在业务代码中显式写 `Cow`：

```rust
AppError::bad_request("invalid uuid format")
AppError::validation("title cannot be empty")
AppError::conflict("user already exists")
AppError::external("s3 upload failed")
AppError::internal("database connection lost")
```

## 错误转换原则

### 业务层负责语义转换

Repository 层返回的底层错误（如 `sqlx::Error`），必须在业务层转换为语义化的 `AppError`。

```rust
// 正确：在 Service 中将 DB 错误转为领域错误
let game = self.repo.find_by_id(game_id).await
    .map_err(|e| AppError::internal(format!("db error: {}", e)))?;

// 错误：直接把 sqlx::Error 抛到路由层
let game = self.repo.find_by_id(game_id).await?;  // 不允许
```

### 路由层负责协议映射

`og-core` 在启用 `axum` feature 时，会自动为 `AppError` 实现 `IntoResponse`，路由层无需关心具体映射逻辑：

```rust
async fn get_game(...) -> Result<Json<Game>, AppError> {
    let game = service.get_game(id).await?;  // AppError 自动映射为 HTTP Response
    Ok(Json(game))
}
```

HTTP 响应体格式统一为：

```json
{
  "error": "conflict: only draft games can be published",
  "code": 409
}
```

## 各层错误处理职责

### 路由层（og-api）
- **捕获**：请求解析失败（如 JSON 格式错误、UUID 解析失败）。
- **处理**：基础参数校验失败返回 `AppError::Validation`。
- **禁止**：禁止在路由层捕获 Service 错误后吞掉或改变语义。

### 业务层（og-service）
- **捕获**：Repository 返回的底层错误、外部服务错误。
- **处理**：转换为 `AppError::NotFound`、`AppError::Conflict`、`AppError::Internal` 等。
- **禁止**：禁止将 `sqlx::Error`、`reqwest::Error` 等外部错误类型直接暴露给上层。

### 基建层（og-infra）
- **策略**：基建层不处理业务语义，将所有错误原样向上抛出（或包装为 `anyhow::Error`）。
- **建议**：PG Repository 的实现中，通常直接用 `map_err` 转成 `AppError::Internal` 后返回。

## 敏感信息保护

错误信息中**严禁**包含以下内容：
- 数据库连接字符串、密码、密钥。
- 完整的 SQL 语句（尤其是带参数的）。
- 堆栈跟踪信息（生产环境不应返回给客户端，可记录到日志）。
- 用户 Token、Session ID。

## 错误级别与日志对应关系

当错误发生时，应根据错误类型选择正确的日志级别：

| AppError | 日志级别 | 原因 |
|---------|---------|------|
| `NotFound` | `info!` | 通常是正常业务分支 |
| `BadRequest` / `Validation` | `info!` | 客户端问题，无需告警 |
| `Unauthorized` / `Forbidden` | `warn!` | 可能存在安全威胁 |
| `Conflict` | `info!` | 正常业务冲突 |
| `TooManyRequests` | `warn!` | 可能遭遇攻击或滥用 |
| `External` | `error!` | 依赖服务故障，需要关注 |
| `Internal` | `error!` | 系统缺陷，必须修复 |

## 测试中的错误断言

单元测试中应直接断言错误的具体变体，而不是字符串匹配：

```rust
// 正确：断言语义
assert!(matches!(result, Err(AppError::NotFound)));
assert!(matches!(result, Err(AppError::Conflict(_))));

// 错误：避免字符串匹配，脆弱且不可维护
assert_eq!(result.unwrap_err().to_string(), "resource not found");
```

路由层测试中应断言 HTTP 状态码：

```rust
let response = err.into_response();
assert_eq!(response.status(), StatusCode::NOT_FOUND);
```
