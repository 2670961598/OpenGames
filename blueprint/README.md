# Web 游戏平台 — 原始方案设计 (Blueprint)

本目录存放项目启动前的完整方案设计、技术选型和架构分析文档。
这些文档是项目决策的源头，在后续 specify 工作流中作为参考和引用来源。

## 文档索引

### 顶层概览
- [`EXECUTIVE_SUMMARY.md`](EXECUTIVE_SUMMARY.md) — 执行摘要
- [`project-requirements.md`](project-requirements.md) — 功能需求与非功能需求
- [`evolution-roadmap.md`](evolution-roadmap.md) — 分阶段演进路线与里程碑
- [`project-structure.md`](project-structure.md) — 推荐项目目录结构
- [`quick-reference.md`](quick-reference.md) — 快速参考卡片

### 完整技术架构
- [`完整技术架构解决方案.md`](完整技术架构解决方案.md) — 综合技术选型报告（推荐方案 A：Tauri + Rust）
- [`web-game-platform-tech-stack-analysis.md`](web-game-platform-tech-stack-analysis.md) — 客户端技术栈分析
- [`web-game-platform-architecture.md`](web-game-platform-architecture.md) — 后端架构设计
- [`web-game-platform-client-container.md`](web-game-platform-client-container.md) — 客户端容器设计
- [`web-game-platform-infrastructure-design.md`](web-game-platform-infrastructure-design.md) — 基础设施设计（K8s、CI/CD）
- [`web-game-platform-network-architecture.md`](web-game-platform-network-architecture.md) — 网络架构（帧同步、状态同步、局域网）
- [`web-game-platform-security-architecture.md`](web-game-platform-security-architecture.md) — 安全架构（沙箱、认证、防作弊）
- [`web-game-platform-monitoring.md`](web-game-platform-monitoring.md) — 监控与可观测性设计
- [`SECURITY_ARCHITECTURE_SUMMARY.md`](SECURITY_ARCHITECTURE_SUMMARY.md) — 安全架构摘要

### 辅助资料
- [`architecture-diagram.mmd`](architecture-diagram.mmd) — Mermaid 格式架构图
- [`network-code-examples.ts`](network-code-examples.ts) — TypeScript 网络示例代码
- [`security-configs/`](security-configs/) — 安全配置模板（Docker Compose、Kong、Falco 规则）

## 使用方式

1. **开始新功能前**：先阅读 `evolution-roadmap.md` 和 `project-requirements.md`，确认当前阶段目标。
2. **技术决策时**：参考 `完整技术架构解决方案.md` 和各专题架构文档。
3. **与 AI 协作时**：在对话中引用本目录下的文档，例如：
   > "参考 `blueprint/web-game-platform-network-architecture.md` 中的帧同步设计。"

---
*版本: v1.0 | 最后更新: 2026-04-04*
