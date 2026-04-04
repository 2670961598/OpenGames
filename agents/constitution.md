# 项目宪法 - Web游戏平台

## 1. 项目愿景
构建一个开放式Web游戏平台，支持跨平台（桌面+移动）、离线运行、局域网联机、在线对战，并确保极致性能与安全性。

## 2. 核心原则

### 2.1 稳定性优先
- 所有代码必须有单元测试覆盖（目标覆盖率 >80%）
- 关键路径必须有集成测试
- 文档先于代码，或至少同步

### 2.2 日志驱动开发
- 每个模块必须有结构化日志
- 日志级别：ERROR > WARN > INFO > DEBUG > TRACE
- 日志必须包含上下文（request_id, user_id, timestamp）

### 2.3 版本管理
- 语义化版本（SemVer）：MAJOR.MINOR.PATCH
- Git 工作流：Git Flow（main/develop/feature/release/hotfix）
- 每个版本必须有 CHANGELOG

### 2.4 代码质量
- Rust: clippy 零警告，rustfmt 格式化
- TypeScript: ESLint + Prettier
- 代码审查：所有 PR 必须有人审查

## 3. 技术基石
- **客户端框架**: Tauri 2.0 + Vue 3 + TypeScript
- **客户端后端**: Rust (axum + tokio)
- **服务端**: Rust (Axum/Actix-web)
- **数据库**: PostgreSQL + Redis Cluster
- **基础设施**: Kubernetes + Firecracker

## 4. 文档规范
- 所有公共 API 必须有文档
- 所有模块必须有 README
- 架构决策必须有 ADR（Architecture Decision Record）

## 5. 测试规范
- 单元测试: 70%
- 集成测试: 20%
- E2E 测试: 10%

## 6. 安全规范
- 依赖扫描（cargo-audit, npm audit）
- 静态分析（clippy, ESLint）
- 密钥管理（Vault）

---
*宪法版本: v1.0*
*生效日期: 2026-04-03*
