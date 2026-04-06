---
description: "游戏平台客户端前端 - 无边框窗口、沙箱游戏、快捷键拦截"
type: feature
scope: client-frontend
---

# Feature Specification: 游戏平台客户端前端

**Feature Branch**: `001-game-platform-client`  
**Created**: 2026-04-05  
**Status**: Draft  
**Scope**: src/ (客户端前端)

---

## 技术上下文

- **框架**: Vue 3.4+ (Composition API)
- **语言**: TypeScript 5.3+
- **状态**: Pinia 2.1+
- **UI**: shadcn-vue + Tailwind CSS
- **构建**: Vite 5.0+
- **测试**: Vitest + Playwright
- **打包**: Tauri (Windows/Mac 桌面应用)

---

## 用户场景 *(mandatory)*

### User Story 1 - 无边框窗口与视觉体验 (Priority: P1)

作为玩家，我希望应用拥有美观的无边框窗口外观，界面元素多而不乱、清晰直接，这样我能获得沉浸式的游戏体验。

**Acceptance Scenarios**:

1. **Given** 应用启动, **When** 窗口显示, **Then** 采用无边框设计（无系统标题栏），视觉美观整洁
2. **Given** 界面展示多个功能模块, **When** 用户浏览, **Then** 布局清晰、信息层级明确，不感觉混乱

**Tauri 集成点**:
- 调用命令: `set_window_decorations(false)` - 设置无边框
- 调用命令: `set_title_bar_style(Overlay)` - macOS 交通灯按钮覆盖模式

---

### User Story 2 - 浏览器快捷键拦截 (Priority: P1)

作为平台运营方，我需要拦截所有浏览器级别的快捷键，确保用户只能使用我们定义的快捷键，无法通过 Ctrl+W/H/J 等触发浏览器默认行为。

**Acceptance Scenarios**:

1. **Given** 用户按下 Ctrl+W, **When** 在应用窗口内, **Then** 不触发浏览器关闭标签页行为（被拦截或重定义）
2. **Given** 用户按下 Ctrl+H/Ctrl+J, **When** 在应用窗口内, **Then** 不触发浏览器历史/下载页面
3. **Given** 用户按下 Cmd+W (Mac), **When** 在应用窗口内, **Then** 按平台策略处理（可关闭窗口但不退出应用）
4. **Given** 用户按下系统级快捷键如 Alt+Tab/Cmd+Tab, **When** 任何时刻, **Then** 不受拦截（正常切换应用）

**Tauri 集成点**:
- 前端监听: `keydown` 事件，阻止默认行为
- 调用命令: `register_global_shortcut` - 注册应用级快捷键

---

### User Story 3 - 游戏沙箱与输入隔离 (Priority: P1)

作为玩家，当我玩游戏时，我希望游戏运行在一个隔离的沙箱环境中，游戏内的按键操作不会影响到外部页面（如方向键不会滚动页面），获得纯粹的游戏体验。

**Acceptance Scenarios**:

1. **Given** 游戏在子窗口/iframe中运行, **When** 用户按下方向键/空格键等游戏控制键, **Then** 页面不滚动、不触发浏览器默认行为
2. **Given** 游戏处于焦点状态, **When** 用户进行游戏操作, **Then** 按键事件仅传递给游戏，不冒泡到外层
3. **Given** 游戏运行中, **When** 游戏需要特殊权限（如存储、网络）, **Then** 在沙箱限制内按策略处理

**Tauri 集成点**:
- 调用命令: `create_webview` - 创建隔离的游戏渲染视图
- 监听事件: `keyboard-event` - 拦截并路由键盘事件

---

### User Story 4 - 首页导航与Tab切换 (Priority: P1)

作为玩家，我希望首页顶部有清晰的导航Tab，可以在推荐、游戏库、个人页面、创作者页面之间快速切换，并能看到自己的登录状态。

**Acceptance Scenarios**:

1. **Given** 用户打开应用, **When** 首页加载, **Then** 顶部显示4个Tab：推荐、游戏库、个人页面、创作者页面
2. **Given** 用户已登录, **When** 查看顶部区域, **Then** 显示用户头像和昵称
3. **Given** 用户未登录, **When** 查看顶部区域, **Then** 显示注册/登录按钮
4. **Given** 用户点击某个Tab, **When** 切换完成, **Then** 显示对应页面内容（当前为占位，后续逐个实现）

**Tauri 集成点**:
- 调用命令: `get_user_session` - 获取登录状态
- 调用命令: `navigate_to` - 页面导航（如需原生跳转）

---

### User Story 5 - 创作者页面入口 (Priority: P2)

作为游戏创作者，我希望有一个专门的创作者页面入口，这样我可以上传和管理自己制作的游戏。

**Acceptance Scenarios**:

1. **Given** 用户点击"创作者页面"Tab, **When** 页面加载, **Then** 显示创作者功能入口（具体功能后续迭代）

---

### Edge Cases

- **多窗口快捷键**: 如果用户打开多个游戏窗口，快捷键如何分配？
  - [需要澄清]: 快捷键是全局生效还是仅聚焦窗口生效？
- **游戏全屏**: 游戏需要全屏时如何处理？
  - 支持游戏请求全屏，此时完全独占输入
- **沙箱逃逸**: 如果游戏尝试跳出沙箱（如 `window.parent` 操作）？
  - 使用 `sandbox` 属性限制，必要时通过 postMessage 受控通信
- **窗口调整**: 用户调整窗口大小时，游戏画面如何适配？
  - 游戏容器保持比例或自适应，根据游戏类型决定

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: 应用窗口必须采用无边框设计，移除系统默认标题栏
- **FR-002**: 必须拦截浏览器级别的快捷键（Ctrl+W, Ctrl+H, Ctrl+J, Ctrl+Shift+T 等），拦截后暂不做任何执行，保留接口后续扩展
- **FR-003**: 系统级快捷键（Alt+Tab, Cmd+Tab 等）不得拦截，正常响应
- **FR-004**: 游戏必须在沙箱环境中运行，与主应用隔离
- **FR-005**: 游戏运行时必须隔离输入事件，防止方向键等触发页面滚动
- **FR-006**: 首页顶部必须显示4个Tab导航：推荐、游戏库、个人页面、创作者页面
- **FR-007**: 根据登录状态显示用户头像昵称（已登录）或注册按钮（未登录）
- **FR-008**: Tab切换时必须更新路由并显示对应页面内容
- **FR-009**: 界面设计要求多而不乱，信息层级清晰，视觉美观
- **FR-010**: 四个Tab的内部功能暂不实现，保留扩展接口
- **FR-011**: 游戏内容必须通过后端请求获取，前端不处理本地游戏文件或远程URL的直接加载逻辑
- **FR-012**: 游戏加载的所有逻辑（包括远程资源）统一由后端控制，前端仅与后端交互

### Key Entities

- **User**: 玩家/创作者，包含头像、昵称、登录状态
- **Game**: 游戏内容，运行在沙箱容器中
- **Tab**: 导航标签，当前激活状态
- **Window**: 应用窗口，无边框、可拖动调整

---

## 文件清单

```
src/
├── components/
│   ├── layout/
│   │   ├── AppWindow.vue           # 无边框窗口容器（拖动、最大化/还原、关闭）
│   │   ├── TitleBar.vue            # 自定义标题栏（拖动区域、窗口控制按钮）
│   │   ├── TabNavigation.vue       # 顶部4个Tab导航
│   │   └── UserProfile.vue         # 用户头像/昵称/登录按钮
│   ├── game/
│   │   ├── GameSandbox.vue         # 游戏沙箱容器（iframe/webview）
│   │   ├── GameContainer.vue       # 游戏运行环境（包裹沙箱）
│   │   └── GameLoader.vue          # 游戏加载组件（向后端请求）
│   └── ui/                         # shadcn-vue 基础组件
├── composables/
│   ├── useWindowControls.ts        # 窗口控制（最小化、最大化、关闭、多窗口）
│   ├── useKeyboardInterceptor.ts   # 浏览器快捷键拦截（预留接口）
│   ├── useGameLoader.ts            # 游戏加载逻辑（对接后端）
│   └── useAuth.ts                  # 用户认证状态
├── stores/
│   ├── auth.ts                     # 用户登录状态
│   ├── navigation.ts               # 当前Tab/路由状态
│   ├── window.ts                   # 窗口状态（最大化、焦点等）
│   └── game.ts                     # 游戏会话状态
├── types/
│   ├── user.ts                     # 用户类型定义
│   ├── game.ts                     # 游戏/会话类型定义
│   ├── window.ts                   # 窗口相关类型
│   └── ipc.ts                      # IPC 接口类型定义
├── services/
│   ├── tauri/
│   │   ├── window.ts               # Tauri 窗口API封装
│   │   ├── keyboard.ts             # 快捷键注册/拦截（预留）
│   │   └── auth.ts                 # 认证相关命令
│   └── game.ts                     # 游戏服务（统一向后端请求）
├── views/
│   ├── HomePage.vue                # 首页框架（含Tab导航）
│   ├── RecommendView.vue           # 推荐页面（占位）
│   ├── LibraryView.vue             # 游戏库页面（占位）
│   ├── ProfileView.vue             # 个人页面（占位）
│   └── CreatorView.vue             # 创作者页面（占位）
└── App.vue                         # 根组件（快捷键监听、全局样式）
```

---

## Tauri 契约

### 窗口控制

| 命令 | 输入 | 输出 | 错误处理 |
|-----|------|------|---------|
| `minimize_window` | `{}` | `Result<()>` | 静默处理 |
| `maximize_window` | `{}` | `Result<bool>` | 静默处理 |
| `close_window` | `{}` | `Result<()>` | 确认对话框 |
| `create_new_window` | `{ route?: string }` | `Result<WindowId>` | Toast 提示 |
| `close_window_by_id` | `{ windowId: string }` | `Result<()>` | 日志 |

### 用户认证

| 命令 | 输入 | 输出 | 错误处理 |
|-----|------|------|---------|
| `get_user_session` | `{}` | `Result<UserSession|null>` | Toast 提示 |
| `login` | `{ credential: LoginCredential }` | `Result<UserSession>` | Toast 提示 |
| `logout` | `{}` | `Result<()>` | Toast 提示 |

### 游戏加载（前端 -> 后端 -> 沙箱）

| 命令 | 输入 | 输出 | 错误处理 |
|-----|------|------|---------|
| `request_game` | `{ gameId: string }` | `Result<GameSession>` | Toast 提示 |
| `get_game_url` | `{ sessionId: string }` | `Result<string>` | Toast 提示 |
| `end_game_session` | `{ sessionId: string }` | `Result<()>` | 日志 |

### 快捷键（预留接口）

| 命令 | 输入 | 输出 | 错误处理 |
|-----|------|------|---------|
| `register_shortcut` | `{ shortcut: string }` | `Result<()>` | 日志 |
| `unregister_shortcut` | `{ shortcut: string }` | `Result<()>` | 日志 |
| `trigger_shortcut_action` | `{ action: string }` | `Result<()>` | 日志 |

> **注意**: 快捷键拦截后暂不做任何执行，仅调用 `trigger_shortcut_action` 预留接口

---

## 检查清单

- [ ] 无边框窗口实现，支持拖动和窗口控制
- [ ] 浏览器快捷键拦截列表完整（拦截后不执行，仅预留接口）
- [ ] 游戏沙箱容器实现，隔离输入事件
- [ ] 游戏加载统一走后端接口，前端不处理来源逻辑
- [ ] 4个Tab导航实现，路由切换正常
- [ ] 用户登录状态显示正确
- [ ] 界面视觉符合"多而不乱"要求
- [ ] 多窗口模式支持（或明确单窗口模式）

---

## 依赖

**依赖的其他功能**:
- [ ] `000-init` - 项目初始化
- [ ] `002-auth-system` - 用户认证系统（如未实现，可先模拟）

**被谁依赖**:
- [ ] 后续 Tab 具体功能实现
- [ ] 游戏上传/管理系统

---

## Assumptions

- 使用 Tauri v2 实现桌面窗口和系统级功能
- 游戏以 Web 形式运行（HTML5/WebGL），通过 Webview 加载
- 沙箱使用 iframe `sandbox` 属性或独立 Webview 实现
- 无边框窗口的拖动通过自定义标题栏区域实现
- 初期用户认证可模拟，后续接入真实 auth 系统

---

## 已确认决策

1. **快捷键策略**: 拦截后暂不做任何执行，仅保留 `trigger_shortcut_action` 接口后续扩展
2. **游戏来源**: 前端完全不处理游戏来源逻辑，统一通过 `request_game` -> 后端控制 -> 返回可加载的 URL
3. **窗口模式**: 最终打包可能支持多窗口模式（每个窗口独立请求后端），也可能是完全的单窗口模式（二选一）

---

## 备注

- 采用"边做边讨论，反向整理归档"的迭代方式
- 四个 Tab 的内部功能后续逐个实现
- 视觉设计追求"好看、清晰、直接、多而不乱"
