# 测试策略 - 省心方案

> 目标：用最小的维护成本，获得可靠的测试保护
> 原则：测试写一次，长期受益；避免过度设计

---

## 核心原则

1. **测试金字塔简化版**：重点放在单元测试，关键路径加 E2E
2. **自动生成优先**：利用 Rust/TS 的类型系统和生成工具
3. **同文件测试**：测试代码紧挨着被测代码，降低维护成本
4. **契约即测试**：API 契约定义本身就构成测试边界

---

## 客户端前端 (Vue 3 + TypeScript)

### 推荐工具组合

| 层级 | 工具 | 用途 | 配置复杂度 |
|-----|------|------|-----------|
| 单元测试 | Vitest | Composables, Utils, Stores | 低 |
| 组件测试 | @vue/test-utils + Vitest | 组件渲染和交互 | 低 |
| E2E | Playwright | 关键用户流程 | 中 |
| 类型测试 | tsd / 直接使用 TS | 类型约束即测试 | 零 |

### 省心模式

#### 1. 同文件测试 (最省心)

```typescript
// composables/useCounter.ts
import { ref } from 'vue'

export function useCounter(initial = 0) {
  const count = ref(initial)
  const increment = () => count.value++
  return { count, increment }
}

// === 测试就在下面 ===
// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest'

describe('useCounter', () => {
  it('should start with initial value', () => {
    const { count } = useCounter(10)
    expect(count.value).toBe(10)
  })
  
  it('should increment', () => {
    const { count, increment } = useCounter()
    increment()
    expect(count.value).toBe(1)
  })
})
```

**配置** (vite.config.ts):
```typescript
export default defineConfig({
  test: {
    include: ['src/**/*.{test,spec}.{js,ts}', 'src/**/*.ts'], // 包含源码文件
    includeSource: ['src/**/*.ts'], // 提取源码中的测试
  }
})
```

#### 2. Store 测试 (Pinia)

```typescript
// stores/game.ts
import { defineStore } from 'pinia'

export const useGameStore = defineStore('game', () => {
  const games = ref<Game[]>([])
  const addGame = (game: Game) => games.value.push(game)
  
  return { games, addGame }
})

// === 测试 ===
import { setActivePinia, createPinia } from 'pinia'

describe('useGameStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })
  
  it('should add game', () => {
    const store = useGameStore()
    store.addGame({ id: '1', name: 'Test' })
    expect(store.games).toHaveLength(1)
  })
})
```

#### 3. API 契约测试 (最省心的集成测试)

```typescript
// services/api.ts
import { z } from 'zod'

// 用 Zod 定义契约 = 运行时类型检查 + 测试
const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
})

export async function fetchUser(id: string) {
  const res = await fetch(`/api/users/${id}`)
  const data = await res.json()
  return UserSchema.parse(data) // 自动验证，失败即测试失败
}

// === 测试 ===
describe('fetchUser', () => {
  it('should parse valid user', async () => {
    // MSW 拦截请求
    server.use(
      rest.get('/api/users/1', (req, res, ctx) => {
        return res(ctx.json({ id: '1', name: 'Test', email: 'test@example.com' }))
      })
    )
    
    const user = await fetchUser('1')
    expect(user.name).toBe('Test')
  })
  
  it('should throw on invalid data', async () => {
    server.use(
      rest.get('/api/users/2', (req, res, ctx) => {
        return res(ctx.json({ id: '2' })) // 缺少字段
      })
    )
    
    await expect(fetchUser('2')).rejects.toThrow()
  })
})
```

#### 4. E2E 只测关键路径

只测最重要的 3-5 个流程，例如：
- 用户登录 → 下载游戏 → 启动游戏
- 创建房间 → 加入房间 → 开始游戏

```typescript
// e2e/game-lifecycle.spec.ts
test('complete game lifecycle', async ({ page }) => {
  // 登录
  await page.goto('/login')
  await page.fill('[name=email]', 'test@example.com')
  await page.fill('[name=password]', 'password')
  await page.click('button[type=submit]')
  
  // 下载游戏
  await page.goto('/store')
  await page.click('[data-testid=game-card]:first-child')
  await page.click('[data-testid=download-btn]')
  await expect(page.locator('[data-testid=progress]')).toContainText('100%')
  
  // 启动
  await page.goto('/library')
  await page.click('[data-testid=launch-btn]')
  await expect(page.locator('iframe')).toBeVisible()
})
```

---

## Rust 端 (src-tauri + src-server)

### 推荐工具组合

| 层级 | 工具 | 用途 | 配置 |
|-----|------|------|------|
| 单元测试 | cargo test | 业务逻辑 | 内置 |
| 模拟 | mockall | 替换依赖 | 简单 |
| 集成测试 | sqlx::test | 数据库测试 | 自动回滚 |
| 契约测试 | jsonschema / insta | 快照测试 | 自动更新 |

### 省心模式

#### 1. 分层测试策略

```rust
// crates/shared/src/services/game_service.rs

pub struct GameService<R: GameRepo> {
    repo: R,
}

impl<R: GameRepo> GameService<R> {
    pub async fn launch(&self, id: &str) -> Result<GameSession, Error> {
        let game = self.repo.find(id).await?;
        // 业务逻辑...
        Ok(GameSession::new(game))
    }
}

// === 测试: 使用 Mock，无需数据库 ===
#[cfg(test)]
mod tests {
    use super::*;
    use mockall::predicate::*;
    
    #[tokio::test]
    async fn test_launch_game() {
        // 创建 Mock
        let mut mock = MockGameRepo::new();
        mock.expect_find()
            .with(eq("game-1"))
            .times(1)
            .returning(|_| Ok(Game::default()));
        
        // 测试业务逻辑
        let service = GameService::new(mock);
        let result = service.launch("game-1").await;
        
        assert!(result.is_ok());
    }
    
    #[tokio::test]
    async fn test_launch_not_found() {
        let mut mock = MockGameRepo::new();
        mock.expect_find()
            .returning(|_| Err(Error::NotFound));
        
        let service = GameService::new(mock);
        let result = service.launch("invalid").await;
        
        assert!(matches!(result, Err(Error::NotFound)));
    }
}
```

**Mock 自动生成** (用 mockall):
```rust
// crates/shared/src/traits.rs
use mockall::automock;

#[automock] // 自动生成 MockGameRepo
pub trait GameRepo {
    async fn find(&self, id: &str) -> Result<Game, Error>;
}
```

#### 2. 数据库测试 (sqlx::test)

```rust
// src-server/tests/db_test.rs
use sqlx::PgPool;

#[sqlx::test] // 自动创建事务，测试完回滚
async fn test_user_repo(pool: PgPool) {
    let repo = UserRepo::new(pool);
    
    // 创建用户
    let user = repo.create("test@example.com", "password").await.unwrap();
    
    // 查询验证
    let found = repo.find_by_email("test@example.com").await.unwrap();
    assert_eq!(found.id, user.id);
    
    // 测试结束，事务自动回滚，数据库干净
}
```

#### 3. HTTP 集成测试 (使用真实 Server)

```rust
// src-server/tests/api_test.rs
use axum::http::StatusCode;

struct TestApp {
    client: reqwest::Client,
    base_url: String,
}

impl TestApp {
    async fn new() -> Self {
        let app = create_app().await;
        // 绑定随机端口
        let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();
        let port = listener.local_addr().unwrap().port();
        
        tokio::spawn(async move {
            axum::serve(listener, app).await.unwrap();
        });
        
        Self {
            client: reqwest::Client::new(),
            base_url: format!("http://127.0.0.1:{}", port),
        }
    }
    
    async fn post(&self, path: &str, body: serde_json::Value) -> reqwest::Response {
        self.client
            .post(format!("{}{}", self.base_url, path))
            .json(&body)
            .send()
            .await
            .unwrap()
    }
}

#[tokio::test]
async fn test_register_api() {
    let app = TestApp::new().await;
    
    let res = app.post("/api/v1/auth/register", json!({
        "email": "test@example.com",
        "password": "SecurePass123!",
    })).await;
    
    assert_eq!(res.status(), StatusCode::CREATED);
}
```

#### 4. 快照测试 (insta)

用于测试复杂结构的输出，自动管理预期结果:

```rust
// 测试响应结构变化
#[test]
fn test_game_list_response() {
    let games = vec![
        Game { id: "1".into(), name: "Game A".into() },
        Game { id: "2".into(), name: "Game B".into() },
    ];
    
    // 第一次运行创建快照，后续对比
    insta::assert_json_snapshot!(games);
}

// 更新快照: cargo insta review
```

---

## 测试工作流 (CI/CD)

```yaml
# .github/workflows/test.yml
name: Test

on: [push, pull_request]

jobs:
  # 1. 快速反馈: 单元测试 (1-2分钟)
  unit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      # Rust 测试
      - name: Rust Unit Tests
        run: cargo test --lib  # 只跑单元测试
      
      # TS 测试
      - name: Vitest
        run: pnpm test:unit

  # 2. 集成测试 (5-10分钟)
  integration:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
      redis:
        image: redis:7
    steps:
      - name: Rust Integration Tests
        run: cargo test --test '*'
      
      - name: E2E Tests
        run: pnpm test:e2e
```

---

## 省心检查清单

### 每次写功能时

- [ ] 同文件测试: 核心函数旁写 2-3 个测试
- [ ] 用 Mock 测试业务逻辑，不依赖外部服务
- [ ] 契约用 Zod/Rust 类型定义，自动验证

### 每周/迭代

- [ ] 运行 `cargo test` 和 `pnpm test`，看是否有失败
- [ ] 如有 API 变更，更新快照 `cargo insta review`

### 不需要做的 (过度设计)

- [ ] 追求 100% 覆盖率 (80% 核心业务即可)
- [ ] 为简单的类型转换写测试
- [ ] 为 UI 细节写大量单元测试 (留给 E2E)
- [ ] 手动维护测试数据 (用工厂函数/Fixture)

---

## 推荐库速查

### TypeScript
```bash
# 测试框架
pnpm add -D vitest @vue/test-utils happy-dom

# Mock HTTP
pnpm add -D msw

# 类型验证
pnpm add zod
```

### Rust
```bash
# 测试增强
cargo add --dev mockall insta

# 数据库测试 (已在 Cargo.toml)
# sqlx = { features = ["runtime-tokio", "postgres"] }
```

---

**核心思想**: 测试是为了让你**放心重构**，不是为了追求数字。够用的测试 + 良好的架构 = 省心的维护。
