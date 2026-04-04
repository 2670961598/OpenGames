<!--
Sync Impact Report
- Version change: 1.0 → 1.0
- Principles initialized from Kimi_Agent_SpecKit/agents/constitution.md
- Templates updated: .specify/templates/constitution-template.md
- Follow-up TODOs: None
-->

# Web游戏平台宪法

## 核心原则

### I. 稳定性优先（不可妥协）
所有代码必须有全面的测试覆盖，目标覆盖率 >80%，关键路径必须达到 100%。测试必须与实现同步编写或提前编写。文档必须与代码变更同步维护。"临时方案"和"快速修复"不是免除测试和文档的理由。

### II. 日志驱动开发
每个模块必须实现结构化日志，采用统一格式。日志必须包含：时间戳、request_id、user_id、严重级别（ERROR > WARN > INFO > DEBUG > TRACE）。生产环境必须使用结构化 JSON 格式。日志必须支持 AI 驱动的分析和自动化告警。

### III. 跨平台统一体验
平台必须在 Windows、macOS、Linux（桌面端）、iOS 和 Android（移动端）上无缝运行。最大化代码复用。UI/UX 在保持一致性的同时尊重各平台惯例。采用离线优先设计，支持优雅降级。

### IV. 安全设计
采用多层安全方案：应用层（SAST/SCA 扫描）、运行时层（eBPF/seccomp）、容器层（WASM/VM 隔离）、基础设施层（网络策略）。纵深防御与零信任原则。定期进行安全审计和依赖扫描。

### V. 性能即功能
严格的性能预算：客户端启动 <2s、API P95 <200ms、WebSocket 延迟 <50ms、游戏启动 <3s。内存限制：空闲 <100MB、运行时 <500MB。安装包 <50MB。性能回退将阻断发布。

### VI. 卓越开发者体验
清晰的 API、完善的文档、友好的错误提示。开发者工具必须直观且文档齐全。新开发者入职时间 <1 天。自动化工具处理重复任务。

## 技术基石

### 客户端技术栈
- **框架**: Tauri 2.0（桌面 + 移动）
- **前端**: Vue 3.4+（Composition API）
- **语言**: TypeScript 5.3+（严格模式）
- **状态管理**: Pinia 2.1+
- **UI 组件**: shadcn-vue + Tailwind CSS
- **构建工具**: Vite 5.0+

### 后端技术栈
- **语言**: Rust 1.75+
- **Web 框架**: Axum 0.7+
- **异步运行时**: Tokio 1.35+
- **本地服务器**: axum（Tauri 侧）
- **数据库**: PostgreSQL 15+、Redis 7+
- **消息队列**: NATS 2.x
- **gRPC**: tonic 0.11+

### 基础设施
- **编排**: Kubernetes 1.29+
- **游戏沙箱**: Firecracker microVM + WASM
- **CI/CD**: GitHub Actions + ArgoCD
- **监控**: Prometheus + Grafana
- **日志**: Loki + Grafana
- **链路追踪**: Jaeger + OpenTelemetry

## 质量标准

### 代码质量
- Rust: `cargo clippy` 零警告，`cargo fmt` 格式化
- TypeScript: ESLint + Prettier，启用严格模式
- 所有公共 API 必须有文档
- 复杂逻辑需要内联注释

### 测试金字塔
- 单元测试: 70%（快速、独立）
- 集成测试: 20%（模块间交互）
- E2E 测试: 10%（关键用户流程）
- 所有测试必须在 CI/CD 中自动化运行

### 版本管理
- 语义化版本: MAJOR.MINOR.PATCH
- Git 工作流: main/develop/feature/release/hotfix
- 每个版本必须包含 CHANGELOG
- 破坏性变更必须提供迁移指南

## 开发工作流

### 阶段驱动开发
1. **Constitution（宪法）**: 确立原则（本文档）
2. **Specify（规格说明）**: 定义做什么、为什么（用户故事、需求）
3. **Plan（计划）**: 定义怎么做（技术栈、架构）
4. **Tasks（任务）**: 分解为可执行单元
5. **Implement（实现）**: 在质量门禁下执行

### 代码审查要求
- 所有 PR 必须至少有一名审查者
- CI 必须通过（测试、代码检查、安全扫描）
- 文档必须同步更新
- 破坏性变更必须明确标注

### 质量门禁
- 测试覆盖率不得下降
- 性能基准必须通过
- 安全扫描必须无高危漏洞
- 文档必须完整

## 治理

本宪法高于一切其他实践。修订须满足：
1. 记录变更理由
2. 获得团队批准
3. 为现有代码制定迁移计划
4. 更新所有受影响的规格说明

所有 PR 和审查必须验证是否符合这些原则。复杂度必须有明确收益作为支撑。有疑问时，优先选择简单和稳定。

**版本**: 1.0 | **批准日期**: 2026-04-03 | **最后修订**: 2026-04-03
