---
description: "实现计划模板 - 与 spec 配套使用"
type: template
---

# Implementation Plan: [FEATURE]

**Branch**: `[###-feature-name]` | **Date**: [DATE] | **Spec**: [link]
**Input**: Feature specification from `/specs/[###-feature-name]/spec.md`
**Scope**: [src (前端) / src-tauri (客户端后端) / src-server (服务端)]

---

## Summary

[主要需求 + 技术方案概述]

---

## Technical Context

> 参考 `.specify/templates/project-context.md`

**Language/Version**: [具体版本]  
**Primary Dependencies**: [核心依赖]  
**Storage**: [数据库/存储]  
**Testing**: [测试工具]  

---

## Constitution Check

- [ ] 符合项目宪法中的技术栈要求
- [ ] 代码规范符合 `.specify/templates/project-context.md`
- [ ] 测试策略参考 `.specify/templates/testing-strategy.md`

---

## Project Structure

### 文档 (本功能)

```
specs/[###-feature]/
├── spec.md              # 本功能的规范
├── plan.md              # 本文件
├── research.md          # 调研笔记 (如需要)
├── data-model.md        # 数据模型 (如需要)
└── tasks.md             # 任务分解
```

### 源代码

参考 `.specify/templates/project-structure-reference.md` 中的对应 scope 结构。

```
[根据 scope 填写]
├── src/
│   ├── [模块]/
│   └── ...
└── tests/
```

---

## Data Model *(如需要)*

### 核心实体

```
[Entity]
├── field: type
└── ...
```

### 关系

- `[Entity A]` 1:N `[Entity B]`
- ...

---

## API / Interface 设计

### 接口列表

| 名称 | 方法 | 输入 | 输出 | 说明 |
|-----|------|------|------|------|
| [name] | [GET/POST/command] | [类型] | [类型] | [说明] |

---

## 测试策略

> 参考 `.specify/templates/testing-strategy.md`

### 单元测试

- [模块]: [测试重点]

### 集成测试

- [场景]: [测试方法]

---

## 依赖 & 风险

### 外部依赖

- [依赖项]: [影响]

### 技术风险

| 风险 | 缓解措施 |
|-----|---------|
| [风险] | [措施] |

---

## 参考

- 项目上下文: `.specify/templates/project-context.md`
- 测试策略: `.specify/templates/testing-strategy.md`
- 目录结构: `.specify/templates/project-structure-reference.md`
