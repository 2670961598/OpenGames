<script setup lang="ts">
import { useAuth } from '../../composables/useAuth.ts'

const { user, isAuthenticated, isLoading, logout } = useAuth()

const handleLogin = () => {
  // TODO: 打开登录弹窗或跳转登录页面
  console.log('打开登录')
}

const handleRegister = () => {
  // TODO: 打开注册弹窗
  console.log('打开注册')
}
</script>

<template>
  <div class="user-profile">
    <!-- 加载中 -->
    <div v-if="isLoading" class="loading-state">
      <div class="skeleton-avatar"></div>
      <div class="skeleton-name"></div>
    </div>

    <!-- 已登录 -->
    <div v-else-if="isAuthenticated && user" class="authenticated-state">
      <button class="user-button" @click="logout">
        <div class="user-avatar">
          <img v-if="user.avatar" :src="user.avatar" :alt="user.nickname">
          <div v-else class="avatar-placeholder">
            {{ user.nickname.charAt(0).toUpperCase() }}
          </div>
        </div>
        <span class="user-name">{{ user.nickname }}</span>
      </button>
    </div>

    <!-- 未登录 -->
    <div v-else class="guest-state">
      <button class="btn-secondary" @click="handleLogin">登录</button>
      <button class="btn-primary" @click="handleRegister">注册</button>
    </div>
  </div>
</template>

<style scoped>
.user-profile {
  display: flex;
  align-items: center;
  height: 100%;
  padding: 0 16px;
  border-left: 1px solid #2a2a2a;
}

/* 加载状态 */
.loading-state {
  display: flex;
  align-items: center;
  gap: 10px;
}

.skeleton-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(90deg, #2a2a2a 25%, #3a3a3a 50%, #2a2a2a 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

.skeleton-name {
  width: 80px;
  height: 16px;
  border-radius: 4px;
  background: linear-gradient(90deg, #2a2a2a 25%, #3a3a3a 50%, #2a2a2a 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* 已登录状态 */
.authenticated-state {
  display: flex;
  align-items: center;
}

.user-button {
  display: flex;
  align-items: center;
  gap: 10px;
  background: transparent;
  border: none;
  color: #e5e5e5;
  cursor: pointer;
  padding: 6px 10px;
  border-radius: 8px;
  transition: background 0.2s ease;
}

.user-button:hover {
  background: rgba(255, 255, 255, 0.08);
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  overflow: hidden;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  display: flex;
  align-items: center;
  justify-content: center;
}

.user-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder {
  font-size: 14px;
  font-weight: 600;
  color: #fff;
}

.user-name {
  font-size: 13px;
  font-weight: 500;
  max-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 未登录状态 */
.guest-state {
  display: flex;
  gap: 8px;
}

.btn-secondary,
.btn-primary {
  padding: 6px 14px;
  font-size: 13px;
  font-weight: 500;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-secondary {
  background: transparent;
  border: 1px solid #52525b;
  color: #a1a1aa;
}

.btn-secondary:hover {
  border-color: #71717a;
  color: #e5e5e5;
  background: rgba(255, 255, 255, 0.05);
}

.btn-primary {
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  border: none;
  color: #fff;
}

.btn-primary:hover {
  box-shadow: 0 2px 12px rgba(99, 102, 241, 0.4);
  transform: translateY(-1px);
}

.btn-primary:active {
  transform: translateY(0);
}
</style>
