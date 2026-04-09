import { createRouter, createWebHashHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

// 主页面路由
const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/recommend'
  },
  {
    path: '/recommend',
    name: 'Recommend',
    component: () => import('../views/RecommendView.vue')
  },
  {
    path: '/library',
    name: 'Library',
    component: () => import('../views/LibraryView.vue')
  },
  {
    path: '/developer',
    name: 'Developer',
    component: () => import('../views/CreatorView.vue')
  },
  // 游戏独立窗口路由（桌面端新窗口用）
  {
    path: '/game/:id',
    name: 'GamePlayer',
    component: () => import('../views/GamePlayerView.vue'),
    props: true
  }
]

export const router = createRouter({
  history: createWebHashHistory(),
  routes
})

// 游戏窗口路由（独立窗口使用简化布局）
export const gameWindowRoutes: RouteRecordRaw[] = [
  {
    path: '/game/:id',
    name: 'GamePlayerWindow',
    component: () => import('../views/GamePlayerView.vue'),
    props: true
  }
]
