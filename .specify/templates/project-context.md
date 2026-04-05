---
description: "Web游戏平台技术上下文 - 用于模板生成时引用"
type: reference
---

# 项目技术上下文

> 此文件供所有模板引用，确保技术栈信息一致性
> 
> **项目目录结构**: 根目录下 `src/` (前端), `src-tauri/` (客户端后端), `src-server/` (服务端)

---

## 客户端前端 (src/)

```yaml
framework: Vue 3.4+
language: TypeScript 5.3+
build_tool: Vite 5.0+
state_management: Pinia 2.1+
ui_library: shadcn-vue + Tailwind CSS
router: Vue Router 4+
testing:
  unit: Vitest
  e2e: Playwright
ipc: "@tauri-apps/api" (invoke/emit)
```

### 目录约定
```
src/
├── components/        # Vue 组件
│   ├── ui/           # shadcn 基础组件
│   ├── layout/       # 布局组件
│   └── game/         # 游戏相关
├── composables/      # 组合式函数 (useXxx.ts)
├── views/            # 页面视图
├── stores/           # Pinia Store
├── router/           # 路由配置
├── types/            # TypeScript 类型
├── services/         # 服务层
│   └── tauri.ts      # Tauri IPC 封装
└── utils/            # 工具函数
```

---

## 客户端后端 (src-tauri/) 与服务端共享架构

### 核心设计原则
> **客户端后端和服务端使用同一套架构，最大化代码复用**
> 局域网场景下，客户端可临时承担服务端角色

```yaml
language: Rust 1.75+
async_runtime: Tokio 1.35+
http_framework: Axum 0.7+
serialization: serde + serde_json
grpc: tonic 0.11+
database:
  orm: sqlx 0.7+
  migration: sqlx-migrate
error_handling: thiserror + anyhow
logging: tracing + tracing-subscriber
config: config-rs
validation: validator
testing: cargo test + tokio-test
```

### 分层架构 (两端一致)

```
┌─────────────────────────────────────┐
│           Presentation Layer        │
│  Client: Tauri Commands             │
│  Server: HTTP Handlers (Axum)       │
├─────────────────────────────────────┤
│           Application Layer         │
│  Use Cases / Services               │
│  (业务逻辑，纯 Rust，平台无关)       │
├─────────────────────────────────────┤
│           Domain Layer              │
│  Entities / Models / Traits         │
│  (完全共享的 crate)                  │
├─────────────────────────────────────┤
│           Infrastructure Layer      │
│  Repositories / Clients / External  │
│  (通过 Trait 抽象，可替换实现)        │
└─────────────────────────────────────┘
```

### 代码共享策略

```
项目根目录/
├── Cargo.toml              # Workspace 配置
│
├── crates/
│   ├── shared/             # 完全共享的核心
│   │   ├── src/
│   │   │   ├── models/     # 数据模型 (serde)
│   │   │   ├── services/   # 业务逻辑
│   │   │   ├── traits/     # 抽象接口
│   │   │   └── errors.rs   # 错误类型
│   │   └── Cargo.toml
│   │
│   ├── shared-client/      # 客户端特定扩展
│   │   └── src/
│   │       ├── local_db/   # SQLite 封装
│   │       └── lan/        # 局域网发现
│   │
│   └── shared-server/      # 服务端特定扩展
│       └── src/
│           ├── redis/      # Redis 封装
│           └── auth/       # JWT 服务端实现
│
├── src-tauri/              # 客户端后端 (Tauri)
│   ├── src/
│   │   ├── commands/       # Tauri 命令 (薄层)
│   │   └── main.rs
│   └── Cargo.toml
│
└── src-server/             # 服务端
    ├── src/
    │   ├── handlers/       # HTTP 处理器 (薄层)
    │   └── main.rs
    └── Cargo.toml
```

### 关键复用模式

#### 1. 共享业务逻辑示例
```rust
// crates/shared/src/services/game_service.rs
// 两端使用完全相同的业务逻辑

use crate::models::Game;
use crate::traits::GameRepository;
use crate::errors::Result;

pub struct GameService<R: GameRepository> {
    repo: R,
}

impl<R: GameRepository> GameService<R> {
    pub async fn launch_game(&self, game_id: &str) -> Result<GameSession> {
        // 业务逻辑完全共享
        let game = self.repo.find_by_id(game_id).await?;
        game.validate()?;
        
        Ok(GameSession::new(game))
    }
}

// 客户端实现
pub struct LocalGameRepo { db: SqlitePool }
impl GameRepository for LocalGameRepo { ... }

// 服务端实现  
pub struct RemoteGameRepo { db: PgPool }
impl GameRepository for RemoteGameRepo { ... }
```

#### 2. 共享网络协议
```rust
// crates/shared/src/protocol/
// 帧同步、状态同步、房间管理协议两端共享

pub mod frame_sync {
    pub const TICK_RATE: u32 = 60;
    pub const INPUT_DELAY: u8 = 3;
    
    #[derive(Serialize, Deserialize)]
    pub struct GameInput {
        pub frame: u64,
        pub player_id: String,
        pub actions: Vec<Action>,
    }
}
```

---

## 目录映射速查

| 功能 | 客户端前端 (src/) | 客户端后端 (src-tauri/) | 服务端 (src-server/) |
|-----|------------------|------------------------|---------------------|
| 用户认证 | `services/auth.ts` | `src/commands/auth.rs` | `src/handlers/auth.rs` |
| 游戏管理 | `stores/game.ts` | 调用 `crates/shared` | 调用 `crates/shared` |
| 网络同步 | `composables/useSync.ts` | 调用 `crates/shared` | 调用 `crates/shared` |
| 数据模型 | `types/` (TS) | `crates/shared/src/models/` | `crates/shared/src/models/` |
| 错误定义 | `types/errors.ts` | `crates/shared/src/errors.rs` | `crates/shared/src/errors.rs` |

---

## 版本锁定

```toml
# 根目录 Cargo.toml (Workspace)
[workspace]
members = ["crates/*", "src-tauri", "src-server"]
resolver = "2"

[workspace.dependencies]
tokio = { version = "1.35", features = ["full"] }
axum = "0.7"
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
sqlx = { version = "0.7", features = ["runtime-tokio"] }
tracing = "0.1"

# 客户端特定
tauri = { version = "2.0" }
mdns-sd = "0.10"

# 服务端特定
tonic = "0.11"
redis = { version = "0.24", features = ["tokio-comp"] }
```

---

**最后更新**: 2026-04-05
