# 2026-04-14 11:08 - Add server business layer

## 提交信息
```
Branch: 002-server-spec
Scope: server (code)
```

## 变更概述
建立服务端业务层（`og-service`），实现游戏用例和规则校验。

## 文件变更

### 新增文件
- `src-server/crates/og-service/Cargo.toml` — service crate 配置
- `src-server/crates/og-service/src/lib.rs` — 模块导出
- `src-server/crates/og-service/src/game_service.rs` — `GameService` trait、`GameServiceImpl` 实现及 mock 单元测试
