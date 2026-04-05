---
description: "检查清单模板"
type: template
---

# [CHECKLIST TYPE] 检查清单: [FEATURE NAME]

**目的**: [简述此检查清单覆盖的内容]
**Created**: [DATE]
**Feature**: [链接到 spec.md]

---

## 代码质量

- [ ] CHK001 代码通过 lint 检查 (ESLint/clippy)
- [ ] CHK002 代码已格式化 (Prettier/rustfmt)
- [ ] CHK003 无编译警告
- [ ] CHK004 公共 API 有文档注释

## 测试

- [ ] CHK005 核心逻辑有单元测试
- [ ] CHK006 测试通过 (`cargo test` / `pnpm test`)
- [ ] CHK007 手动验证通过

## 功能完整性

- [ ] CHK008 满足 spec.md 中的所有需求
- [ ] CHK009 Edge cases 已处理
- [ ] CHK010 错误处理完善

## 集成

- [ ] CHK011 与其他端的接口已对齐
- [ ] CHK012 共享代码已放在正确位置

## 文档

- [ ] CHK013 README 已更新 (如需要)
- [ ] CHK014 变更已记录

---

**使用方法**: 完成后勾选 `[x]`，可内联添加评论。
