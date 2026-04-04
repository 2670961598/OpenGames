# Implementation Plan: [FEATURE]

**Branch**: `[###-feature-name]` | **Date**: [DATE] | **Spec**: [link]
**Input**: Feature specification from `/specs/[###-feature-name]/spec.md`

**Note**: 此模板由 `/speckit.plan` 命令填充。执行流程参见 `.specify/templates/plan-template.md` 中的说明。

## Summary

[从功能规格中提取：主要需求 + 研究阶段确定的技术方案]

## Technical Context

<!--
  需要行动：用本项目的具体技术细节替换本节内容。
  以下结构仅供参考，用于指导迭代过程。
-->

**Language/Version**: [例如 Python 3.11, Swift 5.9, Rust 1.75 或 NEEDS CLARIFICATION]
**Primary Dependencies**: [例如 FastAPI, UIKit, LLVM 或 NEEDS CLARIFICATION]
**Storage**: [如果适用，例如 PostgreSQL, CoreData, 文件系统 或 N/A]
**Testing**: [例如 pytest, XCTest, cargo test 或 NEEDS CLARIFICATION]
**Target Platform**: [例如 Linux 服务器, iOS 15+, WASM 或 NEEDS CLARIFICATION]
**Project Type**: [例如 library/cli/web-service/mobile-app/compiler/desktop-app 或 NEEDS CLARIFICATION]
**Performance Goals**: [领域特定，例如 1000 req/s, 10k 行/秒, 60 fps 或 NEEDS CLARIFICATION]
**Constraints**: [领域特定，例如 <200ms p95, <100MB 内存, 离线可用 或 NEEDS CLARIFICATION]
**Scale/Scope**: [领域特定，例如 10k 用户, 1M 行代码, 50 个页面 或 NEEDS CLARIFICATION]

## Constitution Check

*门禁：必须在 Phase 0 研究前通过。在 Phase 1 设计后重新检查。*

[基于宪法文件确定的质量门禁]

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # 本文件 (/speckit.plan 输出)
├── research.md          # Phase 0 输出 (/speckit.plan)
├── data-model.md        # Phase 1 输出 (/speckit.plan)
├── quickstart.md        # Phase 1 输出 (/speckit.plan)
├── contracts/           # Phase 1 输出 (/speckit.plan)
└── tasks.md             # Phase 2 输出 (/speckit.tasks - 非 /speckit.plan 创建)
```

### Source Code (repository root)
<!--
  需要行动：用本功能的具体布局替换下方的占位树。
  删除未使用的选项并用真实路径扩展所选结构
  （例如 apps/admin, packages/something）。
  最终计划不得包含"Option"标签。
-->

```text
# [如未使用请删除] 选项 1: 单一项目（默认）
src/
├── models/
├── services/
├── cli/
└── lib/

tests/
├── contract/
├── integration/
└── unit/

# [如未使用请删除] 选项 2: Web 应用（当检测到 "frontend" + "backend"）
backend/
├── src/
│   ├── models/
│   ├── services/
│   └── api/
└── tests/

frontend/
├── src/
│   ├── components/
│   ├── pages/
│   └── services/
└── tests/

# [如未使用请删除] 选项 3: 移动端 + API（当检测到 "iOS/Android"）
api/
└── [同上 backend 结构]

ios/ or android/
└── [平台特定结构：功能模块, UI 流程, 平台测试]
```

**Structure Decision**: [记录选定的结构并引用上方捕获的真实目录]

## Complexity Tracking

> **仅在宪法检查存在必须解释的违规时填写**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [例如 第 4 个项目] | [当前需求] | [为什么 3 个项目不够] |
| [例如 Repository 模式] | [特定问题] | [为什么直接 DB 访问不够] |
