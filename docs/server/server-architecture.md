# 服务端分层架构规范

## 概述

服务端采用严格的三层架构，核心目标是**层与层之间完全解耦，每层可独立开发、独立测试、独立替换**。任何一层的实现变更（如换 Web 框架、换数据库、换缓存），都不应导致其他层的代码改动。

## 代码位置

所有服务端代码位于项目根目录下的 `src-server/` 中，采用 Cargo Workspace 组织：

```
src-server/
├── Cargo.toml              # Workspace 根配置
├── config/                 # 环境配置文件
│   ├── development.toml
│   └── production.toml
├── migrations/             # SQLx 数据库迁移脚本
└── crates/
    ├── og-core/            # 领域核心：模型、错误、trait 定义
    ├── og-service/         # 业务层：用例编排、业务规则
    ├── og-infra/           # 基建层：PG、Redis、S3 的具体实现
    └── og-api/             # 路由层：Axum HTTP 接口
```

## 架构图

```
        ┌─────────────────┐
        │   外部调用者      │   ← 前端 / 第三方 / 客户端
        │  (HTTP Client)  │
        └────────┬────────┘
                 │ HTTP 协议
        ┌────────▼────────┐
        │    路由层        │   ← og-api
        │   (Axum Route)  │   职责：解析请求、参数校验、调用 Service
        └────────┬────────┘
                 │ 调用 GameService trait
        ┌────────▼────────┐
        │    业务层        │   ← og-service
        │   (Use Case)    │   职责：编排用例、业务规则、事务控制
        └────────┬────────┘
                 │ 调用 GameRepository trait
        ┌────────▼────────┐
        │    接口层        │   ← og-core::ports
        │  (Repository)   │   职责：定义数据访问契约
        └────────┬────────┘
                 │
    ┌────────────┼────────────┐
    │            │            │
┌───▼───┐   ┌───▼───┐   ┌───▼───┐
│  PG   │   │ Redis │   │ MinIO │   ← og-infra 实现
│ impl  │   │ impl  │   │ impl  │
└───────┘   └───────┘   └───────┘
```

## 各层详细职责

### 第一层：路由层（og-api）

**唯一职责是处理 HTTP 协议相关事宜。**

具体包括：
1. **请求解析**：从 HTTP 请求中提取 path 参数、query 参数、body、header。
2. **参数校验**：使用 `validator` 对请求体进行基础格式校验（如非空、长度、邮箱格式）。
3. **调用编排**：将校验后的参数转换为 `og-service` 所需的请求结构体，调用 Service 方法。
4. **响应封装**：将 Service 的返回值打包为 JSON Response，或将 `AppError` 映射为对应的 HTTP 状态码。

**严格禁止：**
- 禁止在 Handler 中写任何业务规则（如"只有作者才能删除"）。
- 禁止在路由层直接调用 `sqlx`、`redis`、`aws-sdk` 等基建客户端。
- 禁止路由层代码超过 20 行而不重构到 Service。

### 第二层：业务层（og-service）

**架构的核心，所有业务价值的承载层。**

具体包括：
1. **用例编排**：一个 Service 的 public 方法对应一个完整的用户故事，例如 `publish_game` 包含"查找游戏 → 校验状态 → 更新状态 → 返回结果"的完整流程。
2. **业务规则执行**：权限判断、状态机流转、数据一致性校验。
3. **事务边界声明**：当操作涉及多个 Repository 调用时，Service 负责控制事务范围。
4. **领域事件触发**：关键操作完成后触发事件（当前项目暂用日志记录里程碑，后续可扩展为消息队列）。
5. **异常语义转换**：将底层 `sqlx::Error` 转换为领域语义化的 `AppError`。

**严格禁止：**
- 禁止依赖 `axum`、`actix-web` 等 HTTP 框架。
- 禁止直接依赖 `PgPool`、`redis::Client` 等具体实现。
- 禁止在 Service 中写 SQL。

### 第三层：基建层（og-infra）

**为业务层的 trait 提供具体实现。**

具体包括：
1. **trait 实现**：如 `PgGameRepository` 实现 `GameRepository`，`RedisCacheClient` 实现 `CacheClient`。
2. **连接管理**：维护数据库连接池、Redis 连接、S3 Client 生命周期。
3. **数据映射**：将 `sqlx::Row` 映射为 `og-core` 中的领域模型。
4. **第三方协议适配**：处理外部服务 API 的格式转换和异常封装。

**严格禁止：**
- 禁止包含任何业务规则（如状态校验、权限判断）。
- 禁止在基建层捕获业务异常后吞掉或改变语义。
- 每个方法应该是原子的 CRUD 操作。

### 第四层：领域核心（og-core）

**最纯净的 crate，没有任何外部运行时依赖。**

包含：
1. **领域模型**：`User`、`Game`、`GameVersion`、`GameStatus` 等纯数据结构。
2. **错误类型**：`AppError` 枚举，所有层共享的统一错误语言。
3. **接口定义（Ports）**：`GameRepository`、`StorageClient` 等 trait。
4. **配置结构体**：`AppConfig`、`LoggingConfig` 等反序列化结构。

**严格禁止：**
- 禁止依赖 `tokio`、`axum`、`sqlx` 等运行时或框架库（`sqlx::Type` / `sqlx::FromRow` 除外）。
- 禁止包含任何副作用代码（IO、随机数、时间获取如需精确控制，应抽象为 trait）。

## 模块依赖规则

依赖方向必须始终**向下指向接口**，绝不能反向或穿透：

```
og-api     ──► og-service
og-api     ──► og-core
og-service ──► og-core
og-infra   ──► og-core
```

**严禁出现以下依赖：**
- `og-service` 依赖 `og-infra`（业务层不能知道 PG 实现）
- `og-service` 依赖 `axum`（业务层与 HTTP 无关）
- `og-api` 的业务代码依赖 `og-infra`（Handler 只通过 Service 交互）
- `og-core` 依赖 `tokio`、`sqlx` 运行时（`sqlx::Type` / `sqlx::FromRow` 除外）

> **例外说明**：`og-api` 的 `main.rs`（或专门的 `bootstrap` 模块）作为整个应用的组装入口，允许依赖 `og-infra` 进行依赖注入（如创建 `PgPool`、实例化 `PgGameRepository`、注入 `GameService`）。但所有 HTTP Handler 必须只依赖 `og-service` 的 trait。

## 依赖注入方式

所有 Service 和 Repository 都通过**构造函数注入**依赖，禁止全局单例。

```rust
// 正确
pub struct GameServiceImpl<R: GameRepository> {
    repo: R,
}

impl<R: GameRepository> GameServiceImpl<R> {
    pub fn new(repo: R) -> Self {
        Self { repo }
    }
}

// 在 main.rs 中组装
let game_repo = PgGameRepository::new(pool);
let game_service = GameServiceImpl::new(game_repo);
let app = routes::game::routes(game_service);
```

## 数据流转规范

1. **请求流入**：HTTP Request → Handler 提取参数 → DTO（如 `CreateGameBody`）→ Service `CreateGameRequest` → Repository 操作。
2. **响应流出**：Repository 返回领域模型 → Service 做规则校验/转换 → Handler 包装为 JSON Response。
3. **错误传播**：底层错误 → `AppError`（语义化）→ `IntoResponse`（HTTP 状态码 + JSON 错误体）。

## 可替换性保证

由于依赖规则的约束，架构天然支持以下替换而不影响业务逻辑：

| 替换场景 | 需要改动的 crate | 不需要改动的 crate |
|---------|-----------------|-------------------|
| Axum → Actix-web | 仅 `og-api` | `og-service`、`og-core` |
| PostgreSQL → MySQL | 仅 `og-infra` | `og-api`、`og-service`、`og-core` |
| 本地缓存 → Redis | 仅 `og-infra` | 其余全部不变 |
| 新增一个游戏类型 | `og-core`（模型）+ `og-service`（规则）+ `og-api`（路由） | `og-infra` 可能不需要改动 |

## 相关文档

- `logging-guidelines.md` — 日志规范
- `error-handling.md` — 错误处理规范
- `testing-guidelines.md` — 测试规范
- `backend-development-notes.md` — 开发注意事项
