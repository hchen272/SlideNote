import React, { useState, useRef, useEffect } from 'react'
import { useSlate } from 'slate-react'
import { Editor, Transforms, Element as SlateElement } from 'slate'
import { ReactEditor } from 'slate-react'
import { useLang } from '../../i18n'
import { editorRef, LIST_TYPES, linkPop, onLinkPop, showLinkPop, hideLinkPop, formPop, onFormPop, showFormPop, hideFormPop } from './SlateEditor'

const HEADINGS = [
  { level: 1, label: 'H1' },
  { level: 2, label: 'H2' },
  { level: 3, label: 'H3' },
  { level: 4, label: 'H4' },
  { level: 5, label: 'H5' },
]

function applyLink(ed: Editor) {
  if (!linkPop.url.trim()) return
  ReactEditor.focus(ed)
  if (linkPop.isEdit && linkPop.element) {
    try {
      const path = ReactEditor.findPath(ed, linkPop.element)
      Transforms.select(ed, path)
      Transforms.setNodes(ed, { url: linkPop.url.trim() } as any, { at: path })
    } catch { /* ignore */ }
  } else {
    if (linkPop.savedSelection) {
      Transforms.select(ed, linkPop.savedSelection)
    }
    Transforms.wrapNodes(ed, { type: 'link', url: linkPop.url.trim() } as any, { split: true })
  }
}

function insertFormula(ed: Editor) {
  if (!formPop.formula.trim()) return
  ReactEditor.focus(ed)
  if (formPop.element) {
    try {
      const path = ReactEditor.findPath(ed, formPop.element)
      Transforms.select(ed, path)
      Transforms.setNodes(ed, { formula: formPop.formula.trim() } as any, { at: path })
    } catch { /* ignore */ }
  } else {
    Transforms.insertNodes(ed, { type: 'inline-formula', formula: formPop.formula.trim(), children: [{ text: '' }] } as any)
  }
}

function isMarkActive(editor: Editor, format: string) {
  const marks = Editor.marks(editor) as any
  return marks ? marks[format] === true : false
}

function isLinkActive(editor: Editor) {
  const { selection } = editor
  if (!selection) return false
  const [link] = Editor.nodes(editor, { at: selection, match: (n: any) => n.type === 'link' })
  return !!link
}

function isBlockActive(editor: Editor, format: string, level?: number) {
  const [match] = Editor.nodes(editor, {
    match: (n: any) => {
      if (n.type === format) {
        if (level !== undefined) return n.level === level
        return true
      }
      return false
    },
  })
  return !!match
}

function toggleMark(editor: Editor, format: string) {
  const active = isMarkActive(editor, format)
  if (active) {
    Editor.removeMark(editor, format)
  } else {
    Editor.addMark(editor, format, true)
  }
}

function toggleBlock(editor: Editor, format: string, level?: number) {
  const isActive = isBlockActive(editor, format, level)
  const isList = LIST_TYPES.includes(format)

  Transforms.unwrapNodes(editor, {
    match: (n: any) => LIST_TYPES.includes(n.type),
    split: true,
  })

  const newProps: any = {}
  if (format === 'heading' && level) newProps.level = level

  if (format === 'todo-item') {
    newProps.checked = false
  }

  if (!isActive) {
    Transforms.setNodes(editor, { type: format, ...newProps } as any)
    if (isList) {
      Transforms.wrapNodes(editor, { type: format, children: [] } as any)
      Transforms.setNodes(editor, { type: 'list-item' } as any)
    }
  } else {
    Transforms.setNodes(editor, { type: 'paragraph' } as any)
  }
}

export default function SlateToolbar() {
  const editor = useSlate()
  const { t } = useLang()
  const [, forceUpdate] = useState(0)
  const linkRef = useRef<HTMLInputElement>(null)
  const formRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    onLinkPop(() => forceUpdate(n => n + 1))
    onFormPop(() => forceUpdate(n => n + 1))
  }, [])

  useEffect(() => {
    if (linkPop.open && linkRef.current) linkRef.current.focus()
  }, [linkPop.open])

  useEffect(() => {
    if (formPop.open && formRef.current) formRef.current.focus()
  }, [formPop.open])

  const currentHeading = HEADINGS.find(h => isBlockActive(editor, 'heading', h.level))

  return (
    <div className="slate-toolbar">
      <div className="slate-toolbar-section">
        <select
          className="slate-heading-select"
          value={currentHeading ? `h${currentHeading.level}` : 'p'}
          onChange={(e) => {
            const val = e.target.value
            if (val === 'p') {
              toggleBlock(editor, 'paragraph')
            } else {
              const level = parseInt(val.replace('h', ''))
              toggleBlock(editor, 'heading', level)
            }
          }}
          title={t.toolbar.heading}
        >
          <option value="p">正文</option>
          {HEADINGS.map(h => (
            <option key={h.level} value={`h${h.level}`}>H{h.level}</option>
          ))}
        </select>
      </div>

      <div className="slate-toolbar-divider" />

      <div className="slate-toolbar-section">
        <button className={`slate-toolbar-btn ${isMarkActive(editor, 'bold') ? 'active' : ''}`}
          onMouseDown={e => { e.preventDefault(); toggleMark(editor, 'bold') }} title={t.toolbar.bold}>
          <b>B</b>
        </button>
        <button className={`slate-toolbar-btn ${isMarkActive(editor, 'italic') ? 'active' : ''}`}
          onMouseDown={e => { e.preventDefault(); toggleMark(editor, 'italic') }} title={t.toolbar.italic}>
          <i>I</i>
        </button>
        <button className={`slate-toolbar-btn ${isMarkActive(editor, 'underline') ? 'active' : ''}`}
          onMouseDown={e => { e.preventDefault(); toggleMark(editor, 'underline') }} title="U">
          <u>U</u>
        </button>
        <button className={`slate-toolbar-btn ${isMarkActive(editor, 'strikethrough') ? 'active' : ''}`}
          onMouseDown={e => { e.preventDefault(); toggleMark(editor, 'strikethrough') }} title="S">
          <s>S</s>
        </button>
        <button className={`slate-toolbar-btn ${isMarkActive(editor, 'code') ? 'active' : ''}`}
          onMouseDown={e => { e.preventDefault(); toggleMark(editor, 'code') }} title={t.toolbar.code}>
          {'<>'}
        </button>
      </div>

      <div className="slate-toolbar-divider" />

      <div className="slate-toolbar-section">
        <button className={`slate-toolbar-btn ${isBlockActive(editor, 'bulleted-list') ? 'active' : ''}`}
          onMouseDown={e => { e.preventDefault(); toggleBlock(editor, 'bulleted-list') }} title={t.toolbar.list}>
          •≡
        </button>
        <button className={`slate-toolbar-btn ${isBlockActive(editor, 'numbered-list') ? 'active' : ''}`}
          onMouseDown={e => { e.preventDefault(); toggleBlock(editor, 'numbered-list') }} title="1.">
          1.
        </button>
        <button className={`slate-toolbar-btn ${isBlockActive(editor, 'todo-item') ? 'active' : ''}`}
          onMouseDown={e => { e.preventDefault(); toggleBlock(editor, 'todo-item') }} title={t.toolbar.todo}>
          ☑
        </button>
      </div>

      <div className="slate-toolbar-divider" />

      <div className="slate-toolbar-section">
        <button className={`slate-toolbar-btn ${isBlockActive(editor, 'block-quote') ? 'active' : ''}`}
          onMouseDown={e => { e.preventDefault(); toggleBlock(editor, 'block-quote') }} title={t.toolbar.quote}>
          ❝
        </button>
        <button className={`slate-toolbar-btn ${isBlockActive(editor, 'code-block') ? 'active' : ''}`}
          onMouseDown={e => { e.preventDefault(); toggleBlock(editor, 'code-block') }} title={t.toolbar.code}>
          {'</>'}
        </button>
        <button className={`slate-toolbar-btn ${isLinkActive(editor) ? 'active' : ''}`}
          onMouseDown={e => {
            e.preventDefault()
            ReactEditor.focus(editorRef.current!)
            if (isLinkActive(editor)) {
              Transforms.unwrapNodes(editorRef.current!, { match: (n: any) => n.type === 'link' })
            } else {
              showLinkPop('https://', false)
            }
          }}
          title={t.toolbar.link}>
          🔗
        </button>
        {linkPop.open && (
          <div className="slate-link-popover">
            <input ref={linkRef} className="slate-link-input"
              value={linkPop.url}
              onChange={e => { linkPop.url = e.target.value; forceUpdate(n => n + 1) }}
              onKeyDown={e => {
                if (e.key === 'Enter') { e.preventDefault(); applyLink(editorRef.current!); hideLinkPop() }
                if (e.key === 'Escape') hideLinkPop()
              }}
              placeholder="https://..."
            />
            <button className="slate-link-ok" onMouseDown={e => {
              e.preventDefault(); e.stopPropagation()
              applyLink(editorRef.current!)
              hideLinkPop()
            }}>✓</button>
          </div>
        )}
        <button className="slate-toolbar-btn"
          onMouseDown={e => { e.preventDefault(); showFormPop('') }}
          title="LaTeX 公式">
          ∑
        </button>
        {formPop.open && (
          <div className="slate-formula-popover">
            <input ref={formRef} className="slate-formula-input"
              value={formPop.formula}
              onChange={e => { formPop.formula = e.target.value; forceUpdate(n => n + 1) }}
              onKeyDown={e => {
                if (e.key === 'Enter') { e.preventDefault(); insertFormula(editorRef.current!); hideFormPop() }
                if (e.key === 'Escape') hideFormPop()
              }}
              placeholder="x^2 + y^2 = 1"
            />
            <button className="slate-link-ok" onMouseDown={e => {
              e.preventDefault(); e.stopPropagation()
              insertFormula(editorRef.current!)
              hideFormPop()
            }}>✓</button>
          </div>
        )}
      </div>
    </div>
  )
}
