// IPC 接口类型定义

// 窗口控制
export interface WindowControlRequest {
  action: 'minimize' | 'maximize' | 'close' | 'toggle_maximize'
}

export interface CreateWindowRequest {
  route?: string
}

export interface WindowResponse {
  success: boolean
  windowId?: string
  isMaximized?: boolean
  error?: string
}

// 用户认证
export interface AuthResponse {
  success: boolean
  session?: {
    id: string
    nickname: string
    avatar: string
    token: string
    expiresAt: number
  }
  error?: string
}

// 游戏加载
export interface GameRequest {
  gameId: string
}

export interface GameUrlRequest {
  sessionId: string
}

export interface GameSessionResponse {
  success: boolean
  session?: {
    sessionId: string
    gameId: string
    gameUrl: string
    expiresAt: number
  }
  error?: string
}

// 快捷键（预留）
export interface ShortcutRequest {
  shortcut: string
}

export interface ShortcutActionRequest {
  action: string
}
