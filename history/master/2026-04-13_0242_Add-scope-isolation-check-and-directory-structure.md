# 2026-04-13 02:42 - Add scope isolation check and directory structure

## 提交信息
```
Commit: <待生成>
Author: Ye QingXin
Date: 2026-04-13 02:42:00 -0700
Branch: master
```

## 变更概述
1. 添加 GitHub Actions 工作流，强制提交范围隔离检查
2. 创建客户端后端和测试相关目录结构
3. 建立项目职能划分规范

## 新增文件

### CI/CD 配置
- `.github/workflows/scope-check.yml` - 提交范围隔离检查工作流

### 目录结构
- `docs/client-backend/` - 客户端后端（Tauri Rust）文档
- `docs/test/` - 测试文档
- `src-test/` - 测试代码目录

## 职能划分规范

项目分为四个独立职能，每次提交只能涉及一个职能：

| 职能 | 代码路径 | 文档路径 |
|------|----------|----------|
| frontend | `src/` | `docs/frontend/` |
| client-backend | `src-tauri/` | `docs/client-backend/` |
| server | `src-server/` | `docs/server/` |
| test | `src-test/` | `docs/test/` |

## 提交检查规则

### 1. 范围隔离检查（强制）
- 一次提交不能包含多个职能的文件
- 所有代码和文档必须在同一职能范围内

### 2. History 文档检查（强制）
- 必须在 `history/{branch-name}/` 目录下创建记录文件
- 文件名格式：`YYYY-MM-DD_HHMM_描述.md`
- 文件创建时间必须在提交前 3 小时内

## 豁免文件
以下文件变更不触发职能隔离检查：
- `history/*` - 历史记录
- `report/*` - 审计报告
- `.github/*` - CI/CD 配置
- `README.md` - 项目说明
- `.gitignore` - Git 配置

## 关联任务
- [DEV-001] 建立提交规范检查机制
- [DEV-002] 完善项目目录结构

## 备注
此提交为 meta 配置变更，不涉及具体业务代码。
