import React, { useState, useCallback, useRef, useMemo, forwardRef, useImperativeHandle, useEffect } from 'react'
import { Descendant, Editor as SlateEditorType, Transforms } from 'slate'
import { ReactEditor } from 'slate-react'
import katex from 'katex'
import { useNotes } from '../../contexts/NotesContext'
import { useTheme } from '../../contexts/ThemeContext'
import { useLang } from '../../i18n'
import { renderMarkdown, toggleTodoInText } from '../../utils/markdown'
import { slateToMarkdown, markdownToSlate } from '../../utils/slateMdConverter'
import type { HeadingNode } from '../../types'
import Toolbar from '../Toolbar/Toolbar'
import SlateEditorComp, { editorRef as slateEditorRef } from './SlateEditor'
import './Editor.css'

// Module-level scroll cache — survives Editor unmount during dock→undock
const scrollCache = { markdown: 0, preview: 0 }

export interface EditorHandle {
  jumpToHeading: (heading: HeadingNode) => void
}

const Editor = forwardRef<EditorHandle>(function Editor(_props, ref) {
  const { notes, activeNoteId, updateNote } = useNotes()
  const { theme } = useTheme()
  const { t } = useLang()
  const [previewMode, setPreviewMode] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const activeNote = notes.find(n => n.id === activeNoteId)
  const isSlate = activeNote?.contentType === 'slate'

  // Ref to suppress onChange during programmatic jumps (prevents double-update + re-render flicker)
  const isJumpingRef = useRef(false)

  // Slate fires onChange with initialValue on mount; suppress this
  // first call to prevent overwriting persisted content (e.g. after dock→undock)
  const isSlateInitRef = useRef(true)

  // ---- Scroll: track continuously, restore on mount after dock→undock ----
  const onEditorScroll = useCallback(() => {
    const ta = textareaRef.current
    if (ta) { scrollCache.markdown = ta.scrollTop; return }
    const pv = document.querySelector('.markdown-preview') as HTMLElement | null
    if (pv) { scrollCache.preview = pv.scrollTop; return }
  }, [])

  useEffect(() => {
    const restore = () => {
      const ta = textareaRef.current
      if (ta && scrollCache.markdown) { ta.scrollTop = scrollCache.markdown; return }
      const pv = document.querySelector('.markdown-preview') as HTMLElement | null
      if (pv && scrollCache.preview) { pv.scrollTop = scrollCache.preview; return }
    }
    requestAnimationFrame(() => requestAnimationFrame(restore))
  }, [activeNoteId])

  const handleContentChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!activeNoteId) return
    updateNote(activeNoteId, { content: e.target.value })
  }, [activeNoteId, updateNote])

  const handleSlateChange = useCallback((value: Descendant[]) => {
    if (!activeNoteId) return
    // Suppress onChange triggered by programmatic jump (focus+select fire onChange internally)
    if (isJumpingRef.current) return
    // Suppress initial mount onChange (Slate fires this with initialValue)
    if (isSlateInitRef.current) { isSlateInitRef.current = false; return }
    updateNote(activeNoteId, { slateContent: value })
  }, [activeNoteId, updateNote])

  const handleTodoClick = useCallback((lineIndex: number) => {
    if (!activeNoteId || !activeNote) return
    const newContent = toggleTodoInText(activeNote.content, lineIndex)
    updateNote(activeNoteId, { content: newContent })
  }, [activeNoteId, activeNote, updateNote])

  // Toggle TODO in edit mode when clicking the checkbox marker area of a todo line
  const handleTextareaTodoClick = useCallback((e: React.MouseEvent<HTMLTextAreaElement>) => {
    if (!activeNoteId || !activeNote) return
    const textarea = e.currentTarget
    const pos = textarea.selectionStart
    const content = activeNote.content || ''
    const lines = content.split('\n')

    // Find the line where the cursor landed
    let charCount = 0
    let clickedLine = -1
    for (let i = 0; i < lines.length; i++) {
      charCount += lines[i].length + 1
      if (pos < charCount) { clickedLine = i; break }
    }
    if (clickedLine < 0) return

    // Column within the clicked line
    let col = pos
    for (let i = 0; i < clickedLine; i++) col -= lines[i].length + 1

    const rawLine = lines[clickedLine]
    // Locate checkbox marker `- [ ]` / `* [x]` in the line (may be indented)
    const marker = rawLine.match(/[-*]\s*\[[ xX]\]/)
    if (!marker || marker.index === undefined) return

    // Only toggle if click is within the marker area
    const mStart = marker.index
    const mEnd = mStart + marker[0].length
    if (col < mStart || col > mEnd) return

    // Count todo items before this line
    let todoIndex = 0
    for (let i = 0; i < clickedLine; i++) {
      const t = lines[i].trim()
      if (t.startsWith('- [') || t.startsWith('* [')) todoIndex++
    }

    const newContent = toggleTodoInText(content, todoIndex)
    updateNote(activeNoteId, { content: newContent })

    // Restore cursor after React re-renders the textarea
    setTimeout(() => {
      textareaRef.current?.focus()
      textareaRef.current?.setSelectionRange(pos, pos)
    }, 0)
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

  // Expose jumpToHeading for the outline panel
  useImperativeHandle(ref, () => ({
    jumpToHeading: (heading: HeadingNode) => {
      if (!activeNote) return

      if (isSlate) {
        // Slate: scroll to node by path
        const ed = slateEditorRef.current as any
        if (!ed || !heading.slatePath) return
        try {
          // Validate path still exists (content may have changed since headings were extracted)
          if (!SlateEditorType.hasPath(ed, heading.slatePath)) return

          const [node] = SlateEditorType.node(ed, heading.slatePath)
          const domNode = ReactEditor.toDOMNode(ed, node)
          if (domNode) {
            domNode.scrollIntoView({ behavior: 'smooth', block: 'start' })
          }

          // Get a valid text-level point (Slate selection must target leaf text nodes, not block elements)
          const startPoint = SlateEditorType.start(ed, heading.slatePath)

          // Suppress onChange during programmatic focus+select to prevent
          // unnecessary re-renders that can cause toolbar flicker/disappearance
          isJumpingRef.current = true
          try {
            ReactEditor.focus(ed as any)
            Transforms.select(ed as SlateEditorType, {
              anchor: startPoint,
              focus: startPoint,
            })
          } finally {
            // Reset flag asynchronously so it covers any microtask-scheduled onChange
            setTimeout(() => { isJumpingRef.current = false }, 0)
          }
        } catch { /* ignore selection errors */ }
      } else {
        // Markdown: jump to line in textarea or scroll preview
        if (heading.lineIndex === undefined) return

        if (previewMode) {
          // Find the heading element in the preview DOM
          const previewDiv = document.querySelector('.markdown-preview')
          if (!previewDiv) return
          const headings = previewDiv.querySelectorAll('h1, h2, h3, h4, h5')
          // Count headings up to our lineIndex to find the right one
          const lines = (activeNote.content || '').split('\n')
          let headingCount = 0
          let targetIdx = -1
          for (let i = 0; i <= heading.lineIndex; i++) {
            if (/^#{1,5}\s+/.test(lines[i])) {
              if (i === heading.lineIndex) {
                targetIdx = headingCount
                break
              }
              headingCount++
            }
          }
          if (targetIdx >= 0 && targetIdx < headings.length) {
            headings[targetIdx].scrollIntoView({ behavior: 'smooth', block: 'start' })
          }
        } else {
          // Edit mode: place cursor at heading line in textarea
          const textarea = textareaRef.current
          if (!textarea) return

          const lines = (activeNote.content || '').split('\n')
          let charPos = 0
          for (let i = 0; i < heading.lineIndex; i++) {
            charPos += lines[i].length + 1 // +1 for newline
          }
          // Place cursor at start of heading text (after # markers)
          const headingLine = lines[heading.lineIndex] || ''
          const textStart = headingLine.match(/^#{1,5}\s+/)
          const offset = textStart ? textStart[0].length : 0

          textarea.focus()
          textarea.setSelectionRange(charPos + offset, charPos + offset)
          // Scroll the textarea to the right position
          const lineHeight = parseInt(getComputedStyle(textarea).lineHeight) || 24
          textarea.scrollTop = heading.lineIndex * lineHeight - 60
        }
      }
    }
  }), [activeNote, isSlate, previewMode, ref])

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
              onScroll={onEditorScroll}
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
              onMouseUp={handleTextareaTodoClick}
              onScroll={onEditorScroll}
              style={{ fontSize: `${fontSettings.fontSize}px`, fontWeight: fontSettings.fontWeight, color: fontSettings.fontColor }}
              spellCheck={false}
            />
          )}
        </div>
      )}
    </div>
  )
})

export default Editor
