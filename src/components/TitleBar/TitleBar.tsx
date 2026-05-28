import React from 'react'
import { useTheme } from '../../contexts/ThemeContext'
import './TitleBar.css'

interface TitleBarProps {
  isDocked: boolean
  activeNoteTitle: string
  onToggleSidebar: () => void
  sidebarOpen: boolean
}

export default function TitleBar({ isDocked, activeNoteTitle, onToggleSidebar, sidebarOpen }: TitleBarProps) {
  const { theme } = useTheme()

  const handleMinimize = () => {
    window.electronAPI?.minimizeWindow()
  }

  const handleMaximize = () => {
    window.electronAPI?.maximizeWindow()
  }

  const handleClose = () => {
    window.electronAPI?.closeWindow()
  }

  const handleDock = () => {
    window.electronAPI?.toggleDock()
  }

  return (
    <div className={`titlebar theme-${theme}`}>
      <div className="titlebar-left">
        <button
          className="titlebar-btn sidebar-toggle"
          onClick={onToggleSidebar}
          title={sidebarOpen ? '关闭侧边栏' : '打开侧边栏'}
        >
          {sidebarOpen ? '◁' : '☰'}
        </button>
        <button
          className="titlebar-btn dock-btn"
          onClick={handleDock}
          title={isDocked ? '展开窗口' : '吸附到边栏'}
        >
          {isDocked ? '▶' : '◀'}
        </button>
      </div>

      <div className="titlebar-center">
        <span className="titlebar-title">{activeNoteTitle || 'Sticky Notes'}</span>
      </div>

      <div className="titlebar-right">
        <button className="titlebar-btn min-btn" onClick={handleMinimize} title="最小化">
          ─
        </button>
        <button className="titlebar-btn max-btn" onClick={handleMaximize} title="最大化">
          □
        </button>
        <button className="titlebar-btn close-btn" onClick={handleClose} title="吸附到边栏">
          ✕
        </button>
      </div>
    </div>
  )
}
