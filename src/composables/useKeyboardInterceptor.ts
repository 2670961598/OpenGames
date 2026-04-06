import { onMounted, onUnmounted } from 'vue'

// 需要拦截的浏览器快捷键
const INTERCEPTED_SHORTCUTS = [
  // 标签页控制
  { key: 'w', ctrl: true, meta: false }, // Ctrl+W 关闭标签
  { key: 'W', ctrl: true, meta: false },
  { key: 't', ctrl: true, shift: true }, // Ctrl+Shift+T 恢复标签
  { key: 'T', ctrl: true, shift: true },
  // 浏览器功能
  { key: 'h', ctrl: true }, // Ctrl+H 历史
  { key: 'H', ctrl: true },
  { key: 'j', ctrl: true }, // Ctrl+J 下载
  { key: 'J', ctrl: true },
  { key: 'd', ctrl: true }, // Ctrl+D 收藏
  { key: 'D', ctrl: true },
  { key: 'f', ctrl: true }, // Ctrl+F 查找
  { key: 'F', ctrl: true },
  { key: 'p', ctrl: true }, // Ctrl+P 打印
  { key: 'P', ctrl: true },
  { key: 's', ctrl: true }, // Ctrl+S 保存
  { key: 'S', ctrl: true },
  { key: 'u', ctrl: true }, // Ctrl+U 查看源码
  { key: 'U', ctrl: true },
  { key: 'r', ctrl: true }, // Ctrl+R 刷新（可选拦截）
  { key: 'R', ctrl: true },
  // 导航
  { key: 'l', ctrl: true }, // Ctrl+L 地址栏
  { key: 'L', ctrl: true },
  { key: 'k', ctrl: true }, // Ctrl+K 搜索
  { key: 'K', ctrl: true },
  // F 键
  { key: 'F3', ctrl: false },
  { key: 'F5', ctrl: false },
  { key: 'F6', ctrl: false },
  { key: 'F7', ctrl: false },
  { key: 'F10', ctrl: false },
  // F12 不禁用，保留开发者工具
]

export function useKeyboardInterceptor() {
  let isEnabled = true

  const shouldIntercept = (event: KeyboardEvent): boolean => {
    // 如果是输入框内，不拦截
    const target = event.target as HTMLElement
    if (target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable) {
      return false
    }

    // 检查是否匹配拦截列表
    return INTERCEPTED_SHORTCUTS.some(shortcut => {
      const keyMatch = event.key === shortcut.key
      const ctrlMatch = shortcut.ctrl !== undefined
        ? event.ctrlKey === shortcut.ctrl
        : true
      const metaMatch = shortcut.meta !== undefined
        ? event.metaKey === shortcut.meta
        : true

      return keyMatch && ctrlMatch && metaMatch
    })
  }

  const handleKeyDown = (event: KeyboardEvent) => {
    if (!isEnabled) return

    if (shouldIntercept(event)) {
      event.preventDefault()
      event.stopPropagation()

      // 预留接口：后续可以触发快捷键动作
      const shortcut = `${event.ctrlKey ? 'Ctrl+' : ''}${event.metaKey ? 'Meta+' : ''}${event.shiftKey ? 'Shift+' : ''}${event.key}`
      console.log('[快捷键拦截]', shortcut)

      // TODO: 调用 trigger_shortcut_action 接口
      // triggerShortcutAction(shortcut)

      return false
    }
  }

  const enable = () => {
    isEnabled = true
  }

  const disable = () => {
    isEnabled = false
  }

  onMounted(() => {
    window.addEventListener('keydown', handleKeyDown, true)
  })

  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeyDown, true)
  })

  return {
    enable,
    disable,
    isEnabled: () => isEnabled
  }
}

// 预留接口：触发快捷键动作
async function triggerShortcutAction(action: string) {
  try {
    const { invoke } = await import('@tauri-apps/api/core')
    await invoke('trigger_shortcut_action', { action })
  } catch (err) {
    console.error('触发快捷键动作失败:', err)
  }
}
