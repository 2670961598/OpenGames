# 2026-04-14 11:09 - Add server API routes and config

## 提交信息
```
Commit: <待生成>
Author: Ye QingXin
Date: 2026-04-14 11:09:00 +0800
Branch: 002-server-spec
Scope: server (code)
```

## 变更概述
添加服务端路由层（`og-api`）、配置文件和日志初始化，包含代码审查后的质量改进。

主要改进点：
1. 路由层使用 `validator` 进行参数校验
2. 挂载 `TraceLayer` 生成 HTTP 请求 span
3. `publish_game` 增加作者权限校验和并发竞态条件防护
4. Service 层统一显式捕获 Repository 错误（保留语义）
5. 分页参数增加合法性校验和 `checked_mul` 溢出防护
6. 数据库连接初始化增加 `auto_create` 条件控制
7. 配置文件中移除硬编码数据库凭据
8. `database_exists` 错误不再被静默吞掉
9. Migration 增加 `pgcrypto` 扩展兼容性
10. 移除未使用的日志配置字段 `output` / `error_to_stderr`
11. `author_id` 临时方案添加 `TODO(auth)` 注释
12. **release 日志级别修复**：不再强制覆盖为 `info`，仅当配置为 `debug`/`trace` 时才降级为 `info`，`warn`/`error` 等生产需要的低级别仍然保留

## 文件变更

### 新增文件

#### 服务端文档
| 文件 | 用途 |
|------|------|
| `docs/server/server-architecture.md` | 三层架构规范（og-api / og-service / og-infra / og-core） |
| `docs/server/error-handling.md` | 统一 `AppError` 语义化错误处理规范 |
| `docs/server/logging-guidelines.md` | `tracing` 分层日志规范与 release 裁剪策略 |
| `docs/server/testing-guidelines.md` | 测试金字塔与 mock 单元测试规范 |
| `docs/server/backend-development-notes.md` | 后端开发注意事项与常见反模式 |

#### 服务端代码
| 文件 | 用途 |
|------|------|
| `src-server/Cargo.toml` | Cargo Workspace 根配置 |
| `src-server/config/development.toml` | 开发环境配置 |
| `src-server/config/production.toml` | 生产环境配置 |
| `src-server/migrations/20250413180000_init.sql` | 初始数据库迁移（用户、游戏、版本、标签、存档） |
| `src-server/crates/og-core/src/error.rs` | 领域核心：`AppError` 枚举与 `IntoResponse` |
| `src-server/crates/og-core/src/models.rs` | 领域模型：`User`、`Game`、`GameStatus` 等 |
| `src-server/crates/og-core/src/config.rs` | 配置结构体：`AppConfig`、`DatabaseConfig` 等 |
| `src-server/crates/og-core/src/ports/game_repository.rs` | 接口定义：`GameRepository` trait |
| `src-server/crates/og-service/src/game_service.rs` | 业务层：用例编排与规则校验 |
| `src-server/crates/og-infra/src/repository/pg_game_repository.rs` | 基建层：PostgreSQL 实现 |
| `src-server/crates/og-infra/src/lib.rs` | 数据库连接池初始化 |
| `src-server/crates/og-api/src/main.rs` | 应用启动与依赖注入组装 |
| `src-server/crates/og-api/src/routes/game.rs` | HTTP 路由：游戏 CRUD 与发布接口 |
| `src-server/crates/og-api/src/logging/mod.rs` | `tracing-subscriber` 初始化 |
| `src-server/crates/og-api/src/tests.rs` | 路由层内存测试（mock） |

### 修改文件
| 文件 | 变更内容 |
|------|----------|
| `src-server/Cargo.toml` | workspace 依赖集中管理 `sqlx` feature（新增 `derive`、`macros`） |
| `src-server/crates/og-core/Cargo.toml` | 改用 workspace `sqlx` 依赖 |
| `src-server/crates/og-api/Cargo.toml` | 新增 `validator` 依赖 |
| `src-server/crates/og-core/src/config.rs` | 新增 `auto_create` 数据库配置项 |
| `src-server/config/development.toml` | 设置 `auto_create = true` |
| `src-server/crates/og-infra/src/lib.rs` | 条件化自动建库（仅 `auto_create=true`） |
| `src-server/crates/og-service/src/game_service.rs` | 增加分页校验、权限校验、`publish_game`  author_id 参数、Repository 错误语义化包装 |
| `src-server/crates/og-api/src/routes/game.rs` | 引入 `validator` 校验 `CreateGameBody`；`publish_game` 接收 `author_id` query 参数 |
| `src-server/crates/og-api/src/main.rs` | 移除 `/log-demo` 调试用路由，挂载 `TraceLayer` |
| `src-server/crates/og-api/src/tests.rs` | 补充 `publish_game` 404/409/403 路由层测试 |
| `src-server/crates/og-service/src/game_service.rs` | 补充 `test_publish_game_forbidden`、`test_list_published_games_invalid_page*` 等测试 |

### 删除文件
| 文件 | 原因 |
|------|------|
| `docs/server/服务器开发规范.md` | 已被 5 份更详细的规范文档替代 |

## 技术要点

### 1. 分层架构
严格遵循 Clean Architecture 依赖规则：
```
og-api → og-service → og-core
og-infra → og-core
```
通过构造函数注入依赖，`main.rs` 作为唯一组装入口。

### 2. 错误处理
- `og-core` 定义统一 `AppError`，可选 `axum` feature 实现 `IntoResponse`
- 业务层将底层 `sqlx::Error` 转换为语义化 `AppError`
- 路由层自动映射为对应 HTTP 状态码

### 3. 日志规范
- 使用 `tracing` + `release_max_level_info`
- 按 crate 划分 target：`og_api`、`og_service`、`og_infra`
- release 构建自动裁剪 `debug!` / `trace!`，零运行时开销

### 4. 测试策略
- 业务层：纯内存 mock 测试（`mockall::automock`）
- 路由层：内存中 `tower::ServiceExt::oneshot` 测试
- 集成测试仅在涉及复杂 SQL/事务时编写

## 遇到的问题及解决方案

### 问题 1：`sqlx::query_as!` 编译时需要 `DATABASE_URL`
**解决方案**：在 CI/本地测试前设置环境变量，或使用 `cargo sqlx prepare` 生成离线查询缓存。

### 问题 2：文档要求与代码实现存在不一致
**解决方案**：进行代码审查后，补齐了 9 项改进（`validator`、`TraceLayer`、权限校验、错误包装、分页校验、workspace 依赖统一、条件化自动建库、调试用路由移除、测试补充）。

### 问题 3：测试中的闭包变量所有权问题
**解决方案**：在将变量移入 `mockall` 闭包前，先提取所需的字段（如 `author_id`）到独立变量中，避免 `E0382`。

## 后续修复（基于 Codex Review & CI 检查）

### 1. 修复 scope-check CI 误报
**文件**：`.github/workflows/scope-check.yml`
- 将 base SHA 计算改为 `git rev-parse origin/${{ github.base_ref }}`，避免 PR rebase 后使用过时的 `github.event.pull_request.base.sha`
- 将 `.gitkeep` 文件明确标记为 `meta` 豁免

### 2. 修复 `publish_game` 并发竞态条件
**文件**：`og-core/src/ports/game_repository.rs`、`og-infra/src/repository/pg_game_repository.rs`、`og-service/src/game_service.rs`
- `update_status` 的 SQL 增加 `AND status = 'draft'`，并使用 `fetch_optional` 返回 `Option<Game>`
- Service 层在 `update_status` 返回 `None` 时转换为 `AppError::Conflict("game status changed concurrently")`
- 新增 `test_publish_game_race_conflict` 覆盖并发场景

### 3. 修复 Service 层错误误包成 `Internal`
**文件**：`og-service/src/game_service.rs`
- `create_game`、`get_game`、`list_published_games`、`publish_game` 中的 `find_by_id` 和 `update_status` 不再无脑包 `Internal`
- Repository 已返回语义化 `AppError`，Service 直接透传，避免把 `NotFound`/`Conflict` 等变成 500

### 4. 分页 offset 使用 `checked_mul`
**文件**：`og-service/src/game_service.rs`
- `offset` 计算改用 `checked_mul`，溢出时返回 `BadRequest`，避免未来放宽 `page_size` 限制后发生整数溢出

### 5. 移除配置文件中的数据库凭据
**文件**：`config/development.toml`、`config/production.toml`
- URL 中的 `user:password` 已移除，改为 `postgres://localhost/...`
- 运行时凭据通过 `APP_DATABASE__URL` 环境变量注入（`config` crate 已支持 `APP` 前缀 + `__` 分隔符）

### 6. 修复 `database_exists` 错误吞掉
**文件**：`og-infra/src/lib.rs`
- `.unwrap_or(false)` 改为 `?`，确保网络/权限问题能被正确传播而不是误判为"数据库不存在"

### 7. Migration 增加 `pgcrypto` 扩展
**文件**：`migrations/20250413180000_init.sql`
- 文件顶部增加 `CREATE EXTENSION IF NOT EXISTS pgcrypto;`，兼容未默认启用 `pgcrypto` 的 PostgreSQL 实例

### 8. 清理未使用的日志配置字段
**文件**：`og-core/src/config.rs`、`og-api/src/logging/mod.rs`、`config/*.toml`、`docs/server/logging-guidelines.md`
- 移除 `output` 和 `error_to_stderr`（当前实现未使用），避免配置与行为不一致
- 文档中明确说明"当前实现暂不支持按级别严格分流"

### 9. `author_id` 临时方案加 TODO 注释
**文件**：`og-api/src/routes/game.rs`
- `CreateGameBody.author_id` 和 `PublishGameQuery.author_id` 均加了 `TODO(auth)` 注释，提示后续应由 auth middleware 提供

### 10. `Router<()>` merge 类型兼容性注释
**文件**：`og-api/src/main.rs`
- 在 `base_routes().merge(routes::game::routes(...))` 处增加注释，说明 Axum 允许 `Router<()>` 合入 `Router<Arc<S>>` 的前提和安全性

## 验证结果
```bash
cd src-server && cargo check --workspace        # ✅ 通过
export DATABASE_URL=...
cargo test --workspace --lib --bin og-api       # ✅ 36 个测试全部通过
```

## 关联任务
- [SERVER-001] 建立服务端架构规范
- [SERVER-002] 实现游戏基础 CRUD 与发布接口
- [SERVER-003] 代码审查与质量改进
- [SERVER-004] Codex Review 修复与 CI 稳定化
