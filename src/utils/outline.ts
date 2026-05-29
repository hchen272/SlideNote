import type { HeadingNode } from '../types'
import type { Descendant } from 'slate'

/**
 * Extract heading tree from Markdown text.
 * Skips # inside fenced code blocks.
 */
export function extractMarkdownHeadings(md: string): HeadingNode[] {
  const lines = md.split('\n')
  const flat: HeadingNode[] = []
  let inCodeBlock = false
  let idCounter = 0

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // Track code block fences
    if (line.trim().startsWith('```')) {
      inCodeBlock = !inCodeBlock
      continue
    }
    if (inCodeBlock) continue

    const match = line.match(/^(#{1,5})\s+(.+)/)
    if (match) {
      const level = match[1].length
      // Strip inline formatting from heading text
      const text = stripMarkdownFormatting(match[2])
      if (!text.trim()) continue // skip empty headings
      flat.push({
        level,
        text,
        lineIndex: i,
        children: [],
        id: `md-h-${idCounter++}`,
      })
    }
  }

  return buildTree(flat)
}

/**
 * Extract heading tree from Slate Descendant[] nodes.
 */
export function extractSlateHeadings(nodes: Descendant[]): HeadingNode[] {
  const flat: HeadingNode[] = []
  let idCounter = 0

  function walk(children: any[], parentPath: number[]) {
    for (let i = 0; i < children.length; i++) {
      const node = children[i]
      const path = [...parentPath, i]

      if (node.type === 'heading') {
        const text = extractSlateText(node.children || [])
        if (!text.trim()) continue
        flat.push({
          level: node.level as number,
          text,
          slatePath: path,
          children: [],
          id: `slate-h-${idCounter++}`,
        })
      }

      // Recurse into nested children (list items, etc.)
      if (node.children && Array.isArray(node.children)) {
        walk(node.children, path)
      }
    }
  }

  walk(nodes, [])
  return buildTree(flat)
}

/** Extract plain text from Slate node children (skip inline formulas, links). */
function extractSlateText(children: any[]): string {
  return children
    .map((c: any) => {
      if (c.text !== undefined) return c.text
      if (c.type === 'link') return extractSlateText(c.children || [])
      if (c.type === 'inline-formula') return c.formula || ''
      if (c.children) return extractSlateText(c.children)
      return ''
    })
    .join('')
}

/** Strip markdown inline formatting: **bold**, *italic*, `code`, ~~strikethrough~~, [links](url). */
function stripMarkdownFormatting(text: string): string {
  return text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // links
    .replace(/\*\*(.+?)\*\*/g, '$1')          // bold
    .replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '$1') // italic
    .replace(/~~(.+?)~~/g, '$1')               // strikethrough
    .replace(/`([^`]+)`/g, '$1')               // inline code
    .trim()
}

/**
 * Build a hierarchical tree from a flat heading list.
 * Algorithm: maintain a stack; for each heading, pop until
 * stack top's level < current level, then attach as child.
 */
function buildTree(flat: HeadingNode[]): HeadingNode[] {
  const roots: HeadingNode[] = []
  const stack: HeadingNode[] = []

  for (const heading of flat) {
    // Pop until we find a parent with lower level
    while (stack.length > 0 && stack[stack.length - 1].level >= heading.level) {
      stack.pop()
    }

    if (stack.length === 0) {
      roots.push(heading)
    } else {
      stack[stack.length - 1].children.push(heading)
    }

    stack.push(heading)
  }

  return roots
}
