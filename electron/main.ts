import { app, BrowserWindow, ipcMain, screen, globalShortcut } from 'electron'
import { join } from 'path'
import Store from 'electron-store'

const store = new Store({
  defaults: {
    windowBounds: { width: 380, height: 550, x: undefined, y: undefined },
    dockedEdge: null as 'left' | 'right' | null,
    isDocked: false,
    theme: 'cyberpunk',
    notes: [],
    settings: {
      fontSize: 14,
      fontWeight: 'normal',
      fontColor: '#ffffff',
    }
  }
})

let mainWindow: BrowserWindow | null = null
let isDocked = false
let dockedEdge: 'left' | 'right' | null = null
const DOCKED_WIDTH = 48
const NORMAL_WIDTH = 380
const NORMAL_HEIGHT = 550

function createWindow() {
  const bounds = store.get('windowBounds', { width: NORMAL_WIDTH, height: NORMAL_HEIGHT }) as any
  isDocked = store.get('isDocked', false) as boolean
  dockedEdge = store.get('dockedEdge', null) as 'left' | 'right' | null

  mainWindow = new BrowserWindow({
    width: isDocked ? DOCKED_WIDTH : (bounds.width || NORMAL_WIDTH),
    height: isDocked ? (bounds.height || NORMAL_HEIGHT) : (bounds.height || NORMAL_HEIGHT),
    x: bounds.x,
    y: bounds.y,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: false,
    resizable: true,
    minWidth: 300,
    minHeight: 200,
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  // Set always on top with a lower level so fullscreen apps can cover it
  mainWindow.setAlwaysOnTop(true, 'floating')

  // Load the app
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
  } else {
    mainWindow.loadFile(join(__dirname, '../dist/index.html'))
  }

  // Save window bounds on resize/move
  mainWindow.on('resize', saveBounds)
  mainWindow.on('move', saveBounds)

  // Handle edge snapping when moving
  mainWindow.on('move', handleEdgeSnap)

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

function saveBounds() {
  if (!mainWindow || isDocked) return
  const bounds = mainWindow.getBounds()
  store.set('windowBounds', bounds)
}

function handleEdgeSnap() {
  if (!mainWindow || isDocked) return

  const cursorPoint = screen.getCursorScreenPoint()
  const currentDisplay = screen.getDisplayNearestPoint(cursorPoint)
  const { x: screenX, width: screenWidth } = currentDisplay.workArea
  const bounds = mainWindow.getBounds()
  const SNAP_THRESHOLD = 15

  // Check if window is near left edge
  if (Math.abs(bounds.x - screenX) <= SNAP_THRESHOLD) {
    mainWindow.setPosition(screenX, bounds.y)
  }

  // Check if window is near right edge
  if (Math.abs((bounds.x + bounds.width) - (screenX + screenWidth)) <= SNAP_THRESHOLD) {
    mainWindow.setPosition(screenX + screenWidth - bounds.width, bounds.y)
  }
}

// Toggle dock state
function toggleDock() {
  if (!mainWindow) return

  if (isDocked) {
    // Undock: restore to normal size
    const bounds = store.get('windowBounds', { width: NORMAL_WIDTH, height: NORMAL_HEIGHT }) as any
    isDocked = false
    dockedEdge = null
    mainWindow.setSize(NORMAL_WIDTH, bounds.height || NORMAL_HEIGHT)

    // Position near the docked edge but fully visible
    const cursorPoint = screen.getCursorScreenPoint()
    const currentDisplay = screen.getDisplayNearestPoint(cursorPoint)
    const { x: screenX } = currentDisplay.workArea

    if (bounds.x && bounds.x <= 100) {
      mainWindow.setPosition(screenX + 10, bounds.y || 100)
    } else {
      mainWindow.setPosition(screenX + currentDisplay.workArea.width - NORMAL_WIDTH - 10, bounds.y || 100)
    }
    mainWindow.setAlwaysOnTop(true, 'floating')
  } else {
    // Dock: shrink to edge bar
    const bounds = mainWindow.getBounds()
    const cursorPoint = screen.getCursorScreenPoint()
    const currentDisplay = screen.getDisplayNearestPoint(cursorPoint)
    const { x: screenX, width: screenWidth, height: screenHeight, y: screenY } = currentDisplay.workArea

    store.set('windowBounds', bounds)

    // Determine which edge to dock to
    const distToLeft = bounds.x - screenX
    const distToRight = (screenX + screenWidth) - (bounds.x + bounds.width)

    if (distToLeft <= distToRight) {
      dockedEdge = 'left'
      mainWindow.setBounds({
        x: screenX,
        y: Math.round(screenY + screenHeight * 0.2),
        width: DOCKED_WIDTH,
        height: Math.round(screenHeight * 0.45),
      })
    } else {
      dockedEdge = 'right'
      mainWindow.setBounds({
        x: screenX + screenWidth - DOCKED_WIDTH,
        y: Math.round(screenY + screenHeight * 0.2),
        width: DOCKED_WIDTH,
        height: Math.round(screenHeight * 0.45),
      })
    }
    isDocked = true
  }

  store.set('isDocked', isDocked)
  store.set('dockedEdge', dockedEdge)
  mainWindow.webContents.send('dock-state-changed', { isDocked, dockedEdge })
}

// ---- IPC Handlers ----

ipcMain.handle('get-store', (_event, key: string) => {
  return store.get(key)
})

ipcMain.handle('set-store', (_event, key: string, value: any) => {
  store.set(key, value)
  return true
})

ipcMain.handle('get-notes', () => {
  return store.get('notes', [])
})

ipcMain.handle('save-notes', (_event, notes: any[]) => {
  store.set('notes', notes)
  return true
})

ipcMain.handle('toggle-dock', () => {
  toggleDock()
  return { isDocked, dockedEdge }
})

ipcMain.handle('get-dock-state', () => {
  return { isDocked, dockedEdge }
})

ipcMain.handle('minimize-window', () => {
  mainWindow?.minimize()
})

ipcMain.handle('maximize-window', () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize()
  } else {
    mainWindow?.maximize()
  }
})

ipcMain.handle('close-window', () => {
  // Minimize to tray behavior: just dock or hide
  if (!isDocked) {
    toggleDock()
  }
})

ipcMain.handle('get-themes', () => {
  return ['cyberpunk', 'nature', 'medieval']
})

// ---- App Lifecycle ----

app.whenReady().then(() => {
  createWindow()

  // Global shortcut: Ctrl+Shift+N to toggle dock
  globalShortcut.register('CommandOrControl+Shift+D', () => {
    toggleDock()
  })

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
})
