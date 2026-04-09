// 游戏相关类型定义

export interface GameSession {
  sessionId: string
  gameId: string
  gameUrl: string
  expiresAt: number
}

export interface GameInfo {
  id: string
  name: string
  cover: string
  description: string
  author: string
  tags: string[]
}

export type GameLoadingStatus = 'idle' | 'requesting' | 'loading' | 'playing' | 'error'
