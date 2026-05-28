import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import type { Note, SortBy } from '../types'

interface NotesContextType {
  notes: Note[]
  activeNoteId: string | null
  setActiveNoteId: (id: string | null) => void
  createNote: () => Promise<Note>
  updateNote: (id: string, updates: Partial<Note>) => void
  deleteNote: (id: string) => void
  sortBy: SortBy
  setSortBy: (sort: SortBy) => void
  searchQuery: string
  setSearchQuery: (query: string) => void
  sortedNotes: Note[]
}

const NotesContext = createContext<NotesContextType>({
  notes: [],
  activeNoteId: null,
  setActiveNoteId: () => {},
  createNote: async () => ({ id: '', title: '', content: '', createdAt: 0, modifiedAt: 0, wordCount: 0, fontSettings: { fontSize: 14, fontWeight: 'normal', fontColor: '#ffffff' } }),
  updateNote: () => {},
  deleteNote: () => {},
  sortBy: 'modifiedAt',
  setSortBy: () => {},
  searchQuery: '',
  setSearchQuery: () => {},
  sortedNotes: [],
})

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9)
}

export function NotesProvider({ children }: { children: React.ReactNode }) {
  const [notes, setNotes] = useState<Note[]>([])
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<SortBy>('modifiedAt')
  const [searchQuery, setSearchQuery] = useState('')
  const [loaded, setLoaded] = useState(false)

  // Load notes on mount
  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.getNotes().then((saved: Note[]) => {
        if (saved && saved.length > 0) {
          setNotes(saved)
          setActiveNoteId(saved[0].id)
        } else {
          // Create a default welcome note
          const defaultNote: Note = {
            id: generateId(),
            title: '欢迎使用便签',
            content: `# 欢迎使用 Sticky Notes! 🎉

## 功能特点

- **Markdown** 渲染支持
- 可以勾选的 TODO 列表
- 多种主题可选
- 天气信息显示

## TODO 示例

- [x] 完成项目初始化
- [ ] 学习 Markdown 语法
- [ ] 尝试切换主题

> 这是一条引用文字

祝你使用愉快！`,
            createdAt: Date.now(),
            modifiedAt: Date.now(),
            wordCount: 0,
            fontSettings: {
              fontSize: 14,
              fontWeight: 'normal',
              fontColor: '#ffffff',
            },
          }
          defaultNote.wordCount = defaultNote.content.length
          setNotes([defaultNote])
          setActiveNoteId(defaultNote.id)
          saveNotesToDisk([defaultNote])
        }
        setLoaded(true)
      })
    }
  }, [])

  // Save notes to disk
  const saveNotesToDisk = useCallback(async (notesToSave: Note[]) => {
    if (window.electronAPI) {
      await window.electronAPI.saveNotes(notesToSave)
    }
  }, [])

  // Create a new note
  const createNote = useCallback(async (): Promise<Note> => {
    const newNote: Note = {
      id: generateId(),
      title: '新建便签',
      content: '',
      createdAt: Date.now(),
      modifiedAt: Date.now(),
      wordCount: 0,
      fontSettings: {
        fontSize: 14,
        fontWeight: 'normal',
        fontColor: '#ffffff',
      },
    }
    const updated = [newNote, ...notes]
    setNotes(updated)
    setActiveNoteId(newNote.id)
    await saveNotesToDisk(updated)
    return newNote
  }, [notes, saveNotesToDisk])

  // Update a note
  const updateNote = useCallback((id: string, updates: Partial<Note>) => {
    setNotes(prev => {
      const updated = prev.map(note => {
        if (note.id === id) {
          const newNote = {
            ...note,
            ...updates,
            modifiedAt: Date.now(),
            wordCount: updates.content !== undefined ? updates.content.length : note.wordCount,
          }
          // Auto-update title from first line if content changed
          if (updates.content !== undefined) {
            const firstLine = updates.content.split('\n')[0].replace(/^#+\s*/, '').trim()
            if (firstLine && firstLine.length > 0 && firstLine.length <= 50) {
              newNote.title = firstLine
            }
          }
          return newNote
        }
        return note
      })
      saveNotesToDisk(updated)
      return updated
    })
  }, [saveNotesToDisk])

  // Delete a note
  const deleteNote = useCallback((id: string) => {
    setNotes(prev => {
      const updated = prev.filter(note => note.id !== id)
      if (activeNoteId === id) {
        setActiveNoteId(updated.length > 0 ? updated[0].id : null)
      }
      saveNotesToDisk(updated)
      return updated
    })
  }, [activeNoteId, saveNotesToDisk])

  // Sort and filter notes
  const sortedNotes = [...notes]
    .filter(note => {
      if (!searchQuery) return true
      const q = searchQuery.toLowerCase()
      return note.title.toLowerCase().includes(q) || note.content.toLowerCase().includes(q)
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'createdAt':
          return b.createdAt - a.createdAt
        case 'modifiedAt':
          return b.modifiedAt - a.modifiedAt
        case 'wordCount':
          return b.wordCount - a.wordCount
        default:
          return b.modifiedAt - a.modifiedAt
      }
    })

  const value: NotesContextType = {
    notes,
    activeNoteId,
    setActiveNoteId,
    createNote,
    updateNote,
    deleteNote,
    sortBy,
    setSortBy,
    searchQuery,
    setSearchQuery,
    sortedNotes,
  }

  return (
    <NotesContext.Provider value={value}>
      {children}
    </NotesContext.Provider>
  )
}

export function useNotes() {
  return useContext(NotesContext)
}
