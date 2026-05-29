import React from 'react'
import { useTheme } from '../../contexts/ThemeContext'
import { useLang } from '../../i18n'
import './TitleBar.css'

interface TitleBarProps {
  isDocked: boolean
  activeNoteTitle: string
  onToggleSidebar: () => void
  sidebarOpen: boolean
  onToggleOutline: () => void
  outlineOpen: boolean
}

export default function TitleBar({ isDocked, activeNoteTitle, onToggleSidebar, sidebarOpen, onToggleOutline, outlineOpen }: TitleBarProps) {
  const { theme } = useTheme()
  const { t } = useLang()

  return (
    <div className={`titlebar theme-${theme}`}>
      <div className="titlebar-left">
        <button
          className="titlebar-btn sidebar-toggle"
          onClick={onToggleSidebar}
          title={t.titlebar.toggleSidebar}
        >
          {sidebarOpen ? '◁' : '☰'}
        </button>
        <button
          className="titlebar-btn outline-toggle"
          onClick={onToggleOutline}
          title={t.outline.toggleTooltip}
        >
          {outlineOpen ? '◁' : '☷'}
        </button>
        <button
          className="titlebar-btn dock-btn"
          onClick={() => window.electronAPI?.toggleDock()}
          title={isDocked ? t.titlebar.undock : t.titlebar.dock}
        >
          {isDocked ? '▶' : '◀'}
        </button>
      </div>

      <div className="titlebar-center">
        <span className="titlebar-title">{activeNoteTitle || t.app.title}</span>
      </div>

      <div className="titlebar-right">
        <button className="titlebar-btn min-btn" onClick={() => window.electronAPI?.minimizeWindow()} title={t.titlebar.minimize}>
          ─
        </button>
        <button className="titlebar-btn max-btn" onClick={() => window.electronAPI?.maximizeWindow()} title={t.titlebar.maximize}>
          □
        </button>
        <button className="titlebar-btn close-btn" onClick={() => window.electronAPI?.closeWindow()} title={t.titlebar.close}>
          ✕
        </button>
      </div>
    </div>
  )
}
