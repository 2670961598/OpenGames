# Web游戏平台 - 客户端本地容器方案设计

## 1. 客户端容器技术选型

### 1.1 技术对比

| 技术方案 | 启动速度 | 资源占用 | 安全性 | 离线支持 | 浏览器兼容性 |
|---------|---------|---------|-------|---------|-------------|
| **WebContainers** | <10MB | ~10MB | 浏览器沙箱 | ✅ | Chrome/Edge/Firefox |
| **WASM Runtime** | <5ms | ~5MB | 内存安全 | ✅ | 所有现代浏览器 |
| **iframe + CSP** | 即时 | 低 | 浏览器原生 | ⚠️ 需缓存 | 所有浏览器 |
| **Service Worker** | 即时 | 低 | 同源策略 | ✅ | 所有现代浏览器 |
| **PWA + Workbox** | 即时 | 中 | 浏览器原生 | ✅ | 所有现代浏览器 |

### 1.2 推荐架构：分层容器模型

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      客户端分层容器架构                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   Layer 1: 应用外壳 (PWA Shell)                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │  • Service Worker (缓存策略)                                         │   │
│   │  • Manifest (安装配置)                                               │   │
│   │  • 离线页面                                                          │   │
│   │  • 更新机制                                                          │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                         │
│                                    ▼                                         │
│   Layer 2: 平台运行时 (WebContainers)                                        │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │  • Node.js WASM Runtime                                              │   │
│   │  • 虚拟文件系统                                                      │   │
│   │  • 包管理器 (npm/yarn)                                               │   │
│   │  • 网络代理                                                          │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                         │
│                                    ▼                                         │
│   Layer 3: 游戏沙箱 (iframe + CSP)                                           │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │  • 游戏代码执行环境                                                  │   │
│   │  • 渲染隔离                                                          │   │
│   │  • 资源访问控制                                                      │   │
│   │  • 消息通信                                                          │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                         │
│                                    ▼                                         │
│   Layer 4: 浏览器安全沙箱                                                    │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │  • 同源策略 (SOP)                                                    │   │
│   │  • 内容安全策略 (CSP)                                                │   │
│   │  • 沙箱属性                                                          │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 2. WebContainers集成方案

### 2.1 核心架构

```typescript
// webcontainer-manager.ts - WebContainers管理器
import { WebContainer } from '@webcontainer/api';

interface GameContainerConfig {
  gameId: string;
  entryPoint: string;
  files: Record<string, string>;
  dependencies: Record<string, string>;
  resources: {
    maxMemoryMB: number;
    maxCPU: number;
  };
}

interface ContainerInstance {
  id: string;
  webcontainer: WebContainer;
  iframe: HTMLIFrameElement;
  status: 'creating' | 'running' | 'paused' | 'stopped';
  startTime: Date;
}

class WebContainerManager {
  private containers: Map<string, ContainerInstance> = new Map();
  private bootPromise: Promise<void> | null = null;

  // 初始化WebContainers
  async initialize(): Promise<void> {
    if (this.bootPromise) {
      return this.bootPromise;
    }

    this.bootPromise = WebContainer.boot().then(() => {
      console.log('WebContainers initialized');
    });

    return this.bootPromise;
  }

  // 创建游戏容器
  async createGameContainer(config: GameContainerConfig): Promise<ContainerInstance> {
    await this.initialize();

    const containerId = `game-${config.gameId}-${Date.now()}`;
    
    // 创建WebContainer实例
    const webcontainer = await WebContainer.create({
      // 资源限制
      limits: {
        memory: config.resources.maxMemoryMB * 1024 * 1024,
      },
    });

    // 挂载游戏文件
    await this.mountGameFiles(webcontainer, config);

    // 安装依赖
    await this.installDependencies(webcontainer, config.dependencies);

    // 创建iframe沙箱
    const iframe = this.createSandboxIframe(containerId);

    // 启动游戏服务器
    const serverProcess = await webcontainer.spawn('npm', ['run', 'start']);
    
    // 等待服务器就绪
    const serverUrl = await this.waitForServer(webcontainer, config.entryPoint);

    // 加载游戏到iframe
    iframe.src = serverUrl;

    const instance: ContainerInstance = {
      id: containerId,
      webcontainer,
      iframe,
      status: 'running',
      startTime: new Date(),
    };

    this.containers.set(containerId, instance);

    // 设置资源监控
    this.setupResourceMonitoring(instance, config.resources);

    return instance;
  }

  // 挂载游戏文件
  private async mountGameFiles(
    webcontainer: WebContainer, 
    config: GameContainerConfig
  ): Promise<void> {
    const fileTree: any = {};

    // 构建文件树
    for (const [path, content] of Object.entries(config.files)) {
      const parts = path.split('/');
      let current = fileTree;
      
      for (let i = 0; i < parts.length - 1; i++) {
        if (!current[parts[i]]) {
          current[parts[i]] = { directory: {} };
        }
        current = current[parts[i]].directory;
      }
      
      current[parts[parts.length - 1]] = {
        file: { contents: content },
      };
    }

    // 挂载到WebContainer
    await webcontainer.mount(fileTree);
  }

  // 安装依赖
  private async installDependencies(
    webcontainer: WebContainer,
    dependencies: Record<string, string>
  ): Promise<void> {
    // 创建package.json
    const packageJson = {
      name: 'game-container',
      version: '1.0.0',
      dependencies,
    };

    await webcontainer.fs.writeFile(
      '/package.json',
      JSON.stringify(packageJson, null, 2)
    );

    // 运行npm install
    const installProcess = await webcontainer.spawn('npm', ['install']);
    
    const exitCode = await installProcess.exit;
    if (exitCode !== 0) {
      throw new Error(`npm install failed with exit code ${exitCode}`);
    }
  }

  // 创建沙箱iframe
  private createSandboxIframe(containerId: string): HTMLIFrameElement {
    const iframe = document.createElement('iframe');
    iframe.id = containerId;
    iframe.sandbox.add(
      'allow-scripts',
      'allow-same-origin',
      'allow-popups',
      'allow-forms',
      'allow-modals'
    );
    iframe.setAttribute('csp', this.generateCSP());
    iframe.style.cssText = 'width: 100%; height: 100%; border: none;';
    
    return iframe;
  }

  // 生成内容安全策略
  private generateCSP(): string {
    return [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' blob: data:",
      "font-src 'self'",
      "connect-src 'self'",
      "media-src 'self'",
      "object-src 'none'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; ');
  }

  // 等待服务器就绪
  private async waitForServer(
    webcontainer: WebContainer, 
    entryPoint: string
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Server start timeout'));
      }, 30000);

      // 监听端口就绪事件
      webcontainer.on('port', (port, type, url) => {
        if (type === 'open') {
          clearTimeout(timeout);
          resolve(url);
        }
      });
    });
  }

  // 设置资源监控
  private setupResourceMonitoring(
    instance: ContainerInstance,
    limits: { maxMemoryMB: number; maxCPU: number }
  ): void {
    // 内存监控
    setInterval(async () => {
      try {
        // 获取内存使用 (WebContainer API限制，实际实现可能不同)
        const memoryUsage = await this.getMemoryUsage(instance.webcontainer);
        
        if (memoryUsage > limits.maxMemoryMB * 0.9) {
          console.warn(`Container ${instance.id} near memory limit`);
          this.emit('resourceWarning', {
            containerId: instance.id,
            resource: 'memory',
            usage: memoryUsage,
            limit: limits.maxMemoryMB,
          });
        }
      } catch (error) {
        console.error('Resource monitoring error:', error);
      }
    }, 5000);
  }

  // 获取内存使用
  private async getMemoryUsage(webcontainer: WebContainer): Promise<number> {
    // 通过process命令获取内存信息
    const process = await webcontainer.spawn('cat', ['/proc/meminfo']);
    const output = await this.readProcessOutput(process);
    
    // 解析内存信息
    const memAvailable = this.parseMemInfo(output, 'MemAvailable');
    const memTotal = this.parseMemInfo(output, 'MemTotal');
    
    return memTotal - memAvailable;
  }

  // 读取进程输出
  private async readProcessOutput(process: any): Promise<string> {
    const chunks: string[] = [];
    
    process.output.pipeTo(new WritableStream({
      write(chunk) {
        chunks.push(chunk);
      },
    }));

    await process.exit;
    return chunks.join('');
  }

  // 解析内存信息
  private parseMemInfo(output: string, key: string): number {
    const match = output.match(new RegExp(`${key}:\\s+(\\d+)`));
    return match ? parseInt(match[1], 10) : 0;
  }

  // 暂停容器
  async pauseContainer(containerId: string): Promise<void> {
    const instance = this.containers.get(containerId);
    if (!instance) {
      throw new Error(`Container ${containerId} not found`);
    }

    // 暂停iframe
    instance.iframe.contentWindow?.postMessage({ type: 'PAUSE' }, '*');
    instance.status = 'paused';
  }

  // 恢复容器
  async resumeContainer(containerId: string): Promise<void> {
    const instance = this.containers.get(containerId);
    if (!instance) {
      throw new Error(`Container ${containerId} not found`);
    }

    instance.iframe.contentWindow?.postMessage({ type: 'RESUME' }, '*');
    instance.status = 'running';
  }

  // 停止容器
  async stopContainer(containerId: string): Promise<void> {
    const instance = this.containers.get(containerId);
    if (!instance) {
      return;
    }

    // 停止iframe
    instance.iframe.src = 'about:blank';
    instance.iframe.remove();

    // 销毁WebContainer
    // 注意：WebContainer API可能不直接支持销毁，这里需要根据实际API调整
    
    instance.status = 'stopped';
    this.containers.delete(containerId);
  }

  // 获取容器状态
  getContainerStatus(containerId: string): ContainerInstance | undefined {
    return this.containers.get(containerId);
  }

  // 列出所有容器
  listContainers(): ContainerInstance[] {
    return Array.from(this.containers.values());
  }

  // 事件发射器
  private eventListeners: Map<string, Function[]> = new Map();

  on(event: string, listener: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(listener);
  }

  private emit(event: string, data: any): void {
    const listeners = this.eventListeners.get(event) || [];
    listeners.forEach(listener => listener(data));
  }
}

// 导出单例
export const webContainerManager = new WebContainerManager();
```

## 3. 离线运行支持

### 3.1 Service Worker缓存策略

```typescript
// service-worker.ts - Service Worker实现
/// <reference lib="webworker" />

import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { CacheFirst, NetworkFirst, StaleWhileRevalidate } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';

declare const self: ServiceWorkerGlobalScope;

// 预缓存清单
precacheAndRoute(self.__WB_MANIFEST);

// 清理旧缓存
cleanupOutdatedCaches();

// 游戏资源缓存策略
const GAME_CACHE_NAME = 'game-resources-v1';

// 游戏代码 - Network First (优先获取最新版本)
registerRoute(
  ({ url }) => url.pathname.startsWith('/games/') && url.pathname.endsWith('.js'),
  new NetworkFirst({
    cacheName: `${GAME_CACHE_NAME}-code`,
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 7 * 24 * 60 * 60, // 7天
      }),
    ],
  })
);

// 游戏资源 - Cache First (优先使用缓存)
registerRoute(
  ({ url }) => url.pathname.startsWith('/games/') && 
    (/\.(png|jpg|jpeg|gif|webp|svg|mp3|mp4|woff|woff2)$/).test(url.pathname),
  new CacheFirst({
    cacheName: `${GAME_CACHE_NAME}-assets`,
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 500,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30天
      }),
    ],
  })
);

// WebContainer运行时 - Stale While Revalidate
registerRoute(
  ({ url }) => url.pathname.includes('webcontainer'),
  new StaleWhileRevalidate({
    cacheName: `${GAME_CACHE_NAME}-runtime`,
    plugins: [
      new ExpirationPlugin({
        maxEntries: 10,
        maxAgeSeconds: 7 * 24 * 60 * 60,
      }),
    ],
  })
);

// 游戏数据 - Network First with Background Sync
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/game/'),
  new NetworkFirst({
    cacheName: `${GAME_CACHE_NAME}-api`,
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 200,
        maxAgeSeconds: 24 * 60 * 60, // 1天
      }),
    ],
  })
);

// 后台同步 - 离线操作队列
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-game-actions') {
    event.waitUntil(syncGameActions());
  }
});

// 同步游戏操作
async function syncGameActions(): Promise<void> {
  const db = await openDB('game-actions', 1);
  const actions = await db.getAll('pending-actions');
  
  for (const action of actions) {
    try {
      const response = await fetch('/api/game/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(action),
      });
      
      if (response.ok) {
        await db.delete('pending-actions', action.id);
      }
    } catch (error) {
      console.error('Failed to sync action:', error);
    }
  }
}

// 推送通知支持
self.addEventListener('push', (event) => {
  const data = event.data?.json() || {};
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'Game Notification', {
      body: data.body,
      icon: '/icon-192x192.png',
      badge: '/badge-72x72.png',
      data: data.payload,
      actions: data.actions || [],
    })
  );
});

// 通知点击处理
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    self.clients.openWindow(event.notification.data?.url || '/')
  );
});

// IndexedDB辅助函数
async function openDB(name: string, version: number): Promise<any> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(name, version);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('pending-actions')) {
        db.createObjectStore('pending-actions', { keyPath: 'id' });
      }
    };
  });
}
```

### 3.2 离线游戏状态管理

```typescript
// offline-state-manager.ts - 离线状态管理
interface GameState {
  gameId: string;
  playerId: string;
  sessionData: any;
  lastSyncTime: number;
  pendingActions: GameAction[];
}

interface GameAction {
  id: string;
  type: string;
  timestamp: number;
  data: any;
  synced: boolean;
}

class OfflineStateManager {
  private db: IDBDatabase | null = null;
  private readonly DB_NAME = 'GamePlatformDB';
  private readonly DB_VERSION = 1;

  // 初始化数据库
  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // 游戏状态存储
        if (!db.objectStoreNames.contains('game-states')) {
          const stateStore = db.createObjectStore('game-states', { keyPath: 'gameId' });
          stateStore.createIndex('playerId', 'playerId', { unique: false });
          stateStore.createIndex('lastSyncTime', 'lastSyncTime', { unique: false });
        }

        // 待同步操作存储
        if (!db.objectStoreNames.contains('pending-actions')) {
          const actionStore = db.createObjectStore('pending-actions', { keyPath: 'id' });
          actionStore.createIndex('gameId', 'gameId', { unique: false });
          actionStore.createIndex('synced', 'synced', { unique: false });
        }

        // 游戏资源缓存
        if (!db.objectStoreNames.contains('game-assets')) {
          db.createObjectStore('game-assets', { keyPath: 'url' });
        }
      };
    });
  }

  // 保存游戏状态
  async saveGameState(gameId: string, playerId: string, sessionData: any): Promise<void> {
    if (!this.db) await this.initialize();

    const state: GameState = {
      gameId,
      playerId,
      sessionData,
      lastSyncTime: Date.now(),
      pendingActions: [],
    };

    const transaction = this.db!.transaction(['game-states'], 'readwrite');
    const store = transaction.objectStore('game-states');
    
    return new Promise((resolve, reject) => {
      const request = store.put(state);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // 加载游戏状态
  async loadGameState(gameId: string): Promise<GameState | null> {
    if (!this.db) await this.initialize();

    const transaction = this.db!.transaction(['game-states'], 'readonly');
    const store = transaction.objectStore('game-states');

    return new Promise((resolve, reject) => {
      const request = store.get(gameId);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  // 添加待同步操作
  async addPendingAction(gameId: string, action: Omit<GameAction, 'id' | 'synced'>): Promise<void> {
    if (!this.db) await this.initialize();

    const fullAction: GameAction = {
      ...action,
      id: `${gameId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      synced: false,
    };

    const transaction = this.db!.transaction(['pending-actions'], 'readwrite');
    const store = transaction.objectStore('pending-actions');

    return new Promise((resolve, reject) => {
      const request = store.add(fullAction);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // 获取待同步操作
  async getPendingActions(gameId?: string): Promise<GameAction[]> {
    if (!this.db) await this.initialize();

    const transaction = this.db!.transaction(['pending-actions'], 'readonly');
    const store = transaction.objectStore('pending-actions');

    return new Promise((resolve, reject) => {
      let request: IDBRequest;
      
      if (gameId) {
        const index = store.index('gameId');
        request = index.getAll(gameId);
      } else {
        request = store.getAll();
      }

      request.onsuccess = () => {
        const actions = request.result.filter((a: GameAction) => !a.synced);
        resolve(actions);
      };
      request.onerror = () => reject(request.error);
    });
  }

  // 标记操作为已同步
  async markActionSynced(actionId: string): Promise<void> {
    if (!this.db) await this.initialize();

    const transaction = this.db!.transaction(['pending-actions'], 'readwrite');
    const store = transaction.objectStore('pending-actions');

    return new Promise((resolve, reject) => {
      const getRequest = store.get(actionId);
      
      getRequest.onsuccess = () => {
        const action = getRequest.result;
        if (action) {
          action.synced = true;
          const putRequest = store.put(action);
          putRequest.onsuccess = () => resolve();
          putRequest.onerror = () => reject(putRequest.error);
        } else {
          resolve();
        }
      };
      
      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  // 清理已同步操作
  async cleanupSyncedActions(): Promise<void> {
    if (!this.db) await this.initialize();

    const transaction = this.db!.transaction(['pending-actions'], 'readwrite');
    const store = transaction.objectStore('pending-actions');
    const index = store.index('synced');

    return new Promise((resolve, reject) => {
      const request = index.openCursor(IDBKeyRange.only(true));
      
      request.onsuccess = () => {
        const cursor = request.result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          resolve();
        }
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  // 检查网络状态
  isOnline(): boolean {
    return navigator.onLine;
  }

  // 监听网络变化
  onNetworkChange(callback: (online: boolean) => void): void {
    window.addEventListener('online', () => callback(true));
    window.addEventListener('offline', () => callback(false));
  }

  // 同步游戏状态
  async syncGameState(gameId: string): Promise<void> {
    if (!this.isOnline()) {
      throw new Error('Cannot sync while offline');
    }

    const state = await this.loadGameState(gameId);
    if (!state) return;

    const pendingActions = await this.getPendingActions(gameId);

    try {
      const response = await fetch('/api/game/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId,
          playerId: state.playerId,
          sessionData: state.sessionData,
          actions: pendingActions,
        }),
      });

      if (response.ok) {
        // 标记所有操作为已同步
        for (const action of pendingActions) {
          await this.markActionSynced(action.id);
        }
        
        // 更新同步时间
        await this.saveGameState(gameId, state.playerId, state.sessionData);
        
        // 清理已同步操作
        await this.cleanupSyncedActions();
      }
    } catch (error) {
      console.error('Sync failed:', error);
      throw error;
    }
  }
}

// 导出单例
export const offlineStateManager = new OfflineStateManager();
```

## 4. 安全隔离实现

### 4.1 多层安全策略

```typescript
// security-manager.ts - 安全管理器
interface SecurityPolicy {
  allowedOrigins: string[];
  allowedApis: string[];
  resourceLimits: {
    maxMemoryMB: number;
    maxCPUPercent: number;
    maxStorageMB: number;
  };
  networkPolicy: {
    allowExternal: boolean;
    allowedDomains: string[];
    blockedPorts: number[];
  };
}

class SecurityManager {
  private policies: Map<string, SecurityPolicy> = new Map();

  // 设置游戏安全策略
  setGamePolicy(gameId: string, policy: SecurityPolicy): void {
    this.policies.set(gameId, policy);
  }

  // 获取游戏安全策略
  getGamePolicy(gameId: string): SecurityPolicy | undefined {
    return this.policies.get(gameId);
  }

  // 验证网络请求
  validateNetworkRequest(gameId: string, url: string): boolean {
    const policy = this.getGamePolicy(gameId);
    if (!policy) return false;

    const urlObj = new URL(url);

    // 检查是否允许外部请求
    if (!policy.networkPolicy.allowExternal) {
      return false;
    }

    // 检查域名白名单
    const isAllowed = policy.networkPolicy.allowedDomains.some(domain => 
      urlObj.hostname === domain || urlObj.hostname.endsWith(`.${domain}`)
    );

    // 检查端口黑名单
    const isBlocked = policy.networkPolicy.blockedPorts.includes(
      parseInt(urlObj.port) || (urlObj.protocol === 'https:' ? 443 : 80)
    );

    return isAllowed && !isBlocked;
  }

  // 生成安全沙箱配置
  generateSandboxConfig(gameId: string): string {
    const policy = this.getGamePolicy(gameId);
    if (!policy) return '';

    const allowedFeatures = [
      'allow-scripts',
      'allow-same-origin',
      'allow-forms',
    ];

    // 根据策略调整权限
    if (policy.networkPolicy.allowExternal) {
      allowedFeatures.push('allow-popups');
      allowedFeatures.push('allow-popups-to-escape-sandbox');
    }

    return allowedFeatures.join(' ');
  }

  // 生成CSP策略
  generateCSP(gameId: string): string {
    const policy = this.getGamePolicy(gameId);
    if (!policy) return "default-src 'none'";

    const directives: string[] = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' blob: data:",
      "font-src 'self'",
      "object-src 'none'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ];

    // 网络连接策略
    if (policy.networkPolicy.allowExternal && policy.networkPolicy.allowedDomains.length > 0) {
      const connectSrc = ["'self'", ...policy.networkPolicy.allowedDomains.map(d => `https://${d}`)];
      directives.push(`connect-src ${connectSrc.join(' ')}`);
    } else {
      directives.push("connect-src 'self'");
    }

    return directives.join('; ');
  }

  // 监控资源使用
  async monitorResourceUsage(
    gameId: string, 
    container: any
  ): Promise<{ memory: number; cpu: number }> {
    const policy = this.getGamePolicy(gameId);
    if (!policy) throw new Error('No security policy found');

    // 获取资源使用
    const memoryUsage = await this.getMemoryUsage(container);
    const cpuUsage = await this.getCPUUsage(container);

    // 检查是否超出限制
    if (memoryUsage > policy.resourceLimits.maxMemoryMB) {
      this.handleResourceViolation(gameId, 'memory', memoryUsage, policy.resourceLimits.maxMemoryMB);
    }

    if (cpuUsage > policy.resourceLimits.maxCPUPercent) {
      this.handleResourceViolation(gameId, 'cpu', cpuUsage, policy.resourceLimits.maxCPUPercent);
    }

    return { memory: memoryUsage, cpu: cpuUsage };
  }

  // 获取内存使用
  private async getMemoryUsage(container: any): Promise<number> {
    // 实现内存使用获取逻辑
    return 0;
  }

  // 获取CPU使用
  private async getCPUUsage(container: any): Promise<number> {
    // 实现CPU使用获取逻辑
    return 0;
  }

  // 处理资源违规
  private handleResourceViolation(
    gameId: string, 
    resource: string, 
    usage: number, 
    limit: number
  ): void {
    console.warn(`Resource violation: ${gameId} exceeded ${resource} limit (${usage}/${limit})`);
    
    // 发送告警
    this.emit('resourceViolation', {
      gameId,
      resource,
      usage,
      limit,
      timestamp: Date.now(),
    });
  }

  // 事件发射器
  private eventListeners: Map<string, Function[]> = new Map();

  on(event: string, listener: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(listener);
  }

  private emit(event: string, data: any): void {
    const listeners = this.eventListeners.get(event) || [];
    listeners.forEach(listener => listener(data));
  }
}

// 导出单例
export const securityManager = new SecurityManager();
```

---

*客户端本地容器方案设计 v1.0*
