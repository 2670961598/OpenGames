# Web游戏平台网络架构设计方案

## 目录
1. [架构总览](#架构总览)
2. [帧同步方案](#帧同步方案)
3. [状态同步方案](#状态同步方案)
4. [局域网发现机制](#局域网发现机制)
5. [协议栈选择](#协议栈选择)
6. [本地/云端后端代码复用架构](#本地云端后端代码复用架构)
7. [房间和匹配系统架构](#房间和匹配系统架构)
8. [延迟隐藏与优化技术](#延迟隐藏与优化技术)
9. [优缺点分析](#优缺点分析)

---

## 架构总览

### 整体架构图

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Web游戏平台网络架构                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                  │
│  │   客户端层    │    │   同步抽象层  │    │   传输层     │                  │
│  ├──────────────┤    ├──────────────┤    ├──────────────┤                  │
│  │ • 游戏逻辑    │◄──►│ • 帧同步接口  │◄──►│ • WebSocket  │                  │
│  │ • 渲染引擎    │    │ • 状态同步接口│    │ • WebRTC     │                  │
│  │ • 输入处理    │    │ • 预测/回滚   │    │ • UDP封装    │                  │
│  └──────────────┘    └──────────────┘    └──────────────┘                  │
│         │                   │                   │                          │
│         ▼                   ▼                   ▼                          │
│  ┌─────────────────────────────────────────────────────┐                   │
│  │                 后端抽象层 (Backend Abstraction)      │                   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │                   │
│  │  │ 本地后端     │  │ 云端后端     │  │ 局域网P2P   │  │                   │
│  │  │ (Worker)    │  │ (Server)    │  │ (Host)      │  │                   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  │                   │
│  └─────────────────────────────────────────────────────┘                   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────┐                   │
│  │                 服务层                                │                   │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐   │                   │
│  │  │房间系统  │ │匹配系统  │ │发现服务  │ │中继服务  │   │                   │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘   │                   │
│  └─────────────────────────────────────────────────────┘                   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 核心设计原则

1. **抽象隔离**：同步机制与传输协议解耦
2. **代码复用**：本地后端和云端后端共享核心逻辑
3. **灵活切换**：帧同步/状态同步可运行时切换
4. **渐进增强**：从局域网P2P到在线服务器的无缝过渡

---

## 帧同步方案

### 1. 确定性模拟实现

#### 核心原理
帧同步要求所有客户端在相同输入下产生完全一致的游戏状态。关键在于消除所有非确定性因素。

```typescript
// 确定性数学库 - 使用定点数代替浮点数
class FixedPoint {
    private static readonly SCALE = 10000; // 4位小数精度
    private value: number;
    
    constructor(val: number) {
        this.value = Math.round(val * FixedPoint.SCALE);
    }
    
    add(other: FixedPoint): FixedPoint {
        return FixedPoint.fromRaw(this.value + other.value);
    }
    
    mul(other: FixedPoint): FixedPoint {
        // 定点数乘法需要处理溢出
        return FixedPoint.fromRaw(
            Math.round((this.value * other.value) / FixedPoint.SCALE)
        );
    }
    
    toFloat(): number {
        return this.value / FixedPoint.SCALE;
    }
    
    static fromRaw(raw: number): FixedPoint {
        const fp = new FixedPoint(0);
        fp.value = raw;
        return fp;
    }
}

// 确定性随机数生成器
class DeterministicRNG {
    private seed: number;
    
    constructor(seed: number) {
        this.seed = seed;
    }
    
    // xorshift算法 - 确定性且跨平台
    next(): number {
        this.seed ^= this.seed << 13;
        this.seed ^= this.seed >>> 17;
        this.seed ^= this.seed << 5;
        return (this.seed >>> 0) / 4294967296; // 归一化到[0,1)
    }
    
    nextInt(min: number, max: number): number {
        return Math.floor(this.next() * (max - min + 1)) + min;
    }
}
```

#### 确定性物理引擎集成

```typescript
// 确定性物理模拟器接口
interface IDeterministicPhysics {
    step(dt: FixedPoint): void;
    addBody(body: PhysicsBody): void;
    getState(): PhysicsState;
    setState(state: PhysicsState): void;
    checksum(): number; // 用于同步验证
}

// 确定性刚体
class DeterministicRigidBody {
    position: Vector3Fixed;
    velocity: Vector3Fixed;
    rotation: QuaternionFixed;
    angularVelocity: Vector3Fixed;
    mass: FixedPoint;
    
    applyForce(force: Vector3Fixed, point: Vector3Fixed): void {
        // 使用定点数计算
        const acceleration = force.div(this.mass);
        this.velocity = this.velocity.add(acceleration.mul(FIXED_DT));
    }
    
    integrate(dt: FixedPoint): void {
        this.position = this.position.add(this.velocity.mul(dt));
        // 旋转积分...
    }
}
```

### 2. 输入同步机制

#### 输入帧结构

```typescript
// 输入帧定义
interface InputFrame {
    frameNumber: number;      // 帧序号
    playerId: string;         // 玩家ID
    inputs: PlayerInput[];    // 输入集合
    timestamp: number;        // 发送时间戳
    checksum?: number;        // 状态校验和（用于验证）
}

interface PlayerInput {
    type: InputType;
    data: InputData;
}

type InputType = 
    | 'MOVE' 
    | 'ATTACK' 
    | 'SKILL' 
    | 'ITEM'
    | 'CUSTOM';

// 输入管理器
class LockstepInputManager {
    private inputBuffer: Map<number, Map<string, InputFrame>> = new Map();
    private currentFrame: number = 0;
    private inputDelay: number = 3; // 输入延迟帧数（缓冲）
    private pendingInputs: InputFrame[] = [];
    
    // 收集本地输入
    collectLocalInput(input: PlayerInput): void {
        const targetFrame = this.currentFrame + this.inputDelay;
        
        const frame: InputFrame = {
            frameNumber: targetFrame,
            playerId: this.localPlayerId,
            inputs: [input],
            timestamp: Date.now()
        };
        
        this.pendingInputs.push(frame);
    }
    
    // 接收远程输入
    receiveRemoteInput(input: InputFrame): void {
        if (!this.inputBuffer.has(input.frameNumber)) {
            this.inputBuffer.set(input.frameNumber, new Map());
        }
        
        this.inputBuffer.get(input.frameNumber)!.set(input.playerId, input);
    }
    
    // 获取可执行的帧输入（所有玩家输入已到达）
    getExecutableFrame(): InputFrame[] | null {
        const frameInputs = this.inputBuffer.get(this.currentFrame);
        
        if (!frameInputs) return null;
        
        // 检查是否所有玩家输入都已到达
        const allPlayers = this.getAllPlayerIds();
        const receivedPlayers = Array.from(frameInputs.keys());
        
        if (allPlayers.every(p => receivedPlayers.includes(p))) {
            // 所有输入已到达，可以执行
            this.inputBuffer.delete(this.currentFrame);
            return Array.from(frameInputs.values());
        }
        
        return null; // 等待更多输入
    }
    
    // 推进到下一帧
    advanceFrame(): void {
        this.currentFrame++;
    }
}
```

#### 可靠UDP实现（基于冗余重传）

```typescript
// 可靠UDP传输层
class ReliableUDP {
    private socket: UDPSocket;
    private sentPackets: Map<number, SentPacket> = new Map();
    private ackedPackets: Set<number> = new Set();
    private packetSequence: number = 0;
    private ackWindow: number = 32; // 确认窗口大小
    
    // 发送数据（带重传）
    async send(data: Uint8Array, reliable: boolean = true): Promise<void> {
        if (!reliable) {
            this.socket.send(data);
            return;
        }
        
        const seq = this.packetSequence++;
        const packet: SentPacket = {
            sequence: seq,
            data: data,
            timestamp: Date.now(),
            retries: 0
        };
        
        this.sentPackets.set(seq, packet);
        
        // 发送并启动重传定时器
        this.transmit(packet);
        this.startRetransmitTimer(seq);
    }
    
    private transmit(packet: SentPacket): void {
        const header = new Uint8Array(4);
        new DataView(header.buffer).setUint32(0, packet.sequence);
        
        const fullPacket = new Uint8Array(header.length + packet.data.length);
        fullPacket.set(header);
        fullPacket.set(packet.data, header.length);
        
        this.socket.send(fullPacket);
    }
    
    private startRetransmitTimer(seq: number): void {
        const RETRANSMIT_INTERVAL = 50; // ms
        const MAX_RETRIES = 5;
        
        const timer = setInterval(() => {
            const packet = this.sentPackets.get(seq);
            
            if (!packet || this.ackedPackets.has(seq)) {
                clearInterval(timer);
                return;
            }
            
            if (packet.retries >= MAX_RETRIES) {
                // 超过最大重试次数，标记为失败
                this.handleTransmitFailure(seq);
                clearInterval(timer);
                return;
            }
            
            packet.retries++;
            this.transmit(packet);
        }, RETRANSMIT_INTERVAL);
    }
    
    // 处理接收到的ACK
    handleAck(ackSeq: number): void {
        this.ackedPackets.add(ackSeq);
        this.sentPackets.delete(ackSeq);
    }
    
    // 发送ACK确认
    sendAck(sequence: number): void {
        const ackPacket = new Uint8Array(5);
        ackPacket[0] = 0xFF; // ACK标记
        new DataView(ackPacket.buffer).setUint32(1, sequence);
        this.socket.send(ackPacket);
    }
}
```

### 3. 断线重连机制

```typescript
// 断线重连管理器
class ReconnectionManager {
    private gameStateHistory: GameStateSnapshot[] = [];
    private inputHistory: InputFrame[] = [];
    private readonly MAX_HISTORY = 300; // 保存5秒历史（60fps）
    
    // 创建状态快照
    createSnapshot(frameNumber: number, state: GameState): void {
        const snapshot: GameStateSnapshot = {
            frameNumber,
            state: this.serializeState(state),
            checksum: this.computeChecksum(state),
            timestamp: Date.now()
        };
        
        this.gameStateHistory.push(snapshot);
        
        // 清理旧历史
        if (this.gameStateHistory.length > this.MAX_HISTORY) {
            this.gameStateHistory.shift();
        }
    }
    
    // 处理重连请求
    async handleReconnection(playerId: string, lastFrame: number): Promise<ReconnectionData> {
        // 找到重连点
        const snapshotIndex = this.gameStateHistory.findIndex(
            s => s.frameNumber >= lastFrame
        );
        
        if (snapshotIndex === -1) {
            throw new Error('History too old, cannot reconnect');
        }
        
        const snapshot = this.gameStateHistory[snapshotIndex];
        
        // 收集从快照帧到现在的所有输入
        const missedInputs = this.inputHistory.filter(
            input => input.frameNumber > snapshot.frameNumber
        );
        
        return {
            snapshot: snapshot.state,
            snapshotFrame: snapshot.frameNumber,
            missedInputs: missedInputs,
            currentFrame: this.getCurrentFrame()
        };
    }
    
    // 快速重连（使用关键帧）
    async fastReconnect(playerId: string): Promise<ReconnectionData> {
        const latestSnapshot = this.gameStateHistory[this.gameStateHistory.length - 1];
        
        return {
            snapshot: latestSnapshot.state,
            snapshotFrame: latestSnapshot.frameNumber,
            missedInputs: [],
            currentFrame: this.getCurrentFrame(),
            isFastReconnect: true
        };
    }
}

// 重连数据
interface ReconnectionData {
    snapshot: Uint8Array;
    snapshotFrame: number;
    missedInputs: InputFrame[];
    currentFrame: number;
    isFastReconnect?: boolean;
}
```

### 4. 去同步检测与恢复

```typescript
// 去同步检测器
class DesyncDetector {
    private stateChecksums: Map<number, Map<string, number>> = new Map();
    
    // 报告帧校验和
    reportChecksum(frameNumber: number, playerId: string, checksum: number): void {
        if (!this.stateChecksums.has(frameNumber)) {
            this.stateChecksums.set(frameNumber, new Map());
        }
        
        const frameChecksums = this.stateChecksums.get(frameNumber)!;
        frameChecksums.set(playerId, checksum);
        
        // 检查是否所有玩家都已报告
        if (frameChecksums.size === this.getPlayerCount()) {
            this.validateChecksums(frameNumber, frameChecksums);
        }
    }
    
    private validateChecksums(
        frameNumber: number, 
        checksums: Map<string, number>
    ): void {
        const values = Array.from(checksums.values());
        const firstChecksum = values[0];
        
        const isSynced = values.every(v => v === firstChecksum);
        
        if (!isSynced) {
            console.error(`Desync detected at frame ${frameNumber}`);
            
            // 找出不同步的玩家
            const desyncedPlayers: string[] = [];
            checksums.forEach((checksum, playerId) => {
                if (checksum !== firstChecksum) {
                    desyncedPlayers.push(playerId);
                }
            });
            
            this.handleDesync(frameNumber, desyncedPlayers);
        }
        
        // 清理已验证的帧
        this.stateChecksums.delete(frameNumber);
    }
    
    private handleDesync(frameNumber: number, desyncedPlayers: string[]): void {
        // 触发重同步流程
        // 1. 暂停游戏
        // 2. 从上一个已知同步的快照恢复
        // 3. 重新执行后续帧
        
        this.emit('desync', {
            frameNumber,
            desyncedPlayers,
            recoverySnapshot: this.findLastValidSnapshot(frameNumber)
        });
    }
}
```

### 5. 帧同步适用游戏类型

| 游戏类型 | 适合度 | 原因 |
|---------|-------|------|
| RTS（即时战略） | ⭐⭐⭐⭐⭐ | 大量单位，需要精确同步，带宽敏感 |
| 格斗游戏 | ⭐⭐⭐⭐⭐ | 需要帧级精确判定，可用GGPO回滚 |
| MOBA | ⭐⭐⭐⭐ | 技能判定精确，但需处理断线重连 |
| 回合制策略 | ⭐⭐⭐⭐⭐ | 天然适合，无实时性压力 |
| FPS | ⭐⭐ | 需要低延迟，状态同步更合适 |
| 开放世界RPG | ⭐ | 世界状态太大，不适合全量同步 |

---

## 状态同步方案

### 1. 权威服务器模式

```typescript
// 权威服务器架构
class AuthoritativeServer {
    private worldState: WorldState;
    private clients: Map<string, ClientConnection> = new Map();
    private updateRate: number = 20; // 20Hz服务器更新
    
    // 主循环
    async gameLoop(): Promise<void> {
        const tickInterval = 1000 / this.updateRate;
        
        while (this.isRunning) {
            const startTime = performance.now();
            
            // 1. 处理客户端输入
            this.processInputs();
            
            // 2. 更新游戏世界
            this.updateWorld(tickInterval / 1000);
            
            // 3. 广播状态更新
            this.broadcastState();
            
            // 4. 计算下一帧延迟
            const elapsed = performance.now() - startTime;
            const sleepTime = Math.max(0, tickInterval - elapsed);
            
            await this.sleep(sleepTime);
        }
    }
    
    // 处理客户端输入（带验证）
    private processInputs(): void {
        for (const [clientId, client] of this.clients) {
            while (client.inputQueue.length > 0) {
                const input = client.inputQueue.shift()!;
                
                // 验证输入合法性
                if (this.validateInput(clientId, input)) {
                    this.applyInput(clientId, input);
                } else {
                    this.handleInvalidInput(clientId, input);
                }
            }
        }
    }
    
    // 输入验证
    private validateInput(clientId: string, input: PlayerInput): boolean {
        const player = this.worldState.players.get(clientId);
        if (!player) return false;
        
        // 检查移动速度是否合法（防加速外挂）
        if (input.type === 'MOVE') {
            const moveData = input.data as MoveInput;
            const maxSpeed = player.stats.maxSpeed;
            const actualSpeed = Math.sqrt(
                moveData.dx * moveData.dx + 
                moveData.dy * moveData.dy
            );
            
            if (actualSpeed > maxSpeed * 1.1) { // 允许10%误差
                return false;
            }
        }
        
        // 检查技能CD
        if (input.type === 'SKILL') {
            const skillData = input.data as SkillInput;
            if (!this.canUseSkill(player, skillData.skillId)) {
                return false;
            }
        }
        
        return true;
    }
    
    // 广播状态（带增量优化）
    private broadcastState(): void {
        const stateSnapshot = this.captureWorldState();
        
        for (const [clientId, client] of this.clients) {
            // 根据客户端兴趣区域过滤
            const relevantState = this.filterByInterestArea(
                stateSnapshot, 
                client.position,
                client.interestRadius
            );
            
            // 计算增量更新
            const deltaUpdate = this.computeDeltaUpdate(
                client.lastAcknowledgedState,
                relevantState
            );
            
            // 发送更新
            if (deltaUpdate.hasChanges) {
                client.send({
                    type: 'STATE_DELTA',
                    data: deltaUpdate,
                    timestamp: Date.now(),
                    sequence: client.sequence++
                });
            }
        }
    }
}
```

### 2. 增量同步策略

```typescript
// 增量同步管理器
class DeltaSyncManager {
    private lastFullState: Map<string, EntityState> = new Map();
    private dirtyEntities: Set<string> = new Set();
    private priorityQueue: PriorityQueue<EntityUpdate>;
    
    // 标记实体为脏（需要同步）
    markDirty(entityId: string, priority: SyncPriority = 'NORMAL'): void {
        this.dirtyEntities.add(entityId);
        
        // 根据优先级和距离排序
        const entity = this.world.getEntity(entityId);
        const update: EntityUpdate = {
            entityId,
            priority,
            timestamp: Date.now()
        };
        
        this.priorityQueue.enqueue(update, this.calculatePriority(entity));
    }
    
    // 计算增量包
    computeDelta(
        clientId: string, 
        clientView: ClientView
    ): DeltaPacket {
        const updates: EntityDelta[] = [];
        const deletions: string[] = [];
        const creations: EntityState[] = [];
        
        // 获取客户端视野内的实体
        const visibleEntities = this.getVisibleEntities(clientView);
        const previouslyVisible = clientView.lastVisibleEntities;
        
        // 处理新可见实体
        for (const entityId of visibleEntities) {
            if (!previouslyVisible.has(entityId)) {
                const entity = this.world.getEntity(entityId);
                creations.push(this.serializeEntity(entity));
            }
        }
        
        // 处理不再可见实体
        for (const entityId of previouslyVisible) {
            if (!visibleEntities.has(entityId)) {
                deletions.push(entityId);
            }
        }
        
        // 处理脏实体更新
        for (const entityId of this.dirtyEntities) {
            if (!visibleEntities.has(entityId)) continue;
            
            const current = this.world.getEntity(entityId);
            const last = this.lastFullState.get(entityId);
            
            if (last) {
                const delta = this.computeEntityDelta(last, current);
                if (delta.hasChanges) {
                    updates.push(delta);
                }
            }
        }
        
        // 按优先级排序更新
        updates.sort((a, b) => b.priority - a.priority);
        
        return {
            creations,
            updates: updates.slice(0, this.maxUpdatesPerPacket),
            deletions,
            timestamp: Date.now()
        };
    }
    
    // 计算单个实体的增量
    private computeEntityDelta(
        oldState: EntityState, 
        newState: EntityState
    ): EntityDelta {
        const changedFields: string[] = [];
        const values: Record<string, any> = {};
        
        for (const key of Object.keys(newState)) {
            if (JSON.stringify(oldState[key]) !== JSON.stringify(newState[key])) {
                changedFields.push(key);
                values[key] = newState[key];
            }
        }
        
        return {
            entityId: newState.id,
            changedFields,
            values,
            hasChanges: changedFields.length > 0,
            priority: this.calculateUpdatePriority(oldState, newState)
        };
    }
}

// 优先级队列实现
class PriorityQueue<T> {
    private items: Array<{ item: T; priority: number }> = [];
    
    enqueue(item: T, priority: number): void {
        this.items.push({ item, priority });
        this.items.sort((a, b) => b.priority - a.priority);
    }
    
    dequeue(): T | undefined {
        return this.items.shift()?.item;
    }
    
    peek(): T | undefined {
        return this.items[0]?.item;
    }
}
```

### 3. 实体插值与外推

```typescript
// 实体插值管理器（客户端）
class EntityInterpolator {
    private snapshots: Snapshot[] = [];
    private interpolationDelay: number = 100; // 100ms插值延迟
    private maxSnapshots: number = 32;
    
    // 添加服务器快照
    addSnapshot(snapshot: Snapshot): void {
        this.snapshots.push(snapshot);
        this.snapshots.sort((a, b) => a.timestamp - b.timestamp);
        
        // 保持快照数量限制
        if (this.snapshots.length > this.maxSnapshots) {
            this.snapshots.shift();
        }
    }
    
    // 获取插值后的实体状态
    interpolate(entityId: string, renderTime: number): EntityState | null {
        // 找到renderTime前后的两个快照
        const targetTime = renderTime - this.interpolationDelay;
        
        let prevSnapshot: Snapshot | null = null;
        let nextSnapshot: Snapshot | null = null;
        
        for (let i = 0; i < this.snapshots.length - 1; i++) {
            if (this.snapshots[i].timestamp <= targetTime && 
                this.snapshots[i + 1].timestamp >= targetTime) {
                prevSnapshot = this.snapshots[i];
                nextSnapshot = this.snapshots[i + 1];
                break;
            }
        }
        
        if (!prevSnapshot || !nextSnapshot) {
            // 使用外推
            return this.extrapolate(entityId, targetTime);
        }
        
        // 线性插值
        const t = (targetTime - prevSnapshot.timestamp) / 
                  (nextSnapshot.timestamp - prevSnapshot.timestamp);
        
        const prevEntity = prevSnapshot.entities.get(entityId);
        const nextEntity = nextSnapshot.entities.get(entityId);
        
        if (!prevEntity || !nextEntity) return null;
        
        return this.lerpEntity(prevEntity, nextEntity, t);
    }
    
    // 线性插值实体
    private lerpEntity(
        a: EntityState, 
        b: EntityState, 
        t: number
    ): EntityState {
        return {
            id: a.id,
            position: {
                x: this.lerp(a.position.x, b.position.x, t),
                y: this.lerp(a.position.y, b.position.y, t),
                z: this.lerp(a.position.z, b.position.z, t)
            },
            rotation: this.slerpRotation(a.rotation, b.rotation, t),
            velocity: {
                x: this.lerp(a.velocity.x, b.velocity.x, t),
                y: this.lerp(a.velocity.y, b.velocity.y, t),
                z: this.lerp(a.velocity.z, b.velocity.z, t)
            },
            // 其他字段...
        };
    }
    
    private lerp(a: number, b: number, t: number): number {
        return a + (b - a) * t;
    }
    
    // 球面线性插值（旋转）
    private slerpRotation(a: Quaternion, b: Quaternion, t: number): Quaternion {
        // 实现四元数SLERP
        // ...
        return result;
    }
    
    // 外推（预测）
    private extrapolate(
        entityId: string, 
        targetTime: number
    ): EntityState | null {
        const latestSnapshot = this.snapshots[this.snapshots.length - 1];
        if (!latestSnapshot) return null;
        
        const entity = latestSnapshot.entities.get(entityId);
        if (!entity) return null;
        
        const dt = (targetTime - latestSnapshot.timestamp) / 1000;
        
        // 基于速度外推位置
        return {
            ...entity,
            position: {
                x: entity.position.x + entity.velocity.x * dt,
                y: entity.position.y + entity.velocity.y * dt,
                z: entity.position.z + entity.velocity.z * dt
            }
        };
    }
}
```

### 4. 客户端预测与服务器调和

```typescript
// 客户端预测管理器
class ClientPrediction {
    private pendingInputs: PlayerInput[] = [];
    private predictedState: PlayerState;
    private serverState: PlayerState | null = null;
    private inputSequence: number = 0;
    
    // 处理本地输入（立即响应）
    processLocalInput(input: PlayerInput): void {
        // 分配序列号
        input.sequence = this.inputSequence++;
        input.timestamp = Date.now();
        
        // 保存到待确认队列
        this.pendingInputs.push(input);
        
        // 立即应用预测
        this.predictedState = this.applyInput(this.predictedState, input);
        
        // 发送给服务器
        this.sendToServer(input);
    }
    
    // 接收服务器确认
    receiveServerState(serverState: ServerStateUpdate): void {
        this.serverState = serverState.playerState;
        
        // 移除已确认的输入
        this.pendingInputs = this.pendingInputs.filter(
            input => input.sequence > serverState.lastProcessedInput
        );
        
        // 重新应用未确认的预测输入
        this.reconcile();
    }
    
    // 调和预测与服务器状态
    private reconcile(): void {
        if (!this.serverState) return;
        
        // 从服务器状态开始
        let correctedState = { ...this.serverState };
        
        // 重新应用所有未确认的输入
        for (const input of this.pendingInputs) {
            correctedState = this.applyInput(correctedState, input);
        }
        
        // 计算差异
        const divergence = this.calculateDivergence(
            this.predictedState, 
            correctedState
        );
        
        if (divergence > this.reconciliationThreshold) {
            // 差异过大，立即修正
            this.predictedState = correctedState;
            this.onReconciliationNeeded();
        } else {
            // 平滑过渡
            this.predictedState = this.smoothReconciliation(
                this.predictedState, 
                correctedState
            );
        }
    }
    
    // 平滑调和（避免突兀的修正）
    private smoothReconciliation(
        current: PlayerState, 
        target: PlayerState
    ): PlayerState {
        const alpha = 0.3; // 插值因子
        
        return {
            ...current,
            position: {
                x: this.lerp(current.position.x, target.position.x, alpha),
                y: this.lerp(current.position.y, target.position.y, alpha),
                z: this.lerp(current.position.z, target.position.z, alpha)
            }
        };
    }
}
```

---

## 局域网发现机制

### 1. mDNS协议实现

```typescript
// mDNS服务发现
class MDNSServiceDiscovery {
    private mdnsClient: any; // 使用bonjour或类似库
    private discoveredServices: Map<string, DiscoveredService> = new Map();
    private browser: any;
    
    // 游戏服务类型
    private readonly SERVICE_TYPE = '_webgame._tcp.local';
    
    // 开始发现
    startDiscovery(): void {
        const bonjour = require('bonjour')();
        
        this.browser = bonjour.find({ type: 'webgame' });
        
        this.browser.on('up', (service: any) => {
            const discoveredService: DiscoveredService = {
                name: service.name,
                host: service.host,
                port: service.port,
                addresses: service.addresses,
                txt: service.txt,
                lastSeen: Date.now()
            };
            
            this.discoveredServices.set(service.name, discoveredService);
            this.emit('serviceFound', discoveredService);
        });
        
        this.browser.on('down', (service: any) => {
            this.discoveredServices.delete(service.name);
            this.emit('serviceLost', service.name);
        });
    }
    
    // 发布自己的服务
    advertiseService(
        roomInfo: RoomInfo, 
        port: number
    ): void {
        const bonjour = require('bonjour')();
        
        bonjour.publish({
            name: `webgame-${roomInfo.roomId}`,
            type: 'webgame',
            port: port,
            txt: {
                roomId: roomInfo.roomId,
                roomName: roomInfo.name,
                hostName: roomInfo.hostName,
                playerCount: roomInfo.playerCount.toString(),
                maxPlayers: roomInfo.maxPlayers.toString(),
                gameMode: roomInfo.gameMode,
                version: roomInfo.version
            }
        });
    }
    
    // 停止发现
    stopDiscovery(): void {
        if (this.browser) {
            this.browser.stop();
        }
    }
}

// 浏览器原生mDNS实现（使用WebRTC DataChannel作为备选）
class BrowserMDNS {
    private socket: UDPBroadcastSocket;
    private readonly MDNS_PORT = 5353;
    private readonly MDNS_ADDRESS = '224.0.0.251';
    
    // 发送mDNS查询
    sendQuery(serviceType: string): void {
        const query = this.buildDNSQuery(serviceType);
        this.socket.send(query, this.MDNS_PORT, this.MDNS_ADDRESS);
    }
    
    // 构建DNS查询包
    private buildDNSQuery(serviceType: string): Uint8Array {
        // DNS查询包格式
        // 头部 + 问题部分
        const encoder = new TextEncoder();
        const serviceBytes = encoder.encode(serviceType);
        
        const packet = new Uint8Array(12 + serviceBytes.length + 5);
        const view = new DataView(packet.buffer);
        
        // 事务ID
        view.setUint16(0, Math.floor(Math.random() * 65536));
        // 标志
        view.setUint16(2, 0x0000);
        // 问题数
        view.setUint16(4, 1);
        // 回答数、授权数、附加数
        view.setUint16(6, 0);
        view.setUint16(8, 0);
        view.setUint16(10, 0);
        
        // 问题部分
        let offset = 12;
        for (const label of serviceType.split('.')) {
            const labelBytes = encoder.encode(label);
            packet[offset++] = labelBytes.length;
            packet.set(labelBytes, offset);
            offset += labelBytes.length;
        }
        packet[offset++] = 0; // 结束标记
        
        // 查询类型 (PTR = 12)
        view.setUint16(offset, 12);
        offset += 2;
        
        // 查询类 (IN = 1)
        view.setUint16(offset, 1);
        
        return packet;
    }
}
```

### 2. UDP广播方案

```typescript
// UDP广播发现（备选方案）
class UDPBroadcastDiscovery {
    private socket: dgram.Socket;
    private readonly BROADCAST_PORT = 27777;
    private readonly BROADCAST_INTERVAL = 2000; // 2秒广播一次
    private broadcastTimer: NodeJS.Timer | null = null;
    
    // 启动广播服务
    startBroadcast(roomInfo: RoomInfo): void {
        this.socket = dgram.createSocket('udp4');
        
        this.socket.bind(() => {
            this.socket.setBroadcast(true);
        });
        
        const broadcastMessage = JSON.stringify({
            type: 'GAME_ADVERTISE',
            roomId: roomInfo.roomId,
            roomName: roomInfo.name,
            hostName: roomInfo.hostName,
            playerCount: roomInfo.playerCount,
            maxPlayers: roomInfo.maxPlayers,
            gameMode: roomInfo.gameMode,
            version: roomInfo.version,
            timestamp: Date.now()
        });
        
        this.broadcastTimer = setInterval(() => {
            this.socket.send(
                broadcastMessage,
                0,
                broadcastMessage.length,
                this.BROADCAST_PORT,
                '255.255.255.255'
            );
        }, this.BROADCAST_INTERVAL);
    }
    
    // 启动发现监听
    startListening(): void {
        this.socket = dgram.createSocket('udp4');
        
        this.socket.on('message', (msg, rinfo) => {
            try {
                const data = JSON.parse(msg.toString());
                
                if (data.type === 'GAME_ADVERTISE') {
                    // 验证消息时效性（防止过期广播）
                    if (Date.now() - data.timestamp < 10000) {
                        this.emit('roomDiscovered', {
                            ...data,
                            address: rinfo.address,
                            port: rinfo.port
                        });
                    }
                }
            } catch (e) {
                // 忽略非JSON消息
            }
        });
        
        this.socket.bind(this.BROADCAST_PORT);
    }
    
    // 停止广播
    stopBroadcast(): void {
        if (this.broadcastTimer) {
            clearInterval(this.broadcastTimer);
        }
        if (this.socket) {
            this.socket.close();
        }
    }
}
```

### 3. WebRTC局域网P2P

```typescript
// WebRTC P2P连接管理器
class WebRTCP2PManager {
    private connections: Map<string, RTCPeerConnection> = new Map();
    private dataChannels: Map<string, RTCDataChannel> = new Map();
    private iceServers: RTCIceServer[] = [
        { urls: 'stun:stun.l.google.com:19302' }
    ];
    
    // 创建P2P连接（局域网优先）
    async createConnection(
        peerId: string, 
        isInitiator: boolean
    ): Promise<RTCDataChannel> {
        const config: RTCConfiguration = {
            iceServers: this.iceServers,
            iceTransportPolicy: 'all', // 允许所有传输方式
            iceCandidatePoolSize: 10
        };
        
        const pc = new RTCPeerConnection(config);
        this.connections.set(peerId, pc);
        
        // 收集ICE候选
        pc.onicecandidate = (event) => {
            if (event.candidate) {
                this.sendSignal(peerId, {
                    type: 'ice-candidate',
                    candidate: event.candidate
                });
            }
        };
        
        // 连接状态监控
        pc.onconnectionstatechange = () => {
            console.log(`Connection state: ${pc.connectionState}`);
            
            if (pc.connectionState === 'connected') {
                this.emit('peerConnected', peerId);
            } else if (pc.connectionState === 'disconnected') {
                this.emit('peerDisconnected', peerId);
            }
        };
        
        // 创建数据通道
        let dataChannel: RTCDataChannel;
        
        if (isInitiator) {
            dataChannel = pc.createDataChannel('game', {
                ordered: false, // 允许乱序（游戏通常可接受）
                maxRetransmits: 0 // 不重传（实时性优先）
            });
            this.setupDataChannel(dataChannel, peerId);
            
            // 创建offer
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            
            this.sendSignal(peerId, {
                type: 'offer',
                sdp: offer
            });
        } else {
            // 等待数据通道
            pc.ondatachannel = (event) => {
                dataChannel = event.channel;
                this.setupDataChannel(dataChannel, peerId);
            };
        }
        
        return new Promise((resolve) => {
            const checkInterval = setInterval(() => {
                if (dataChannel && dataChannel.readyState === 'open') {
                    clearInterval(checkInterval);
                    resolve(dataChannel);
                }
            }, 100);
        });
    }
    
    // 设置数据通道
    private setupDataChannel(channel: RTCDataChannel, peerId: string): void {
        this.dataChannels.set(peerId, channel);
        
        channel.onopen = () => {
            console.log(`Data channel opened with ${peerId}`);
        };
        
        channel.onmessage = (event) => {
            this.handleP2PMessage(peerId, event.data);
        };
        
        channel.onclose = () => {
            console.log(`Data channel closed with ${peerId}`);
            this.dataChannels.delete(peerId);
        };
    }
    
    // 发送P2P消息
    sendToPeer(peerId: string, data: any): void {
        const channel = this.dataChannels.get(peerId);
        if (channel && channel.readyState === 'open') {
            const serialized = typeof data === 'string' 
                ? data 
                : JSON.stringify(data);
            channel.send(serialized);
        }
    }
    
    // 广播给所有对等节点
    broadcastToPeers(data: any): void {
        for (const [peerId, channel] of this.dataChannels) {
            if (channel.readyState === 'open') {
                channel.send(JSON.stringify(data));
            }
        }
    }
}
```

---

## 协议栈选择

### 1. 协议对比分析

| 协议 | 延迟 | 可靠性 | 带宽效率 | 穿透能力 | 适用场景 |
|-----|------|--------|---------|---------|---------|
| **WebSocket** | 中 | 高(有序) | 中 | 优秀 | 大厅、匹配、信令 |
| **WebRTC DataChannel** | 低 | 可配置 | 高 | 好(STUN/TURN) | 实时游戏数据传输 |
| **UDP (原生)** | 最低 | 无保证 | 最高 | 差 | 局域网、可控环境 |
| **gRPC** | 中 | 高 | 中 | 优秀 | 服务端API、匹配 |

### 2. 推荐协议栈架构

```
┌─────────────────────────────────────────────────────────────┐
│                      协议栈分层架构                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  应用层                                                      │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ • 游戏逻辑消息  • 房间管理  • 匹配系统  • 发现服务    │   │
│  └─────────────────────────────────────────────────────┘   │
│                          │                                  │
│  序列化层                                                   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  FlatBuffers (首选)  │  MessagePack  │  JSON (调试)  │   │
│  └─────────────────────────────────────────────────────┘   │
│                          │                                  │
│  传输层（多路复用）                                          │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  可靠通道: WebSocket (TCP)                          │   │
│  │  实时通道: WebRTC DataChannel (UDP-like)            │   │
│  │  局域网: 原生UDP广播                                │   │
│  └─────────────────────────────────────────────────────┘   │
│                          │                                  │
│  网络层                                                     │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  HTTP/2  │  WebSocket  │  ICE/STUN/TURN  │  UDP     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 3. 序列化方案对比

```typescript
// FlatBuffers 定义示例（.fbs文件）
// game_messages.fbs
namespace Game.Messages;

table InputFrame {
    frame_number: uint32;
    player_id: string;
    inputs: [PlayerInput];
    timestamp: uint64;
    checksum: uint32;
}

table PlayerInput {
    type: InputType;
    data: [ubyte];
}

enum InputType: byte {
    MOVE = 0,
    ATTACK = 1,
    SKILL = 2,
    ITEM = 3
}

table Vector3 {
    x: float;
    y: float;
    z: float;
}

table EntityState {
    id: string;
    position: Vector3;
    rotation: Vector3;
    velocity: Vector3;
    health: float;
}

table StateSnapshot {
    timestamp: uint64;
    sequence: uint32;
    entities: [EntityState];
}

root_type InputFrame;
```

| 序列化方案 | 序列化速度 | 反序列化速度 | 包大小 | Schema演进 | 跨语言 |
|-----------|-----------|-------------|--------|-----------|-------|
| **FlatBuffers** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ✅ | ✅ |
| **Protobuf** | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | ✅ | ✅ |
| **MessagePack** | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⚠️ | ✅ |
| **JSON** | ⭐⭐ | ⭐⭐ | ⭐ | ✅ | ✅ |

**推荐**：实时游戏数据使用FlatBuffers，配置数据使用JSON，调试日志使用JSON。

---

## 本地/云端后端代码复用架构

### 1. 抽象层设计

```typescript
// 后端抽象接口
interface IGameBackend {
    // 初始化
    initialize(config: BackendConfig): Promise<void>;
    
    // 玩家管理
    addPlayer(player: PlayerInfo): Promise<void>;
    removePlayer(playerId: string): Promise<void>;
    
    // 游戏循环
    startGameLoop(): void;
    stopGameLoop(): void;
    
    // 输入处理
    processInput(playerId: string, input: PlayerInput): void;
    
    // 状态获取
    getGameState(): GameState;
    getPlayerState(playerId: string): PlayerState;
    
    // 事件
    on(event: string, callback: Function): void;
    emit(event: string, data: any): void;
}

// 同步策略抽象
interface ISyncStrategy {
    // 初始化
    initialize(backend: IGameBackend): void;
    
    // 发送更新
    sendUpdate(playerId: string, state: GameState): void;
    broadcastUpdate(state: GameState): void;
    
    // 接收输入
    onInputReceived(playerId: string, input: PlayerInput): void;
    
    // 同步配置
    getSyncConfig(): SyncConfig;
}

// 帧同步策略
class LockstepSyncStrategy implements ISyncStrategy {
    private backend: IGameBackend;
    private inputBuffer: Map<number, Map<string, PlayerInput[]>> = new Map();
    private currentFrame: number = 0;
    private inputDelay: number = 3;
    
    initialize(backend: IGameBackend): void {
        this.backend = backend;
    }
    
    onInputReceived(playerId: string, input: PlayerInput): void {
        const targetFrame = this.currentFrame + this.inputDelay;
        
        if (!this.inputBuffer.has(targetFrame)) {
            this.inputBuffer.set(targetFrame, new Map());
        }
        
        const frameInputs = this.inputBuffer.get(targetFrame)!;
        if (!frameInputs.has(playerId)) {
            frameInputs.set(playerId, []);
        }
        
        frameInputs.get(playerId)!.push(input);
    }
    
    // 每帧调用
    tick(): void {
        const frameInputs = this.inputBuffer.get(this.currentFrame);
        
        if (frameInputs && this.allInputsReceived(frameInputs)) {
            // 执行帧
            this.executeFrame(frameInputs);
            this.inputBuffer.delete(this.currentFrame);
            this.currentFrame++;
        }
    }
    
    private allInputsReceived(frameInputs: Map<string, PlayerInput[]>): boolean {
        const allPlayers = this.backend.getAllPlayerIds();
        return allPlayers.every(id => frameInputs.has(id));
    }
    
    private executeFrame(inputs: Map<string, PlayerInput[]>): void {
        inputs.forEach((playerInputs, playerId) => {
            playerInputs.forEach(input => {
                this.backend.processInput(playerId, input);
            });
        });
        
        // 广播状态（帧同步中可选，用于校验）
        const state = this.backend.getGameState();
        this.broadcastUpdate(state);
    }
    
    getSyncConfig(): SyncConfig {
        return {
            type: 'lockstep',
            tickRate: 60,
            inputDelay: this.inputDelay
        };
    }
}

// 状态同步策略
class StateSyncStrategy implements ISyncStrategy {
    private backend: IGameBackend;
    private updateRate: number = 20; // 20Hz
    private lastUpdateTime: number = 0;
    private deltaManager: DeltaSyncManager;
    
    initialize(backend: IGameBackend): void {
        this.backend = backend;
        this.deltaManager = new DeltaSyncManager();
    }
    
    onInputReceived(playerId: string, input: PlayerInput): void {
        // 立即处理输入
        this.backend.processInput(playerId, input);
    }
    
    // 定期广播状态
    update(): void {
        const now = Date.now();
        
        if (now - this.lastUpdateTime >= 1000 / this.updateRate) {
            const state = this.backend.getGameState();
            
            // 对每个玩家发送增量更新
            for (const playerId of this.backend.getAllPlayerIds()) {
                const delta = this.deltaManager.computeDelta(playerId, state);
                this.sendUpdate(playerId, delta);
            }
            
            this.lastUpdateTime = now;
        }
    }
    
    sendUpdate(playerId: string, state: any): void {
        // 实际发送逻辑由传输层处理
        this.backend.emit('stateUpdate', { playerId, state });
    }
    
    broadcastUpdate(state: GameState): void {
        // 状态同步中不常用
    }
    
    getSyncConfig(): SyncConfig {
        return {
            type: 'state',
            updateRate: this.updateRate
        };
    }
}
```

### 2. 本地后端实现（Web Worker）

```typescript
// 本地后端（运行在Web Worker中）
class LocalBackend implements IGameBackend {
    private gameWorld: GameWorld;
    private players: Map<string, PlayerInfo> = new Map();
    private eventEmitter: EventEmitter;
    private syncStrategy: ISyncStrategy;
    private gameLoopId: number | null = null;
    
    constructor(syncStrategy: ISyncStrategy) {
        this.syncStrategy = syncStrategy;
        this.syncStrategy.initialize(this);
        this.eventEmitter = new EventEmitter();
    }
    
    async initialize(config: BackendConfig): Promise<void> {
        this.gameWorld = new GameWorld(config.worldConfig);
        
        // 启动游戏循环
        this.startGameLoop();
    }
    
    startGameLoop(): void {
        const tick = () => {
            // 更新游戏世界
            this.gameWorld.update(1 / 60);
            
            // 执行同步策略
            if (this.syncStrategy instanceof LockstepSyncStrategy) {
                (this.syncStrategy as LockstepSyncStrategy).tick();
            } else if (this.syncStrategy instanceof StateSyncStrategy) {
                (this.syncStrategy as StateSyncStrategy).update();
            }
            
            this.gameLoopId = requestAnimationFrame(tick);
        };
        
        tick();
    }
    
    stopGameLoop(): void {
        if (this.gameLoopId !== null) {
            cancelAnimationFrame(this.gameLoopId);
        }
    }
    
    addPlayer(player: PlayerInfo): Promise<void> {
        this.players.set(player.id, player);
        this.gameWorld.spawnPlayer(player);
        return Promise.resolve();
    }
    
    removePlayer(playerId: string): Promise<void> {
        this.players.delete(playerId);
        this.gameWorld.removePlayer(playerId);
        return Promise.resolve();
    }
    
    processInput(playerId: string, input: PlayerInput): void {
        this.syncStrategy.onInputReceived(playerId, input);
    }
    
    getGameState(): GameState {
        return this.gameWorld.getState();
    }
    
    getPlayerState(playerId: string): PlayerState {
        return this.gameWorld.getPlayerState(playerId);
    }
    
    getAllPlayerIds(): string[] {
        return Array.from(this.players.keys());
    }
    
    on(event: string, callback: Function): void {
        this.eventEmitter.on(event, callback);
    }
    
    emit(event: string, data: any): void {
        this.eventEmitter.emit(event, data);
    }
}

// Web Worker入口
// backend.worker.ts
self.onmessage = (event) => {
    const { type, payload } = event.data;
    
    switch (type) {
        case 'INIT':
            const backend = new LocalBackend(
                createSyncStrategy(payload.syncType)
            );
            backend.initialize(payload.config);
            (self as any).backend = backend;
            
            // 转发事件到主线程
            backend.on('stateUpdate', (data) => {
                self.postMessage({ type: 'STATE_UPDATE', data });
            });
            break;
            
        case 'INPUT':
            (self as any).backend.processInput(payload.playerId, payload.input);
            break;
            
        case 'ADD_PLAYER':
            (self as any).backend.addPlayer(payload.player);
            break;
            
        case 'REMOVE_PLAYER':
            (self as any).backend.removePlayer(payload.playerId);
            break;
    }
};
```

### 3. 云端后端实现

```typescript
// 云端后端（Node.js服务器）
class CloudBackend implements IGameBackend {
    private gameWorld: GameWorld;
    private players: Map<string, PlayerConnection> = new Map();
    private syncStrategy: ISyncStrategy;
    private io: SocketIOServer;
    private gameLoopInterval: NodeJS.Timer | null = null;
    
    constructor(io: SocketIOServer, syncStrategy: ISyncStrategy) {
        this.io = io;
        this.syncStrategy = syncStrategy;
        this.syncStrategy.initialize(this);
    }
    
    async initialize(config: BackendConfig): Promise<void> {
        this.gameWorld = new GameWorld(config.worldConfig);
        
        // 设置Socket.IO事件处理
        this.io.on('connection', (socket) => {
            this.handleConnection(socket);
        });
        
        this.startGameLoop();
    }
    
    private handleConnection(socket: Socket): void {
        socket.on('join', (playerInfo: PlayerInfo) => {
            this.addPlayer({ ...playerInfo, socketId: socket.id });
        });
        
        socket.on('input', (input: PlayerInput) => {
            const player = this.findPlayerBySocket(socket.id);
            if (player) {
                this.processInput(player.id, input);
            }
        });
        
        socket.on('disconnect', () => {
            const player = this.findPlayerBySocket(socket.id);
            if (player) {
                this.removePlayer(player.id);
            }
        });
    }
    
    startGameLoop(): void {
        const TICK_RATE = 60;
        
        this.gameLoopInterval = setInterval(() => {
            this.gameWorld.update(1 / TICK_RATE);
            
            if (this.syncStrategy instanceof LockstepSyncStrategy) {
                (this.syncStrategy as LockstepSyncStrategy).tick();
            } else if (this.syncStrategy instanceof StateSyncStrategy) {
                (this.syncStrategy as StateSyncStrategy).update();
            }
        }, 1000 / TICK_RATE);
    }
    
    stopGameLoop(): void {
        if (this.gameLoopInterval) {
            clearInterval(this.gameLoopInterval);
        }
    }
    
    async addPlayer(player: PlayerInfo & { socketId: string }): Promise<void> {
        this.players.set(player.id, {
            info: player,
            socket: this.io.sockets.sockets.get(player.socketId)!
        });
        
        this.gameWorld.spawnPlayer(player);
        
        // 广播玩家加入
        this.broadcast('playerJoined', player);
    }
    
    async removePlayer(playerId: string): Promise<void> {
        this.players.delete(playerId);
        this.gameWorld.removePlayer(playerId);
        
        this.broadcast('playerLeft', { playerId });
    }
    
    processInput(playerId: string, input: PlayerInput): void {
        this.syncStrategy.onInputReceived(playerId, input);
    }
    
    getGameState(): GameState {
        return this.gameWorld.getState();
    }
    
    getPlayerState(playerId: string): PlayerState {
        return this.gameWorld.getPlayerState(playerId);
    }
    
    getAllPlayerIds(): string[] {
        return Array.from(this.players.keys());
    }
    
    // 发送给特定玩家
    sendToPlayer(playerId: string, event: string, data: any): void {
        const player = this.players.get(playerId);
        if (player) {
            player.socket.emit(event, data);
        }
    }
    
    // 广播给所有玩家
    broadcast(event: string, data: any): void {
        this.io.emit(event, data);
    }
    
    on(event: string, callback: Function): void {
        // 服务器端事件处理
    }
    
    emit(event: string, data: any): void {
        if (event === 'stateUpdate') {
            const { playerId, state } = data;
            this.sendToPlayer(playerId, 'state', state);
        }
    }
}
```

### 4. 后端工厂与运行时切换

```typescript
// 后端工厂
class BackendFactory {
    static createBackend(
        type: 'local' | 'cloud' | 'lan-host',
        config: BackendConfig,
        syncStrategy: ISyncStrategy
    ): IGameBackend {
        switch (type) {
            case 'local':
                return new LocalBackend(syncStrategy);
                
            case 'cloud':
                // 需要Socket.IO实例
                const io = new SocketIOServer(config.server);
                return new CloudBackend(io, syncStrategy);
                
            case 'lan-host':
                // 局域网主机（同时作为服务器和客户端）
                return new LANHostBackend(syncStrategy);
                
            default:
                throw new Error(`Unknown backend type: ${type}`);
        }
    }
}

// 运行时切换示例
class GameNetworkManager {
    private currentBackend: IGameBackend | null = null;
    private syncStrategy: ISyncStrategy;
    
    async switchBackend(type: 'local' | 'cloud' | 'lan-host'): Promise<void> {
        // 保存当前状态
        const currentState = this.currentBackend?.getGameState();
        
        // 停止当前后端
        if (this.currentBackend) {
            this.currentBackend.stopGameLoop();
        }
        
        // 创建新后端
        this.currentBackend = BackendFactory.createBackend(
            type,
            this.config,
            this.syncStrategy
        );
        
        // 初始化并恢复状态
        await this.currentBackend.initialize(this.config);
        
        if (currentState) {
            // 恢复玩家
            for (const player of currentState.players) {
                await this.currentBackend.addPlayer(player);
            }
        }
    }
}
```

---

## 房间和匹配系统架构

### 1. 房间系统架构

```typescript
// 房间管理器
class RoomManager {
    private rooms: Map<string, Room> = new Map();
    private playerRooms: Map<string, string> = new Map(); // playerId -> roomId
    private eventEmitter: EventEmitter;
    
    // 创建房间
    async createRoom(
        hostId: string, 
        config: RoomConfig
    ): Promise<Room> {
        const roomId = this.generateRoomId();
        
        const room: Room = {
            id: roomId,
            name: config.name || `Room ${roomId}`,
            hostId,
            players: new Map([[hostId, { 
                id: hostId, 
                isHost: true,
                isReady: false 
            }]]),
            maxPlayers: config.maxPlayers || 8,
            gameMode: config.gameMode,
            status: 'waiting', // waiting, ready, playing, ended
            settings: config.settings,
            createdAt: Date.now()
        };
        
        this.rooms.set(roomId, room);
        this.playerRooms.set(hostId, roomId);
        
        this.emit('roomCreated', room);
        
        return room;
    }
    
    // 加入房间
    async joinRoom(
        playerId: string, 
        roomId: string
    ): Promise<Room> {
        const room = this.rooms.get(roomId);
        
        if (!room) {
            throw new Error('Room not found');
        }
        
        if (room.players.size >= room.maxPlayers) {
            throw new Error('Room is full');
        }
        
        if (room.status !== 'waiting') {
            throw new Error('Game already started');
        }
        
        // 移除玩家从之前的房间
        const oldRoomId = this.playerRooms.get(playerId);
        if (oldRoomId) {
            await this.leaveRoom(playerId);
        }
        
        // 加入新房间
        room.players.set(playerId, {
            id: playerId,
            isHost: false,
            isReady: false
        });
        
        this.playerRooms.set(playerId, roomId);
        
        this.broadcastToRoom(roomId, 'playerJoined', {
            playerId,
            playerCount: room.players.size
        });
        
        return room;
    }
    
    // 离开房间
    async leaveRoom(playerId: string): Promise<void> {
        const roomId = this.playerRooms.get(playerId);
        if (!roomId) return;
        
        const room = this.rooms.get(roomId);
        if (!room) return;
        
        room.players.delete(playerId);
        this.playerRooms.delete(playerId);
        
        // 如果房主离开，转移房主
        if (room.hostId === playerId && room.players.size > 0) {
            const newHost = room.players.values().next().value;
            room.hostId = newHost.id;
            newHost.isHost = true;
        }
        
        // 如果房间空了，删除房间
        if (room.players.size === 0) {
            this.rooms.delete(roomId);
            this.emit('roomClosed', { roomId });
        } else {
            this.broadcastToRoom(roomId, 'playerLeft', {
                playerId,
                playerCount: room.players.size
            });
        }
    }
    
    // 玩家准备
    setPlayerReady(playerId: string, isReady: boolean): void {
        const roomId = this.playerRooms.get(playerId);
        if (!roomId) return;
        
        const room = this.rooms.get(roomId);
        if (!room) return;
        
        const player = room.players.get(playerId);
        if (player) {
            player.isReady = isReady;
            
            this.broadcastToRoom(roomId, 'playerReady', {
                playerId,
                isReady
            });
            
            // 检查是否所有玩家都准备
            this.checkAllReady(room);
        }
    }
    
    // 检查是否全部准备
    private checkAllReady(room: Room): void {
        const allReady = Array.from(room.players.values())
            .every(p => p.isReady);
        
        if (allReady && room.players.size >= 2) {
            room.status = 'ready';
            this.broadcastToRoom(room.id, 'allReady', {
                roomId: room.id
            });
        }
    }
    
    // 开始游戏
    async startGame(roomId: string, hostId: string): Promise<void> {
        const room = this.rooms.get(roomId);
        
        if (!room || room.hostId !== hostId) {
            throw new Error('Unauthorized');
        }
        
        if (room.players.size < 2) {
            throw new Error('Not enough players');
        }
        
        room.status = 'playing';
        
        this.broadcastToRoom(roomId, 'gameStarting', {
            roomId,
            players: Array.from(room.players.keys()),
            gameMode: room.gameMode
        });
    }
    
    // 广播给房间内所有玩家
    private broadcastToRoom(
        roomId: string, 
        event: string, 
        data: any
    ): void {
        const room = this.rooms.get(roomId);
        if (!room) return;
        
        for (const playerId of room.players.keys()) {
            this.sendToPlayer(playerId, event, data);
        }
    }
    
    // 生成房间ID
    private generateRoomId(): string {
        return Math.random().toString(36).substring(2, 8).toUpperCase();
    }
}

// 房间状态
interface Room {
    id: string;
    name: string;
    hostId: string;
    players: Map<string, RoomPlayer>;
    maxPlayers: number;
    gameMode: string;
    status: 'waiting' | 'ready' | 'playing' | 'ended';
    settings: GameSettings;
    createdAt: number;
}

interface RoomPlayer {
    id: string;
    isHost: boolean;
    isReady: boolean;
}
```

### 2. 匹配系统架构

```typescript
// 匹配系统
class MatchmakingSystem {
    private waitingPlayers: Map<string, MatchmakingRequest> = new Map();
    private activeMatches: Map<string, Match> = new Map();
    private matchmakingQueue: PriorityQueue<MatchmakingRequest>;
    private matchmakingInterval: NodeJS.Timer | null = null;
    
    // 匹配配置
    private readonly MATCHMAKING_INTERVAL = 5000; // 5秒检查一次
    private readonly SKILL_RANGE_EXPAND = 100; // 技能分扩展范围
    private readonly MAX_WAIT_TIME = 300000; // 最大等待5分钟
    
    // 开始匹配
    async startMatchmaking(
        playerId: string, 
        criteria: MatchCriteria
    ): Promise<void> {
        const request: MatchmakingRequest = {
            playerId,
            criteria,
            skillRating: await this.getPlayerSkillRating(playerId),
            region: await this.getPlayerRegion(playerId),
            enqueueTime: Date.now(),
            expandedRange: 0
        };
        
        this.waitingPlayers.set(playerId, request);
        this.matchmakingQueue.enqueue(request, this.calculatePriority(request));
        
        // 启动匹配循环
        if (!this.matchmakingInterval) {
            this.startMatchmakingLoop();
        }
    }
    
    // 取消匹配
    cancelMatchmaking(playerId: string): void {
        this.waitingPlayers.delete(playerId);
    }
    
    // 匹配循环
    private startMatchmakingLoop(): void {
        this.matchmakingInterval = setInterval(() => {
            this.processMatchmaking();
        }, this.MATCHMAKING_INTERVAL);
    }
    
    // 处理匹配
    private processMatchmaking(): void {
        const requests = Array.from(this.waitingPlayers.values());
        
        // 按游戏模式分组
        const groupedByMode = this.groupByGameMode(requests);
        
        for (const [gameMode, modeRequests] of groupedByMode) {
            this.matchPlayers(modeRequests, gameMode);
        }
        
        // 扩展等待时间较长的玩家的匹配范围
        this.expandSkillRanges(requests);
    }
    
    // 玩家匹配算法
    private matchPlayers(
        requests: MatchmakingRequest[], 
        gameMode: string
    ): void {
        const gameConfig = this.getGameConfig(gameMode);
        const requiredPlayers = gameConfig.teamSize * gameConfig.teamCount;
        
        // 按技能分排序
        requests.sort((a, b) => a.skillRating - b.skillRating);
        
        const matched: MatchmakingRequest[] = [];
        
        for (const request of requests) {
            if (matched.length >= requiredPlayers) break;
            
            // 检查是否可以加入当前匹配组
            const canMatch = matched.every(m => 
                this.canPlayersMatch(m, request)
            );
            
            if (canMatch || matched.length === 0) {
                matched.push(request);
            }
        }
        
        if (matched.length >= requiredPlayers) {
            this.createMatch(matched, gameMode);
        }
    }
    
    // 检查两个玩家是否可以匹配
    private canPlayersMatch(
        a: MatchmakingRequest, 
        b: MatchmakingRequest
    ): boolean {
        // 技能分检查
        const skillDiff = Math.abs(a.skillRating - b.skillRating);
        const maxSkillDiff = Math.max(a.expandedRange, b.expandedRange);
        
        if (skillDiff > maxSkillDiff) {
            return false;
        }
        
        // 地区检查（可选）
        if (a.criteria.preferSameRegion && a.region !== b.region) {
            return false;
        }
        
        // 延迟检查
        const estimatedLatency = this.estimateLatency(a.region, b.region);
        if (estimatedLatency > a.criteria.maxLatency) {
            return false;
        }
        
        return true;
    }
    
    // 创建匹配
    private createMatch(
        players: MatchmakingRequest[], 
        gameMode: string
    ): void {
        const matchId = this.generateMatchId();
        
        // 从等待队列移除
        for (const player of players) {
            this.waitingPlayers.delete(player.playerId);
        }
        
        // 创建房间
        const room = this.roomManager.createRoom(
            players[0].playerId,
            {
                name: `Match ${matchId}`,
                maxPlayers: players.length,
                gameMode
            }
        );
        
        // 添加其他玩家到房间
        for (let i = 1; i < players.length; i++) {
            this.roomManager.joinRoom(players[i].playerId, room.id);
        }
        
        // 记录匹配
        const match: Match = {
            id: matchId,
            roomId: room.id,
            players: players.map(p => p.playerId),
            gameMode,
            createdAt: Date.now(),
            status: 'waiting'
        };
        
        this.activeMatches.set(matchId, match);
        
        // 通知玩家
        for (const player of players) {
            this.notifyPlayer(player.playerId, 'matchFound', {
                matchId,
                roomId: room.id
            });
        }
    }
    
    // 扩展技能范围（等待时间越长，范围越大）
    private expandSkillRanges(requests: MatchmakingRequest[]): void {
        const now = Date.now();
        
        for (const request of requests) {
            const waitTime = now - request.enqueueTime;
            
            // 每30秒扩展一次范围
            const expansions = Math.floor(waitTime / 30000);
            request.expandedRange = this.SKILL_RANGE_EXPAND * (1 + expansions);
            
            // 通知玩家匹配进度
            if (waitTime > 60000 && waitTime % 30000 < 5000) {
                this.notifyPlayer(request.playerId, 'matchmakingUpdate', {
                    waitTime,
                    expandedRange: request.expandedRange
                });
            }
        }
    }
    
    // 计算匹配优先级
    private calculatePriority(request: MatchmakingRequest): number {
        // 等待时间越长，优先级越高
        const waitTime = Date.now() - request.enqueueTime;
        return waitTime / 1000;
    }
}

// 匹配请求
interface MatchmakingRequest {
    playerId: string;
    criteria: MatchCriteria;
    skillRating: number;
    region: string;
    enqueueTime: number;
    expandedRange: number;
}

interface MatchCriteria {
    gameMode: string;
    preferSameRegion?: boolean;
    maxLatency?: number;
    teamSize?: number;
}
```

### 3. 状态管理与弹性扩展

```typescript
// 分布式房间状态管理（使用Redis）
class DistributedRoomManager {
    private redis: Redis;
    private pubsub: Redis;
    
    // 房间状态键前缀
    private readonly ROOM_KEY_PREFIX = 'room:';
    private readonly PLAYER_ROOM_KEY = 'player_room:';
    
    // 创建分布式房间
    async createRoom(
        hostId: string, 
        config: RoomConfig
    ): Promise<Room> {
        const roomId = this.generateRoomId();
        const room: Room = {
            id: roomId,
            name: config.name || `Room ${roomId}`,
            hostId,
            players: new Map(),
            maxPlayers: config.maxPlayers || 8,
            gameMode: config.gameMode,
            status: 'waiting',
            settings: config.settings,
            createdAt: Date.now()
        };
        
        // 存储到Redis
        await this.redis.setex(
            `${this.ROOM_KEY_PREFIX}${roomId}`,
            3600, // 1小时过期
            JSON.stringify(room)
        );
        
        // 发布房间创建事件
        await this.pubsub.publish('room:created', JSON.stringify(room));
        
        return room;
    }
    
    // 获取房间（带缓存）
    async getRoom(roomId: string): Promise<Room | null> {
        // 先从Redis获取
        const data = await this.redis.get(`${this.ROOM_KEY_PREFIX}${roomId}`);
        
        if (data) {
            return JSON.parse(data);
        }
        
        return null;
    }
    
    // 原子性更新房间状态
    async updateRoomState(
        roomId: string, 
        update: Partial<Room>
    ): Promise<void> {
        const key = `${this.ROOM_KEY_PREFIX}${roomId}`;
        
        // 使用Lua脚本保证原子性
        const script = `
            local room = redis.call('get', KEYS[1])
            if not room then return nil end
            
            local data = cjson.decode(room)
            for k, v in pairs(ARGV[1]) do
                data[k] = v
            end
            
            redis.call('set', KEYS[1], cjson.encode(data))
            return cjson.encode(data)
        `;
        
        await this.redis.eval(
            script,
            1,
            key,
            JSON.stringify(update)
        );
        
        // 发布状态更新
        await this.pubsub.publish(
            `room:${roomId}:update`, 
            JSON.stringify(update)
        );
    }
    
    // 房间心跳（续期）
    async roomHeartbeat(roomId: string): Promise<void> {
        await this.redis.expire(
            `${this.ROOM_KEY_PREFIX}${roomId}`,
            3600
        );
    }
    
    // 获取活跃房间列表
    async getActiveRooms(
        gameMode?: string,
        limit: number = 100
    ): Promise<Room[]> {
        const keys = await this.redis.keys(`${this.ROOM_KEY_PREFIX}*`);
        const rooms: Room[] = [];
        
        for (const key of keys.slice(0, limit)) {
            const data = await this.redis.get(key);
            if (data) {
                const room: Room = JSON.parse(data);
                if (!gameMode || room.gameMode === gameMode) {
                    rooms.push(room);
                }
            }
        }
        
        return rooms;
    }
}

// 服务发现和负载均衡
class GameServerRegistry {
    private consul: Consul;
    private servers: Map<string, GameServer> = new Map();
    
    // 注册游戏服务器
    async registerServer(serverInfo: GameServer): Promise<void> {
        await this.consul.agent.service.register({
            name: 'game-server',
            id: serverInfo.id,
            tags: [serverInfo.region, serverInfo.gameMode],
            port: serverInfo.port,
            check: {
                http: `http://${serverInfo.host}:${serverInfo.port}/health`,
                interval: '10s',
                timeout: '5s'
            },
            meta: {
                region: serverInfo.region,
                capacity: serverInfo.maxRooms.toString(),
                currentRooms: serverInfo.currentRooms.toString()
            }
        });
        
        this.servers.set(serverInfo.id, serverInfo);
    }
    
    // 获取最优服务器
    async getOptimalServer(
        region: string, 
        gameMode: string
    ): Promise<GameServer | null> {
        const services = await this.consul.health.service({
            service: 'game-server',
            tag: region,
            passing: true
        });
        
        // 按负载排序
        const availableServers = services
            .map((s: any) => ({
                id: s.Service.ID,
                host: s.Service.Address,
                port: s.Service.Port,
                load: parseInt(s.Service.Meta.currentRooms) / 
                      parseInt(s.Service.Meta.capacity)
            }))
            .filter((s: any) => s.load < 0.8) // 负载低于80%
            .sort((a: any, b: any) => a.load - b.load);
        
        return availableServers[0] || null;
    }
}
```

---

## 延迟隐藏与优化技术

### 1. 客户端预测

```typescript
// 客户端预测系统
class ClientPredictionSystem {
    private pendingInputs: Map<number, PredictedInput> = new Map();
    private predictedStates: Map<number, PlayerState> = new Map();
    private serverStates: Map<number, ServerState> = new Map();
    private currentSequence: number = 0;
    
    // 处理本地输入
    processLocalInput(input: PlayerInput): PlayerState {
        const sequence = this.currentSequence++;
        
        // 保存输入
        this.pendingInputs.set(sequence, {
            sequence,
            input,
            timestamp: Date.now()
        });
        
        // 预测应用
        const currentState = this.getCurrentPredictedState();
        const predictedState = this.applyInput(currentState, input);
        
        this.predictedStates.set(sequence, predictedState);
        
        return predictedState;
    }
    
    // 接收服务器状态
    receiveServerState(serverState: ServerStateUpdate): void {
        this.serverStates.set(serverState.sequence, serverState);
        
        // 执行调和
        this.reconcile(serverState);
    }
    
    // 调和预测与服务器状态
    private reconcile(serverState: ServerStateUpdate): void {
        // 找到服务器状态对应的预测
        const serverPredicted = this.predictedStates.get(
            serverState.lastProcessedInput
        );
        
        if (!serverPredicted) return;
        
        // 计算差异
        const divergence = this.calculateDivergence(
            serverPredicted,
            serverState.state
        );
        
        if (divergence < 0.1) {
            // 差异小，平滑过渡
            this.smoothReconciliation(serverState);
        } else {
            // 差异大，立即修正
            this.hardReconciliation(serverState);
        }
    }
    
    // 平滑调和
    private smoothReconciliation(serverState: ServerStateUpdate): void {
        const targetState = serverState.state;
        
        // 从服务器状态重新预测
        let state = { ...targetState };
        
        // 重新应用所有未确认的输入
        for (let seq = serverState.lastProcessedInput + 1; 
             seq < this.currentSequence; 
             seq++) {
            const input = this.pendingInputs.get(seq);
            if (input) {
                state = this.applyInput(state, input.input);
            }
        }
        
        // 平滑插值到新预测
        this.currentPredictedState = this.lerpStates(
            this.getCurrentPredictedState(),
            state,
            0.3
        );
    }
}
```

### 2. 延迟补偿（Lag Compensation）

```typescript
// 延迟补偿系统（服务器端）
class LagCompensation {
    private stateHistory: CircularBuffer<GameState>;
    private readonly HISTORY_SIZE = 128; // 约2秒历史（60fps）
    private readonly MAX_LATENCY = 500; // 最大补偿500ms
    
    constructor() {
        this.stateHistory = new CircularBuffer(this.HISTORY_SIZE);
    }
    
    // 记录每帧状态
    recordState(state: GameState): void {
        this.stateHistory.push({
            timestamp: Date.now(),
            state: this.cloneState(state)
        });
    }
    
    // 获取历史状态（用于命中判定）
    getHistoricalState(clientTimestamp: number): GameState | null {
        const serverTime = Date.now();
        const latency = serverTime - clientTimestamp;
        
        // 限制最大补偿时间
        if (latency > this.MAX_LATENCY) {
            console.warn(`Latency ${latency}ms exceeds max compensation`);
            return null;
        }
        
        // 找到最接近的历史状态
        const targetTime = serverTime - latency;
        
        let closestState: GameState | null = null;
        let closestDiff = Infinity;
        
        for (const record of this.stateHistory) {
            const diff = Math.abs(record.timestamp - targetTime);
            if (diff < closestDiff) {
                closestDiff = diff;
                closestState = record.state;
            }
        }
        
        return closestState;
    }
    
    // 执行带延迟补偿的命中检测
    performHitDetection(
        attacker: Player,
        attack: AttackInfo,
        clientTimestamp: number
    ): HitResult {
        // 获取历史状态
        const historicalState = this.getHistoricalState(clientTimestamp);
        
        if (!historicalState) {
            // 无法补偿，使用当前状态
            return this.checkHit(attacker, attack, this.currentState);
        }
        
        // 在历史状态下进行命中检测
        return this.checkHit(attacker, attack, historicalState);
    }
}
```

### 3. 输入缓冲与延迟渲染

```typescript
// 输入缓冲区
class InputBuffer {
    private buffer: Map<number, InputFrame> = new Map();
    private readonly BUFFER_SIZE = 6; // 100ms缓冲（60fps）
    private currentFrame: number = 0;
    
    // 添加输入到缓冲区
    addInput(input: InputFrame): void {
        this.buffer.set(input.frameNumber, input);
    }
    
    // 获取可执行的输入
    getExecutableInput(): InputFrame | null {
        const targetFrame = this.currentFrame;
        const input = this.buffer.get(targetFrame);
        
        if (input) {
            this.buffer.delete(targetFrame);
            this.currentFrame++;
            return input;
        }
        
        return null; // 等待输入
    }
    
    // 检查缓冲区状态
    getBufferStatus(): BufferStatus {
        const bufferedFrames = this.buffer.size;
        
        if (bufferedFrames < 2) {
            return 'UNDERRUN'; // 缓冲区不足
        } else if (bufferedFrames > this.BUFFER_SIZE * 1.5) {
            return 'OVERRUN'; // 缓冲区溢出
        }
        
        return 'OK';
    }
}

// 延迟渲染系统
class DelayedRenderSystem {
    private renderBuffer: RenderFrame[] = [];
    private readonly RENDER_DELAY = 3; // 3帧延迟
    private currentFrame: number = 0;
    
    // 提交渲染帧
    submitRenderFrame(frame: RenderFrame): void {
        this.renderBuffer.push(frame);
    }
    
    // 获取应渲染的帧
    getRenderFrame(): RenderFrame | null {
        const targetFrame = this.currentFrame - this.RENDER_DELAY;
        
        const frame = this.renderBuffer.find(f => f.frameNumber === targetFrame);
        
        if (frame) {
            // 移除已渲染的帧
            this.renderBuffer = this.renderBuffer.filter(
                f => f.frameNumber > targetFrame
            );
            this.currentFrame++;
            return frame;
        }
        
        return null;
    }
}
```

---

## 优缺点分析

### 帧同步方案

| 优点 | 缺点 |
|-----|------|
| ✅ 带宽占用极低（只传输入） | ❌ 需要完全确定性 |
| ✅ 支持大规模单位同步 | ❌ 难以跨平台保证一致性 |
| ✅ 天然支持回放和观战 | ❌ 最慢玩家决定整体速度 |
| ✅ 作弊检测相对简单 | ❌ 断线重连复杂 |
| ✅ 服务器压力小 | ❌ 不适合高延迟环境 |

### 状态同步方案

| 优点 | 缺点 |
|-----|------|
| ✅ 实现相对简单 | ❌ 带宽占用高 |
| ✅ 支持任意平台 | ❌ 服务器压力大 |
| ✅ 断线重连容易 | ❌ 需要实体插值 |
| ✅ 可动态调整同步频率 | ❌ 大规模同步困难 |
| ✅ 延迟影响较小 | ❌ 客户端需要预测 |

### 协议选择建议

| 场景 | 推荐协议 | 理由 |
|-----|---------|------|
| 大厅/匹配/信令 | WebSocket | 可靠、双向、穿透好 |
| 实时游戏数据 | WebRTC DataChannel | 低延迟、UDP-like |
| 局域网发现 | mDNS + UDP广播 | 零配置、快速发现 |
| 配置/排行榜 | HTTP/2 + gRPC | 高效、类型安全 |

### 架构整体评估

| 维度 | 评分 | 说明 |
|-----|------|------|
| 可扩展性 | ⭐⭐⭐⭐ | 模块化设计，易于扩展 |
| 可维护性 | ⭐⭐⭐⭐⭐ | 清晰的抽象层 |
| 性能 | ⭐⭐⭐⭐ | 优化的同步策略 |
| 开发效率 | ⭐⭐⭐⭐ | 代码复用率高 |
| 部署灵活性 | ⭐⭐⭐⭐⭐ | 本地/云端无缝切换 |

---

## 总结

本架构方案提供了：

1. **完整的同步机制**：帧同步和状态同步的详细实现，支持运行时切换
2. **灵活的局域网发现**：mDNS + UDP广播 + WebRTC P2P的组合方案
3. **优化的协议栈**：WebSocket + WebRTC DataChannel的分层设计
4. **代码复用架构**：本地后端和云端后端共享核心逻辑
5. **可扩展的房间/匹配系统**：支持分布式部署

开发者可以根据游戏类型和需求选择合适的同步策略，实现从局域网到云端的无缝过渡。
