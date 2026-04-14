# 2026-04-14 11:05 - Add server documentation

## 提交信息
```
Branch: 002-server-spec
Scope: server (docs)
```

## 变更概述
添加服务端技术文档体系，删除旧的占位文档。

## 文件变更

### 新增文件
- `docs/server/server-architecture.md` — 三层架构规范
- `docs/server/error-handling.md` — 统一 `AppError` 语义化错误处理规范
- `docs/server/logging-guidelines.md` — `tracing` 分层日志规范
- `docs/server/testing-guidelines.md` — 测试金字塔与 mock 测试规范
- `docs/server/backend-development-notes.md` — 后端开发注意事项

### 删除文件
- `docs/server/服务器开发规范.md` — 被 5 份详细文档替代
