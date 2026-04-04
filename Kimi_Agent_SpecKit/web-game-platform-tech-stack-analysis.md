# Web游戏平台客户端技术选型方案

## 项目需求概述

### 核心需求
- **跨平台支持**：桌面端(Win/Mac/Linux) + 移动端(iOS/Android)
- **前后端分离架构**：前端负责游戏渲染/UI，后端负责下载/局域网/资源管理
- **游戏运行**：支持WebGL/WebAssembly游戏，可离线运行
- **局域网功能**：支持局域网游戏发现和联机
- **开发者偏好**：熟悉Tauri 2.0，喜欢前沿技术

---

## 方案一：Tauri 2.0 全栈方案（推荐）

### 技术组合清单

| 层级 | 技术选型 | 版本建议 |
|------|----------|----------|
| **主框架** | Tauri 2.0 | ^2.0.0 |
| **前端框架** | React 18 + TypeScript | ^18.2.0 |
| **UI组件库** | shadcn/ui + Tailwind CSS | latest |
| **状态管理** | Zustand | ^4.4.0 |
| **游戏渲染** | iframe + WebGL | Native |
| **本地后端** | Tauri Rust Core + Sidecar | ^2.0.0 |
| **本地HTTP服务器** | Tauri localhost plugin / axum | ^2.0.0 |
| **局域网发现** | mdns-sd (Rust) / UDP广播 | ^0.10.0 |
| **P2P通信** | WebRTC DataChannel | Native API |
| **本地存储** | Tauri Store Plugin + SQLite | ^2.0.0 |
| **构建工具** | Vite 5 | ^5.0.0 |

### 架构示意图

```
┌─────────────────────────────────────────────────────────────────┐
│                        前端层 (Frontend)                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │  React UI   │  │  Zustand    │  │    Game Container       │  │
│  │  (shadcn)   │◄─┤   Store     │◄─┤   (iframe/WebGL)        │  │
│  └──────┬──────┘  └──────┬──────┘  └─────────────────────────┘  │
│         │                │                                       │
│         └────────────────┘                                       │
│                   │                                              │
│              Tauri IPC (invoke)                                  │
└───────────────────┼──────────────────────────────────────────────┘
                    │
┌───────────────────┼──────────────────────────────────────────────┐
│                   ▼                                              │
│              Rust Core Layer                                     │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Commands: download_game, manage_resource, lan_discovery │   │
│  └──────────────────────────────────────────────────────────┘   │
│                    │                                             │
│      ┌─────────────┼─────────────┐                               │
│      ▼             ▼             ▼                               │
│  ┌────────┐  ┌──────────┐  ┌─────────────┐                      │
│  │  HTTP  │  │   mDNS   │  │   File      │                      │
│  │ Server │  │  (UDP)   │  │   System    │                      │
│  │(axum)  │  │          │  │             │                      │
│  └────────┘  └──────────┘  └─────────────┘                      │
└──────────────────────────────────────────────────────────────────┘
```

### 选择理由

1. **开发者熟悉度**：团队已有Tauri经验，学习成本低
2. **包体积极小**：Tauri应用通常<10MB，Electron通常>100MB
3. **内存占用低**：Tauri空闲时30-40MB，Electron 200-300MB
4. **启动速度快**：<500ms vs Electron 1-2秒
5. **真正的跨平台**：一套代码覆盖桌面端+移动端
6. **安全优先**：Rust后端，deny-by-default权限模型

### 核心优势

| 优势 | 说明 |
|------|------|
| **极致轻量** | 使用系统WebView，无需打包Chromium |
| **原生性能** | Rust后端提供接近原生的执行效率 |
| **统一代码库** | 桌面+移动端共享90%+代码 |
| **现代IPC** | v2改进的IPC使用自定义协议，性能接近HTTP |
| **插件生态** | 官方插件覆盖文件系统、HTTP、WebSocket、SQLite等 |
| **热更新** | 内置updater插件支持自动更新 |

### 潜在挑战

| 挑战 | 解决方案 |
|------|----------|
| **移动端成熟度** | Tauri移动端较新，需要更多测试；关键功能可用原生插件补充 |
| **CSS跨平台差异** | 不同WebView有细微CSS差异，需充分测试 |
| **Rust学习曲线** | 后端逻辑需要Rust，但基础命令学习成本可控 |
| **游戏兼容性** | 复杂WebGL游戏需测试各平台WebView支持 |

### 关键代码示例

#### 1. Tauri配置 (tauri.conf.json)
```json
{
  "productName": "GamePlatform",
  "version": "1.0.0",
  "identifier": "com.yourcompany.gameplatform",
  "build": {
    "frontendDist": "../dist",
    "devUrl": "http://localhost:5173"
  },
  "app": {
    "windows": [
      {
        "title": "Game Platform",
        "width": 1280,
        "height": 800,
        "resizable": true,
        "fullscreen": false
      }
    ]
  },
  "plugins": {
    "updater": {
      "pubkey": "YOUR_PUBLIC_KEY",
      "endpoints": ["https://your-server.com/updates.json"]
    },
    "fs": {
      "scope": ["$APPDATA/**", "$DOWNLOAD/**"]
    }
  }
}
```

#### 2. Rust后端命令 (src/lib.rs)
```rust
use tauri::State;
use std::sync::Mutex;

pub struct GamePlatformState {
    pub download_manager: Mutex<DownloadManager>,
    pub lan_discovery: Mutex<LanDiscovery>,
}

#[tauri::command]
async fn download_game(
    url: String,
    game_id: String,
    state: State<'_, GamePlatformState>
) -> Result<String, String> {
    let manager = state.download_manager.lock().unwrap();
    manager.download(&url, &game_id).await
}

#[tauri::command]
async fn discover_lan_games(
    state: State<'_, GamePlatformState>
) -> Result<Vec<LanGame>, String> {
    let discovery = state.lan_discovery.lock().unwrap();
    discovery.scan().await
}

#[tauri::command]
async fn launch_game(
    game_path: String,
    port: u16
) -> Result<(), String> {
    // 启动本地HTTP服务器服务游戏
    start_local_server(&game_path, port).await
}
```

#### 3. 前端调用 (React)
```typescript
import { invoke } from '@tauri-apps/api/core';
import { useGameStore } from './store';

// 下载游戏
const downloadGame = async (gameId: string, url: string) => {
  try {
    const result = await invoke<string>('download_game', { 
      url, 
      gameId 
    });
    useGameStore.getState().addDownloadedGame(gameId, result);
  } catch (error) {
    console.error('Download failed:', error);
  }
};

// 发现局域网游戏
const discoverGames = async () => {
  const games = await invoke<LanGame[]>('discover_lan_games');
  useGameStore.getState().setLanGames(games);
};
```

#### 4. 局域网发现实现 (Rust)
```rust
use mdns_sd::{ServiceDaemon, ServiceInfo};
use std::net::SocketAddr;

pub struct LanDiscovery {
    mdns: ServiceDaemon,
}

const SERVICE_TYPE: &str = "_gameplatform._tcp.local.";

impl LanDiscovery {
    pub fn new() -> Result<Self, Box<dyn std::error::Error>> {
        let mdns = ServiceDaemon::new()?;
        Ok(Self { mdns })
    }
    
    pub fn announce(&self, game_info: GameInfo, port: u16) -> Result<(), Box<dyn std::error::Error>> {
        let service_info = ServiceInfo::new(
            SERVICE_TYPE,
            &game_info.id,
            &format!("{}.{}", game_info.id, SERVICE_TYPE),
            "",
            port,
            &[
                ("name", &game_info.name),
                ("version", &game_info.version),
                ("players", &game_info.max_players.to_string()),
            ][..],
        )?;
        
        self.mdns.register(service_info)?;
        Ok(())
    }
    
    pub fn scan(&self) -> Result<Vec<DiscoveredGame>, Box<dyn std::error::Error>> {
        let receiver = self.mdns.browse(SERVICE_TYPE)?;
        // 收集发现的实例...
        Ok(games)
    }
}
```

#### 5. 本地HTTP服务器 (Rust - axum)
```rust
use axum::{Router, routing::get, response::Html};
use std::net::SocketAddr;
use tower_http::services::ServeDir;

pub async fn start_game_server(game_path: String, port: u16) -> Result<(), Box<dyn std::error::Error>> {
    let app = Router::new()
        .nest_service("/", ServeDir::new(&game_path))
        .route("/health", get(|| async { "OK" }));
    
    let addr = SocketAddr::from(([127, 0, 0, 1], port));
    
    tokio::spawn(async move {
        axum::serve(tokio::net::TcpListener::bind(addr).await.unwrap(), app)
            .await
            .unwrap();
    });
    
    Ok(())
}
```

#### 6. 前端状态管理 (Zustand)
```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Game {
  id: string;
  name: string;
  path: string;
  version: string;
}

interface GameStore {
  downloadedGames: Game[];
  lanGames: LanGame[];
  currentGame: Game | null;
  addDownloadedGame: (game: Game) => void;
  setLanGames: (games: LanGame[]) => void;
  launchGame: (gameId: string) => Promise<void>;
}

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      downloadedGames: [],
      lanGames: [],
      currentGame: null,
      addDownloadedGame: (game) => {
        set((state) => ({
          downloadedGames: [...state.downloadedGames, game]
        }));
      },
      setLanGames: (games) => set({ lanGames: games }),
      launchGame: async (gameId) => {
        const game = get().downloadedGames.find(g => g.id === gameId);
        if (game) {
          await invoke('launch_game', { 
            gamePath: game.path, 
            port: 8080 
          });
          set({ currentGame: game });
        }
      },
    }),
    {
      name: 'game-platform-storage',
    }
  )
);
```

### 适用场景
- ✅ 追求极致性能和包体积
- ✅ 团队熟悉Rust或愿意学习
- ✅ 需要同时支持桌面和移动端
- ✅ 对安全性要求较高
- ✅ 希望使用现代Web技术栈

---

## 方案二：Electron + React 成熟方案

### 技术组合清单

| 层级 | 技术选型 | 版本建议 |
|------|----------|----------|
| **主框架** | Electron 28+ | ^28.0.0 |
| **前端框架** | React 18 + TypeScript | ^18.2.0 |
| **UI组件库** | Ant Design / Material-UI | ^5.0.0 |
| **状态管理** | Zustand / Redux Toolkit | ^4.4.0 / ^2.0.0 |
| **游戏渲染** | iframe + WebGL | Native |
| **本地后端** | Node.js Main Process | Built-in |
| **本地HTTP服务器** | express / fastify | ^4.18.0 |
| **局域网发现** | bonjour / mdns | latest |
| **P2P通信** | simple-peer / WebRTC | ^9.11.0 |
| **本地存储** | electron-store / better-sqlite3 | latest |
| **构建工具** | electron-vite / electron-builder | latest |

### 架构示意图

```
┌─────────────────────────────────────────────────────────────────┐
│                    渲染进程 (Renderer Process)                    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │  React UI   │  │  Zustand    │  │    Game Container       │  │
│  │  (AntD)     │◄─┤   Store     │◄─┤   (iframe/WebGL)        │  │
│  └──────┬──────┘  └──────┬──────┘  └─────────────────────────┘  │
│         │                │                                       │
│         └────────────────┘                                       │
│                   │                                              │
│              Electron IPC (ipcRenderer)                          │
└───────────────────┼──────────────────────────────────────────────┘
                    │
┌───────────────────┼──────────────────────────────────────────────┐
│                   ▼                                              │
│              主进程 (Main Process) - Node.js                     │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  IPC Handlers: download, lan, fs, server management      │   │
│  └──────────────────────────────────────────────────────────┘   │
│                    │                                             │
│      ┌─────────────┼─────────────┐                               │
│      ▼             ▼             ▼                               │
│  ┌────────┐  ┌──────────┐  ┌─────────────┐                      │
│  │Express │  │  Bonjour │  │   Node.js   │                      │
│  │ Server │  │  (mDNS)  │  │   FS/API    │                      │
│  └────────┘  └──────────┘  └─────────────┘                      │
└──────────────────────────────────────────────────────────────────┘
```

### 选择理由

1. **生态最成熟**：Electron是最成熟的桌面应用框架，社区庞大
2. **Node.js生态**：可直接使用npm上数百万包
3. **调试便利**：Chrome DevTools + Node.js调试工具完善
4. **成功案例多**：VS Code、Slack、Discord等大规模应用验证
5. **团队熟悉**：多数前端开发者熟悉Electron

### 核心优势

| 优势 | 说明 |
|------|------|
| **生态丰富** | npm生态可直接使用，第三方库丰富 |
| **调试友好** | Chrome DevTools完善，调试体验好 |
| **文档完善** | 官方文档详尽，社区资源丰富 |
| **稳定性高** | 经过多年大规模应用验证 |
| **多窗口支持** | 成熟的多窗口管理能力 |

### 潜在挑战

| 挑战 | 影响 |
|------|------|
| **包体积大** | 需打包Chromium，应用>100MB |
| **内存占用高** | 空闲时200-300MB |
| **启动较慢** | 冷启动1-2秒 |
| **移动端不支持** | 仅桌面端，移动端需另选方案 |
| **安全问题** | Node.js集成需谨慎处理安全 |

### 关键代码示例

#### 1. Electron主进程 (main.js)
```javascript
const { app, BrowserWindow, ipcMain } = require('electron');
const express = require('express');
const bonjour = require('bonjour')();
const path = require('path');

let mainWindow;
let gameServer;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });
  
  mainWindow.loadURL('http://localhost:5173');
}

// IPC处理下载
ipcMain.handle('download-game', async (event, { url, gameId }) => {
  const downloadManager = new DownloadManager();
  return await downloadManager.download(url, gameId);
});

// IPC处理局域网发现
ipcMain.handle('discover-lan-games', async () => {
  return new Promise((resolve) => {
    const browser = bonjour.find({ type: 'gameplatform' });
    const games = [];
    
    browser.on('up', (service) => {
      games.push({
        name: service.name,
        host: service.host,
        port: service.port,
        addresses: service.addresses
      });
    });
    
    setTimeout(() => {
      browser.stop();
      resolve(games);
    }, 3000);
  });
});

// 启动本地游戏服务器
ipcMain.handle('start-game-server', async (event, { gamePath, port }) => {
  const server = express();
  server.use(express.static(gamePath));
  
  gameServer = server.listen(port, () => {
    console.log(`Game server running on port ${port}`);
  });
  
  return port;
});

app.whenReady().then(createWindow);
```

#### 2. Preload脚本 (preload.js)
```javascript
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  downloadGame: (url, gameId) => 
    ipcRenderer.invoke('download-game', { url, gameId }),
  discoverLanGames: () => 
    ipcRenderer.invoke('discover-lan-games'),
  startGameServer: (gamePath, port) => 
    ipcRenderer.invoke('start-game-server', { gamePath, port }),
  onDownloadProgress: (callback) => 
    ipcRenderer.on('download-progress', callback)
});
```

#### 3. 前端调用 (React)
```typescript
// 类型声明
declare global {
  interface Window {
    electronAPI: {
      downloadGame: (url: string, gameId: string) => Promise<string>;
      discoverLanGames: () => Promise<LanGame[]>;
      startGameServer: (gamePath: string, port: number) => Promise<number>;
      onDownloadProgress: (callback: (event: any, progress: number) => void) => void;
    };
  }
}

// 使用示例
const GameManager = () => {
  const handleDownload = async (game: Game) => {
    const result = await window.electronAPI.downloadGame(game.url, game.id);
    console.log('Downloaded to:', result);
  };
  
  const handleDiscover = async () => {
    const games = await window.electronAPI.discoverLanGames();
    setLanGames(games);
  };
  
  return (
    // ...
  );
};
```

### 适用场景
- ✅ 团队熟悉Node.js，不想学习Rust
- ✅ 需要丰富的npm生态支持
- ✅ 仅桌面端需求，不考虑移动端
- ✅ 对包体积不敏感
- ✅ 需要成熟的调试工具

---

## 方案三：Flutter + WebView 混合方案

### 技术组合清单

| 层级 | 技术选型 | 版本建议 |
|------|----------|----------|
| **主框架** | Flutter 3.16+ | ^3.16.0 |
| **前端框架** | Flutter Widgets + WebView | Native |
| **UI组件库** | Material 3 / Cupertino | Built-in |
| **状态管理** | Riverpod / Bloc | ^2.4.0 |
| **游戏渲染** | webview_flutter / flutter_inappwebview | ^6.0.0 |
| **本地后端** | Dart + FFI | Native |
| **本地HTTP服务器** | shelf / dart:io HttpServer | Built-in |
| **局域网发现** | multicast_dns / 自定义UDP | latest |
| **P2P通信** | flutter_webrtc | ^0.9.0 |
| **本地存储** | hive / sqflite | latest |
| **构建工具** | Flutter SDK | 3.16+ |

### 架构示意图

```
┌─────────────────────────────────────────────────────────────────┐
│                    Flutter UI Layer                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │  Material   │  │  Riverpod   │  │    WebView Container    │  │
│  │  Widgets    │◄─┤   State     │◄─┤   (Game Renderer)       │  │
│  └──────┬──────┘  └──────┬──────┘  └─────────────────────────┘  │
│         │                │                                       │
│         └────────────────┘                                       │
│                   │                                              │
│              Dart MethodChannel                                   │
└───────────────────┼──────────────────────────────────────────────┘
                    │
┌───────────────────┼──────────────────────────────────────────────┐
│                   ▼                                              │
│              Dart Service Layer                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Services: GameService, LanService, DownloadService      │   │
│  └──────────────────────────────────────────────────────────┘   │
│                    │                                             │
│      ┌─────────────┼─────────────┐                               │
│      ▼             ▼             ▼                               │
│  ┌────────┐  ┌──────────┐  ┌─────────────┐                      │
│  │  Dart  │  │Multicast │  │   Dart:io   │                      │
│  │ Server │  │   DNS    │  │   File API  │                      │
│  │(shelf) │  │          │  │             │                      │
│  └────────┘  └──────────┘  └─────────────┘                      │
└──────────────────────────────────────────────────────────────────┘
```

### 选择理由

1. **真正的原生性能**：Flutter编译为原生代码，性能最优
2. **UI一致性**：自绘引擎，各平台UI表现完全一致
3. **移动端优先**：移动端体验最佳，桌面端支持逐步完善
4. **热重载**：开发体验优秀，迭代速度快
5. **单一代码库**：一套Dart代码覆盖所有平台

### 核心优势

| 优势 | 说明 |
|------|------|
| **原生性能** | Dart编译为机器码，性能接近原生 |
| **UI一致性** | Skia自绘引擎，各平台像素级一致 |
| **热重载** | 开发效率极高 |
| **移动端体验** | 移动端流畅度最佳 |
| **包体积适中** | 比Electron小，比Tauri略大 |

### 潜在挑战

| 挑战 | 解决方案 |
|------|----------|
| **WebView集成** | 游戏渲染需嵌入WebView，增加复杂度 |
| **桌面端成熟度** | 桌面端支持相对较新，部分功能需适配 |
| **Dart生态** | 生态不如JavaScript丰富 |
| **学习曲线** | 需学习Dart和Flutter Widget系统 |
| **游戏性能** | WebView中的WebGL性能可能受限 |

### 关键代码示例

#### 1. Flutter主应用 (main.dart)
```dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:webview_flutter/webview_flutter.dart';

void main() {
  runApp(
    ProviderScope(
      child: GamePlatformApp(),
    ),
  );
}

class GamePlatformApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Game Platform',
      theme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.blue),
      ),
      home: HomeScreen(),
    );
  }
}
```

#### 2. 游戏WebView容器 (game_view.dart)
```dart
import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';

class GameView extends StatefulWidget {
  final String gameUrl;
  
  GameView({required this.gameUrl});
  
  @override
  _GameViewState createState() => _GameViewState();
}

class _GameViewState extends State<GameView> {
  late final WebViewController _controller;
  
  @override
  void initState() {
    super.initState();
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setBackgroundColor(const Color(0x00000000))
      ..setNavigationDelegate(
        NavigationDelegate(
          onProgress: (int progress) {
            // 更新加载进度
          },
          onPageStarted: (String url) {},
          onPageFinished: (String url) {},
          onWebResourceError: (WebResourceError error) {},
        ),
      )
      ..loadRequest(Uri.parse(widget.gameUrl));
  }
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Game'),
        actions: [
          IconButton(
            icon: Icon(Icons.fullscreen),
            onPressed: () {
              // 全屏模式
            },
          ),
        ],
      ),
      body: WebViewWidget(controller: _controller),
    );
  }
}
```

#### 3. 局域网发现服务 (lan_service.dart)
```dart
import 'package:multicast_dns/multicast_dns.dart';
import 'dart:io';

class LanDiscoveryService {
  static const String _serviceType = '_gameplatform._tcp';
  
  Future<List<DiscoveredGame>> discoverGames() async {
    final MDnsClient client = MDnsClient();
    final List<DiscoveredGame> games = [];
    
    await client.start();
    
    await for (final PtrResourceRecord ptr in client.lookup<PtrResourceRecord>(
      ResourceRecordQuery.serverPointer(_serviceType),
    )) {
      await for (final SrvResourceRecord srv in client.lookup<SrvResourceRecord>(
        ResourceRecordQuery.service(ptr.domainName),
      )) {
        games.add(DiscoveredGame(
          name: ptr.domainName,
          host: srv.target,
          port: srv.port,
        ));
      }
    }
    
    client.stop();
    return games;
  }
  
  Future<void> announceGame(GameInfo game, int port) async {
    // 使用自定义UDP广播作为备选
    final socket = await RawDatagramSocket.bind(InternetAddress.anyIPv4, 0);
    socket.broadcastEnabled = true;
    
    final message = jsonEncode({
      'type': 'game_announce',
      'name': game.name,
      'id': game.id,
      'port': port,
    });
    
    socket.send(
      message.codeUnits,
      InternetAddress('255.255.255.255'),
      5353,
    );
  }
}
```

#### 4. 本地HTTP服务器 (server_service.dart)
```dart
import 'package:shelf/shelf.dart';
import 'package:shelf/shelf_io.dart' as shelf_io;
import 'package:shelf_static/shelf_static.dart';

class LocalServerService {
  HttpServer? _server;
  
  Future<int> startServer(String gamePath, int port) async {
    final staticHandler = createStaticHandler(
      gamePath,
      defaultDocument: 'index.html',
    );
    
    final handler = const Pipeline()
      .addMiddleware(logRequests())
      .addHandler(staticHandler);
    
    _server = await shelf_io.serve(handler, 'localhost', port);
    
    return _server!.port;
  }
  
  Future<void> stopServer() async {
    await _server?.close();
    _server = null;
  }
}
```

#### 5. 状态管理 (Riverpod)
```dart
import 'package:flutter_riverpod/flutter_riverpod.dart';

// 游戏模型
class Game {
  final String id;
  final String name;
  final String path;
  final String version;
  
  Game({
    required this.id,
    required this.name,
    required this.path,
    required this.version,
  });
}

// 游戏列表状态
final gameListProvider = StateNotifierProvider<GameListNotifier, List<Game>>(
  (ref) => GameListNotifier(),
);

class GameListNotifier extends StateNotifier<List<Game>> {
  GameListNotifier() : super([]);
  
  void addGame(Game game) {
    state = [...state, game];
  }
  
  void removeGame(String id) {
    state = state.where((g) => g.id != id).toList();
  }
}

// 局域网游戏状态
final lanGamesProvider = StateNotifierProvider<LanGamesNotifier, List<DiscoveredGame>>(
  (ref) => LanGamesNotifier(),
);

class LanGamesNotifier extends StateNotifier<List<DiscoveredGame>> {
  LanGamesNotifier() : super([]);
  
  void updateGames(List<DiscoveredGame> games) {
    state = games;
  }
}
```

### 适用场景
- ✅ 追求原生性能和UI一致性
- ✅ 移动端体验优先
- ✅ 团队熟悉Dart或愿意学习
- ✅ 需要像素级一致的跨平台UI
- ✅ 游戏渲染需求相对简单

---

## 三套方案对比总结

| 维度 | 方案一：Tauri 2.0 | 方案二：Electron | 方案三：Flutter |
|------|------------------|------------------|----------------|
| **包体积** | ⭐⭐⭐⭐⭐ (<10MB) | ⭐ (100MB+) | ⭐⭐⭐ (20-50MB) |
| **内存占用** | ⭐⭐⭐⭐⭐ (30-40MB) | ⭐⭐ (200-300MB) | ⭐⭐⭐⭐ (80-120MB) |
| **启动速度** | ⭐⭐⭐⭐⭐ (<500ms) | ⭐⭐ (1-2s) | ⭐⭐⭐⭐ (<1s) |
| **桌面端成熟度** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **移动端成熟度** | ⭐⭐⭐ | ❌ 不支持 | ⭐⭐⭐⭐⭐ |
| **游戏渲染** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **开发体验** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **生态丰富度** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **学习曲线** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **安全性** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |

### 推荐建议

1. **首选方案一（Tauri 2.0）**：
   - 符合开发者技术偏好
   - 真正的全平台支持（桌面+移动）
   - 极致的性能和包体积
   - 现代化技术栈

2. **备选方案二（Electron）**：
   - 如果团队不熟悉Rust
   - 如果只需要桌面端
   - 如果需要丰富的npm生态

3. **考虑方案三（Flutter）**：
   - 如果移动端体验是最高优先级
   - 如果追求UI完全一致
   - 如果游戏渲染需求较简单

---

## 附录：依赖包清单

### 方案一（Tauri 2.0）依赖

```json
// package.json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "zustand": "^4.4.0",
    "@tauri-apps/api": "^2.0.0",
    "@tauri-apps/plugin-store": "^2.0.0",
    "@tauri-apps/plugin-http": "^2.0.0",
    "@tauri-apps/plugin-fs": "^2.0.0",
    "@tauri-apps/plugin-updater": "^2.0.0"
  },
  "devDependencies": {
    "@tauri-apps/cli": "^2.0.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@vitejs/plugin-react": "^4.0.0",
    "typescript": "^5.0.0",
    "vite": "^5.0.0"
  }
}
```

```toml
# Cargo.toml
[dependencies]
tauri = { version = "2.0", features = [] }
tauri-plugin-store = "2.0"
tauri-plugin-http = "2.0"
tauri-plugin-fs = "2.0"
tauri-plugin-updater = "2.0"
tauri-plugin-localhost = "2.0"
axum = "0.7"
mdns-sd = "0.10"
tokio = { version = "1", features = ["full"] }
serde = { version = "1", features = ["derive"] }
```

### 方案二（Electron）依赖

```json
// package.json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "zustand": "^4.4.0",
    "express": "^4.18.0",
    "bonjour": "^3.5.0",
    "electron-store": "^8.1.0",
    "simple-peer": "^9.11.0"
  },
  "devDependencies": {
    "electron": "^28.0.0",
    "electron-vite": "^2.0.0",
    "electron-builder": "^24.0.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "typescript": "^5.0.0",
    "vite": "^5.0.0"
  }
}
```

### 方案三（Flutter）依赖

```yaml
# pubspec.yaml
dependencies:
  flutter:
    sdk: flutter
  webview_flutter: ^6.0.0
  flutter_inappwebview: ^6.0.0
  flutter_riverpod: ^2.4.0
  shelf: ^1.4.0
  shelf_static: ^1.1.0
  multicast_dns: ^0.3.0
  hive: ^2.2.0
  hive_flutter: ^1.1.0
  sqflite: ^2.3.0
  flutter_webrtc: ^0.9.0
  path_provider: ^2.1.0

dev_dependencies:
  flutter_test:
    sdk: flutter
  build_runner: ^2.4.0
  hive_generator: ^2.0.0
```

---

*文档生成时间：2024年*
*版本：v1.0*
