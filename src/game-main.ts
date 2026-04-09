import { createApp, h, ref } from 'vue'
import { Quasar } from 'quasar'
import '@quasar/extras/material-icons/material-icons.css'
import 'quasar/src/css/index.sass'
import './styles/variables.css'

import GameHeader from './components/layout/GameHeader.vue'
import { useTheme } from './composables/useTheme.ts'

// 从 URL hash 中提取游戏 ID
function getGameIdFromUrl(): string {
  const hash = window.location.hash
  const match = hash.match(/game\/([^/]+)/)
  return match ? match[1] : 'unknown'
}

// 最简单的游戏应用组件
const GameApp = {
  setup() {
    const activeTab = ref('game')
    const gameId = getGameIdFromUrl()

    return { activeTab, gameId }
  },
  render() {

    return h('div', {
      style: {
        minHeight: '100vh',
        background: 'var(--color-bg-primary)',
        color: 'var(--color-text-primary)'
      }
    }, [
      // 使用 GameHeader 组件
      h(GameHeader, {
        modelValue: this.activeTab,
        'onUpdate:modelValue': (val: string) => { this.activeTab = val }
      }),

      // 主内容
      h('main', {
        style: {
          paddingTop: '56px',
          minHeight: '100vh'
        }
      }, [
        h('div', {
          style: {
            padding: '24px',
            textAlign: 'center'
          }
        }, [
          h('h1', '游戏窗口'),
          h('p', `游戏ID: ${this.gameId}`),
          h('p', `当前标签: ${this.activeTab}`)
        ])
      ])
    ])
  }
}

// 创建应用
const app = createApp(GameApp)

// 使用 Quasar
app.use(Quasar, {
  plugins: {},
  config: { dark: true }
})

// 初始化主题
const { initTheme } = useTheme()
initTheme()

// 挂载
app.mount('#app')
