# 服务端日志规范

## 概述

服务端日志统一使用 `tracing` + `tracing-subscriber`。日志是排查线上问题的首要线索，也是观察系统运行状态的重要窗口。本规范的目标是：**分层清晰、配置灵活、生产安全**。

## 技术选型

- **`tracing`**：Rust 异步生态的事实标准日志框架，支持 span、field、结构化日志。
- **`tracing-subscriber`**：日志收集和输出适配器，支持多种格式和环境过滤。

选择 `tracing` 的原因：
- 与 `axum`、`tokio`、`sqlx` 生态无缝集成。
- 支持按 `target` 过滤、按级别分流、自定义字段前缀。
- 编译期 feature 可彻底移除调试日志，确保 release 零开销。

## 配置来源与优先级

日志配置**不硬编码在业务代码中**，统一从配置文件读取，并允许环境变量覆盖。

### 优先级（从高到低）

1. 环境变量 `RUST_LOG`
2. `config/{环境}.toml` 中的 `[logging]` 配置段
3. 代码中的保守默认值（仅兜底）

### 配置文件示例

```toml
# config/development.toml
[logging]
level = "debug"
format = "pretty"          # 可选："pretty" | "json" | "compact"

[[logging.filter_modules]]
target = "og_api"
level = "info"

[[logging.filter_modules]]
target = "og_service"
level = "debug"

[[logging.filter_modules]]
target = "og_infra"
level = "info"
```

```toml
# config/production.toml
[logging]
level = "info"
format = "json"

[[logging.filter_modules]]
target = "og_api"
level = "info"

[[logging.filter_modules]]
target = "og_service"
level = "info"

[[logging.filter_modules]]
target = "og_infra"
level = "warn"
```

### 配置加载代码

```rust
let env = std::env::var("APP_ENV").unwrap_or_else(|_| "development".into());
let config: AppConfig = config::Config::builder()
    .add_source(config::File::with_name(&format!("config/{}", env)))
    .add_source(config::Environment::with_prefix("APP").separator("__"))
    .build()?
    .try_deserialize()?;

logging::init_logging(&config.logging);
```

## 日志分层约定

按 crate 划分 `target`，每个层级使用固定的 target 名称，不得随意更改。

| 层级 | Target 名称 | dev 默认级别 | prod 默认级别 | 用途说明 |
|------|------------|-------------|--------------|---------|
| 路由层 | `og_api` | `info` | `info` | 请求进入、响应状态、路由处理里程碑 |
| 业务层 | `og_service` | `debug` | `info` | 用例开始/结束、关键分支决策、业务规则触发 |
| 基建层 | `og_infra` | `warn` | `warn` | 慢查询、连接异常、存储操作失败；正常 CRUD 不打印 |

通过 `RUST_LOG` 或配置文件可以独立控制每层级别，例如只把业务层开到 debug：

```bash
RUST_LOG="og_api=info,og_service=debug,og_infra=warn" cargo run
```

## 日志级别使用规范

| 级别 | 使用场景 | 生产环境 |
|-----|---------|---------|
| `error!` | 影响用例完成的异常，需要人工介入排查 | 保留 |
| `warn!` | 非致命异常或可疑行为，如重复请求、缓存降级、权限试探 | 保留 |
| `info!` | 用例里程碑，如"游戏创建成功"、"版本发布完成" | 保留 |
| `debug!` | 分支细节、中间变量、调用参数 | **release 自动移除** |
| `trace!` | 极其详细的调用链，如 SQL 完整参数、Redis 原始返回值 | **release 自动移除** |

## Release 构建的日志裁剪

`Cargo.toml` 中为 `tracing` 启用了 `release_max_level_info` feature：

```toml
[workspace.dependencies]
tracing = { version = "0.1", features = ["release_max_level_info"] }
```

效果：
- `debug!` 和 `trace!` 在 `--release` 编译时会被优化为空操作，**零运行时开销**。
- 即使配置文件误写 `level = "debug"`，release 二进制也不会输出 debug 日志。
- 不会出现 `tracing-subscriber` 的 "static max level is info" warning。

此外，日志初始化代码中在 release 模式下会自动将根级别限制为 `info`，避免配置与编译特性不一致导致的 warning。

## 模块前缀与 Span

关键模块或请求链路使用 `span` 携带上下文字段，便于追踪同一事务的完整日志。

### 业务层 Span 示例

```rust
use tracing::{info, info_span};

let span = info_span!(
    target: "og_service",
    "game_service",
    game_id = %game_id,
    user_id = %user_id
);
let _enter = span.enter();

info!("开始发布游戏");
```

输出效果（pretty 格式）：
```
 INFO og_service: game_service game_id=xxx user_id=xxx 开始发布游戏
```

### 路由层请求 Span

Axum 可通过 `TraceLayer` 为每个 HTTP 请求自动生成 span：

```rust
.layer(
    tracing::TraceLayer::new_for_http()
        .make_span_with(|req| {
            tracing::info_span!(
                target: "og_api",
                "http_request",
                method = %req.method(),
                uri = %req.uri(),
                request_id = %Uuid::new_v4()
            )
        })
)
```

这样从路由层到业务层再到基建层，同一请求的所有日志都能通过 `request_id` 关联起来。

## 报错与正常日志分流

> **注意**：当前实现暂不支持按级别严格分流到 stdout/stderr。`tracing-subscriber` 默认将所有日志输出到 stdout。若后续需要严格分流（如 `error` → stderr、`info` → stdout），应在 `og-api/src/logging/mod.rs` 中增加自定义 Layer / Writer 实现。
>
> 生产环境如对接日志收集系统（如 Loki、ELK），建议直接使用 `json` 格式统一输出到 stdout，由外部收集器处理。

## 禁止事项

- **禁止在代码中硬编码日志级别或输出格式。** 所有与格式、级别相关的设置必须从配置文件读取。
- **禁止在业务层直接使用 `println!` 或 `eprintln!`。** 统一使用 `tracing` 宏。
- **禁止在循环内高频打印 `info!` 及以上级别日志。** 高频日志应使用 `debug!` 或 `trace!`。
- **禁止在日志中输出用户密码、Token、Session ID、数据库连接字符串等敏感信息。**
- **禁止在生产环境开启 `pretty` 格式。** 生产必须使用 `json` 或 `compact`，便于机器解析。
- **禁止在配置文件中声明当前实现不支持的字段**，避免配置与行为不一致。

## 日志与测试

测试运行时日志会正常输出，但不会影响测试断言。若测试日志过于嘈杂，可通过环境变量控制：

```bash
RUST_LOG=warn cargo test --workspace
```

日志初始化测试已包含在 `og-api/src/logging/mod.rs` 中，验证 `pretty` / `json` / `compact` 三种格式的初始化不会 panic。

## 相关文档

- `server-architecture.md` — 三层架构与日志分层的关系
- `error-handling.md` — 错误级别与日志级别的对应关系
- `testing-guidelines.md` — 测试中的日志控制策略
