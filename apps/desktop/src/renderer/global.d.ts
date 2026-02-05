import type { DesktopAPI } from '@agni/platform'

declare global {
  interface Window {
    electronAPI?: DesktopAPI
  }
}

export {}
