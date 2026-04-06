<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useTheme } from '../composables/useTheme.ts'

const { themes, currentTheme, setTheme } = useTheme()

// 测试功能列表
const testItems = [
  { id: 'window', name: '窗口控制测试', status: 'ready' },
  { id: 'keyboard', name: '快捷键拦截测试', status: 'ready' },
  { id: 'theme', name: '主题切换测试', status: 'ready' },
  { id: 'auth', name: '登录状态切换', status: 'ready' },
  { id: 'game', name: '游戏沙箱测试', status: 'pending' },
  { id: 'ipc', name: 'IPC 通信测试', status: 'pending' },
]

const logs = ref<string[]>([])
const activeTest = ref<string | null>(null)

const addLog = (msg: string) => {
  const time = new Date().toLocaleTimeString()
  logs.value.unshift(`[${time}] ${msg}`)
  if (logs.value.length > 50) logs.value.pop()
}

// 测试主题切换
const testTheme = async (themeName: string) => {
  activeTest.value = 'theme'
  const theme = themes.value.find(t => t.name === themeName)
  await setTheme(themeName)
  addLog(`切换到主题: ${theme?.label || themeName}`)
}

// 测试窗口控制
const testWindowControl = (action: string) => {
  activeTest.value = 'window'
  addLog(`测试窗口控制: ${action}`)

  switch (action) {
    case 'minimize':
      addLog('调用 minimize_window')
      break
    case 'maximize':
      addLog('调用 maximize_window')
      break
    case 'close':
      addLog('调用 close_window')
      break
    case 'fullscreen':
      addLog('切换全屏模式')
      break
  }
}

// 测试快捷键
const testKeyboard = () => {
  activeTest.value = 'keyboard'
  addLog('测试快捷键拦截...')
  addLog('尝试按 Ctrl+W, Ctrl+H, Ctrl+J, F5 等键')
  addLog('观察控制台输出，应被拦截且不执行默认行为')
}

// 测试登录状态
const testAuth = (state: 'login' | 'logout') => {
  activeTest.value = 'auth'
  if (state === 'login') {
    addLog('模拟登录成功')
    addLog('用户: PlayerOne')
  } else {
    addLog('模拟登出')
  }
}

// 清空日志
const clearLogs = () => {
  logs.value = []
  addLog('日志已清空')
}

// 模拟错误
const simulateError = () => {
  addLog('错误: 模拟测试错误')
  console.error('测试错误输出')
}

// 监听按键显示
const handleKeyDown = (e: KeyboardEvent) => {
  if (activeTest.value === 'keyboard') {
    addLog(`按键: ${e.key} (ctrl: ${e.ctrlKey}, alt: ${e.altKey}, shift: ${e.shiftKey})`)
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
})
</script>

<template>
  <div class="dev-test-view">
    <div class="test-header">
      <h2>
        <span class="icon">🛠️</span>
        开发者测试界面
      </h2>
      <span class="hint">按 `~ 键退出</span>
    </div>

    <div class="test-content">
      <!-- 左侧：测试项目 -->
      <div class="test-panel">
        <!-- 主题测试 -->
        <div class="panel-section">
          <h3>主题切换</h3>
          <div class="current-theme">
            当前: <span class="theme-name">{{ currentTheme?.label }}</span>
          </div>
          <div class="button-group">
            <button
              v-for="theme in themes"
              :key="theme.name"
              @click="testTheme(theme.name)"
              :class="{ active: currentTheme?.name === theme.name }"
            >
              {{ theme.label }}
            </button>
          </div>
        </div>

        <div class="panel-section">
          <h3>窗口控制</h3>
          <div class="button-group">
            <button @click="testWindowControl('minimize')">最小化</button>
            <button @click="testWindowControl('maximize')">最大化</button>
            <button @click="testWindowControl('fullscreen')">全屏</button>
            <button @click="testWindowControl('close')" class="danger">关闭</button>
          </div>
        </div>

        <div class="panel-section">
          <h3>功能测试</h3>
          <div class="button-group">
            <button @click="testKeyboard">快捷键测试</button>
            <button @click="testAuth('login')">模拟登录</button>
            <button @click="testAuth('logout')">模拟登出</button>
            <button @click="simulateError" class="danger">模拟错误</button>
          </div>
        </div>

        <div class="panel-section">
          <h3>状态概览</h3>
          <div class="status-list">
            <div v-for="item in testItems" :key="item.id" class="status-item">
              <span class="status-dot" :class="item.status"></span>
              <span class="status-name">{{ item.name }}</span>
              <span class="status-badge" :class="item.status">{{ item.status }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：日志输出 -->
      <div class="log-panel">
        <div class="log-header">
          <h3>📋 测试日志</h3>
          <button class="btn-clear" @click="clearLogs">清空</button>
        </div>
        <div class="log-content">
          <div v-if="logs.length === 0" class="log-empty">
            暂无日志，点击左侧按钮开始测试
          </div>
          <div v-else class="log-list">
            <div
              v-for="(log, index) in logs"
              :key="index"
              class="log-item"
              :class="{ error: log.includes('错误') }"
            >
              {{ log }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dev-test-view {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: var(--color-bg-primary);
  overflow: hidden;
  transition: var(--theme-transition);
}

.test-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-md) var(--space-lg);
  background: var(--color-bg-secondary);
  border-bottom: 1px solid var(--color-border);
  transition: var(--theme-transition);
}

.test-header h2 {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  font-size: var(--text-lg);
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0;
  transition: var(--theme-transition);
}

.test-header .icon {
  font-size: var(--text-xl);
}

.test-header .hint {
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
  background: var(--color-bg-tertiary);
  padding: var(--space-xs) var(--space-sm);
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border);
  transition: var(--theme-transition);
}

.test-content {
  flex: 1;
  display: flex;
  overflow: hidden;
}

/* 左侧测试面板 */
.test-panel {
  width: 380px;
  background: var(--color-bg-secondary);
  border-right: 1px solid var(--color-border);
  padding: var(--space-lg);
  overflow-y: auto;
  transition: var(--theme-transition);
}

.panel-section {
  margin-bottom: var(--space-lg);
}

.panel-section h3 {
  font-size: var(--text-xs);
  font-weight: 600;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: var(--space-md);
  transition: var(--theme-transition);
}

.current-theme {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  margin-bottom: var(--space-sm);
}

.current-theme .theme-name {
  color: var(--color-accent);
  font-weight: 600;
}

.button-group {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-sm);
}

.button-group button {
  padding: var(--space-sm) var(--space-md);
  font-size: var(--text-sm);
  font-weight: 500;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  background: var(--color-bg-tertiary);
  color: var(--color-text-primary);
  cursor: pointer;
  transition: var(--theme-transition);
}

.button-group button:hover {
  background: var(--color-bg-elevated);
  border-color: var(--color-accent);
}

.button-group button.active {
  background: var(--color-accent);
  color: var(--color-text-inverse);
  border-color: var(--color-accent);
}

.button-group button.danger {
  background: rgba(239, 68, 68, 0.1);
  border-color: var(--color-error);
  color: var(--color-error);
}

.button-group button.danger:hover {
  background: rgba(239, 68, 68, 0.2);
}

/* 状态列表 */
.status-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.status-item {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-md);
  background: var(--color-bg-tertiary);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  transition: var(--theme-transition);
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--color-text-tertiary);
  transition: var(--theme-transition);
}

.status-dot.ready {
  background: var(--color-success);
  box-shadow: 0 0 6px rgba(34, 197, 94, 0.4);
}

.status-dot.pending {
  background: var(--color-warning);
}

.status-name {
  flex: 1;
  font-size: var(--text-sm);
  color: var(--color-text-primary);
  transition: var(--theme-transition);
}

.status-badge {
  font-size: 11px;
  padding: var(--space-xs) var(--space-sm);
  border-radius: var(--radius-sm);
  text-transform: uppercase;
  font-weight: 500;
  transition: var(--theme-transition);
}

.status-badge.ready {
  background: rgba(34, 197, 94, 0.15);
  color: var(--color-success);
}

.status-badge.pending {
  background: rgba(245, 158, 11, 0.15);
  color: var(--color-warning);
}

/* 右侧日志面板 */
.log-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: var(--color-bg-primary);
  transition: var(--theme-transition);
}

.log-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-md) var(--space-lg);
  border-bottom: 1px solid var(--color-border);
  transition: var(--theme-transition);
}

.log-header h3 {
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0;
  transition: var(--theme-transition);
}

.btn-clear {
  padding: var(--space-xs) var(--space-sm);
  font-size: var(--text-xs);
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border);
  background: transparent;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: var(--theme-transition);
}

.btn-clear:hover {
  background: var(--color-bg-secondary);
  color: var(--color-text-primary);
}

.log-content {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-md);
}

.log-empty {
  text-align: center;
  padding: 60px var(--space-lg);
  color: var(--color-text-tertiary);
  font-size: var(--text-sm);
  transition: var(--theme-transition);
}

.log-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  font-family: var(--font-mono);
  font-size: var(--text-xs);
}

.log-item {
  padding: var(--space-sm) var(--space-md);
  background: var(--color-bg-secondary);
  border-radius: var(--radius-sm);
  border-left: 3px solid var(--color-accent);
  color: var(--color-text-secondary);
  line-height: 1.5;
  transition: var(--theme-transition);
}

.log-item.error {
  border-left-color: var(--color-error);
  background: rgba(239, 68, 68, 0.1);
  color: var(--color-error);
}

/* 赛博朋克主题特殊效果 */
[data-theme="cyberpunk"] .status-dot.ready {
  box-shadow: 0 0 8px var(--color-success);
}

[data-theme="cyberpunk"] .log-item {
  border-left-width: 2px;
  font-family: var(--font-mono);
}
</style>
