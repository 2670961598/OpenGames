import { ref, computed } from 'vue'
import type { UserSession, LoginCredential, AuthStatus } from '../types/user.ts'

// 模拟模式
const isMock = typeof window !== 'undefined' && !(window as any).__TAURI__

// 模拟用户数据
const mockUser: UserSession = {
  id: '1',
  nickname: 'PlayerOne',
  avatar: '',
  token: 'mock-token',
  expiresAt: Date.now() + 86400000
}

const currentUser = ref<UserSession | null>(null)
const authStatus = ref<AuthStatus>('loading')

// 初始加载
setTimeout(() => {
  // 模拟未登录状态，方便测试两种 UI
  authStatus.value = 'unauthenticated'
  // 如需测试已登录，取消下面注释
  // currentUser.value = mockUser
  // authStatus.value = 'authenticated'
}, 500)

export function useAuth() {
  const isAuthenticated = computed(() => authStatus.value === 'authenticated')
  const isLoading = computed(() => authStatus.value === 'loading')

  // 获取当前会话
  const fetchSession = async () => {
    if (isMock) {
      console.log('[Mock] 获取会话')
      return
    }
    // Tauri 调用...
  }

  // 登录
  const login = async (credential: LoginCredential) => {
    if (isMock) {
      console.log('[Mock] 登录:', credential)
      currentUser.value = mockUser
      authStatus.value = 'authenticated'
      return { success: true }
    }
    // Tauri 调用...
    return { success: false, error: '未实现' }
  }

  // 登出
  const logout = async () => {
    if (isMock) {
      console.log('[Mock] 登出')
      currentUser.value = null
      authStatus.value = 'unauthenticated'
      return
    }
    // Tauri 调用...
  }

  return {
    user: currentUser,
    status: authStatus,
    isAuthenticated,
    isLoading,
    login,
    logout,
    fetchSession
  }
}
