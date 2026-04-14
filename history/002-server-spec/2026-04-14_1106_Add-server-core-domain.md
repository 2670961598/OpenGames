# 2026-04-14 11:06 - Add server core domain

## 提交信息
```
Branch: 002-server-spec
Scope: server (code)
```

## 变更概述
建立服务端领域核心层（`og-core`）和 Workspace 根配置。

## 文件变更

### 新增文件
- `src-server/Cargo.toml` — Cargo Workspace 根配置
- `src-server/Cargo.lock` — 依赖锁定文件
- `src-server/crates/og-core/Cargo.toml` — core crate 配置
- `src-server/crates/og-core/src/lib.rs` — 模块导出
- `src-server/crates/og-core/src/error.rs` — `AppError` 枚举与 `IntoResponse`
- `src-server/crates/og-core/src/models.rs` — `User`、`Game`、`GameStatus` 等模型
- `src-server/crates/og-core/src/config.rs` — `AppConfig`、`DatabaseConfig`、`LoggingConfig`
- `src-server/crates/og-core/src/ports/mod.rs` — 端口模块导出
- `src-server/crates/og-core/src/ports/game_repository.rs` — `GameRepository` trait
