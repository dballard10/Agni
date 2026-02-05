/**
 * Electron main process entry point.
 * Creates the browser window and manages app lifecycle.
 */

import { app, BrowserWindow, shell } from 'electron'
import path from 'path'

// Disable GPU acceleration if issues arise on some systems
// app.disableHardwareAcceleration()

let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  // Open external links in the default browser
  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // Load the renderer
  if (process.env.NODE_ENV === 'development') {
    // In dev, electron-vite serves the renderer on a local port
    const rendererUrl = process.env['ELECTRON_RENDERER_URL']
    if (rendererUrl) {
      mainWindow.loadURL(rendererUrl)
    } else {
      mainWindow.loadURL('http://localhost:5173')
    }
    // Open DevTools in development
    mainWindow.webContents.openDevTools()
  } else {
    // In production, load the built HTML file
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
  }
}

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
