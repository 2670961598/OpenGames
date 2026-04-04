# Spec-kit Agent 体系 - Web游戏平台

## 概述

本目录包含 Web 游戏平台项目的完整 Spec-kit Agent 体系。

## Agent 列表

| Agent | 文件 | 职责 |
|-------|------|------|
| **项目宪法** | `constitution.md` | 项目基本原则和规范 |
| **客户端前端 Agent** | `agent-client-frontend.md` | Vue 3 + Tauri 前端开发 |
| **客户端后端 Agent** | `agent-client-backend.md` | Tauri Rust 后端开发 |
| **服务端 Agent** | `agent-server.md` | Rust 微服务开发 |
| **基础设施 Agent** | `agent-infrastructure.md` | K8s、CI/CD、监控 |
| **测试 Agent** | `agent-testing.md` | 测试策略和自动化 |
| **文档 Agent** | `agent-documentation.md` | 技术文档编写 |

## 配套文档

| 文档 | 路径 | 说明 |
|------|------|------|
| **项目需求** | `../blueprint/project-requirements.md` | 功能需求和非功能需求 |
| **演进路线** | `../blueprint/evolution-roadmap.md` | 分阶段开发开发计划 |

## 快速开始

### 1. 阅读宪法
首先阅读 `constitution.md`，了解项目的基本原则和规范。

### 2. 阅读项目需求
查看 `../blueprint/project-requirements.md` 了解项目需求。

### 3. 阅读演进路线
查看 `../blueprint/evolution-roadmap.md` 了解开发计划。

### 4. 选择 Agent
根据你的角色选择对应的 Agent 文档：
- **前端开发者** → `agent-client-frontend.md`
- **Rust 开发者** → `agent-client-backend.md` + `agent-server.md`
- **DevOps** → `agent-infrastructure.md`
- **QA** → `agent-testing.md`
- **技术写作** → `agent-documentation.md`

## 演进阶段

```
Phase 1 (Week 1-2):   基础架构   →  项目脚手架、CI/CD、基础组件
Phase 2 (Week 3-5):   核心功能   →  用户系统、游戏管理、本地运行
Phase 3 (Week 6-8):   联机功能   →  局域网发现、帧/状态同步、房间系统
Phase 4 (Week 9-10):  平台扩展   →  开发者API、排行榜、社交功能
Phase 5 (Week 11-12): 生产就绪   →  性能优化、安全加固、监控完善
```

## 关键决策

### 技术栈
- **客户端框架**: Tauri 2.0 + Vue 3 + TypeScript
- **客户端后端**: Rust (axum + tokio)
- **服务端**: Rust (Axum/Actix-web)
- **数据库**: PostgreSQL + Redis Cluster
- **基础设施**: Kubernetes + Firecracker

### 设计原则
1. **稳定性优先**: 所有代码必须有测试覆盖（目标 >80%）
2. **日志驱动**: 结构化日志，便于 AI 溯源和自动化
3. **版本管理**: SemVer + Git Flow
4. **安全第一**: 多层沙箱、依赖审计、安全扫描

## 项目目录结构

```
game-platform/
├── .specify/                    # specify 工作流核心
│   ├── memory/
│   │   └── constitution.md      # 项目宪法（specify 读取）
│   ├── templates/               # specify 模板
│   └── ...
│
├── agents/                      # 本目录（Agent 角色定义）
│   ├── constitution.md          # 项目宪法
│   ├── agent-client-frontend.md # 客户端前端 Agent
│   ├── agent-client-backend.md  # 客户端后端 Agent
│   ├── agent-server.md          # 服务端 Agent
│   ├── agent-infrastructure.md  # 基础设施 Agent
│   ├── agent-testing.md         # 测试 Agent
│   ├── agent-documentation.md   # 文档 Agent
│   └── README.md                # 本文件
│
├── blueprint/                   # 原始方案设计（知识库）
│   ├── project-requirements.md  # 项目需求
│   ├── evolution-roadmap.md     # 演进路线
│   ├── 完整技术架构解决方案.md   # 技术选型与架构总览
│   ├── security-configs/        # 安全配置
│   └── ...
│
├── client-frontend/             # 客户端前端 (Vue 3)
├── client-backend/              # 客户端后端 (Rust)
├── server/                      # 服务端 (Rust)
├── infrastructure/              # 基础设施 (K8s, CI/CD)
├── tests/                       # 测试集合
└── README.md                    # 项目根 README
```

## 下一步行动

### 立即执行
1. 创建项目仓库
2. 初始化 Tauri + Vue 项目
3. 初始化 Rust Workspace
4. 配置 CI/CD 基础

### 第一周目标
- [ ] 完成项目脚手架
- [ ] 配置开发环境
- [ ] 编写基础组件
- [ ] 实现用户认证

### 第一个月目标
- [ ] 完成用户系统
- [ ] 完成游戏上传/下载
- [ ] 实现本地游戏运行
- [ ] 编写 50%+ 测试覆盖

---
*版本: v1.0*
*更新日期: 2026-04-03*
