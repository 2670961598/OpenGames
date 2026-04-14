# 后端开发注意事项

## 概述

本文档汇总了在 OpenGames 服务端开发新功能时需要注意的关键事项，帮助开发者避免常见错误，保持代码风格一致。

## 一、分层边界

- **路由层只处理 HTTP**。任何涉及"能不能做"的判断都必须下放到业务层。
- **业务层不感知框架**。Service 的方法签名中不能出现 `axum::extract::State`、`Json`、`Request` 等类型。
- **基建层只做原子操作**。Repository 的一个方法应该只对应一条 SQL 或一个 Redis 命令，不要把多个业务步骤塞进去。
- **核心层保持纯净**。`og-core` 中禁止引入 `tokio`、`axum` 等运行时依赖（`sqlx::Type` / `sqlx::FromRow` 除外）。

## 二、依赖注入

- 所有 Service 和 Repository 都通过构造函数传入依赖。
- 禁止全局静态变量（`lazy_static!`、`once_cell` 单例外）。
- `main.rs` 是唯一允许"组装"各个层的地方。

## 三、错误处理

- 底层错误必须在业务层转换为 `AppError` 后才能继续向上传播。
- 禁止把 `sqlx::Error`、`std::io::Error` 等外部错误类型直接返回给路由层。
- 错误信息中禁止包含密码、Token、完整 SQL、数据库连接字符串。
- 新增 `AppError` 变体时，必须同步更新 `IntoResponse` 映射和路由层测试。

## 四、日志规范

- 禁止在代码中硬编码日志级别或格式。
- 禁止在业务层使用 `println!` / `eprintln!`。
- 循环内部禁止打印 `info!` 及以上级别日志。
- 每个 crate 使用固定的 `target`：`og_api`、`og_service`、`og_infra`。
- 关键操作使用 `span` 携带上下文 ID（如 `game_id`、`user_id`）。

## 五、数据库与 SQL

- 表结构变更必须通过 `sqlx migrate` 管理，禁止手动改库。
- SQL 查询使用 `sqlx::query_as!` 宏以获得编译时类型检查。
- 查询自定义枚举时，必须在 SELECT 中显式标注类型转换：`status as "status: _"`。
- 运行 `cargo build` 或 `cargo test` 前，确保环境变量 `DATABASE_URL` 已设置且数据库已运行 migration。

## 六、模型与类型

- 领域模型定义在 `og-core/src/models.rs`，使用 `#[derive(Debug, Clone)]`。
- 路由层的请求体 DTO 定义在 `og-api/src/routes/` 下，与领域模型分离。
- `Uuid` 类型的 ID 字段禁止与 `String` 混用，保持类型安全。
- 时间戳统一使用 `chrono::DateTime<chrono::Utc>`。

## 七、测试要求

- 业务层代码必须有 mock 单元测试覆盖。
- 路由层代码必须有内存 HTTP 测试覆盖。
- 测试断言优先使用 `matches!` 匹配 `AppError` 变体，避免字符串比较。
- 集成测试仅在涉及复杂 SQL 或事务时编写，日常 CRUD 可依赖上层测试间接覆盖。
- 提交前必须执行 `cargo test --workspace` 并确保全部通过。

## 八、提交与文档

- 实现新功能后，检查是否需要更新 `docs/server/` 下的相关文档。
- 如果修改了 `migrations/`，必须同步告知团队更新本地数据库。
- `history/` 目录按分支记录提交，遵循项目根目录 README 中的提交历史规范。

## 九、安全与性能

- release 构建自动裁剪 `debug!` / `trace!` 日志，无需担心日志影响性能。
- 对外的 API 参数必须做长度限制和格式校验。
- 任何涉及文件上传的功能，必须校验 MIME 类型和文件大小，禁止直接信任客户端输入。
- 敏感配置（数据库密码、API Key）禁止写入代码仓库，统一走环境变量或配置文件。

## 十、常见反模式

- ❌ Handler 中写 SQL 或调用 `PgPool`
- ❌ Service 中直接返回 `sqlx::Error`
- ❌ Repository 中做业务规则判断
- ❌ 全局静态 `PgPool` 或 `RedisClient`
- ❌ 错误信息中包含敏感数据
- ❌ 修改表结构但不写 migration
- ❌ 提交代码前不跑测试
