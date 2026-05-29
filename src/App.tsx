import React, { useState, useEffect } from 'react'
import { ThemeProvider, useTheme } from './contexts/ThemeContext'
import { NotesProvider, useNotes } from './contexts/NotesContext'
import { LanguageProvider, useLang } from './i18n'
import TitleBar from './components/TitleBar/TitleBar'
import Sidebar from './components/Sidebar/Sidebar'
import Editor from './components/Editor/Editor'
import SettingsModal from './components/Settings/SettingsModal'

function AppContent() {
  const { theme } = useTheme()
  const { t } = useLang()
  const { notes, activeNoteId } = useNotes()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isDocked, setIsDocked] = useState(false)
  const [dockedEdge, setDockedEdge] = useState<string | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)

  const activeNote = notes.find(n => n.id === activeNoteId)

  useEffect(() => {
    document.body.className = `theme-${theme}`
  }, [theme])

  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.getDockState().then(state => {
        setIsDocked(state.isDocked)
        setDockedEdge(state.dockedEdge)
      })
      window.electronAPI.onDockStateChanged((state) => {
        setIsDocked(state.isDocked)
        setDockedEdge(state.dockedEdge)
      })
    }
  }, [])

  if (isDocked) {
    const handlePointerDown = (e: React.PointerEvent) => {
      const el = e.currentTarget as HTMLElement
      el.setPointerCapture(e.pointerId)
      const startX = e.screenX
      const startY = e.screenY
      let dragged = false

      const onMove = (ev: PointerEvent) => {
        if (!dragged && (Math.abs(ev.screenX - startX) > 3 || Math.abs(ev.screenY - startY) > 3)) {
          dragged = true
          window.electronAPI?.startDrag(startX, startY)
        }
      }

      const onUp = () => {
        el.releasePointerCapture(e.pointerId)
        el.removeEventListener('pointermove', onMove)
        el.removeEventListener('pointerup', onUp)
        if (dragged) {
          window.electronAPI?.stopDrag()
        } else {
          window.electronAPI?.toggleDock()
        }
      }

      el.addEventListener('pointermove', onMove)
      el.addEventListener('pointerup', onUp)
    }

    return (
      <div
        className={`app-container docked ${dockedEdge} theme-${theme}`}
        onPointerDown={handlePointerDown}
        title={t.app.dockedTooltip}
      >
        <div className="dock-tab-strip" />
      </div>
    )
  }

  return (
    <div className={`app-container theme-${theme}`}>
      <TitleBar
        isDocked={isDocked}
        activeNoteTitle={activeNote?.title || t.app.title}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        sidebarOpen={sidebarOpen}
      />
      <div className="app-body">
        <Sidebar isOpen={sidebarOpen} onOpenSettings={() => setSettingsOpen(true)} />
        <Editor />
      </div>
      <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  )
}

export default function App() {
  return (
    <LanguageProvider>
      <ThemeProvider>
        <NotesProvider>
          <AppContent />
        </NotesProvider>
      </ThemeProvider>
    </LanguageProvider>
  )
}
