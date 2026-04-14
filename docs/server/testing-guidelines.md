# 服务端测试规范

## 概述

测试是服务端代码质量的核心保障。本规范要求：**业务逻辑必须可被 mock 测试，路由行为必须可被内存测试，所有核心路径必须有自动化测试覆盖。** 测试的目的是验证"接口流程和规则"是否正确，而不是验证"基建是否连得上"。

## 测试金字塔

```
         ▲
        / \
       / E2E \      ← 全链路集成测试（极少量，启动真实服务）
      /─────────\
     / Integration \  ← 基建层集成测试（少量，需要真实 PG/Redis）
    /────────────────\
   /     Unit Tests    \ ← 业务层 + 路由层单元测试（大量，纯内存）
  /─────────────────────────\
```

执行策略：
- **每次 commit**：`cargo test --workspace --lib`（纯单元测试，秒级）
- **PR Merge 前**：`cargo test --workspace --test '*'`（含集成测试）
- **发布前**：全量 E2E 测试

## 三层测试策略

### 1. 路由层测试（og-api）

**测试方式**：内存中启动 Axum Router，不绑定真实端口，Mock 掉所有 Service。

**测试重点**：
- 路由映射是否正确
- 参数提取和校验是否生效
- 错误码映射是否正确（`AppError -> HTTP Status`）
- Middleware（如 trace、CORS）是否生效

**使用的技术**：
- `tower::ServiceExt::oneshot` 在内存中发送请求
- `MockGameRepository` + `GameServiceImpl` 构造被测路由

**示例原则**：
```rust
#[tokio::test]
async fn test_create_game_validation_error() {
    let mock = MockGameRepository::new();
    let response = app_with_mock_service(mock)
        .oneshot(Request::builder()
            .uri("/games")
            .method("POST")
            .header("Content-Type", "application/json")
            .body(Body::from(json!({"title": ""}).to_string()))
            .unwrap())
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::UNPROCESSABLE_ENTITY);
}
```

### 2. 业务层测试（og-service）

**测试方式**：纯内存单元测试，使用 `mockall` 自动生成 Repository Mock。

**测试重点**：
- 正常用例流程是否走完全程
- 分支规则是否完备（权限不足、状态不对、资源不存在、重复操作）
- 多个 Repository 调用顺序和次数是否正确
- 错误类型是否符合预期

**禁止**：
- 禁止在业务层测试中启动数据库
- 禁止在业务层测试中发真实 HTTP 请求

**使用的技术**：
- `mockall::automock` 自动生成 `MockGameRepository`
- `mockall::predicate::eq` 断言参数匹配

**示例原则**：
```rust
#[tokio::test]
async fn test_publish_game_already_published() {
    let game_id = Uuid::new_v4();
    let game = dummy_game(game_id, GameStatus::Published);

    let mut mock = MockGameRepository::new();
    mock.expect_find_by_id()
        .with(eq(game_id))
        .times(1)
        .returning(move |_| Ok(Some(game.clone())));

    let service = GameServiceImpl::<MockGameRepository>::new(mock);
    let result = service.publish_game(game_id).await;

    assert!(matches!(result, Err(AppError::Conflict(_))));
}
```

### 3. 基建层测试（og-infra）

**测试方式**：集成测试，需要真实的 PostgreSQL/Redis/MinIO。

**测试重点**：
- SQL 语句是否正确
- 数据映射（Row -> Model）是否正确
- 事务行为是否符合预期
- 复杂查询（如带 CTE 的排行榜）是否正确

**策略**：
- 简单 CRUD **不写**集成测试（SQL 直观且被上层测试间接覆盖）。
- 复杂 SQL、事务边界、并发行为**必须写**集成测试。
- 集成测试使用 `testcontainers` 或本地已启动的 PG 服务。

### 4. 领域核心测试（og-core）

**测试方式**：纯内存测试，无外部依赖。

**测试重点**：
- 错误类型的构造和显示是否正确
- 枚举映射是否正确
- 配置反序列化是否正确

## Mock 使用规范

### trait 的 automock 标记

需要在 `og-core` 中为测试暴露 mock 能力：

```rust
#[cfg_attr(any(test, feature = "test-utils"), mockall::automock)]
#[async_trait]
pub trait GameRepository: Send + Sync {
    // ...
}
```

`og-core` 的 `Cargo.toml` 中配置：

```toml
[dependencies]
mockall = { version = "0.14", optional = true }

[features]
test-utils = ["dep:mockall"]
```

`og-service` 和 `og-api` 的 dev-dependencies 中启用：

```toml
[dev-dependencies]
og-core = { path = "../og-core", features = ["test-utils"] }
mockall = "0.14"
```

### Mock 断言规范

- 使用 `.times(n)` 明确断言调用次数
- 使用 `.with(eq(...))` 断言关键参数匹配
- 对 `Uuid` 等复杂类型使用 `eq` 而不是裸比较

## 断言风格

统一使用 Rust 标准断言宏：

```rust
assert!(result.is_ok());
assert_eq!(game.status, GameStatus::Published);
assert!(matches!(result, Err(AppError::NotFound)));
assert!(matches!(result, Err(AppError::Conflict(_))));
```

**不推荐**：
- snapshot 测试（引入额外依赖，且对结构变化过于敏感）
- 字符串匹配错误信息（脆弱）
- 自定义复杂断言宏（团队学习成本高）

## 测试环境变量

由于 `og-infra` 使用了 `sqlx::query_as!` 编译时检查宏，测试前必须设置：

```bash
export DATABASE_URL="postgres://opengames:opengames@localhost/opengames_dev"
cargo test --workspace
```

对于 CI 环境，确保 PostgreSQL 服务已启动并运行了 migration。

## 新功能测试 checklist

每开发一个新功能，必须满足以下检查项才能提交：

- [ ] 业务层核心分支已覆盖单元测试（mock）
- [ ] 路由层正常路径和错误路径已覆盖内存测试
- [ ] 新引入的 `AppError` 变体已映射正确的 HTTP 状态码
- [ ] 如涉及复杂 SQL，已补充基建层集成测试
- [ ] 所有测试通过：`cargo test --workspace`
- [ ] 没有编译警告（`cargo check --workspace` 无 warning）

## 测试与生产的差异控制

- 测试数据和生产数据**严格隔离**（不同数据库或不同 schema）。
- 测试用例中**禁止使用** `thread::sleep` 等待异步完成，应使用 `tokio::time` 或 await 自然同步。
- 测试日志输出默认不影响断言，但可以通过 `RUST_LOG=warn` 减少测试噪音。
