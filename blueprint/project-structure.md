# 项目目录结构 - Web游戏平台

## 概述

本文档定义项目的标准目录结构，所有 Agent 必须遵循此结构。

## 根目录结构

```
game-platform/
├── agents/                      # Spec-kit Agent 设定
├── client-frontend/             # 客户端前端 (Vue 3 + Tauri)
├── client-backend/              # 客户端后端 (Rust Tauri)
├── server/                      # 服务端 (Rust 微服务)
├── infrastructure/              # 基础设施 (K8s, CI/CD)
├── tests/                       # 跨项目测试
├── docs/                        # 技术文档
├── scripts/                     # 运维脚本
├── .github/                     # GitHub 配置
├── project-requirements.md      # 项目需求
├── evolution-roadmap.md         # 演进路线
├── project-structure.md         # 本文件
└── README.md                    # 项目根 README
```

---

## client-frontend/ 目录结构

```
client-frontend/
├── .vscode/                     # VSCode 配置
├── public/                      # 静态资源
├── src/
│   ├── components/              # 组件
│   │   ├── ui/                  # UI 基础组件
│   │   ├── layout/              # 布局组件
│   │   ├── game/                # 游戏相关组件
│   │   └── common/              # 通用组件
│   ├── composables/             # 组合式函数
│   ├── views/                   # 页面视图
│   ├── stores/                  # Pinia 状态管理
│   ├── router/                  # 路由配置
│   ├── types/                   # TypeScript 类型
│   ├── utils/                   # 工具函数
│   ├── services/                # 服务层
│   ├── styles/                  # 样式
│   ├── App.vue                  # 根组件
│   └── main.ts                  # 入口文件
├── tests/                       # 测试文件
│   ├── unit/                    # 单元测试
│   ├── integration/             # 集成测试
│   └── e2e/                     # E2E 测试
├── docs/                        # 模块文档
├── index.html
├── package.json
├── vite.config.ts
├── vitest.config.ts
├── tsconfig.json
├── tailwind.config.js
├── eslint.config.js
├── .prettierrc
└── README.md
```

### 关键文件说明

| 文件/目录 | 说明 | Agent |
|-----------|------|-------|
| `src/components/` | Vue 组件 | Client Frontend |
| `src/composables/` | 可复用逻辑 | Client Frontend |
| `src/stores/` | Pinia 状态管理 | Client Frontend |
| `src/services/tauriService.ts` | Tauri 调用封装 | Client Frontend |
| `tests/` | 测试文件 | Testing |
| `docs/` | 模块文档 | Documentation |

---

## client-backend/ 目录结构

```
client-backend/
├── src/
│   ├── main.rs                  # 入口文件
│   ├── lib.rs                   # 库入口
│   ├── commands/                # Tauri 命令模块
│   │   ├── mod.rs
│   │   ├── user_commands.rs
│   │   ├── game_commands.rs
│   │   ├── download_commands.rs
│   │   ├── lan_commands.rs
│   │   └── system_commands.rs
│   ├── services/                # 服务层
│   │   ├── mod.rs
│   │   ├── local_server.rs
│   │   ├── lan_discovery.rs
│   │   ├── download_manager.rs
│   │   ├── game_manager.rs
│   │   ├── file_manager.rs
│   │   └── config_manager.rs
│   ├── models/                  # 数据模型
│   │   ├── mod.rs
│   │   ├── user.rs
│   │   ├── game.rs
│   │   ├── download.rs
│   │   ├── lan.rs
│   │   └── config.rs
│   ├── utils/                   # 工具模块
│   │   ├── mod.rs
│   │   ├── logger.rs
│   │   ├── errors.rs
│   │   ├── paths.rs
│   │   ├── crypto.rs
│   │   └── validators.rs
│   ├── middleware/              # 中间件
│   │   ├── mod.rs
│   │   ├── logging.rs
│   │   └── error_handling.rs
│   └── tests/                   # 集成测试
│       └── integration_tests.rs
├── Cargo.toml
├── Cargo.lock
├── build.rs
├── tauri.conf.json              # Tauri 配置
├── capabilities/                # Tauri 权限配置
│   └── default.json
├── docs/                        # 模块文档
└── tests/                       # 测试目录
    ├── unit/
    ├── integration/
    └── fixtures/
```

### 关键文件说明

| 文件/目录 | 说明 | Agent |
|-----------|------|-------|
| `src/commands/` | Tauri 命令 | Client Backend |
| `src/services/` | 业务逻辑服务 | Client Backend |
| `src/models/` | 数据模型 | Client Backend |
| `src/utils/logger.rs` | 日志工具 | Client Backend |
| `src/utils/errors.rs` | 错误定义 | Client Backend |
| `tauri.conf.json` | Tauri 配置 | Client Backend |
| `tests/` | 测试文件 | Testing |

---

## server/ 目录结构

```
server/
├── Cargo.toml                   # Workspace 配置
├── Cargo.lock
├── Makefile
├── docker-compose.yml           # 本地开发环境
├── Dockerfile
├── k8s/                         # Kubernetes 配置
│   ├── base/
│   ├── services/
│   ├── databases/
│   ├── monitoring/
│   └── sandbox/
├── crates/                      # 多 crate Workspace
│   ├── api-gateway/             # API 网关
│   │   ├── Cargo.toml
│   │   ├── src/
│   │   │   ├── main.rs
│   │   │   ├── lib.rs
│   │   │   ├── router.rs
│   │   │   ├── middleware/
│   │   │   └── handlers/
│   │   └── tests/
│   │
│   ├── user-service/            # 用户服务
│   │   ├── Cargo.toml
│   │   ├── src/
│   │   │   ├── main.rs
│   │   │   ├── lib.rs
│   │   │   ├── handlers.rs
│   │   │   ├── models.rs
│   │   │   ├── repository.rs
│   │   │   └── service.rs
│   │   ├── migrations/
│   │   └── tests/
│   │
│   ├── game-service/            # 游戏联机服务
│   │   ├── Cargo.toml
│   │   ├── src/
│   │   │   ├── main.rs
│   │   │   ├── lib.rs
│   │   │   ├── sync/
│   │   │   │   ├── frame_sync.rs
│   │   │   │   └── state_sync.rs
│   │   │   ├── room/
│   │   │   │   ├── manager.rs
│   │   │   │   └── models.rs
│   │   │   ├── matchmaking/
│   │   │   │   ├── algorithm.rs
│   │   │   │   └── queue.rs
│   │   │   └── websocket/
│   │   │       ├── handler.rs
│   │   │       └── protocol.rs
│   │   └── tests/
│   │
│   ├── leaderboard-service/     # 排行榜服务
│   │   ├── Cargo.toml
│   │   ├── src/
│   │   └── tests/
│   │
│   ├── developer-api/           # 开发者 API 服务
│   │   ├── Cargo.toml
│   │   ├── src/
│   │   └── tests/
│   │
│   └── shared/                  # 共享库
│       ├── Cargo.toml
│       └── src/
│           ├── lib.rs
│           ├── models/
│           ├── errors.rs
│           ├── utils/
│           ├── middleware/
│           └── database/
│
├── proto/                       # Protocol Buffers
│   ├── common.proto
│   ├── user.proto
│   ├── game.proto
│   └── leaderboard.proto
│
├── docs/                        # 文档
│   ├── architecture/
│   ├── api/
│   ├── deployment/
│   └── testing/
│
├── scripts/                     # 脚本
│   ├── setup.sh
│   ├── migrate.sh
│   └── test.sh
│
└── tests/                       # 集成测试
    ├── e2e/
    └── load/
```

### 关键文件说明

| 文件/目录 | 说明 | Agent |
|-----------|------|-------|
| `crates/api-gateway/` | API 网关 | Server |
| `crates/user-service/` | 用户服务 | Server |
| `crates/game-service/` | 游戏联机服务 | Server |
| `crates/shared/` | 共享库 | Server |
| `proto/` | Protocol Buffers | Server |
| `migrations/` | 数据库迁移 | Server |
| `k8s/` | Kubernetes 配置 | Infrastructure |
| `tests/` | 测试文件 | Testing |

---

## infrastructure/ 目录结构

```
infrastructure/
├── k8s/                         # Kubernetes 配置
│   ├── base/                    # 基础配置
│   │   ├── namespaces.yaml
│   │   ├── network-policies.yaml
│   │   └── resource-quotas.yaml
│   ├── services/                # 服务配置
│   │   ├── api-gateway/
│   │   ├── user-service/
│   │   ├── game-service/
│   │   ├── leaderboard-service/
│   │   └── developer-api/
│   ├── databases/               # 数据库配置
│   │   ├── postgres/
│   │   └── redis/
│   ├── monitoring/              # 监控配置
│   │   ├── prometheus/
│   │   ├── grafana/
│   │   ├── loki/
│   │   └── jaeger/
│   └── sandbox/                 # 游戏沙箱配置
│       ├── firecracker/
│       └── wasm-runtime/
│
├── ci-cd/                       # CI/CD 配置
│   ├── github-actions/
│   │   ├── workflows/
│   │   │   ├── build.yml
│   │   │   ├── test.yml
│   │   │   ├── deploy-staging.yml
│   │   │   └── deploy-production.yml
│   │   └── actions/
│   └── argocd/
│       ├── applications/
│       └── app-of-apps.yaml
│
├── terraform/                   # 基础设施即代码
│   ├── modules/
│   │   ├── vpc/
│   │   ├── eks/
│   │   ├── rds/
│   │   └── elasticache/
│   ├── environments/
│   │   ├── development/
│   │   ├── staging/
│   │   └── production/
│   └── main.tf
│
├── scripts/                     # 运维脚本
│   ├── setup.sh
│   ├── deploy.sh
│   ├── backup.sh
│   └── rollback.sh
│
├── docker/                      # Dockerfile 集合
│   ├── api-gateway.Dockerfile
│   ├── game-service.Dockerfile
│   └── firecracker-vm.Dockerfile
│
├── docs/                        # 运维文档
│   ├── deployment-guide.md
│   ├── monitoring-guide.md
│   ├── disaster-recovery.md
│   └── runbooks/
│
└── helm/                        # Helm Charts
    ├── game-platform/
    └── charts/
```

### 关键文件说明

| 文件/目录 | 说明 | Agent |
|-----------|------|-------|
| `k8s/` | Kubernetes 配置 | Infrastructure |
| `ci-cd/` | CI/CD 配置 | Infrastructure |
| `terraform/` | 基础设施即代码 | Infrastructure |
| `scripts/` | 运维脚本 | Infrastructure |
| `docker/` | Dockerfile | Infrastructure |
| `helm/` | Helm Charts | Infrastructure |

---

## tests/ 目录结构

```
tests/
├── unit/                        # 单元测试
│   ├── rust/
│   │   ├── client-backend/
│   │   └── server/
│   └── typescript/
│       └── client-frontend/
│
├── integration/                 # 集成测试
│   ├── rust/
│   │   ├── api_integration_test.rs
│   │   ├── database_integration_test.rs
│   │   └── websocket_integration_test.rs
│   └── typescript/
│       └── api_integration_test.ts
│
├── e2e/                         # 端到端测试
│   └── playwright/
│       ├── specs/
│       │   ├── auth.spec.ts
│       │   ├── game_store.spec.ts
│       │   ├── game_library.spec.ts
│       │   └── multiplayer.spec.ts
│       ├── fixtures/
│       ├── pages/
│       └── utils/
│
├── performance/                 # 性能测试
│   ├── k6/
│   │   ├── load_test.js
│   │   ├── stress_test.js
│   │   └── spike_test.js
│   └── rust/
│       └── benchmarks/
│
├── security/                    # 安全测试
│   ├── cargo-audit.toml
│   ├── npm-audit.sh
│   └── zap-scan.sh
│
└── fixtures/                    # 测试数据
    ├── games/
    ├── users/
    └── responses/
```

### 关键文件说明

| 文件/目录 | 说明 | Agent |
|-----------|------|-------|
| `unit/` | 单元测试 | Testing |
| `integration/` | 集成测试 | Testing |
| `e2e/` | E2E 测试 | Testing |
| `performance/` | 性能测试 | Testing |
| `security/` | 安全测试 | Testing |
| `fixtures/` | 测试数据 | Testing |

---

## docs/ 目录结构

```
docs/
├── README.md                    # 文档首页
├── architecture/                # 架构文档
│   ├── overview.md              # 架构总览
│   ├── client.md                # 客户端架构
│   ├── server.md                # 服务端架构
│   ├── network.md               # 网络架构
│   ├── security.md              # 安全架构
│   └── data-model.md            # 数据模型
│
├── design/                      # 设计文档
│   ├── client-frontend/
│   ├── client-backend/
│   ├── server/
│   └── sync/
│
├── api/                         # API 文档
│   ├── openapi.yaml             # OpenAPI 规范
│   ├── authentication.md
│   ├── errors.md
│   └── changelog.md
│
├── guides/                      # 开发指南
│   ├── development/
│   │   ├── setup.md
│   │   ├── workflow.md
│   │   ├── testing.md
│   │   └── debugging.md
│   ├── deployment/
│   │   ├── local.md
│   │   ├── staging.md
│   │   └── production.md
│   └── operations/
│       ├── monitoring.md
│       ├── logging.md
│       └── troubleshooting.md
│
├── reference/                   # 参考文档
│   ├── environment-variables.md
│   ├── configuration.md
│   ├── cli-commands.md
│   └── faq.md
│
└── user-guide/                  # 用户手册
    ├── player/
    └── developer/
```

### 关键文件说明

| 文件/目录 | 说明 | Agent |
|-----------|------|-------|
| `architecture/` | 架构文档 | Documentation |
| `design/` | 设计文档 | Documentation |
| `api/` | API 文档 | Documentation |
| `guides/` | 开发指南 | Documentation |
| `reference/` | 参考文档 | Documentation |
| `user-guide/` | 用户手册 | Documentation |

---

## 文件命名规范

### Rust 文件
- 使用 `snake_case`
- 模块文件: `mod.rs`
- 测试文件: `xxx_test.rs`
- 示例: `game_manager.rs`, `user_commands.rs`

### TypeScript/Vue 文件
- 组件: `PascalCase.vue`（如 `GameCard.vue`）
- 工具函数: `camelCase.ts`（如 `formatDate.ts`）
- Composables: `useXxx.ts`（如 `useGame.ts`）
- 测试文件: `xxx.test.ts` 或 `xxx.spec.ts`

### 配置文件
- 使用 `kebab-case`
- 示例: `tauri.conf.json`, `vite.config.ts`

---

## 版本控制

### Git 忽略文件
```gitignore
# Rust
target/
Cargo.lock
**/*.rs.bk

# Node.js
node_modules/
dist/
*.log

# IDE
.vscode/
.idea/
*.swp

# OS
.DS_Store
Thumbs.db

# Secrets
.env
*.pem
*.key
```

### Git 工作流
- `main`: 生产代码
- `develop`: 开发代码
- `feature/*`: 功能分支
- `release/*`: 发布分支
- `hotfix/*`: 热修复分支

---

## 附录

### 推荐工具
- **IDE**: VSCode + rust-analyzer + Volar
- **API 测试**: Postman / Insomnia
- **数据库**: TablePlus / DBeaver
- **Git**: GitKraken / SourceTree

### 常用命令
```bash
# 启动开发环境
docker-compose up -d

# 运行测试
cargo test
pnpm test

# 代码格式化
cargo fmt
pnpm format

# 代码检查
cargo clippy
pnpm lint
```

---
**版本**: v1.0
**最后更新**: 2026-04-04
**来源**: Kimi_Agent_SpecKit/project-structure.md
