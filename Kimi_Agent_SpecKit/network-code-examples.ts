// ============================================================================
// Web游戏平台网络架构 - 代码示例
// ============================================================================

// ============================================================================
// 1. 网络管理器主入口
// ============================================================================

import { EventEmitter } from 'events';

export enum NetworkMode {
    LOCAL = 'local',
    LAN_HOST = 'lan-host',
    LAN_CLIENT = 'lan-client',
    CLOUD = 'cloud'
}

export enum SyncStrategyType {
    LOCKSTEP = 'lockstep',
    STATE_SYNC = 'state-sync'
}

export class NetworkManager extends EventEmitter {
    private mode: NetworkMode = NetworkMode.LOCAL;
    private syncStrategy: SyncStrategyType = SyncStrategyType.STATE_SYNC;
    private backend: IGameBackend | null = null;
    private transport: ITransportLayer | null = null;
    private discovery: IDiscoveryService | null = null;
    
    // 配置
    private config: NetworkConfig = {
        syncRate: 60,
        interpolationDelay: 100,
        maxPredictionFrames: 10,
        inputBufferSize: 3
    };
    
    async initialize(config: NetworkConfig): Promise<void> {
        this.config = { ...this.config, ...config };
        
        // 初始化传输层
        this.transport = new MultiTransportLayer();
        await this.transport.initialize();
        
        // 设置事件监听
        this.setupEventListeners();
    }
    
    // 切换到指定模式
    async switchMode(mode: NetworkMode, options?: ModeSwitchOptions): Promise<void> {
        console.log(`Switching network mode to: ${mode}`);
        
        // 保存当前状态
        const currentState = this.backend?.getGameState();
        
        // 清理当前模式
        await this.cleanupCurrentMode();
        
        this.mode = mode;
        
        // 初始化新模式
        switch (mode) {
            case NetworkMode.LOCAL:
                await this.initializeLocalMode();
                break;
                
            case NetworkMode.LAN_HOST:
                await this.initializeLANHostMode(options);
                break;
                
            case NetworkMode.LAN_CLIENT:
                await this.initializeLANClientMode(options);
                break;
                
            case NetworkMode.CLOUD:
                await this.initializeCloudMode(options);
                break;
        }
        
        // 恢复状态
        if (currentState) {
            await this.restoreState(currentState);
        }
        
        this.emit('modeChanged', mode);
    }
    
    private async cleanupCurrentMode(): Promise<void> {
        if (this.backend) {
            await this.backend.dispose();
            this.backend = null;
        }
        
        if (this.discovery) {
            await this.discovery.stop();
            this.discovery = null;
        }
    }
    
    private async initializeLocalMode(): Promise<void> {
        // 创建本地后端（Web Worker）
        const worker = new Worker('./backend.worker.js');
        this.backend = new LocalBackendAdapter(worker);
        
        await this.backend.initialize({
            syncStrategy: this.syncStrategy,
            ...this.config
        });
    }
    
    private async initializeLANHostMode(options?: ModeSwitchOptions): Promise<void> {
        // 启动发现服务
        this.discovery = new MDNSDiscoveryService();
        await this.discovery.advertise({
            roomId: options?.roomId || 'default',
            gameMode: options?.gameMode || 'default'
        });
        
        // 创建P2P主机
        this.backend = new LANHostBackend();
        await this.backend.initialize({
            syncStrategy: this.syncStrategy,
            ...this.config
        });
    }
    
    private async initializeLANClientMode(options?: ModeSwitchOptions): Promise<void> {
        // 发现服务
        this.discovery = new MDNSDiscoveryService();
        const host = await this.discovery.findHost(options?.roomId);
        
        // 连接到主机
        this.backend = new LANClientBackend(host);
        await this.backend.initialize({
            syncStrategy: this.syncStrategy,
            ...this.config
        });
    }
    
    private async initializeCloudMode(options?: ModeSwitchOptions): Promise<void> {
        // 连接到云服务器
        const socket = io(options?.serverUrl || 'wss://game-server.example.com');
        this.backend = new CloudBackendAdapter(socket);
        
        await this.backend.initialize({
            syncStrategy: this.syncStrategy,
            ...this.config
        });
    }
    
    // 发送输入
    sendInput(input: PlayerInput): void {
        if (this.backend) {
            this.backend.sendInput(input);
        }
    }
    
    // 获取游戏状态
    getGameState(): GameState | null {
        return this.backend?.getGameState() || null;
    }
    
    private setupEventListeners(): void {
        // 监听网络状态变化
        window.addEventListener('online', () => {
            this.emit('networkOnline');
        });
        
        window.addEventListener('offline', () => {
            this.emit('networkOffline');
            // 自动切换到本地模式
            if (this.mode === NetworkMode.CLOUD) {
                this.switchMode(NetworkMode.LOCAL);
            }
        });
    }
    
    private async restoreState(state: GameState): Promise<void> {
        // 恢复玩家
        for (const player of state.players) {
            await this.backend?.addPlayer(player);
        }
    }
}

// ============================================================================
// 2. 传输层抽象
// ============================================================================

interface ITransportLayer {
    initialize(): Promise<void>;
    connect(endpoint: string): Promise<void>;
    disconnect(): Promise<void>;
    send(data: Uint8Array, reliable?: boolean): void;
    onMessage(callback: (data: Uint8Array) => void): void;
    getLatency(): number;
}

// 多路复用传输层
class MultiTransportLayer implements ITransportLayer {
    private reliableChannel: WebSocket | null = null;
    private unreliableChannel: RTCDataChannel | null = null;
    private messageCallbacks: Array<(data: Uint8Array) => void> = [];
    
    async initialize(): Promise<void> {
        // 初始化完成
    }
    
    async connect(endpoint: string): Promise<void> {
        // 建立可靠连接（WebSocket）
        this.reliableChannel = new WebSocket(endpoint);
        
        this.reliableChannel.onopen = () => {
            console.log('Reliable channel connected');
        };
        
        this.reliableChannel.onmessage = (event) => {
            this.handleMessage(event.data);
        };
        
        // 建立不可靠连接（WebRTC）
        await this.setupWebRTC();
    }
    
    private async setupWebRTC(): Promise<void> {
        const pc = new RTCPeerConnection({
            iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
        });
        
        this.unreliableChannel = pc.createDataChannel('game', {
            ordered: false,
            maxRetransmits: 0
        });
        
        this.unreliableChannel.onmessage = (event) => {
            this.handleMessage(event.data);
        };
    }
    
    send(data: Uint8Array, reliable: boolean = true): void {
        if (reliable && this.reliableChannel?.readyState === 'open') {
            this.reliableChannel.send(data);
        } else if (this.unreliableChannel?.readyState === 'open') {
            this.unreliableChannel.send(data);
        }
    }
    
    onMessage(callback: (data: Uint8Array) => void): void {
        this.messageCallbacks.push(callback);
    }
    
    private handleMessage(data: any): void {
        const bytes = data instanceof ArrayBuffer 
            ? new Uint8Array(data) 
            : new TextEncoder().encode(data);
            
        this.messageCallbacks.forEach(cb => cb(bytes));
    }
    
    getLatency(): number {
        // 实现RTT测量
        return 50; // 占位
    }
    
    async disconnect(): Promise<void> {
        this.reliableChannel?.close();
        this.unreliableChannel?.close();
    }
}

// ============================================================================
// 3. 序列化层（FlatBuffers示例）
// ============================================================================

class FlatBufferSerializer {
    private builder: flatbuffers.Builder;
    
    constructor() {
        this.builder = new flatbuffers.Builder(1024);
    }
    
    // 序列化输入帧
    serializeInputFrame(frame: InputFrame): Uint8Array {
        const builder = this.builder;
        
        // 序列化玩家ID
        const playerIdOffset = builder.createString(frame.playerId);
        
        // 序列化输入数组
        const inputOffsets: number[] = [];
        for (const input of frame.inputs) {
            const inputOffset = this.serializePlayerInput(builder, input);
            inputOffsets.push(inputOffset);
        }
        
        const inputsVector = Game.Messages.InputFrame.createInputsVector(
            builder, 
            inputOffsets
        );
        
        // 创建InputFrame
        Game.Messages.InputFrame.startInputFrame(builder);
        Game.Messages.InputFrame.addFrameNumber(builder, frame.frameNumber);
        Game.Messages.InputFrame.addPlayerId(builder, playerIdOffset);
        Game.Messages.InputFrame.addInputs(builder, inputsVector);
        Game.Messages.InputFrame.addTimestamp(builder, BigInt(frame.timestamp));
        
        const frameOffset = Game.Messages.InputFrame.endInputFrame(builder);
        builder.finish(frameOffset);
        
        return builder.asUint8Array();
    }
    
    private serializePlayerInput(
        builder: flatbuffers.Builder, 
        input: PlayerInput
    ): number {
        // 序列化输入数据
        const dataOffset = Game.Messages.PlayerInput.createDataVector(
            builder, 
            new Uint8Array(input.data)
        );
        
        Game.Messages.PlayerInput.startPlayerInput(builder);
        Game.Messages.PlayerInput.addType(builder, input.type);
        Game.Messages.PlayerInput.addData(builder, dataOffset);
        
        return Game.Messages.PlayerInput.endPlayerInput(builder);
    }
    
    // 反序列化输入帧
    deserializeInputFrame(data: Uint8Array): InputFrame {
        const buf = new flatbuffers.ByteBuffer(data);
        const frame = Game.Messages.InputFrame.getRootAsInputFrame(buf);
        
        const inputs: PlayerInput[] = [];
        for (let i = 0; i < frame.inputsLength(); i++) {
            const input = frame.inputs(i)!;
            inputs.push({
                type: input.type(),
                data: input.dataArray() || new Uint8Array()
            });
        }
        
        return {
            frameNumber: frame.frameNumber(),
            playerId: frame.playerId() || '',
            inputs,
            timestamp: Number(frame.timestamp())
        };
    }
}

// ============================================================================
// 4. 实体插值系统
// ============================================================================

class EntityInterpolationSystem {
    private snapshots: Snapshot[] = [];
    private readonly MAX_SNAPSHOTS = 32;
    private interpolationDelay: number = 100; // ms
    
    // 添加服务器快照
    addSnapshot(snapshot: Snapshot): void {
        // 插入到正确位置（按时间排序）
        const insertIndex = this.snapshots.findIndex(
            s => s.timestamp > snapshot.timestamp
        );
        
        if (insertIndex === -1) {
            this.snapshots.push(snapshot);
        } else {
            this.snapshots.splice(insertIndex, 0, snapshot);
        }
        
        // 限制快照数量
        if (this.snapshots.length > this.MAX_SNAPSHOTS) {
            this.snapshots.shift();
        }
    }
    
    // 插值获取实体状态
    interpolate(entityId: string, renderTime: number): EntityState | null {
        const targetTime = renderTime - this.interpolationDelay;
        
        // 找到前后两个快照
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
            // 无法插值，使用外推
            return this.extrapolate(entityId, targetTime);
        }
        
        // 计算插值因子
        const t = (targetTime - prevSnapshot.timestamp) /
                  (nextSnapshot.timestamp - prevSnapshot.timestamp);
        
        const prevEntity = prevSnapshot.entities.get(entityId);
        const nextEntity = nextSnapshot.entities.get(entityId);
        
        if (!prevEntity || !nextEntity) return null;
        
        return this.lerpEntity(prevEntity, nextEntity, Math.max(0, Math.min(1, t)));
    }
    
    // 线性插值实体
    private lerpEntity(a: EntityState, b: EntityState, t: number): EntityState {
        return {
            id: a.id,
            position: {
                x: this.lerp(a.position.x, b.position.x, t),
                y: this.lerp(a.position.y, b.position.y, t),
                z: this.lerp(a.position.z, b.position.z, t)
            },
            rotation: this.slerp(a.rotation, b.rotation, t),
            velocity: {
                x: this.lerp(a.velocity.x, b.velocity.x, t),
                y: this.lerp(a.velocity.y, b.velocity.y, t),
                z: this.lerp(a.velocity.z, b.velocity.z, t)
            }
        };
    }
    
    private lerp(a: number, b: number, t: number): number {
        return a + (b - a) * t;
    }
    
    // 球面线性插值（旋转）
    private slerp(a: Quaternion, b: Quaternion, t: number): Quaternion {
        // 计算点积
        let dot = a.x * b.x + a.y * b.y + a.z * b.z + a.w * b.w;
        
        // 如果点积为负，反转一个四元数以取最短路径
        if (dot < 0) {
            dot = -dot;
            b = { x: -b.x, y: -b.y, z: -b.z, w: -b.w };
        }
        
        // 如果四元数非常接近，使用线性插值
        if (dot > 0.9995) {
            return {
                x: this.lerp(a.x, b.x, t),
                y: this.lerp(a.y, b.y, t),
                z: this.lerp(a.z, b.z, t),
                w: this.lerp(a.w, b.w, t)
            };
        }
        
        // 计算插值
        const theta0 = Math.acos(dot);
        const theta = theta0 * t;
        const sinTheta = Math.sin(theta);
        const sinTheta0 = Math.sin(theta0);
        
        const s0 = Math.cos(theta) - dot * sinTheta / sinTheta0;
        const s1 = sinTheta / sinTheta0;
        
        return {
            x: a.x * s0 + b.x * s1,
            y: a.y * s0 + b.y * s1,
            z: a.z * s0 + b.z * s1,
            w: a.w * s0 + b.w * s1
        };
    }
    
    // 外推（预测）
    private extrapolate(entityId: string, targetTime: number): EntityState | null {
        const latest = this.snapshots[this.snapshots.length - 1];
        if (!latest) return null;
        
        const entity = latest.entities.get(entityId);
        if (!entity) return null;
        
        const dt = (targetTime - latest.timestamp) / 1000;
        
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

// ============================================================================
// 5. 断线重连管理器
// ============================================================================

class ReconnectionManager {
    private stateHistory: StateSnapshot[] = [];
    private inputHistory: InputFrame[] = [];
    private readonly MAX_HISTORY = 300; // 5秒 @ 60fps
    
    // 记录状态快照
    recordSnapshot(frameNumber: number, state: GameState): void {
        const snapshot: StateSnapshot = {
            frameNumber,
            state: this.cloneState(state),
            checksum: this.computeChecksum(state),
            timestamp: Date.now()
        };
        
        this.stateHistory.push(snapshot);
        
        // 清理旧历史
        if (this.stateHistory.length > this.MAX_HISTORY) {
            this.stateHistory.shift();
        }
    }
    
    // 记录输入
    recordInput(input: InputFrame): void {
        this.inputHistory.push(input);
        
        // 清理旧输入
        const cutoffFrame = this.inputHistory[this.inputHistory.length - 1]?.frameNumber - this.MAX_HISTORY;
        this.inputHistory = this.inputHistory.filter(i => i.frameNumber > cutoffFrame);
    }
    
    // 生成重连数据
    generateReconnectionData(lastFrame: number): ReconnectionData | null {
        // 找到最近的快照
        const snapshotIndex = this.stateHistory.findIndex(
            s => s.frameNumber >= lastFrame
        );
        
        if (snapshotIndex === -1) {
            console.warn('History too old for reconnection');
            return null;
        }
        
        const snapshot = this.stateHistory[snapshotIndex];
        
        // 收集错过的输入
        const missedInputs = this.inputHistory.filter(
            i => i.frameNumber > snapshot.frameNumber
        );
        
        return {
            snapshot: snapshot.state,
            snapshotFrame: snapshot.frameNumber,
            missedInputs,
            currentFrame: this.getCurrentFrame()
        };
    }
    
    // 快速重连（使用最新快照）
    generateFastReconnectionData(): ReconnectionData {
        const latest = this.stateHistory[this.stateHistory.length - 1];
        
        return {
            snapshot: latest.state,
            snapshotFrame: latest.frameNumber,
            missedInputs: [],
            currentFrame: this.getCurrentFrame(),
            isFastReconnect: true
        };
    }
    
    private cloneState(state: GameState): GameState {
        return JSON.parse(JSON.stringify(state));
    }
    
    private computeChecksum(state: GameState): number {
        // 简单的校验和计算
        const str = JSON.stringify(state);
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash;
    }
    
    private getCurrentFrame(): number {
        // 从输入历史获取当前帧
        const lastInput = this.inputHistory[this.inputHistory.length - 1];
        return lastInput ? lastInput.frameNumber : 0;
    }
}

// ============================================================================
// 6. 类型定义
// ============================================================================

interface NetworkConfig {
    syncRate?: number;
    interpolationDelay?: number;
    maxPredictionFrames?: number;
    inputBufferSize?: number;
}

interface ModeSwitchOptions {
    roomId?: string;
    gameMode?: string;
    serverUrl?: string;
}

interface IGameBackend {
    initialize(config: any): Promise<void>;
    dispose(): Promise<void>;
    sendInput(input: PlayerInput): void;
    getGameState(): GameState;
    addPlayer(player: PlayerInfo): Promise<void>;
}

interface IDiscoveryService {
    advertise(info: any): Promise<void>;
    findHost(roomId?: string): Promise<any>;
    stop(): Promise<void>;
}

interface PlayerInput {
    type: number;
    data: Uint8Array;
}

interface InputFrame {
    frameNumber: number;
    playerId: string;
    inputs: PlayerInput[];
    timestamp: number;
}

interface EntityState {
    id: string;
    position: { x: number; y: number; z: number };
    rotation: Quaternion;
    velocity: { x: number; y: number; z: number };
}

interface Quaternion {
    x: number;
    y: number;
    z: number;
    w: number;
}

interface Snapshot {
    timestamp: number;
    frameNumber: number;
    entities: Map<string, EntityState>;
}

interface GameState {
    players: PlayerInfo[];
    entities: EntityState[];
    frameNumber: number;
}

interface PlayerInfo {
    id: string;
    name: string;
    position?: { x: number; y: number; z: number };
}

interface StateSnapshot {
    frameNumber: number;
    state: GameState;
    checksum: number;
    timestamp: number;
}

interface ReconnectionData {
    snapshot: GameState;
    snapshotFrame: number;
    missedInputs: InputFrame[];
    currentFrame: number;
    isFastReconnect?: boolean;
}

// 占位符类型（需要实际FlatBuffers定义）
namespace Game.Messages {
    export class InputFrame {
        static startInputFrame(builder: any): void {}
        static addFrameNumber(builder: any, val: number): void {}
        static addPlayerId(builder: any, val: any): void {}
        static addInputs(builder: any, val: any): void {}
        static addTimestamp(builder: any, val: bigint): void {}
        static endInputFrame(builder: any): number { return 0; }
        static getRootAsInputFrame(buf: any): any { return {}; }
        static createInputsVector(builder: any, vals: any[]): any { return null; }
        
        frameNumber(): number { return 0; }
        playerId(): string | null { return null; }
        inputsLength(): number { return 0; }
        inputs(index: number): any { return null; }
        timestamp(): bigint { return BigInt(0); }
    }
    
    export class PlayerInput {
        static startPlayerInput(builder: any): void {}
        static addType(builder: any, val: number): void {}
        static addData(builder: any, val: any): void {}
        static endPlayerInput(builder: any): number { return 0; }
        static createDataVector(builder: any, data: Uint8Array): any { return null; }
        
        type(): number { return 0; }
        dataArray(): Uint8Array | null { return null; }
    }
}

// 占位符类
class LocalBackendAdapter implements IGameBackend {
    constructor(worker: Worker) {}
    async initialize(config: any): Promise<void> {}
    async dispose(): Promise<void> {}
    sendInput(input: PlayerInput): void {}
    getGameState(): GameState { return { players: [], entities: [], frameNumber: 0 }; }
    async addPlayer(player: PlayerInfo): Promise<void> {}
}

class LANHostBackend implements IGameBackend {
    async initialize(config: any): Promise<void> {}
    async dispose(): Promise<void> {}
    sendInput(input: PlayerInput): void {}
    getGameState(): GameState { return { players: [], entities: [], frameNumber: 0 }; }
    async addPlayer(player: PlayerInfo): Promise<void> {}
}

class LANClientBackend implements IGameBackend {
    constructor(host: any) {}
    async initialize(config: any): Promise<void> {}
    async dispose(): Promise<void> {}
    sendInput(input: PlayerInput): void {}
    getGameState(): GameState { return { players: [], entities: [], frameNumber: 0 }; }
    async addPlayer(player: PlayerInfo): Promise<void> {}
}

class CloudBackendAdapter implements IGameBackend {
    constructor(socket: any) {}
    async initialize(config: any): Promise<void> {}
    async dispose(): Promise<void> {}
    sendInput(input: PlayerInput): void {}
    getGameState(): GameState { return { players: [], entities: [], frameNumber: 0 }; }
    async addPlayer(player: PlayerInfo): Promise<void> {}
}

class MDNSDiscoveryService implements IDiscoveryService {
    async advertise(info: any): Promise<void> {}
    async findHost(roomId?: string): Promise<any> { return null; }
    async stop(): Promise<void> {}
}

// 导入（占位）
import io from 'socket.io-client';
import * as flatbuffers from 'flatbuffers';

// 导出
export {
    IGameBackend,
    ITransportLayer,
    IDiscoveryService,
    PlayerInput,
    InputFrame,
    EntityState,
    GameState,
    PlayerInfo,
    Snapshot
};
