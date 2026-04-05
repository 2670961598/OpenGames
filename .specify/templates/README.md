# Spec-kit 模板目录

> Web游戏平台项目的规范模板集合

---

## 文件说明

| 文件 | 用途 | 使用时机 |
|-----|------|---------|
| `project-context.md` | **技术上下文** - 项目技术栈定义 | 所有模板引用 |
| `project-structure-reference.md` | **目录结构** - 与 blueprint 同步 | 规划文件位置时 |
| `testing-strategy.md` | **测试策略** - 省心测试方案 | 设计测试时 |
| `spec-template*.md` | **功能规范** - 按 scope 选择 | 创建新功能时 |
| `plan-template.md` | **实现计划** - 技术方案 | spec 之后 |
| `tasks-template.md` | **任务分解** - 可执行单元 | plan 之后 |
| `checklist-template.md` | **检查清单** - 验收标准 | 完成时 |

---

## 使用流程

### 1. 创建新功能规范

根据 scope 选择对应的 spec 模板：

```bash
# 客户端前端功能 (src/)
cp spec-template-client-frontend.md specs/001-user-system/spec.md

# 客户端后端功能 (src-tauri/)
cp spec-template-client-backend.md specs/002-game-manager/spec.md

# 服务端功能 (src-server/)
cp spec-template-server.md specs/003-auth-api/spec.md
```

### 2. 填写规范

参考 `project-context.md` 中的技术栈信息，填写：
- 用户故事
- 功能需求
- 契约定义（与另一端的对齐）

### 3. 生成实现计划

```bash
cp plan-template.md ../specs/001-user-system/plan.md
```

填写技术方案，引用 `project-context.md` 中的框架版本。

### 4. 生成任务列表

```bash
cp tasks-template.md ../specs/001-user-system/tasks.md
```

按用户故事分解任务，参考 `testing-strategy.md` 添加测试任务。

### 5. 开发完成后检查

```bash
cp checklist-template.md ../specs/001-user-system/checklist.md
```

逐项勾选验收。

---

## 关键原则

### 代码复用 (重要)

> **src-tauri (客户端后端) 和 src-server (服务端) 共享 `crates/shared/`**

- 业务逻辑放在 `crates/shared/src/services/`
- 数据模型放在 `crates/shared/src/models/`
- 客户端/服务端仅实现薄层（命令/handler）

### 测试省心模式

1. **同文件测试**: 测试代码紧邻被测代码
2. **Mock 测试业务逻辑**: 不依赖外部服务
3. **契约即测试**: 用 Zod/Rust 类型自动验证

### 契约定义

你提到会手动控制契约，建议在功能启动时：

1. 先定义两端接口（OpenAPI / Rust Trait）
2. 再并行/串行实现各自端
3. 最后联调验证

---

## 目录结构

```
.specify/templates/
├── README.md                              # 本文件
├── project-context.md                     # 技术上下文
├── project-structure-reference.md         # 目录结构参考
├── testing-strategy.md                    # 测试策略
├── spec-template.md                       # 通用 spec 模板
├── spec-template-client-frontend.md       # 前端专用
├── spec-template-client-backend.md        # 客户端后端专用
├── spec-template-server.md                # 服务端专用
├── plan-template.md                       # 实现计划
├── tasks-template.md                      # 任务列表
└── checklist-template.md                  # 检查清单
```

---

## 更新模板

当技术栈变更时，只需修改：
1. `project-context.md` - 更新版本号
2. `project-structure-reference.md` - 同步目录变化

所有其他模板引用这两个文件，自动保持一致。

---

**最后更新**: 2026-04-05
