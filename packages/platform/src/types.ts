/**
 * Platform capabilities interface
 * Defines what features are available on each platform
 */
export interface PlatformCapabilities {
  isDesktop: boolean
  isBrowser: boolean
  isMobile: boolean
  hasFileSystem: boolean
  hasNativeMenus: boolean
  hasNotifications: boolean
  hasAutoUpdater: boolean
}

/**
 * Desktop-specific API exposed via Electron preload
 * This interface is the contract between preload.ts and the web app
 */
export interface DesktopAPI {
  platform: NodeJS.Platform
  versions: {
    node: string
    chrome: string
    electron: string
  }

  // File system (future offline-first)
  fs?: {
    readFile: (path: string) => Promise<string>
    writeFile: (path: string, content: string) => Promise<void>
    exists: (path: string) => Promise<boolean>
    mkdir: (path: string) => Promise<void>
    readDir: (path: string) => Promise<string[]>
  }

  // App lifecycle
  app: {
    getPath: (name: 'userData' | 'documents' | 'downloads') => Promise<string>
    quit: () => void
    minimize: () => void
    maximize: () => void
    isMaximized: () => Promise<boolean>
  }

  // Native dialogs
  dialog: {
    showOpenDialog: (options: OpenDialogOptions) => Promise<string[] | null>
    showSaveDialog: (options: SaveDialogOptions) => Promise<string | null>
    showMessageBox: (options: MessageBoxOptions) => Promise<number>
  }

  // Shell integration
  shell: {
    openExternal: (url: string) => Promise<void>
    showItemInFolder: (path: string) => void
  }

  // Window controls (frameless window support)
  window: {
    minimize: () => void
    maximize: () => void
    close: () => void
    isMaximized: () => Promise<boolean>
    onMaximizeChange: (callback: (maximized: boolean) => void) => () => void
  }
}

export interface OpenDialogOptions {
  title?: string
  defaultPath?: string
  filters?: { name: string; extensions: string[] }[]
  properties?: ('openFile' | 'openDirectory' | 'multiSelections')[]
}

export interface SaveDialogOptions {
  title?: string
  defaultPath?: string
  filters?: { name: string; extensions: string[] }[]
}

export interface MessageBoxOptions {
  type?: 'none' | 'info' | 'error' | 'question' | 'warning'
  title?: string
  message: string
  buttons?: string[]
}
