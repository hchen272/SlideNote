import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { ThemeProvider, useTheme } from './contexts/ThemeContext'
import { NotesProvider, useNotes } from './contexts/NotesContext'
import { LanguageProvider, useLang } from './i18n'
import TitleBar from './components/TitleBar/TitleBar'
import Sidebar from './components/Sidebar/Sidebar'
import Editor from './components/Editor/Editor'
import type { EditorHandle } from './components/Editor/Editor'
import OutlinePanel from './components/Outline/OutlinePanel'
import SettingsModal from './components/Settings/SettingsModal'
import type { HeadingNode } from './types'
import { extractMarkdownHeadings, extractSlateHeadings } from './utils/outline'

function AppContent() {
  const { theme } = useTheme()
  const { t } = useLang()
  const { notes, activeNoteId } = useNotes()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isDocked, setIsDocked] = useState(false)
  const [dockedEdge, setDockedEdge] = useState<string | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [outlineOpen, setOutlineOpen] = useState(false)
  const editorRef = useRef<EditorHandle>(null)

  const activeNote = notes.find(n => n.id === activeNoteId)

  // Extract heading tree from active note (Markdown or Slate)
  const headings: HeadingNode[] = useMemo(() => {
    if (!activeNote) return []
    if (activeNote.contentType === 'slate') {
      return extractSlateHeadings(activeNote.slateContent || [])
    }
    return extractMarkdownHeadings(activeNote.content || '')
  }, [activeNote?.content, activeNote?.slateContent])

  // Jump to heading via Editor ref
  const handleJumpToHeading = useCallback((heading: HeadingNode) => {
    editorRef.current?.jumpToHeading(heading)
  }, [])

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
        onToggleOutline={() => setOutlineOpen(!outlineOpen)}
        outlineOpen={outlineOpen}
      />
      <div className="app-body">
        <Sidebar isOpen={sidebarOpen} onOpenSettings={() => setSettingsOpen(true)} />
        <Editor ref={editorRef} />
        <OutlinePanel
          headings={headings}
          isOpen={outlineOpen}
          onJump={handleJumpToHeading}
          titleText={t.outline.title}
          emptyText={t.outline.empty}
        />
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
