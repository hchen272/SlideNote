import React, { useCallback, useMemo } from 'react'
import { createEditor, Descendant, Editor, Element as SlateElement, Text, Transforms, Range, Point } from 'slate'
import { Slate, Editable, withReact, ReactEditor, RenderElementProps, RenderLeafProps } from 'slate-react'
import { withHistory } from 'slate-history'
import katex from 'katex'
import { useTheme } from '../../contexts/ThemeContext'
import { useLang } from '../../i18n'
import SlateToolbar from './SlateToolbar'
import './SlateEditor.css'

// ---- Custom Types ----
type HeadingElement = { type: 'heading'; level: 1 | 2 | 3 | 4 | 5; children: Descendant[] }
type ParagraphElement = { type: 'paragraph'; children: Descendant[] }
type TodoItemElement = { type: 'todo-item'; checked: boolean; children: Descendant[] }
type BulletedListElement = { type: 'bulleted-list'; children: ListItemElement[] }
type NumberedListElement = { type: 'numbered-list'; children: ListItemElement[] }
type ListItemElement = { type: 'list-item'; children: Descendant[] }
type BlockQuoteElement = { type: 'block-quote'; children: Descendant[] }
type CodeBlockElement = { type: 'code-block'; children: Descendant[] }
type LinkElement = { type: 'link'; url: string; children: CustomText[] }
type InlineFormulaElement = { type: 'inline-formula'; formula: string; children: [{ text: '' }] }
type BlockFormulaElement = { type: 'block-formula'; formula: string; children: [{ text: '' }] }

type CustomElement =
  | HeadingElement
  | ParagraphElement
  | TodoItemElement
  | BulletedListElement
  | NumberedListElement
  | ListItemElement
  | BlockQuoteElement
  | CodeBlockElement
  | LinkElement
  | InlineFormulaElement
  | BlockFormulaElement

type CustomText = {
  text: string
  bold?: boolean
  italic?: boolean
  underline?: boolean
  strikethrough?: boolean
  code?: boolean
}

declare module 'slate' {
  interface CustomTypes {
    Editor: ReactEditor
    Element: CustomElement
    Text: CustomText
  }
}

// ---- Constants ----
const LIST_TYPES = ['bulleted-list', 'numbered-list']

const initialValue: Descendant[] = [
  { type: 'paragraph', children: [{ text: '' }] },
]

// ---- Plugins ----
const withCustom = (editor: Editor) => {
  const { isInline, isVoid, normalizeNode, deleteBackward } = editor

  editor.isInline = (element) => {
    const t = (element as any).type
    if (t === 'link' || t === 'inline-formula') return true
    return isInline(element)
  }

  editor.isVoid = (element) => {
    const t = (element as any).type
    return t === 'inline-formula' || t === 'block-formula'
  }

  editor.normalizeNode = (entry) => {
    const [node, path] = entry

    // If a list has no children, remove it
    if (LIST_TYPES.includes((node as any).type) && (node as any).children?.length === 0) {
      Transforms.removeNodes(editor, { at: path })
      return
    }

    normalizeNode(entry)
  }

  return editor
}

// ---- KaTeX render helper ----
function renderFormula(formula: string, block = false): string {
  try {
    return katex.renderToString(formula, { throwOnError: false, displayMode: block })
  } catch {
    return `<span class="slate-formula-error">${formula}</span>`
  }
}

// ---- Element Renderers ----
function ElementRenderer({ attributes, children, element }: RenderElementProps) {
  const style: React.CSSProperties = {}

  switch (element.type) {
    case 'heading':
      const Tag = `h${element.level}` as any
      return <Tag {...attributes} className={`slate-heading h${element.level}`}>{children}</Tag>

    case 'block-quote':
      return <blockquote {...attributes} className="slate-blockquote">{children}</blockquote>

    case 'bulleted-list':
      return <ul {...attributes} className="slate-ul">{children}</ul>

    case 'numbered-list':
      return <ol {...attributes} className="slate-ol">{children}</ol>

    case 'list-item':
      return <li {...attributes} className="slate-li">{children}</li>

    case 'todo-item':
      return (
        <div {...attributes} className={`slate-todo-item ${element.checked ? 'checked' : ''}`}>
          <span
            contentEditable={false}
            className="slate-todo-checkbox"
            onClick={(e) => {
              e.preventDefault()
              const path = ReactEditor.findPath(editorRef.current!, element)
              Transforms.setNodes(editorRef.current!, { checked: !element.checked } as any, { at: path })
            }}
          >
            {element.checked ? '☑' : '☐'}
          </span>
          <span className={`slate-todo-text ${element.checked ? 'checked' : ''}`}>{children}</span>
        </div>
      )

    case 'code-block':
      return <pre {...attributes} className="slate-code-block"><code>{children}</code></pre>

    case 'link':
      return (
        <a {...attributes} href={element.url} className="slate-link"
          onClick={(e) => {
            if (e.ctrlKey || e.metaKey) {
              window.electronAPI?.openUrl(element.url)
              return
            }
            e.preventDefault()
            showLinkPop(element.url, true, element)
          }}
          title={`${element.url}\nCtrl+Click to open in browser\nClick to edit`}
        >
          {children}
        </a>
      )

    case 'inline-formula':
      return (
        <span {...attributes} className="slate-inline-formula" contentEditable={false}
          onClick={() => showFormPop(element.formula, element)}
          dangerouslySetInnerHTML={{ __html: renderFormula(element.formula) }}
        />
      )

    case 'block-formula':
      return (
        <div {...attributes} className="slate-block-formula" contentEditable={false}
          onClick={() => showFormPop(element.formula, element)}
        >
          <span dangerouslySetInnerHTML={{ __html: renderFormula(element.formula, true) }} />
        </div>
      )

    default:
      return <p {...attributes} className="slate-paragraph">{children}</p>
  }
}

// ---- Leaf Renderer ----
function LeafRenderer({ attributes, children, leaf }: RenderLeafProps) {
  if (leaf.bold) children = <strong>{children}</strong>
  if (leaf.italic) children = <em>{children}</em>
  if (leaf.underline) children = <u>{children}</u>
  if (leaf.strikethrough) children = <s>{children}</s>
  if (leaf.code) children = <code className="slate-inline-code">{children}</code>
  return <span {...attributes}>{children}</span>
}

// ---- Editor ref for use in callbacks ----
let editorRef: { current: Editor } = { current: null as any }

// ---- Shared link popover state ----
export const linkPop = { open: false, url: '', isEdit: false, element: null as any, savedSelection: null as any }
let linkListener: (() => void) | null = null
export function onLinkPop(fn: () => void) { linkListener = fn }
function notifyLink() { linkListener?.() }
export function showLinkPop(url: string, isEdit: boolean, el?: any) {
  linkPop.open = true; linkPop.url = url; linkPop.isEdit = isEdit; linkPop.element = el || null
  linkPop.savedSelection = editorRef.current?.selection || null
  notifyLink()
}
export function hideLinkPop() { linkPop.open = false; notifyLink() }

// ---- Shared formula popover state ----
export const formPop = { open: false, formula: '', element: null as any }
let formListener: (() => void) | null = null
export function onFormPop(fn: () => void) { formListener = fn }
function notifyForm() { formListener?.() }
export function showFormPop(formula: string, el?: any) {
  formPop.open = true; formPop.formula = formula; formPop.element = el || null; notifyForm()
}
export function hideFormPop() { formPop.open = false; notifyForm() }

// ---- Main Component ----
interface SlateEditorProps {
  value: Descendant[]
  onChange: (value: Descendant[]) => void
  fontSettings?: { fontSize: number; fontWeight: 'normal' | 'bold'; fontColor: string }
}

export default function SlateEditor({ value, onChange, fontSettings }: SlateEditorProps) {
  const { theme } = useTheme()
  const { t } = useLang()
  const fs = fontSettings || { fontSize: 14, fontWeight: 'normal' as const, fontColor: '#ffffff' }

  const editor = useMemo(() => {
    const e = withCustom(withHistory(withReact(createEditor())))
    editorRef.current = e as any
    return e
  }, [])

  const handleChange = useCallback((newValue: Descendant[]) => {
    onChange(newValue)
  }, [onChange])

  const displayValue = value && value.length > 0 ? value : initialValue

  return (
    <div className={`slate-editor theme-${theme}`}>
      <Slate editor={editor} initialValue={displayValue} onChange={handleChange}>
        <SlateToolbar />
        <div className="slate-content">
          <Editable
            className="slate-editable"
            renderElement={ElementRenderer}
            renderLeaf={LeafRenderer}
            placeholder={t.editor.placeholder}
            spellCheck={false}
            autoFocus
            style={{
              fontSize: `${fs.fontSize}px`,
              fontWeight: fs.fontWeight,
              color: fs.fontColor,
            }}
          />
        </div>
      </Slate>
    </div>
  )
}

// Re-export helpers for toolbar use
export { editorRef, LIST_TYPES }
