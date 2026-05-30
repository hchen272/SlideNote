import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import type { Note, SortBy, Folder } from '../types'
import zh from '../i18n/zh'
import en from '../i18n/en'

interface NotesContextType {
  notes: Note[]
  activeNoteId: string | null
  setActiveNoteId: (id: string | null) => void
  createNote: (contentType?: 'markdown' | 'slate') => Promise<Note>
  updateNote: (id: string, updates: Partial<Note>) => void
  deleteNote: (id: string) => void
  deleteNotes: (ids: string[]) => void
  sortBy: SortBy
  setSortBy: (sort: SortBy) => void
  searchQuery: string
  setSearchQuery: (query: string) => void
  sortedNotes: Note[]
  // Folders
  folders: Folder[]
  createFolder: (name: string, color: string) => Promise<Folder>
  updateFolder: (id: string, updates: Partial<Folder>) => void
  deleteFolder: (id: string) => void
}

const NotesContext = createContext<NotesContextType>({
  notes: [],
  activeNoteId: null,
  setActiveNoteId: () => {},
  createNote: async () => ({ id: '', title: '', content: '', slateContent: [], contentType: 'markdown' as const, createdAt: 0, modifiedAt: 0, wordCount: 0, fontSettings: { fontSize: 14, fontWeight: 'normal' as const, fontColor: '#ffffff' } }),
  updateNote: () => {},
  deleteNote: () => {},
  deleteNotes: () => {},
  sortBy: 'modifiedAt',
  setSortBy: () => {},
  searchQuery: '',
  setSearchQuery: () => {},
  sortedNotes: [],
  folders: [],
  createFolder: async () => ({ id: '', name: '', color: '', createdAt: 0 }),
  updateFolder: () => {},
  deleteFolder: () => {},
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
  const [folders, setFolders] = useState<Folder[]>([])

  // Save folders to disk
  const saveFoldersToDisk = useCallback(async (f: Folder[]) => {
    if (window.electronAPI) {
      await window.electronAPI.saveFolders(f)
    }
  }, [])

  // Load notes on mount
  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.getNotes().then((saved: Note[]) => {
        if (saved && saved.length > 0) {
          // Migrate old notes missing new fields
          const migrated = saved.map(n => ({
            ...n,
            slateContent: n.slateContent || [{ type: 'paragraph' as const, children: [{ text: '' }] }],
            contentType: n.contentType || 'markdown',
          }))
          setNotes(migrated)
          setActiveNoteId(migrated[0].id)
        } else {
          // Create both language welcome notes
          window.electronAPI?.getStore('language').then((lang: string) => {
            const makeNote = (title: string, content: string): Note => ({
              id: generateId(),
              title,
              content,
              slateContent: [{ type: 'paragraph' as const, children: [{ text: '' }] }],
              contentType: 'markdown',
              createdAt: Date.now(),
              modifiedAt: Date.now(),
              wordCount: content.length,
              fontSettings: {
                fontSize: 14,
                fontWeight: 'normal',
                fontColor: '#ffffff',
              },
            })

            const zhNote = makeNote(zh.welcome.title, zh.welcome.content)
            const enNote = makeNote(en.welcome.title, en.welcome.content)
            const welcomeNotes = [zhNote, enNote]

            setNotes(welcomeNotes)
            setActiveNoteId(lang === 'en' ? enNote.id : zhNote.id)
            saveNotesToDisk(welcomeNotes)
          })
        }
        setLoaded(true)
        // Load folders in parallel
        window.electronAPI?.getFolders().then((f: Folder[]) => {
          if (f && f.length > 0) setFolders(f)
        })
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
  const createNote = useCallback(async (contentType: 'markdown' | 'slate' = 'markdown'): Promise<Note> => {
    const newNote: Note = {
      id: generateId(),
      title: contentType === 'slate' ? '新建富文本' : '新建便签',
      content: '',
      slateContent: [{ type: 'paragraph' as const, children: [{ text: '' }] }],
      contentType,
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

  // Batch delete notes
  const deleteNotes = useCallback((ids: string[]) => {
    setNotes(prev => {
      const updated = prev.filter(note => !ids.includes(note.id))
      if (activeNoteId && ids.includes(activeNoteId)) {
        setActiveNoteId(updated.length > 0 ? updated[0].id : null)
      }
      saveNotesToDisk(updated)
      return updated
    })
  }, [activeNoteId, saveNotesToDisk])

  // Folder CRUD
  const createFolder = useCallback(async (name: string, color: string): Promise<Folder> => {
    const folder: Folder = { id: generateId(), name, color, createdAt: Date.now() }
    const updated = [...folders, folder]
    setFolders(updated)
    await saveFoldersToDisk(updated)
    return folder
  }, [folders, saveFoldersToDisk])

  const updateFolder = useCallback((id: string, updates: Partial<Folder>) => {
    setFolders(prev => {
      const updated = prev.map(f => f.id === id ? { ...f, ...updates } : f)
      saveFoldersToDisk(updated)
      return updated
    })
  }, [saveFoldersToDisk])

  const deleteFolder = useCallback((id: string) => {
    setFolders(prev => {
      const updated = prev.filter(f => f.id !== id)
      saveFoldersToDisk(updated)
      return updated
    })
    // Remove folderId from all notes that had it
    setNotes(prev => {
      const updated = prev.map(note => {
        if (note.folderIds?.includes(id)) {
          return { ...note, folderIds: note.folderIds.filter(fid => fid !== id) }
        }
        return note
      })
      saveNotesToDisk(updated)
      return updated
    })
  }, [saveNotesToDisk])

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
        case 'title':
          return (a.title || '').localeCompare(b.title || '')
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
    deleteNotes,
    sortBy,
    setSortBy,
    searchQuery,
    setSearchQuery,
    sortedNotes,
    folders,
    createFolder,
    updateFolder,
    deleteFolder,
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
