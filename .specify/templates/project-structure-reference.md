# 项目目录结构参考

> 实际项目目录结构（根目录下统一存放）

---

## 根目录结构

```
OpenGames/                          # 项目根目录
├── .specify/                       # Spec-kit 工作流
│   ├── memory/
│   ├── templates/
│   └── ...
│
├── agents/                         # Agent 角色定义
├── blueprint/                      # 原始方案设计
├── specs/                          # 功能规范 (待创建)
│   └── [###-feature-name]/
│       ├── spec.md
│       ├── plan.md
│       └── tasks.md
│
├── src/                            # 客户端前端 (Vue 3 + Tauri)
│   ├── components/                 # Vue 组件
│   │   ├── ui/                     # shadcn 基础组件
│   │   ├── layout/                 # 布局组件
│   │   └── game/                   # 游戏相关
│   ├── composables/                # 组合式函数
│   ├── views/                      # 页面视图
│   ├── stores/                     # Pinia Store
│   ├── router/                     # 路由配置
│   ├── types/                      # TypeScript 类型
│   ├── services/                   # 服务层
│   │   └── tauri.ts                # Tauri IPC 封装
│   ├── utils/                      # 工具函数
│   ├── App.vue
│   └── main.ts
│
├── src-tauri/                      # 客户端后端 (Tauri Rust)
│   ├── src/
│   │   ├── main.rs                 # 程序入口
│   │   ├── lib.rs                  # 库入口
│   │   └── commands/               # Tauri 命令模块
│   │       ├── mod.rs
│   │       ├── user_commands.rs
│   │       ├── game_commands.rs
│   │       └── ...
│   ├── Cargo.toml
│   ├── tauri.conf.json
│   └── capabilities/               # Tauri 权限配置
│
├── src-server/                     # 服务端 (Rust)
│   ├── src/
│   │   ├── main.rs                 # 程序入口
│   │   ├── handlers/               # HTTP 处理器
│   │   ├── middleware/             # 中间件
│   │   └── ...
│   ├── Cargo.toml
│   └── migrations/                 # 数据库迁移
│
├── crates/                         # 共享代码 (Workspace)
│   ├── shared/                     # 客户端/服务端完全共享
│   │   └── src/
│   │       ├── models/             # 数据模型
│   │       ├── services/           # 业务逻辑
│   │       ├── traits/             # 抽象接口
│   │       └── errors.rs           # 错误类型
│   │
│   ├── shared-client/              # 客户端特定扩展
│   │   └── src/
│   │       ├── repositories/       # SQLite 实现
│   │       ├── local_db/           # 本地数据库封装
│   │       └── lan/                # 局域网发现
│   │
│   └── shared-server/              # 服务端特定扩展
│       └── src/
│           ├── repositories/       # PostgreSQL 实现
│           ├── cache/              # Redis 封装
│           └── messaging/          # NATS 消息队列
│
├── Cargo.toml                      # Workspace 配置
├── package.json                    # 前端依赖
├── vite.config.ts
├── tsconfig.json
├── index.html
├── public/                         # 静态资源
└── README.md
```

---

## 关键路径速查

| 功能 | 客户端前端 | 客户端后端 | 服务端 |
|-----|-----------|-----------|--------|
| 共享模型 | - | `crates/shared/src/models/` | `crates/shared/src/models/` |
| 共享业务逻辑 | - | `crates/shared/src/services/` | `crates/shared/src/services/` |
| 客户端命令 | - | `src-tauri/src/commands/` | - |
| 服务端 Handler | - | - | `src-server/src/handlers/` |
| 前端组件 | `src/components/` | - | - |
| 前端 Store | `src/stores/` | - | - |
| 数据库迁移 | - | - | `src-server/migrations/` |

---

## 创建新功能的目录模板

### 命令快速创建

```bash
# 创建功能规范目录
mkdir -p specs/[###-feature-name]

# 创建前端组件目录
mkdir -p src/components/[feature]
touch src/components/[feature]/.gitkeep

# 创建共享模型
touch crates/shared/src/models/[feature].rs

# 创建客户端命令
touch src-tauri/src/commands/[feature]_commands.rs

# 创建服务端 handler
touch src-server/src/handlers/[feature].rs
```

---

## 与 Blueprint 的差异说明

| Blueprint 设计 | 实际项目 | 说明 |
|---------------|---------|------|
| `client-frontend/` | `src/` | 前端源码直接放在根目录 src/ |
| `client-backend/` | `src-tauri/` | Tauri 标准目录结构 |
| `server/` | `src-server/` | 服务端源码目录 |
| `crates/` | `crates/` | 共享代码，保持一致 |

---

**最后更新**: 2026-04-05
