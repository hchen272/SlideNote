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

  // When docked, show a minimal bar
  if (isDocked) {
    return (
      <div
        className={`app-container docked ${dockedEdge} theme-${theme}`}
        onClick={() => window.electronAPI?.toggleDock()}
        title="点击展开便签"
      >
        <span style={{ fontSize: '12px', letterSpacing: '2px' }}>
          📝 Sticky Notes
        </span>
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
