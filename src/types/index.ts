import type { Descendant } from 'slate'

export interface HeadingNode {
  level: number            // 1-5 heading level
  text: string             // plain heading text (no markdown formatting)
  lineIndex?: number       // line index in markdown source (0-based)
  slatePath?: number[]     // slate node path in Descendant[]
  children: HeadingNode[]  // sub-headings (e.g. h2 under h1)
  id: string               // unique id for React key & scroll targeting
}

export interface Folder {
  id: string
  name: string
  color: string           // hex color for the folder tag
  createdAt: number
}

export interface Note {
  id: string
  title: string
  content: string          // markdown content (when contentType is 'markdown')
  slateContent: Descendant[] // slate JSON content (when contentType is 'slate')
  contentType: 'markdown' | 'slate'
  createdAt: number
  modifiedAt: number
  wordCount: number
  fontSettings: FontSettings
  folderIds?: string[]     // folders this note belongs to (tag-style, multi-folder)
}

export interface FontSettings {
  fontSize: number
  fontWeight: 'normal' | 'bold'
  fontColor: string
}

export type ThemeName = 'cyberpunk' | 'nature' | 'medieval'

export type SortBy = 'createdAt' | 'modifiedAt' | 'wordCount' | 'title'

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
  pickFolder: () => Promise<string | null>
  openUrl: (url: string) => Promise<void>
  getThemes: () => Promise<string[]>
  getFolders: () => Promise<Folder[]>
  saveFolders: (folders: Folder[]) => Promise<boolean>
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}
