import React, { useState, useCallback, useRef, useEffect } from 'react'
import { useNotes } from '../../contexts/NotesContext'
import { useTheme } from '../../contexts/ThemeContext'
import { renderMarkdown, extractTodoStats, toggleTodoInText } from '../../utils/markdown'
import Toolbar from '../Toolbar/Toolbar'
import WeatherBar from '../WeatherBar/WeatherBar'
import './Editor.css'

export default function Editor() {
  const { notes, activeNoteId, updateNote } = useNotes()
  const { theme } = useTheme()
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
        newText = text.substring(0, start) + `**${selected || '粗体文字'}**` + text.substring(end)
        cursorOffset = selected ? 0 : -2
        break
      case 'italic':
        newText = text.substring(0, start) + `*${selected || '斜体文字'}*` + text.substring(end)
        cursorOffset = selected ? 0 : -1
        break
      case 'heading':
        newText = text.substring(0, start) + `\n## ${selected || '标题'}\n` + text.substring(end)
        cursorOffset = 0
        break
      case 'list':
        newText = text.substring(0, start) + `\n- ${selected || '列表项'}\n` + text.substring(end)
        cursorOffset = 0
        break
      case 'todo':
        newText = text.substring(0, start) + `\n- [ ] ${selected || '待办事项'}\n` + text.substring(end)
        cursorOffset = 0
        break
      case 'quote':
        newText = text.substring(0, start) + `\n> ${selected || '引用文字'}\n` + text.substring(end)
        cursorOffset = 0
        break
      case 'code':
        newText = text.substring(0, start) + `\`${selected || '代码'}\`` + text.substring(end)
        cursorOffset = selected ? 0 : -1
        break
      case 'link':
        newText = text.substring(0, start) + `[${selected || '链接文字'}](url)` + text.substring(end)
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
          <p>选择一个便签或创建新的便签</p>
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
            placeholder="开始写作... 支持 Markdown 格式"
            style={{
              fontSize: `${fontSettings.fontSize}px`,
              fontWeight: fontSettings.fontWeight,
              color: fontSettings.fontColor,
            }}
            spellCheck={false}
          />
        )}
      </div>

      <WeatherBar />
    </div>
  )
}
