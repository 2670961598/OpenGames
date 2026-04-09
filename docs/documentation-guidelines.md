# 项目文档规范指南

## 概述

本文档定义了项目中文档的维护规范，确保项目知识的可追溯性和可维护性。

## 文档目录结构

```
project-root/
├── docs/           # 技术规范和开发文档
├── history/        # 提交历史记录（按分支组织）
├── report/         # 审计、检查报告
└── src/            # 源代码
```

## 各目录用途

### 1. docs/ - 技术文档

存放技术规范、实现文档和开发指南。

**文件类型：**
- 技术实现总结（如多窗口实现）
- 组件开发规范
- 主题系统规范
- API 使用指南

**命名规范：**
- 使用小写字母和连字符
- 格式：`主题-简要描述.md`
- 示例：`tauri-multi-window-implementation.md`

**更新时机：**
- 实现新功能后必须更新
- 技术方案变更时更新
- 发现最佳实践时补充

### 2. history/ - 提交历史

记录每次提交的详细信息，按分支组织。

**目录结构：**
```
history/
└── {branch-name}/
    └── YYYY-MM-DD_HHMM_简述.md
```

**文件命名：**
```
YYYY-MM-DD_HHMM_简要描述.md

示例：
2026-04-07_0139_Implement-multi-window-game-platform.md
```

**文件内容模板：**
```markdown
# YYYY-MM-DD HH:MM - 提交标题

## 提交信息
```
Commit: {hash}
Author: {name}
Date: {date}
Branch: {branch}
```

## 变更概述
简要描述本次提交的目的和主要内容。

## 文件变更

### 新增文件
| 文件 | 用途 |
|------|------|
| `src/...` | 描述 |

### 修改文件
| 文件 | 变更内容 |
|------|----------|
| `src/...` | 描述 |

### 删除文件
| 文件 | 原因 |
|------|------|
| `src/...` | 描述 |

## 技术要点
详细的技术实现说明、关键代码片段。

## 遇到的问题及解决方案
记录开发过程中遇到的问题和解决方法。

## 使用方法
如何使���新功能的示例代码。

## 关联任务
- [TASK-001] 任务描述

## 备注
其他需要记录的信息。
```

**更新时机：**
- 每次代码提交后必须创建对应的 history 文件
- 即使是很小的提交也需要记录
- 提交前未完成的功能，完成后补充记录

### 3. report/ - 审计报告

存放代码审计、检查结果和修复报告。

**文件类型：**
- 代码审计报告
- 规范检查结果
- 修复记录

**命名规范：**
```
{类型}-{日期}[-fixed].md

示例：
audit-report-2026-04-06.md
audit-report-2026-04-06-fixed.md
```

**更新时机：**
- 完成代码审计后立即创建
- 修复问题后创建 -fixed 版本
- 定期检查后更新

## 文档维护流程

### 开发流程

1. **开发功能**
   ```
   编写代码 → 本地测试 → 准备提交
   ```

2. **创建文档**
   ```
   创建 history 文件（必须）
   如需要，更新或创建 docs/ 技术文档
   如需要，创建 report/ 审计记录
   ```

3. **提交代码**
   ```
   git add -A
   git commit -m "提交信息"
   ```

### 提交前检查清单

- [ ] 代码功能完整
- [ ] 本地测试通过
- [ ] 已创建 history/ 记录
- [ ] 如有技术变更，已更新 docs/
- [ ] 如有问题修复，已更新 report/

### 提交信息规范

**格式：**
```
简要描述

- 详细变更点1
- 详细变更点2

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
```

**示例：**
```
Implement user authentication

- Add login form component
- Integrate with backend API
- Add session management
- Update routing guards

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
```

## 文档质量要求

### 必须包含

1. **History 文件**
   - 提交基本信息（hash、日期、作者）
   - 变更概述
   - 文件变更列表

2. **Docs 技术文档**
   - 需求背景
   - 技术方案
   - 实现细节
   - 使用示例

3. **Report 审计报告**
   - 审计范围
   - 发现的问题
   - 修复建议
   - 修复结果

### 可选补充

- 遇到的问题及解决方案
- 参考链接
- 截图或示意图
- 性能数据

## 常见场景处理

### 场景1：修复 Bug

1. 修复代码
2. 创建 history 文件记录修复
3. 如需要，创建 report/audit-report-xxx-fixed.md
4. 提交代码

### 场景2：实现新功能

1. 实现代码
2. 创建详细的 history 文件
3. 创建 docs/ 技术实现文档（如技术复杂）
4. 提交代码

### 场景3：代码重构

1. 重构代码
2. 创建 history 文件说明重构内容
3. 更新相关的 docs/ 文档
4. 提交代码

### 场景4：审计检查

1. 执行审计检查
2. 创建 report/audit-report-xxx.md 记录问题
3. 修复问题
4. 创建 report/audit-report-xxx-fixed.md 记录修复
5. 创建 history 文件记录提交
6. 提交代码

## 工具命令

### 创建新的 history 文件

```bash
# 获取最新提交信息
git log -1 --pretty=format:"%h|%ci|%s"

# 创建文件（替换变量）
touch "history/$(git branch --show-current)/YYYY-MM-DD_HHMM_描述.md"
```

### 查看提交历史

```bash
# 查看当前分支历史
git log --oneline

# 查看详细历史
git log --pretty=format:"%h - %an, %ar : %s"
```

## 注意事项

1. **及时性**：提交后应立即创建对应的 history 文件
2. **准确性**：确保文档内容与代码变更一致
3. **完整性**：不要遗漏重要的技术细节
4. **可追溯性**：通过 history 能快速了解任何提交的内容

## 审核标准

Code Review 时应检查：

- [ ] 代码变更是否合理
- [ ] 是否创建了对应的 history 文件
- [ ] 文档描述是否准确清晰
- [ ] 技术文档是否需要更新

---

**最后更新：** 2026-04-07
**维护者：** Ye QingXin
