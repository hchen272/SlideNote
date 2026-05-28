export interface Note {
  id: string
  title: string
  content: string
  createdAt: number
  modifiedAt: number
  wordCount: number
  fontSettings: FontSettings
}

export interface FontSettings {
  fontSize: number
  fontWeight: 'normal' | 'bold'
  fontColor: string
}

export type ThemeName = 'cyberpunk' | 'nature' | 'medieval'

export type SortBy = 'createdAt' | 'modifiedAt' | 'wordCount'

export interface WeatherData {
  temperature: number
  condition: string
  icon: string
  humidity: number
  windSpeed: number
  location: string
  forecast: WeatherForecast[]
}

export interface WeatherForecast {
  day: string
  temperature: number
  condition: string
  icon: string
}

export interface ElectronAPI {
  getStore: (key: string) => Promise<any>
  setStore: (key: string, value: any) => Promise<boolean>
  getNotes: () => Promise<Note[]>
  saveNotes: (notes: Note[]) => Promise<boolean>
  toggleDock: () => Promise<{ isDocked: boolean; dockedEdge: string | null }>
  getDockState: () => Promise<{ isDocked: boolean; dockedEdge: string | null }>
  onDockStateChanged: (callback: (state: { isDocked: boolean; dockedEdge: string | null }) => void) => void
  minimizeWindow: () => Promise<void>
  maximizeWindow: () => Promise<void>
  closeWindow: () => Promise<void>
  startDrag: (startX: number, startY: number) => void
  stopDrag: () => void
  getDataPath: () => Promise<string>
  setDataPath: (path: string) => Promise<boolean>
  getThemes: () => Promise<string[]>
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}
