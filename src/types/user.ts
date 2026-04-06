// 用户相关类型定义

export interface UserSession {
  id: string
  nickname: string
  avatar: string
  token: string
  expiresAt: number
}

export interface LoginCredential {
  username?: string
  email?: string
  password: string
  phone?: string
}

export type AuthStatus = 'authenticated' | 'unauthenticated' | 'loading'
