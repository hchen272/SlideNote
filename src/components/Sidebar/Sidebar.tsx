import React, { useState, useRef, useEffect } from 'react'
import { useNotes } from '../../contexts/NotesContext'
import { useTheme } from '../../contexts/ThemeContext'
import { useLang } from '../../i18n'
import type { SortBy } from '../../types'
import './Sidebar.css'

interface SidebarProps {
  isOpen: boolean
  onOpenSettings: () => void
}

export default function Sidebar({ isOpen, onOpenSettings }: SidebarProps) {
  const {
    sortedNotes,
    activeNoteId,
    setActiveNoteId,
    createNote,
    deleteNote,
    sortBy,
    setSortBy,
    searchQuery,
    setSearchQuery,
  } = useNotes()
  const { theme } = useTheme()
  const { t, lang } = useLang()

  const sortOptions: { value: SortBy; label: string }[] = [
    { value: 'modifiedAt', label: t.sidebar.sortModified },
    { value: 'createdAt', label: t.sidebar.sortCreated },
    { value: 'wordCount', label: t.sidebar.sortWords },
  ]

  const formatDate = (timestamp: number) => {
    const d = new Date(timestamp)
    return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
  }

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    if (sortedNotes.length > 1 && confirm(t.sidebar.confirmDelete)) {
      deleteNote(id)
    } else if (sortedNotes.length <= 1) {
      alert(t.sidebar.needOneNote)
    }
  }

  if (!isOpen) return null

  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className={`sidebar theme-${theme}`}>
      <div className="sidebar-header">
        <div className="new-note-dropdown" ref={menuRef}>
          <button className="new-note-btn" onClick={() => setMenuOpen(!menuOpen)}>
            {t.sidebar.newNote}
          </button>
          {menuOpen && (
            <div className="new-note-menu">
              <button className="new-note-menu-item" onClick={() => { createNote('markdown'); setMenuOpen(false) }}>
                📄 Markdown
              </button>
              <button className="new-note-menu-item" onClick={() => { createNote('slate'); setMenuOpen(false) }}>
                ✨ {t.sidebar.richText || '富文本'}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="sidebar-search">
        <input
          type="text"
          placeholder={t.sidebar.searchPlaceholder}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />
      </div>

      <div className="sidebar-sort">
        <span className="sort-label">{t.sidebar.sortLabel}</span>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortBy)}
          className="sort-select"
        >
          {sortOptions.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      <div className="sidebar-list">
        {sortedNotes.map(note => (
          <div
            key={note.id}
            className={`note-item ${note.id === activeNoteId ? 'active' : ''}`}
            onClick={() => setActiveNoteId(note.id)}
          >
            <div className="note-item-header">
              <span className="note-item-title">{note.title || t.sidebar.untitled}</span>
              <button
                className="note-item-delete"
                onClick={(e) => handleDelete(e, note.id)}
                title={t.sidebar.settings}
              >
                ×
              </button>
            </div>
            <div className="note-item-meta">
              <span>{formatDate(note.modifiedAt)}</span>
              <span>{note.wordCount}{lang === 'zh' ? '字' : 'w'}</span>
            </div>
          </div>
        ))}
        {sortedNotes.length === 0 && (
          <div className="no-notes">{t.sidebar.noNotes}</div>
        )}
      </div>

      <div className="sidebar-footer">
        <button className="sidebar-settings-btn" onClick={onOpenSettings} title={t.sidebar.settings}>
          ⚙
        </button>
      </div>
    </div>
  )
}
