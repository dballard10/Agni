/**
 * Electron preload script.
 * Exposes a safe, typed API to the renderer process via contextBridge.
 */

import { contextBridge, ipcRenderer } from 'electron'

// Define the API exposed to the renderer
export interface ElectronAPI {
  platform: NodeJS.Platform
  versions: {
    node: string
    chrome: string
    electron: string
  }
  // Add more IPC methods here as needed
  send: (channel: string, data: unknown) => void
  on: (channel: string, callback: (data: unknown) => void) => () => void
}

// Whitelist of allowed IPC channels
const validSendChannels = ['toMain']
const validReceiveChannels = ['fromMain']

const api: ElectronAPI = {
  platform: process.platform,
  versions: {
    node: process.versions.node,
    chrome: process.versions.chrome,
    electron: process.versions.electron,
  },
  send: (channel: string, data: unknown) => {
    if (validSendChannels.includes(channel)) {
      ipcRenderer.send(channel, data)
    }
  },
  on: (channel: string, callback: (data: unknown) => void) => {
    if (validReceiveChannels.includes(channel)) {
      const subscription = (_event: Electron.IpcRendererEvent, data: unknown) =>
        callback(data)
      ipcRenderer.on(channel, subscription)
      return () => {
        ipcRenderer.removeListener(channel, subscription)
      }
    }
    return () => {}
  },
}

// Expose the API to the renderer process
contextBridge.exposeInMainWorld('electronAPI', api)

// TypeScript declaration for the renderer
declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}
