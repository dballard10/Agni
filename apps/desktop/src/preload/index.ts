/**
 * Electron preload script.
 * Exposes a safe, typed API to the renderer process via contextBridge.
 *
 * SECURITY: All IPC channels are explicitly whitelisted
 * ARCHITECTURE: This is the ONLY place Electron APIs are imported
 */

import { contextBridge, ipcRenderer } from 'electron'
import type { DesktopAPI, OpenDialogOptions, SaveDialogOptions, MessageBoxOptions } from '@agni/platform'

const desktopAPI: DesktopAPI = {
  platform: process.platform,
  versions: {
    node: process.versions.node,
    chrome: process.versions.chrome,
    electron: process.versions.electron,
  },

  // App lifecycle
  app: {
    getPath: (name) => ipcRenderer.invoke('app:getPath', name),
    quit: () => ipcRenderer.send('app:quit'),
    minimize: () => ipcRenderer.send('window:minimize'),
    maximize: () => ipcRenderer.send('window:maximize'),
    isMaximized: () => ipcRenderer.invoke('window:isMaximized'),
  },

  // Native dialogs
  dialog: {
    showOpenDialog: (options: OpenDialogOptions) =>
      ipcRenderer.invoke('dialog:showOpenDialog', options),
    showSaveDialog: (options: SaveDialogOptions) =>
      ipcRenderer.invoke('dialog:showSaveDialog', options),
    showMessageBox: (options: MessageBoxOptions) =>
      ipcRenderer.invoke('dialog:showMessageBox', options),
  },

  // Shell integration
  shell: {
    openExternal: (url: string) => ipcRenderer.invoke('shell:openExternal', url),
    showItemInFolder: (path: string) => ipcRenderer.send('shell:showItemInFolder', path),
  },

  // Window controls
  window: {
    minimize: () => ipcRenderer.send('window:minimize'),
    maximize: () => ipcRenderer.send('window:maximize'),
    close: () => ipcRenderer.send('window:close'),
    isMaximized: () => ipcRenderer.invoke('window:isMaximized'),
    onMaximizeChange: (callback) => {
      const handler = (_: unknown, maximized: boolean) => callback(maximized)
      ipcRenderer.on('window:maximizeChanged', handler)
      return () => ipcRenderer.removeListener('window:maximizeChanged', handler)
    },
  },

  // File system (disabled until offline-first phase)
  // fs: { ... }
}

// Expose to renderer
contextBridge.exposeInMainWorld('electronAPI', desktopAPI)

// TypeScript declaration for window.electronAPI
declare global {
  interface Window {
    electronAPI?: DesktopAPI
  }
}
