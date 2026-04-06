import { lightTheme } from './light.ts'
import { darkTheme } from './dark.ts'
import { cyberpunkTheme } from './cyberpunk.ts'
import { forestTheme } from './forest.ts'
import type { Theme } from '../types.ts'

export const themePresets: Theme[] = [
  lightTheme,
  darkTheme,
  cyberpunkTheme,
  forestTheme,
]

export const defaultTheme = lightTheme

export { lightTheme, darkTheme, cyberpunkTheme, forestTheme }
