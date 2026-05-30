import { app, BrowserWindow, ipcMain, screen, globalShortcut, dialog, shell } from 'electron'
import { join } from 'path'
import { readFileSync, writeFileSync, existsSync, mkdirSync, unlinkSync, readdirSync } from 'fs'
import Store from 'electron-store'

// ---- Custom data path support ----
const configPath = join(app.getPath('userData'), 'slide-note-path.json')

function getDataPath(): string {
  try {
    if (existsSync(configPath)) {
      const cfg = JSON.parse(readFileSync(configPath, 'utf-8'))
      if (cfg.dataPath && existsSync(cfg.dataPath)) {
        return cfg.dataPath
      }
    }
  } catch { /* ignore */ }
  return app.getPath('userData')
}

function setDataPath(newPath: string): void {
  const oldPath = getDataPath()

  // Read all current data from the in-memory store (non-notes config only)
  const allKeys = ['windowBounds', 'isDocked', 'dockedEdge', 'theme', 'settings', 'language', 'tabBounds', 'tabPosition']
  const data: Record<string, any> = {}
  for (const key of allKeys) {
    data[key] = store.get(key)
  }

  if (!existsSync(newPath)) {
    mkdirSync(newPath, { recursive: true })
  }

  writeFileSync(configPath, JSON.stringify({ dataPath: newPath }), 'utf-8')

  // Replace store with new one pointing to the new path
  store = new Store({ cwd: newPath, defaults: storeDefaults })
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      store.set(key, value)
    }
  }

  // Migrate notes folder to new path
  migrateNotesFolder(oldPath, newPath)
  migrateFoldersFile(oldPath, newPath)

  // Delete old config file
  const oldConfig = join(oldPath, 'config.json')
  if (existsSync(oldConfig) && oldPath !== newPath) {
    unlinkSync(oldConfig)
  }
}

// ---- Notes folder-based storage ----

const NOTES_DIR = 'notes'

function getNotesDir(): string {
  return join(getDataPath(), NOTES_DIR)
}

/** Read all notes from individual JSON files in the notes/ folder */
function readNotesFromDisk(): any[] {
  const dir = getNotesDir()
  if (!existsSync(dir)) return []
  const notes: any[] = []
  try {
    const files = readdirSync(dir)
    for (const file of files) {
      if (!file.endsWith('.json')) continue
      try {
        const data = JSON.parse(readFileSync(join(dir, file), 'utf-8'))
        if (data && data.id) notes.push(data)
      } catch { /* skip corrupted files */ }
    }
  } catch { /* ignore read errors */ }
  return notes
}

/** Write all notes as individual JSON files, then clean orphan files */
function writeNotesToDisk(notes: any[]): void {
  const dir = getNotesDir()
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })

  // Track which IDs we're writing
  const writtenIds = new Set<string>()

  for (const note of notes) {
    if (!note.id) continue
    writtenIds.add(note.id)
    const filePath = join(dir, `${note.id}.json`)
    writeFileSync(filePath, JSON.stringify(note, null, 2), 'utf-8')
  }

  // Remove orphan files (notes deleted from the array)
  try {
    const existingFiles = readdirSync(dir)
    for (const file of existingFiles) {
      if (!file.endsWith('.json')) continue
      const id = file.replace('.json', '')
      if (!writtenIds.has(id)) {
        unlinkSync(join(dir, file))
      }
    }
  } catch { /* ignore cleanup errors */ }
}

/** Migrate notes from old electron-store format to folder-based storage */
function migrateNotesFromStore(): void {
  const dir = getNotesDir()
  // Only migrate if notes/ folder doesn't exist yet
  if (existsSync(dir)) return

  const oldNotes = store.get('notes', []) as any[]
  if (!oldNotes || oldNotes.length === 0) return

  try {
    writeNotesToDisk(oldNotes)
    // Delete the old notes key from store so it's not double-loaded
    store.delete('notes' as any)
    console.log(`Migrated ${oldNotes.length} notes to folder-based storage.`)
  } catch (e) {
    console.error('Failed to migrate notes:', e)
  }
}

/** Copy notes folder from old data path to new data path */
function migrateNotesFolder(oldPath: string, newPath: string): void {
  const oldDir = join(oldPath, NOTES_DIR)
  const newDir = join(newPath, NOTES_DIR)
  if (!existsSync(oldDir)) return
  if (!existsSync(newDir)) mkdirSync(newDir, { recursive: true })
  try {
    const files = readdirSync(oldDir)
    for (const file of files) {
      if (!file.endsWith('.json')) continue
      const src = join(oldDir, file)
      const dst = join(newDir, file)
      const data = readFileSync(src, 'utf-8')
      writeFileSync(dst, data, 'utf-8')
    }
  } catch { /* ignore migration errors */ }
}

// ---- Folders storage (folders.json) ----

const FOLDERS_FILE = 'folders.json'

function getFoldersPath(): string {
  return join(getDataPath(), FOLDERS_FILE)
}

function readFoldersFromDisk(): any[] {
  const fp = getFoldersPath()
  if (!existsSync(fp)) return []
  try {
    const data = JSON.parse(readFileSync(fp, 'utf-8'))
    return Array.isArray(data) ? data : []
  } catch { return [] }
}

function writeFoldersToDisk(folders: any[]): void {
  writeFileSync(getFoldersPath(), JSON.stringify(folders, null, 2), 'utf-8')
}

function migrateFoldersFile(oldPath: string, newPath: string): void {
  const src = join(oldPath, FOLDERS_FILE)
  const dst = join(newPath, FOLDERS_FILE)
  if (existsSync(src)) {
    writeFileSync(dst, readFileSync(src, 'utf-8'), 'utf-8')
  }
}

const storeDefaults = {
  windowBounds: { width: 380, height: 550, x: undefined, y: undefined },
  dockedEdge: null as 'left' | 'right' | null,
  isDocked: false,
  theme: 'cyberpunk',
  settings: {
    fontSize: 14,
    fontWeight: 'normal',
    fontColor: '#ffffff',
  }
}

let store = new Store({
  cwd: getDataPath(),
  defaults: storeDefaults,
})

let mainWindow: BrowserWindow | null = null
let isDocked = false
let dockedEdge: 'left' | 'right' | null = null
const DOCKED_WIDTH = 10 // fallback, actual width calculated dynamically
const NORMAL_WIDTH = 380
const NORMAL_HEIGHT = 550

function createWindow() {
  const bounds = store.get('windowBounds', { width: NORMAL_WIDTH, height: NORMAL_HEIGHT }) as any
  isDocked = store.get('isDocked', false) as boolean
  dockedEdge = store.get('dockedEdge', null) as 'left' | 'right' | null
  const savedTabBounds = store.get('tabBounds', { width: DOCKED_WIDTH, height: NORMAL_HEIGHT }) as any

  mainWindow = new BrowserWindow({
    width: isDocked ? (savedTabBounds.width || DOCKED_WIDTH) : (bounds.width || NORMAL_WIDTH),
    height: isDocked ? (savedTabBounds.height || NORMAL_HEIGHT) : (bounds.height || NORMAL_HEIGHT),
    x: bounds.x,
    y: bounds.y,
    frame: false,
    transparent: false,
    backgroundColor: '#0a0a1a',
    alwaysOnTop: true,
    skipTaskbar: false,
    resizable: !isDocked,
    minWidth: isDocked ? undefined : 300,
    minHeight: isDocked ? undefined : 200,
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
  // Don't save maximized bounds — they would overwrite the real normal size
  if (mainWindow.isMaximized()) return
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

  // Snap to left edge (small gap prevents resize trigger)
  if (Math.abs(bounds.x - screenX) <= SNAP_THRESHOLD) {
    mainWindow.setPosition(screenX + 1, bounds.y)
  }

  // Snap to right edge (gap prevents Windows resize-on-edge behavior)
  if (Math.abs((bounds.x + bounds.width) - (screenX + screenWidth)) <= SNAP_THRESHOLD) {
    mainWindow.setPosition(screenX + screenWidth - bounds.width - 1, bounds.y)
  }
}

// Toggle dock state
function toggleDock() {
  if (!mainWindow) return

  if (isDocked) {
    // Undock: restore to previously saved size
    const savedEdge = dockedEdge
    const savedBounds = store.get('windowBounds', { width: NORMAL_WIDTH, height: NORMAL_HEIGHT, x: 100, y: 100 }) as any
    isDocked = false
    dockedEdge = null
    const savedWidth = savedBounds.width || NORMAL_WIDTH
    const savedHeight = savedBounds.height || NORMAL_HEIGHT

    // Re-enable resize and min size
    mainWindow.setResizable(true)
    mainWindow.setMinimumSize(300, 200)

    // Position near the previously docked edge but fully visible
    const cursorPoint = screen.getCursorScreenPoint()
    const currentDisplay = screen.getDisplayNearestPoint(cursorPoint)
    const { x: screenX, width: screenWidth } = currentDisplay.workArea

    if (savedEdge === 'left') {
      mainWindow.setBounds({
        x: screenX,
        y: savedBounds.y || 100,
        width: savedWidth,
        height: savedHeight,
      })
    } else {
      mainWindow.setBounds({
        x: screenX + screenWidth - savedWidth - 10,
        y: savedBounds.y || 100,
        width: savedWidth,
        height: savedHeight,
      })
    }
    mainWindow.setAlwaysOnTop(true, 'floating')
  } else {
    // Dock: shrink to a small bookmark tab
    // Unmaximize first — a maximized window can't be resized to a docked tab
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize()
    }
    const bounds = mainWindow.getBounds()
    const cursorPoint = screen.getCursorScreenPoint()
    const currentDisplay = screen.getDisplayNearestPoint(cursorPoint)
    const { x: screenX, y: screenY, width: screenWidth, height: screenHeight } = currentDisplay.workArea

    // Save current bounds BEFORE changing isDocked
    store.set('windowBounds', bounds)

    // Determine which edge to dock to
    const distToLeft = bounds.x - screenX
    const distToRight = (screenX + screenWidth) - (bounds.x + bounds.width)

    const tabHeight = Math.round(screenHeight * 0.04)
    const tabWidth = Math.round(tabHeight * 0.30)
    const tabY = Math.round(screenY + (screenHeight - tabHeight) / 2)

    // Save tab dimensions for restart
    store.set('tabBounds', { width: tabWidth, height: tabHeight })

    if (distToLeft < distToRight) {
      dockedEdge = 'left'
      isDocked = true
      mainWindow.setResizable(false)
      mainWindow.setMinimumSize(tabWidth, tabHeight)
      mainWindow.setBounds({
        x: screenX,
        y: tabY,
        width: tabWidth,
        height: tabHeight,
      })
    } else {
      dockedEdge = 'right'
      isDocked = true
      mainWindow.setResizable(false)
      mainWindow.setMinimumSize(tabWidth, tabHeight)
      mainWindow.setBounds({
        x: screenX + screenWidth - tabWidth,
        y: tabY,
        width: tabWidth,
        height: tabHeight,
      })
    }
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
  return readNotesFromDisk()
})

ipcMain.handle('save-notes', (_event, notes: any[]) => {
  writeNotesToDisk(notes)
  return true
})

ipcMain.handle('get-folders', () => {
  return readFoldersFromDisk()
})

ipcMain.handle('save-folders', (_event, folders: any[]) => {
  writeFoldersToDisk(folders)
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
  app.quit()
})

ipcMain.handle('get-themes', () => {
  return ['cyberpunk', 'nature', 'medieval', 'minimal']
})

// ---- Data path ----
ipcMain.handle('get-data-path', () => {
  return getDataPath()
})

ipcMain.handle('set-data-path', (_event, newPath: string) => {
  setDataPath(newPath)
  return true
})

ipcMain.handle('pick-folder', async () => {
  if (!mainWindow) return null
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
    title: '选择数据存储文件夹',
  })
  return result.canceled ? null : result.filePaths[0]
})

ipcMain.handle('open-url', (_event, url: string) => {
  shell.openExternal(url)
})

// ---- Window drag for docked tab ----
let dragInterval: NodeJS.Timeout | null = null

ipcMain.on('start-drag', (_event, startX: number, startY: number) => {
  if (!mainWindow || !isDocked) return
  const startBounds = mainWindow.getBounds()

  dragInterval = setInterval(() => {
    if (!mainWindow) return
    const cursor = screen.getCursorScreenPoint()
    const newY = startBounds.y + (cursor.y - startY)
    // Clamp Y within work area so tab doesn't go off-screen
    const display = screen.getDisplayNearestPoint(cursor)
    const { y: screenY, height: screenHeight } = display.workArea
    const clampedY = Math.max(screenY, Math.min(screenY + screenHeight - startBounds.height, newY))
    mainWindow.setBounds({
      x: startBounds.x,
      y: Math.round(clampedY),
      width: startBounds.width,
      height: startBounds.height,
    })
  }, 16)
})

ipcMain.on('stop-drag', () => {
  if (dragInterval) {
    clearInterval(dragInterval)
    dragInterval = null
  }
  // Save tab Y separately — never overwrite windowBounds with docked size!
  if (mainWindow && isDocked) {
    store.set('tabPosition', { y: mainWindow.getBounds().y })
  }
})

// ---- App Lifecycle ----

app.whenReady().then(() => {
  // Migrate old single-file notes to folder-based storage (one-time)
  migrateNotesFromStore()

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
