# Web游戏平台网络架构 - 快速参考

## 同步策略选择指南

| 游戏类型 | 推荐策略 | 理由 |
|---------|---------|------|
| RTS/MOBA | 帧同步 | 大量单位，需要精确同步 |
| 格斗游戏 | 帧同步 + 回滚 | 帧级精确判定 |
| FPS/TPS | 状态同步 | 低延迟要求，大规模场景 |
| 卡牌/回合制 | 帧同步 | 天然适合，无实时压力 |
| 开放世界RPG | 状态同步 | 世界状态太大 |

## 协议选择速查

| 场景 | 协议 | 端口 |
|-----|------|------|
| 大厅/匹配 | WebSocket | 443/80 |
| 实时游戏 | WebRTC DataChannel | 动态 |
| 局域网发现 | mDNS | 5353 |
| UDP广播 | UDP | 27777 |

## 关键参数配置

### 帧同步
```typescript
const lockstepConfig = {
    tickRate: 60,           // 每秒60帧
    inputDelay: 3,          // 3帧输入延迟
    maxPlayers: 8,          // 最大玩家数
    checksumInterval: 30    // 每30帧校验一次
};
```

### 状态同步
```typescript
const stateSyncConfig = {
    updateRate: 20,         // 20Hz更新频率
    interpolationDelay: 100, // 100ms插值延迟
    deltaCompression: true,  // 启用增量压缩
    interestRadius: 100      // 兴趣区域半径
};
```

### 局域网发现
```typescript
const discoveryConfig = {
    mDNSServiceType: '_webgame._tcp.local',
    broadcastPort: 27777,
    broadcastInterval: 2000,  // 2秒广播一次
    discoveryTimeout: 10000   // 10秒超时
};
```

## 代码示例速查

### 初始化网络管理器
```typescript
const network = new NetworkManager();

await network.initialize({
    syncRate: 60,
    interpolationDelay: 100
});

// 切换到局域网主机模式
await network.switchMode(NetworkMode.LAN_HOST, {
    roomId: 'my-room',
    gameMode: 'deathmatch'
});
```

### 发送玩家输入
```typescript
network.sendInput({
    type: InputType.MOVE,
    data: new Uint8Array([dx, dy, dz])
});
```

### 监听游戏状态
```typescript
network.on('stateUpdate', (state: GameState) => {
    // 更新渲染
    updateRenderer(state);
});

network.on('playerJoined', (player: PlayerInfo) => {
    console.log(`Player ${player.name} joined`);
});
```

## 性能优化建议

### 带宽优化
1. 使用FlatBuffers序列化（比JSON小50-70%）
2. 启用增量同步（减少90%数据传输）
3. 兴趣区域过滤（只同步可见实体）
4. 压缩浮点数（使用半精度或定点数）

### 延迟优化
1. 客户端预测（减少感知延迟）
2. 输入缓冲（平滑网络抖动）
3. 插值延迟（100-150ms）
4. 本地回显（立即响应本地输入）

### CPU优化
1. Web Worker运行游戏逻辑
2. 对象池复用
3. 空间分区（四叉树/八叉树）
4. LOD（细节层次）同步

## 调试技巧

### 网络监控
```typescript
// 显示网络统计
network.on('stats', (stats) => {
    console.table({
        'Latency (ms)': stats.latency,
        'Packet Loss (%)': stats.packetLoss,
        'Bandwidth (KB/s)': stats.bandwidth,
        'Sync Divergence': stats.divergence
    });
});
```

### 可视化调试
```typescript
// 显示插值缓冲区
network.on('interpolationBuffer', (buffer) => {
    renderDebugOverlay({
        snapshots: buffer.size,
        targetTime: buffer.targetTime,
        interpolationDelay: buffer.delay
    });
});
```

## 常见问题排查

| 问题 | 可能原因 | 解决方案 |
|-----|---------|---------|
| 游戏卡顿 | 网络抖动 | 增加输入缓冲 |
| 位置跳变 | 预测错误 | 调整调和参数 |
| 同步失败 | 确定性问题 | 检查浮点数使用 |
| 高延迟 | 服务器距离 | 使用CDN/边缘节点 |
| 断线频繁 | 网络不稳定 | 实现自动重连 |

## 部署检查清单

- [ ] 服务器配置（CPU/内存/带宽）
- [ ] 数据库连接池配置
- [ ] Redis缓存配置
- [ ] WebRTC STUN/TURN服务器
- [ ] 负载均衡配置
- [ ] 监控和告警设置
- [ ] 日志收集配置
- [ ] 自动扩缩容策略

## 扩展阅读

1. [Glenn Fiedler's Networking Series](https://gafferongames.com/categories/networked-physics/)
2. [Source Engine Multiplayer](https://developer.valvesoftware.com/wiki/Source_Multiplayer_Networking)
3. [Unity Netcode Documentation](https://docs-multiplayer.unity3d.com/)
4. [WebRTC Specification](https://www.w3.org/TR/webrtc/)

---

**版本**: v1.0
**最后更新**: 2026-04-04
**来源**: Kimi_Agent_SpecKit/quick-reference.md
