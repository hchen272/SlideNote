import React from 'react'
import { useNotes } from '../../contexts/NotesContext'
import { useTheme } from '../../contexts/ThemeContext'
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

  const sortOptions: { value: SortBy; label: string }[] = [
    { value: 'modifiedAt', label: '修改时间' },
    { value: 'createdAt', label: '创建时间' },
    { value: 'wordCount', label: '字数' },
  ]

  const formatDate = (timestamp: number) => {
    const d = new Date(timestamp)
    return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
  }

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    if (sortedNotes.length > 1 && confirm('确定删除此便签？')) {
      deleteNote(id)
    } else if (sortedNotes.length <= 1) {
      alert('至少保留一个便签')
    }
  }

  if (!isOpen) return null

  return (
    <div className={`sidebar theme-${theme}`}>
      <div className="sidebar-header">
        <button className="new-note-btn" onClick={createNote}>
          + 新建便签
        </button>
      </div>

      <div className="sidebar-search">
        <input
          type="text"
          placeholder="搜索便签..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />
      </div>

      <div className="sidebar-sort">
        <span className="sort-label">排序：</span>
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
              <span className="note-item-title">{note.title || '无标题'}</span>
              <button
                className="note-item-delete"
                onClick={(e) => handleDelete(e, note.id)}
                title="删除"
              >
                ×
              </button>
            </div>
            <div className="note-item-meta">
              <span>{formatDate(note.modifiedAt)}</span>
              <span>{note.wordCount}字</span>
            </div>
          </div>
        ))}
        {sortedNotes.length === 0 && (
          <div className="no-notes">暂无便签</div>
        )}
      </div>

      <div className="sidebar-footer">
        <button className="sidebar-settings-btn" onClick={onOpenSettings} title="设置">
          ⚙
        </button>
      </div>
    </div>
  )
}
