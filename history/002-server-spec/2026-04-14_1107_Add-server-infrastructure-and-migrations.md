# 2026-04-14 11:07 - Add server infrastructure and migrations

## 提交信息
```
Branch: 002-server-spec
Scope: server (code)
```

## 变更概述
建立服务端基础设施层（`og-infra`）和初始数据库迁移脚本。

## 文件变更

### 新增文件
- `src-server/migrations/20250413180000_init.sql` — 初始 PG schema（用户、游戏、版本、标签、存档）
- `src-server/crates/og-infra/Cargo.toml` — infra crate 配置
- `src-server/crates/og-infra/src/lib.rs` — 数据库连接池初始化
- `src-server/crates/og-infra/src/repository/mod.rs` — 仓库模块导出
- `src-server/crates/og-infra/src/repository/pg_game_repository.rs` — `GameRepository` 的 PostgreSQL 实现
