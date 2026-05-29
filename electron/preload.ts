import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  // Store operations
  getStore: (key: string) => ipcRenderer.invoke('get-store', key),
  setStore: (key: string, value: any) => ipcRenderer.invoke('set-store', key, value),

  // Notes operations
  getNotes: () => ipcRenderer.invoke('get-notes'),
  saveNotes: (notes: any[]) => ipcRenderer.invoke('save-notes', notes),

  // Dock operations
  toggleDock: () => ipcRenderer.invoke('toggle-dock'),
  getDockState: () => ipcRenderer.invoke('get-dock-state'),
  onDockStateChanged: (callback: (state: { isDocked: boolean; dockedEdge: string | null }) => void) => {
    ipcRenderer.on('dock-state-changed', (_event, state) => callback(state))
  },

  // Window controls
  minimizeWindow: () => ipcRenderer.invoke('minimize-window'),
  maximizeWindow: () => ipcRenderer.invoke('maximize-window'),
  closeWindow: () => ipcRenderer.invoke('close-window'),

  // Window drag (for docked tab)
  startDrag: (startX: number, startY: number) => ipcRenderer.send('start-drag', startX, startY),
  stopDrag: () => ipcRenderer.send('stop-drag'),

  // Data path
  getDataPath: () => ipcRenderer.invoke('get-data-path'),
  setDataPath: (path: string) => ipcRenderer.invoke('set-data-path', path),
  pickFolder: () => ipcRenderer.invoke('pick-folder'),

  // Themes
  getThemes: () => ipcRenderer.invoke('get-themes'),
})

export {}
