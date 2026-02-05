/**
 * Electron main process entry point.
 * Creates the browser window and manages app lifecycle.
 */

import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron'
import path from 'path'
import fs from 'fs'

let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  const isMac = process.platform === 'darwin'

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    show: false,
    autoHideMenuBar: true,
    // Frameless window with platform-appropriate title bar
    frame: false,
    titleBarStyle: isMac ? 'hiddenInset' : 'hidden',
    ...(isMac && {
      trafficLightPosition: { x: 12, y: 12 },
    }),
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  // Notify renderer of maximize state changes
  mainWindow.on('maximize', () => {
    mainWindow?.webContents.send('window:maximizeChanged', true)
  })
  mainWindow.on('unmaximize', () => {
    mainWindow?.webContents.send('window:maximizeChanged', false)
  })

  // Open external links in the default browser
  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // Load the renderer
  if (process.env.NODE_ENV === 'development') {
    // Wrapper mode by default: load web app URL (can be overridden via AGNI_WEB_URL)
    const webUrl = process.env.AGNI_WEB_URL ?? 'http://localhost:5174'
    mainWindow.loadURL(webUrl)
    mainWindow.webContents.openDevTools()
  } else {
    // Production: check for bundled web app first, then fall back to electron-vite renderer
    const webDistPath = path.join(process.resourcesPath, 'web/dist/index.html')
    const rendererPath = path.join(__dirname, '../renderer/index.html')

    // Use web dist if it exists (wrapper production mode)
    if (fs.existsSync(webDistPath)) {
      mainWindow.loadFile(webDistPath)
    } else {
      mainWindow.loadFile(rendererPath)
    }
  }
}

// ============================================
// IPC Handlers
// ============================================

// App lifecycle
ipcMain.handle('app:getPath', (_, name: string) => {
  return app.getPath(name as 'userData' | 'documents' | 'downloads')
})

ipcMain.on('app:quit', () => app.quit())

// Window controls
ipcMain.on('window:minimize', () => mainWindow?.minimize())
ipcMain.on('window:maximize', () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize()
  } else {
    mainWindow?.maximize()
  }
})
ipcMain.on('window:close', () => mainWindow?.close())
ipcMain.handle('window:isMaximized', () => mainWindow?.isMaximized() ?? false)

// Dialogs
ipcMain.handle('dialog:showOpenDialog', async (_, options) => {
  if (!mainWindow) return null
  const result = await dialog.showOpenDialog(mainWindow, options)
  return result.canceled ? null : result.filePaths
})

ipcMain.handle('dialog:showSaveDialog', async (_, options) => {
  if (!mainWindow) return null
  const result = await dialog.showSaveDialog(mainWindow, options)
  return result.canceled ? null : result.filePath
})

ipcMain.handle('dialog:showMessageBox', async (_, options) => {
  if (!mainWindow) return 0
  const result = await dialog.showMessageBox(mainWindow, options)
  return result.response
})

// Shell
ipcMain.handle('shell:openExternal', (_, url: string) => shell.openExternal(url))
ipcMain.on('shell:showItemInFolder', (_, path: string) => shell.showItemInFolder(path))

// ============================================
// App Lifecycle
// ============================================

// Quit when all windows are closed (except on macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On macOS, re-create window when dock icon is clicked
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

// Create window when Electron is ready
app.whenReady().then(() => {
  createWindow()
})
