import React, { useState, useCallback, useRef, useEffect } from 'react'
import { useNotes } from '../../contexts/NotesContext'
import { useTheme } from '../../contexts/ThemeContext'
import { useLang } from '../../i18n'
import { renderMarkdown, extractTodoStats, toggleTodoInText } from '../../utils/markdown'
import Toolbar from '../Toolbar/Toolbar'
import './Editor.css'

export default function Editor() {
  const { notes, activeNoteId, updateNote } = useNotes()
  const { theme } = useTheme()
  const { t } = useLang()
  const [previewMode, setPreviewMode] = useState(false)
  const [todoStats, setTodoStats] = useState({ total: 0, completed: 0 })
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const activeNote = notes.find(n => n.id === activeNoteId)

  useEffect(() => {
    if (activeNote) {
      setTodoStats(extractTodoStats(activeNote.content))
    } else {
      setTodoStats({ total: 0, completed: 0 })
    }
  }, [activeNote?.content])

  const handleContentChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!activeNoteId) return
    updateNote(activeNoteId, { content: e.target.value })
  }, [activeNoteId, updateNote])

  const handleTodoClick = useCallback((lineIndex: number) => {
    if (!activeNoteId || !activeNote) return
    const newContent = toggleTodoInText(activeNote.content, lineIndex)
    updateNote(activeNoteId, { content: newContent })
  }, [activeNoteId, activeNote, updateNote])

  const handleFontChange = useCallback((settings: { fontSize?: number; fontWeight?: 'normal' | 'bold'; fontColor?: string }) => {
    if (!activeNoteId) return
    const currentSettings = activeNote?.fontSettings || { fontSize: 14, fontWeight: 'normal' as const, fontColor: '#ffffff' }
    updateNote(activeNoteId, {
      fontSettings: { ...currentSettings, ...settings }
    })
  }, [activeNoteId, activeNote, updateNote])

  const insertMarkdown = useCallback((syntax: string) => {
    if (!activeNoteId || !textareaRef.current) return
    const textarea = textareaRef.current
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const text = activeNote?.content || ''
    const selected = text.substring(start, end)

    let newText: string
    let cursorOffset: number

    switch (syntax) {
      case 'bold':
        newText = text.substring(0, start) + `**${selected || t.insert.boldText}**` + text.substring(end)
        cursorOffset = selected ? 0 : -2
        break
      case 'italic':
        newText = text.substring(0, start) + `*${selected || t.insert.italicText}*` + text.substring(end)
        cursorOffset = selected ? 0 : -1
        break
      case 'heading':
        newText = text.substring(0, start) + `\n## ${selected || t.insert.headingText}\n` + text.substring(end)
        cursorOffset = 0
        break
      case 'list':
        newText = text.substring(0, start) + `\n- ${selected || t.insert.listItem}\n` + text.substring(end)
        cursorOffset = 0
        break
      case 'todo':
        newText = text.substring(0, start) + `\n- [ ] ${selected || t.insert.todoItem}\n` + text.substring(end)
        cursorOffset = 0
        break
      case 'quote':
        newText = text.substring(0, start) + `\n> ${selected || t.insert.quoteText}\n` + text.substring(end)
        cursorOffset = 0
        break
      case 'code':
        newText = text.substring(0, start) + `\`${selected || t.insert.codeText}\`` + text.substring(end)
        cursorOffset = selected ? 0 : -1
        break
      case 'link':
        newText = text.substring(0, start) + `[${selected || t.insert.linkText}](url)` + text.substring(end)
        cursorOffset = selected ? -4 : -4
        break
      default:
        return
    }

    updateNote(activeNoteId, { content: newText })
    setTimeout(() => {
      textarea.focus()
      const newPos = start + (selected ? selected.length + syntax.length + 2 : syntax.length + 2)
      textarea.setSelectionRange(newPos + (cursorOffset || 0), newPos + (cursorOffset || 0))
    }, 0)
  }, [activeNoteId, activeNote, updateNote])

  if (!activeNote) {
    return (
      <div className={`editor theme-${theme}`}>
        <div className="editor-empty">
          <p>{t.editor.empty}</p>
        </div>
      </div>
    )
  }

  const fontSettings = activeNote.fontSettings || { fontSize: 14, fontWeight: 'normal' as const, fontColor: '#ffffff' }

  return (
    <div className={`editor theme-${theme}`}>
      <Toolbar
        previewMode={previewMode}
        onTogglePreview={() => setPreviewMode(!previewMode)}
        onInsertMarkdown={insertMarkdown}
        fontSettings={fontSettings}
        onFontChange={handleFontChange}
      />

      <div className="editor-content">
        {previewMode ? (
          <div
            className="markdown-preview"
            style={{
              fontSize: `${fontSettings.fontSize}px`,
              fontWeight: fontSettings.fontWeight,
              color: fontSettings.fontColor,
            }}
            dangerouslySetInnerHTML={{ __html: renderMarkdown(activeNote.content) }}
            onClick={(e) => {
              const target = e.target as HTMLElement
              if (target.tagName === 'INPUT' && target.classList.contains('md-checkbox')) {
                const allCheckboxes = document.querySelectorAll('.md-checkbox')
                const index = Array.from(allCheckboxes).indexOf(target as HTMLInputElement)
                if (index >= 0) {
                  handleTodoClick(index)
                }
              }
            }}
          />
        ) : (
          <textarea
            ref={textareaRef}
            className="editor-textarea"
            value={activeNote.content}
            onChange={handleContentChange}
            placeholder={t.editor.placeholder}
            style={{
              fontSize: `${fontSettings.fontSize}px`,
              fontWeight: fontSettings.fontWeight,
              color: fontSettings.fontColor,
            }}
            spellCheck={false}
          />
        )}
      </div>
    </div>
  )
}
