import React, { useState, useEffect } from 'react'
import { ThemeProvider, useTheme } from './contexts/ThemeContext'
import { NotesProvider, useNotes } from './contexts/NotesContext'
import TitleBar from './components/TitleBar/TitleBar'
import Sidebar from './components/Sidebar/Sidebar'
import Editor from './components/Editor/Editor'

function AppContent() {
  const { theme } = useTheme()
  const { notes, activeNoteId } = useNotes()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isDocked, setIsDocked] = useState(false)
  const [dockedEdge, setDockedEdge] = useState<string | null>(null)

  const activeNote = notes.find(n => n.id === activeNoteId)

  // Sync theme class to body so CSS variables affect the entire window
  useEffect(() => {
    document.body.className = `theme-${theme}`
  }, [theme])

  useEffect(() => {
    // Get initial dock state
    if (window.electronAPI) {
      window.electronAPI.getDockState().then(state => {
        setIsDocked(state.isDocked)
        setDockedEdge(state.dockedEdge)
      })

      // Listen for dock state changes
      window.electronAPI.onDockStateChanged((state) => {
        setIsDocked(state.isDocked)
        setDockedEdge(state.dockedEdge)
      })
    }
  }, [])

  // When docked: click to expand, drag to move along edge
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
        title="点击展开 / 拖拽移动"
      >
        <div className="dock-tab-strip" />
      </div>
    )
  }

  return (
    <div className={`app-container theme-${theme}`}>
      <TitleBar
        isDocked={isDocked}
        activeNoteTitle={activeNote?.title || 'Sticky Notes'}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        sidebarOpen={sidebarOpen}
      />
      <div className="app-body">
        <Sidebar isOpen={sidebarOpen} />
        <Editor />
      </div>
    </div>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <NotesProvider>
        <AppContent />
      </NotesProvider>
    </ThemeProvider>
  )
}
