import React, { useState, useRef, useEffect, useCallback } from 'react'
import { useNotes } from '../../contexts/NotesContext'
import { useTheme } from '../../contexts/ThemeContext'
import { useLang } from '../../i18n'
import type { SortBy, Folder } from '../../types'
import './Sidebar.css'

const FOLDER_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4',
  '#3b82f6', '#8b5cf6', '#ec4899', '#78716c', '#84cc16',
]

interface SidebarProps {
  isOpen: boolean
  onOpenSettings: () => void
}

export default function Sidebar({ isOpen, onOpenSettings }: SidebarProps) {
  const {
    sortedNotes, notes, activeNoteId, setActiveNoteId,
    createNote, deleteNote, deleteNotes, updateNote,
    sortBy, setSortBy, searchQuery, setSearchQuery,
    folders, createFolder, deleteFolder,
  } = useNotes()
  const { theme } = useTheme()
  const { t, lang } = useLang()

  // ---- Local state ----
  const [menuOpen, setMenuOpen] = useState(false)
  const [folderCreateOpen, setFolderCreateOpen] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [newFolderColor, setNewFolderColor] = useState(FOLDER_COLORS[3])
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())
  const [contextNoteId, setContextNoteId] = useState<string | null>(null)
  const [contextPos, setContextPos] = useState({ x: 0, y: 0 })
  const [folderPickerOpen, setFolderPickerOpen] = useState<string | null>(null) // noteId
  const [multiSelect, setMultiSelect] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [batchFolderOpen, setBatchFolderOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const ctxMenuRef = useRef<HTMLDivElement>(null)
  const folderInputRef = useRef<HTMLInputElement>(null)

  // ---- Derived ----
  const folderNotes = useCallback((folderId: string) =>
    notes.filter(n => n.folderIds?.includes(folderId)),
  [notes])
  const ungroupedNotes = sortedNotes.filter(n => !n.folderIds || n.folderIds.length === 0)

  // ---- Close popups on outside click ----
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
      if (ctxMenuRef.current && !ctxMenuRef.current.contains(e.target as Node)) {
        setContextNoteId(null)
        setFolderPickerOpen(null)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    if (folderCreateOpen && folderInputRef.current) folderInputRef.current.focus()
  }, [folderCreateOpen])

  // ---- Sort options ----
  const sortOptions: { value: SortBy; label: string }[] = [
    { value: 'modifiedAt', label: t.sidebar.sortModified },
    { value: 'createdAt', label: t.sidebar.sortCreated },
    { value: 'wordCount', label: t.sidebar.sortWords },
    { value: 'title', label: t.sidebar.sortTitle },
  ]

  const formatDate = (timestamp: number) => {
    const d = new Date(timestamp)
    return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
  }

  // ---- Actions ----
  const toggleFolder = (id: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return
    createFolder(newFolderName.trim(), newFolderColor)
    setNewFolderName('')
    setFolderCreateOpen(false)
  }

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  const handleBatchDelete = () => {
    if (selectedIds.size === 0) return
    const msg = t.sidebar.confirmDeleteNotes.replace('{count}', String(selectedIds.size))
    if (confirm(msg)) {
      deleteNotes([...selectedIds])
      setSelectedIds(new Set())
      setMultiSelect(false)
    }
  }

  const handleBatchAddToFolder = (folderId: string) => {
    for (const id of selectedIds) {
      const note = notes.find(n => n.id === id)
      const current = note?.folderIds || []
      if (!current.includes(folderId)) {
        updateNote(id, { folderIds: [...current, folderId] })
      }
    }
    setSelectedIds(new Set())
    setMultiSelect(false)
    setBatchFolderOpen(false)
  }

  const handleContextDelete = (id: string) => {
    if (confirm(t.sidebar.confirmDelete)) {
      deleteNote(id)
    }
    setContextNoteId(null)
  }

  const handleContextAddFolder = (id: string, folderId: string) => {
    const note = notes.find(n => n.id === id)
    const current = note?.folderIds || []
    if (!current.includes(folderId)) {
      updateNote(id, { folderIds: [...current, folderId] })
    }
    setFolderPickerOpen(null)
    setContextNoteId(null)
  }

  const handleContextRemoveFolder = (id: string, folderId: string) => {
    const note = notes.find(n => n.id === id)
    if (note?.folderIds) {
      updateNote(id, { folderIds: note.folderIds.filter(fid => fid !== folderId) })
    }
    setContextNoteId(null)
  }

  // Get folder color by id
  const folderColor = (folderId: string) => folders.find(f => f.id === folderId)?.color || '#888'

  if (!isOpen) return null

  // ---- Render ----
  return (
    <div className={`sidebar theme-${theme}`}>
      {/* Header */}
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
        <button className="new-folder-btn" title={t.sidebar.newFolder}
          onClick={() => setFolderCreateOpen(!folderCreateOpen)}>
          📁+
        </button>
      </div>

      {/* Folder creation inline */}
      {folderCreateOpen && (
        <div className="folder-create">
          <input
            ref={folderInputRef}
            className="folder-name-input"
            placeholder={t.sidebar.folderNamePlaceholder}
            value={newFolderName}
            onChange={e => setNewFolderName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleCreateFolder(); if (e.key === 'Escape') setFolderCreateOpen(false) }}
          />
          <div className="folder-color-row">
            {FOLDER_COLORS.map(c => (
              <div
                key={c}
                className={`folder-color-dot ${newFolderColor === c ? 'selected' : ''}`}
                style={{ backgroundColor: c }}
                onClick={() => setNewFolderColor(c)}
              />
            ))}
          </div>
          <button className="folder-create-ok" onClick={handleCreateFolder}>✓</button>
        </div>
      )}

      {/* Search */}
      <div className="sidebar-search">
        <input type="text" placeholder={t.sidebar.searchPlaceholder}
          value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="search-input" />
      </div>

      {/* Sort + Multi-select toggle */}
      <div className="sidebar-sort">
        <span className="sort-label">{t.sidebar.sortLabel}</span>
        <select value={sortBy} onChange={e => setSortBy(e.target.value as SortBy)} className="sort-select">
          {sortOptions.map(opt => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
        </select>
        <button
          className={`multi-select-btn ${multiSelect ? 'active' : ''}`}
          onClick={() => { setMultiSelect(!multiSelect); setSelectedIds(new Set()) }}
          title={t.sidebar.multiSelect}
        >
          ☐
        </button>
      </div>

      {/* Multi-select actions */}
      {multiSelect && selectedIds.size > 0 && (
        <div className="multi-select-bar">
          <span className="multi-select-count">{selectedIds.size} selected</span>
          <button className="multi-select-action delete" onClick={handleBatchDelete}>{t.sidebar.batchDelete}</button>
          <div className="batch-folder-wrapper">
            <button className="multi-select-action add-folder" onClick={() => setBatchFolderOpen(!batchFolderOpen)}>
              📁 {t.sidebar.addToFolder}
            </button>
            {batchFolderOpen && (
              <div className="batch-folder-dropdown">
                {folders.map(f => (
                  <div key={f.id} className="folder-picker-item"
                    onClick={() => handleBatchAddToFolder(f.id)}>
                    <span className="folder-dot" style={{ backgroundColor: f.color }} />
                    <span>{f.name}</span>
                  </div>
                ))}
                {folders.length === 0 && <div className="folder-picker-empty">{t.sidebar.noFolders}</div>}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ---- Folder sections ---- */}
      <div className="sidebar-list">
        {folders.map(folder => {
          const expanded = expandedFolders.has(folder.id)
          const folderNoteList = folderNotes(folder.id).filter(n => {
            if (!searchQuery) return true
            const q = searchQuery.toLowerCase()
            return n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q)
          })

          return (
            <div key={folder.id} className="folder-section">
              <div
                className="folder-header"
                onClick={() => toggleFolder(folder.id)}
                onContextMenu={e => {
                  e.preventDefault()
                  if (confirm(`Delete folder "${folder.name}"? Notes will not be deleted.`)) {
                    deleteFolder(folder.id)
                  }
                }}
              >
                <span className="folder-arrow">{expanded ? '▾' : '▸'}</span>
                <span className="folder-dot" style={{ backgroundColor: folder.color }} />
                <span className="folder-name">{folder.name}</span>
                <span className="folder-count">{folderNoteList.length}</span>
              </div>
              {expanded && (
                <div className="folder-notes">
                  {folderNoteList.map(note => renderNoteItem(note))}
                  {folderNoteList.length === 0 && (
                    <div className="folder-empty">—</div>
                  )}
                </div>
              )}
            </div>
          )
        })}

        {/* Divider between folders and ungrouped notes */}
        {folders.length > 0 && ungroupedNotes.length > 0 && (
          <div className="sidebar-divider" />
        )}

        {/* Ungrouped notes */}
        {ungroupedNotes.map(note => renderNoteItem(note))}

        {sortedNotes.length === 0 && (
          <div className="no-notes">{t.sidebar.noNotes}</div>
        )}
      </div>

      {/* Settings footer */}
      <div className="sidebar-footer">
        <button className="sidebar-settings-btn" onClick={onOpenSettings} title={t.sidebar.settings}>⚙</button>
      </div>

      {/* Context menu popup */}
      {contextNoteId && (
        <div
          ref={ctxMenuRef}
          className="context-menu"
          style={{ top: contextPos.y, left: contextPos.x }}
        >
          {folderPickerOpen === contextNoteId ? (
            <div className="folder-picker">
              <div className="folder-picker-title">{t.sidebar.selectFolder}</div>
              {folders.map(f => {
                const noteInFolder = notes.find(n => n.id === contextNoteId)?.folderIds?.includes(f.id)
                return (
                  <div
                    key={f.id}
                    className="folder-picker-item"
                    onClick={() => handleContextAddFolder(contextNoteId, f.id)}
                  >
                    <span className="folder-dot" style={{ backgroundColor: f.color }} />
                    <span>{f.name}</span>
                    {noteInFolder && <span className="folder-check">✓</span>}
                  </div>
                )
              })}
              {folders.length === 0 && <div className="folder-picker-empty">{t.sidebar.noFolders}</div>}
            </div>
          ) : (
            <>
              <button className="context-menu-item" onClick={() => handleContextDelete(contextNoteId)}>
                🗑 {t.sidebar.deleteNote}
              </button>
              <button className="context-menu-item" onClick={() => setFolderPickerOpen(contextNoteId)}>
                📁 {t.sidebar.addToFolder}
              </button>
              {notes.find(n => n.id === contextNoteId)?.folderIds?.map(fid => (
                <button key={fid} className="context-menu-item"
                  onClick={() => handleContextRemoveFolder(contextNoteId, fid)}>
                  ✕ {t.sidebar.removeFromFolder}: {folders.find(f => f.id === fid)?.name || fid}
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  )

  // Helper: render a note item (used in both folder and ungrouped lists)
  function renderNoteItem(note: typeof sortedNotes[0]) {
    const isActive = note.id === activeNoteId
    const isSelected = selectedIds.has(note.id)

    return (
      <div
        key={note.id}
        className={`note-item ${isActive ? 'active' : ''} ${multiSelect ? 'multi' : ''}`}
        onClick={() => {
          if (multiSelect) { toggleSelect(note.id); return }
          setActiveNoteId(note.id)
        }}
        onContextMenu={e => {
          e.preventDefault()
          if (multiSelect) return
          setContextNoteId(note.id)
          setContextPos({ x: e.clientX - 120, y: e.clientY + 5 })
        }}
      >
        {multiSelect && (
          <span className={`note-checkbox ${isSelected ? 'checked' : ''}`}
            onClick={e => { e.stopPropagation(); toggleSelect(note.id) }}>
            {isSelected ? '☑' : '☐'}
          </span>
        )}
        <div className="note-item-header">
          <span className="note-item-title">{note.title || t.sidebar.untitled}</span>
          {note.folderIds && note.folderIds.length > 0 && (
            <span className="note-folder-tags">
              {note.folderIds.map(fid => (
                <span key={fid} className="note-folder-tag"
                  style={{ backgroundColor: folderColor(fid) }} />
              ))}
            </span>
          )}
        </div>
        <div className="note-item-meta">
          <span>{formatDate(note.modifiedAt)}</span>
          <span>{note.wordCount}{lang === 'zh' ? '字' : 'w'}</span>
        </div>
        {!multiSelect && (
          <button
            className="note-item-menu"
            onClick={e => {
              e.stopPropagation()
              setContextNoteId(note.id)
              setContextPos({ x: e.clientX - 120, y: e.clientY + 5 })
            }}
            title="..."
          >...</button>
        )}
      </div>
    )
  }
}
