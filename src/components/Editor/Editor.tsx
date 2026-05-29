import React, { useState, useCallback, useRef, useMemo } from 'react'
import { Descendant } from 'slate'
import katex from 'katex'
import { useNotes } from '../../contexts/NotesContext'
import { useTheme } from '../../contexts/ThemeContext'
import { useLang } from '../../i18n'
import { renderMarkdown, toggleTodoInText } from '../../utils/markdown'
import { slateToMarkdown, markdownToSlate } from '../../utils/slateMdConverter'
import Toolbar from '../Toolbar/Toolbar'
import SlateEditorComp from './SlateEditor'
import './Editor.css'

export default function Editor() {
  const { notes, activeNoteId, updateNote } = useNotes()
  const { theme } = useTheme()
  const { t } = useLang()
  const [previewMode, setPreviewMode] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const activeNote = notes.find(n => n.id === activeNoteId)
  const isSlate = activeNote?.contentType === 'slate'

  const handleContentChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!activeNoteId) return
    updateNote(activeNoteId, { content: e.target.value })
  }, [activeNoteId, updateNote])

  const handleSlateChange = useCallback((value: Descendant[]) => {
    if (!activeNoteId) return
    updateNote(activeNoteId, { slateContent: value })
  }, [activeNoteId, updateNote])

  const handleTodoClick = useCallback((lineIndex: number) => {
    if (!activeNoteId || !activeNote) return
    const newContent = toggleTodoInText(activeNote.content, lineIndex)
    updateNote(activeNoteId, { content: newContent })
  }, [activeNoteId, activeNote, updateNote])

  const handleFontChange = useCallback((settings: { fontSize?: number; fontWeight?: 'normal' | 'bold'; fontColor?: string }) => {
    if (!activeNoteId || !activeNote) return
    const currentSettings = activeNote.fontSettings || { fontSize: 14, fontWeight: 'normal' as const, fontColor: '#ffffff' }
    updateNote(activeNoteId, { fontSettings: { ...currentSettings, ...settings } })
  }, [activeNoteId, activeNote, updateNote])

  const handleConvert = useCallback(() => {
    if (!activeNoteId || !activeNote) return
    if (isSlate) {
      // Slate → Markdown
      const md = slateToMarkdown(activeNote.slateContent || [])
      updateNote(activeNoteId, { content: md, contentType: 'markdown' })
    } else {
      // Markdown → Slate
      const nodes = markdownToSlate(activeNote.content)
      updateNote(activeNoteId, { slateContent: nodes, contentType: 'slate' })
    }
  }, [activeNoteId, activeNote, isSlate, updateNote])

  const insertMarkdown = useCallback((syntax: string) => {
    if (!activeNoteId || !textareaRef.current) return
    const textarea = textareaRef.current
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const text = activeNote?.content || ''
    const selected = text.substring(start, end)
    let newText: string; let cursorOffset: number
    switch (syntax) {
      case 'bold': newText = text.substring(0, start) + `**${selected || t.insert.boldText}**` + text.substring(end); cursorOffset = selected ? 0 : -2; break
      case 'italic': newText = text.substring(0, start) + `*${selected || t.insert.italicText}*` + text.substring(end); cursorOffset = selected ? 0 : -1; break
      case 'heading': newText = text.substring(0, start) + `\n## ${selected || t.insert.headingText}\n` + text.substring(end); cursorOffset = 0; break
      case 'list': newText = text.substring(0, start) + `\n- ${selected || t.insert.listItem}\n` + text.substring(end); cursorOffset = 0; break
      case 'todo': newText = text.substring(0, start) + `\n- [ ] ${selected || t.insert.todoItem}\n` + text.substring(end); cursorOffset = 0; break
      case 'quote': newText = text.substring(0, start) + `\n> ${selected || t.insert.quoteText}\n` + text.substring(end); cursorOffset = 0; break
      case 'code': newText = text.substring(0, start) + `\`${selected || t.insert.codeText}\`` + text.substring(end); cursorOffset = selected ? 0 : -1; break
      case 'link': newText = text.substring(0, start) + `[${selected || t.insert.linkText}](url)` + text.substring(end); cursorOffset = -4; break
      default: return
    }
    updateNote(activeNoteId, { content: newText })
    setTimeout(() => { textarea.focus(); const np = start + (selected ? selected.length + syntax.length + 2 : syntax.length + 2); textarea.setSelectionRange(np + (cursorOffset || 0), np + (cursorOffset || 0)) }, 0)
  }, [activeNoteId, activeNote, updateNote, t])

  // Render markdown with KaTeX formulas (must be before early return — hook rules)
  const renderedHtml = useMemo(() => {
    const content = activeNote?.content || ''
    let html = renderMarkdown(content)
    html = html.replace(/\$\$([^$]+)\$\$/g, (_, f) => {
      try { return katex.renderToString(f.trim(), { displayMode: true, throwOnError: false }) }
      catch { return `<code>$${f}$</code>` }
    })
    html = html.replace(/\$([^$]+)\$/g, (_, f) => {
      try { return katex.renderToString(f.trim(), { displayMode: false, throwOnError: false }) }
      catch { return `<code>$${f}$</code>` }
    })
    return html
  }, [activeNote?.content])

  if (!activeNote) {
    return <div className={`editor theme-${theme}`}><div className="editor-empty"><p>{t.editor.empty}</p></div></div>
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
        isSlate={isSlate}
        onConvert={handleConvert}
      />

      {isSlate ? (
        <SlateEditorComp
          value={activeNote.slateContent || [{ type: 'paragraph', children: [{ text: '' }] }]}
          onChange={handleSlateChange}
          fontSettings={fontSettings}
        />
      ) : (
        <div className="editor-content">
          {previewMode ? (
            <div className="markdown-preview"
              style={{ fontSize: `${fontSettings.fontSize}px`, fontWeight: fontSettings.fontWeight, color: fontSettings.fontColor }}
              dangerouslySetInnerHTML={{ __html: renderedHtml }}
              onClick={(e) => {
                const tgt = e.target as HTMLElement
                // Ctrl+Click on a link → open in browser
                if ((e.ctrlKey || e.metaKey) && tgt.tagName === 'A') {
                  e.preventDefault()
                  window.electronAPI?.openUrl((tgt as HTMLAnchorElement).href)
                  return
                }
                if (tgt.tagName === 'INPUT' && tgt.classList.contains('md-checkbox')) {
                  const idx = Array.from(document.querySelectorAll('.md-checkbox')).indexOf(tgt as HTMLInputElement)
                  if (idx >= 0) handleTodoClick(idx)
                }
              }}
            />
          ) : (
            <textarea ref={textareaRef} className="editor-textarea" value={activeNote.content}
              onChange={handleContentChange} placeholder={t.editor.placeholder}
              style={{ fontSize: `${fontSettings.fontSize}px`, fontWeight: fontSettings.fontWeight, color: fontSettings.fontColor }}
              spellCheck={false}
            />
          )}
        </div>
      )}
    </div>
  )
}
