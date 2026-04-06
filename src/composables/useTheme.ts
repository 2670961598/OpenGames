import { ref, computed } from 'vue'
import type { Theme } from '../themes/types.ts'
import {
  applyTheme,
  getAvailableThemes,
  findThemeByName,
  getDefaultTheme,
} from '../themes/manager.ts'

const STORAGE_KEY = 'app-theme'

// 当前主题状态（全局单例）
const currentThemeName = ref<string>(getDefaultTheme().name)
const isInitialized = ref(false)

// TODO: Rust 后端接口
// import { invoke } from '@tauri-apps/api/core'

async function loadThemeFromStorage(): Promise<string | null> {
  // TODO: 调用 Rust 后端获取保存的主题
  // try {
  //   const saved = await invoke<string | null>('get_theme')
  //   return saved
  // } catch (err) {
  //   console.error('Failed to load theme from Rust:', err)
  //   return null
  // }

  // 临时：从 localStorage 读取
  return localStorage.getItem(STORAGE_KEY)
}

async function saveThemeToStorage(themeName: string): Promise<void> {
  // TODO: 调用 Rust 后端保存主题
  // try {
  //   await invoke('set_theme', { theme: themeName })
  // } catch (err) {
  //   console.error('Failed to save theme to Rust:', err)
  // }

  // 临时：保存到 localStorage
  localStorage.setItem(STORAGE_KEY, themeName)
}

export function useTheme() {
  // 获取所有可用主题
  const themes = computed(() => getAvailableThemes())

  // 当前主题
  const currentTheme = computed(() => {
    return findThemeByName(currentThemeName.value) || getDefaultTheme()
  })

  // 设置主题
  const setTheme = async (themeName: string) => {
    const theme = findThemeByName(themeName)
    if (!theme) {
      console.warn(`[Theme] Unknown theme: ${themeName}`)
      return
    }

    currentThemeName.value = themeName
    applyTheme(theme)
    await saveThemeToStorage(themeName)
  }

  // 初始化主题（在 App 启动时调用）
  const initTheme = async () => {
    if (isInitialized.value) return

    const saved = await loadThemeFromStorage()
    const themeName = saved || getDefaultTheme().name

    await setTheme(themeName)
    isInitialized.value = true
  }

  // 切换到下一个主题
  const cycleTheme = async () => {
    const available = getAvailableThemes()
    const currentIndex = available.findIndex(t => t.name === currentThemeName.value)
    const nextIndex = (currentIndex + 1) % available.length
    await setTheme(available[nextIndex].name)
  }

  return {
    themes,
    currentTheme,
    currentThemeName,
    setTheme,
    initTheme,
    cycleTheme,
    isInitialized,
  }
}
