import { Descendant } from 'slate'

// ============ Slate → Markdown ============

type InlineLeaf = { text: string; bold?: boolean; italic?: boolean; strikethrough?: boolean; code?: boolean; underline?: boolean }

function serializeLeaf(leaf: InlineLeaf): string {
  let t = leaf.text
  if (leaf.bold) t = `**${t}**`
  if (leaf.italic) t = `*${t}*`
  if (leaf.strikethrough) t = `~~${t}~~`
  if (leaf.code) t = '`' + t + '`'
  if (leaf.underline) t = `<u>${t}</u>`
  return t
}

function serializeChildren(children: any[]): string {
  return children.map((c: any) => {
    if (c.type === 'link') return `[${serializeChildren(c.children)}](${c.url})`
    if (c.text !== undefined) return serializeLeaf(c)
    if (c.children) return serializeChildren(c.children)
    return ''
  }).join('')
}

export function slateToMarkdown(nodes: Descendant[]): string {
  const lines: string[] = []

  for (const node of nodes as any[]) {
    switch (node.type) {
      case 'paragraph':
        lines.push(serializeChildren(node.children))
        break
      case 'heading':
        lines.push('#'.repeat(node.level) + ' ' + serializeChildren(node.children))
        break
      case 'todo-item':
        const prefix = node.checked ? '- [x] ' : '- [ ] '
        lines.push(prefix + serializeChildren(node.children))
        break
      case 'bulleted-list':
        for (const item of node.children) {
          lines.push('- ' + serializeChildren(item.children))
        }
        break
      case 'numbered-list':
        let i = 1
        for (const item of node.children) {
          lines.push(`${i++}. ` + serializeChildren(item.children))
        }
        break
      case 'block-quote':
        lines.push('> ' + serializeChildren(node.children))
        break
      case 'code-block':
        lines.push('```')
        lines.push(serializeChildren(node.children))
        lines.push('```')
        break
      case 'inline-formula':
        lines.push(`$${node.formula}$`)
        break
      case 'block-formula':
        lines.push(`$$${node.formula}$$`)
        break
      case 'table':
        for (let ri = 0; ri < node.children.length; ri++) {
          const row = node.children[ri]
          const cells = row.children.map((c: any) => serializeChildren(c.children).trim())
          lines.push('| ' + cells.join(' | ') + ' |')
          if (ri === 0) {
            lines.push('|' + cells.map(() => '---').join('|') + '|')
          }
        }
        break
      default:
        if (node.children) {
          lines.push(serializeChildren(node.children))
        }
    }
    lines.push('')
  }

  return lines.join('\n').trim()
}

// ============ Markdown → Slate ============

function parseInlineMarks(text: string): any[] {
  // First, parse links: [text](url)
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g
  const segments: Array<{ type: 'text' | 'link'; content: string; url?: string }> = []
  let lastEnd = 0
  let match: RegExpExecArray | null

  while ((match = linkRegex.exec(text)) !== null) {
    if (match.index > lastEnd) {
      segments.push({ type: 'text', content: text.slice(lastEnd, match.index) })
    }
    segments.push({ type: 'link', content: match[1], url: match[2] })
    lastEnd = match.index + match[0].length
  }
  if (lastEnd < text.length) {
    segments.push({ type: 'text', content: text.slice(lastEnd) })
  }
  if (segments.length === 0) {
    segments.push({ type: 'text', content: text })
  }

  // Parse inline marks within each segment
  const result: any[] = []
  for (const seg of segments) {
    if (seg.type === 'link') {
      result.push({ type: 'link', url: seg.url, children: parseMarksOnly(seg.content) })
    } else {
      result.push(...parseFormulasInText(seg.content))
    }
  }
  return result
}

function parseFormulasInText(text: string): any[] {
  const out: any[] = []
  const regex = /\$([^$]+)\$/g
  let lastEnd = 0
  let match: RegExpExecArray | null
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastEnd) {
      out.push(...parseMarksOnly(text.slice(lastEnd, match.index)))
    }
    out.push({ type: 'inline-formula', formula: match[1], children: [{ text: '' }] })
    lastEnd = match.index + match[0].length
  }
  if (lastEnd < text.length) {
    out.push(...parseMarksOnly(text.slice(lastEnd)))
  }
  if (out.length === 0) {
    out.push(...parseMarksOnly(text))
  }
  return out
}


function parseMarksOnly(text: string): any[] {
  if (!text) return [{ text: '' }]
  
  // Order matters: code first (no nested marks), then bold, italic, strikethrough, underline
  const patterns: Array<{ regex: RegExp; mark: string; wrapper?: [string, string] }> = [
    { regex: /`([^`]+)`/g, mark: 'code' },
    { regex: /\*\*(.+?)\*\*/g, mark: 'bold' },
    { regex: /(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, mark: 'italic' },
    { regex: /~~(.+?)~~/g, mark: 'strikethrough' },
    { regex: /<u>(.+?)<\/u>/g, mark: 'underline' },
  ]

  interface Token { type: 'text' | 'mark'; text: string; marks: Record<string, boolean>; start: number; end: number }
  let tokens: Token[] = [{ type: 'text', text, marks: {}, start: 0, end: text.length }]

  for (const { regex, mark } of patterns) {
    const newTokens: Token[] = []
    for (const token of tokens) {
      if (token.type === 'mark') { newTokens.push(token); continue }
      
      let lastEnd = 0
      let match: RegExpExecArray | null
      const str = token.text
      regex.lastIndex = 0
      
      while ((match = regex.exec(str)) !== null) {
        if (match.index > lastEnd) {
          newTokens.push({ type: 'text', text: str.slice(lastEnd, match.index), marks: { ...token.marks }, start: 0, end: 0 })
        }
        const m = { ...token.marks, [mark]: true }
        newTokens.push({ type: 'mark', text: match[1], marks: m, start: 0, end: 0 })
        lastEnd = match.index + match[0].length
      }
      if (lastEnd < str.length) {
        newTokens.push({ type: 'text', text: str.slice(lastEnd), marks: { ...token.marks }, start: 0, end: 0 })
      }
    }
    tokens = newTokens
  }

  return tokens.map(t => ({ text: t.text, ...t.marks }))
}

export function markdownToSlate(md: string): Descendant[] {
  if (!md || !md.trim()) {
    return [{ type: 'paragraph', children: [{ text: '' }] }]
  }

  const lines = md.split('\n')
  const nodes: any[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    // Code block
    if (line.trim().startsWith('```')) {
      const codeLines: string[] = []
      i++
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i])
        i++
      }
      nodes.push({ type: 'code-block', children: [{ text: codeLines.join('\n') }] })
      i++
      continue
    }

    // Block formula $$...$$
    if (line.trim().startsWith('$$')) {
      const formLines: string[] = []
      i++
      while (i < lines.length && !lines[i].trim().startsWith('$$')) {
        formLines.push(lines[i])
        i++
      }
      nodes.push({ type: 'block-formula', formula: formLines.join('\n'), children: [{ text: '' }] })
      i++
      continue
    }

    // Heading
    const headingMatch = line.match(/^(#{1,5})\s+(.+)/)
    if (headingMatch) {
      nodes.push({ type: 'heading', level: headingMatch[1].length, children: parseInlineMarks(headingMatch[2]) })
      i++
      continue
    }

    // TODO item
    const todoMatch = line.match(/^-\s*\[([ xX])\]\s+(.+)/)
    if (todoMatch) {
      nodes.push({ type: 'todo-item', checked: todoMatch[1].toLowerCase() === 'x', children: parseInlineMarks(todoMatch[2]) })
      i++
      continue
    }

    // Blockquote
    const quoteMatch = line.match(/^>\s?(.*)/)
    if (quoteMatch) {
      nodes.push({ type: 'block-quote', children: parseInlineMarks(quoteMatch[1]) })
      i++
      continue
    }

    // Numbered list
    const numMatch = line.match(/^(\d+)\.\s+(.+)/)
    if (numMatch) {
      const listItems: any[] = []
      while (i < lines.length) {
        const nm = lines[i].match(/^(\d+)\.\s+(.+)/)
        if (!nm) break
        listItems.push({ type: 'list-item', children: parseInlineMarks(nm[2]) })
        i++
      }
      nodes.push({ type: 'numbered-list', children: listItems })
      continue
    }

    // Bulleted list
    const bulletMatch = line.match(/^-\s+(.+)/)
    if (bulletMatch) {
      const listItems: any[] = []
      while (i < lines.length) {
        const bm = lines[i].match(/^-\s+(.+)/)
        if (!bm) break
        listItems.push({ type: 'list-item', children: parseInlineMarks(bm[1]) })
        i++
      }
      nodes.push({ type: 'bulleted-list', children: listItems })
      continue
    }

    // GFM table
    const tableMatch = line.match(/^\|(.+)\|$/)
    if (tableMatch) {
      const rows: any[] = []
      // Header row
      const headers = tableMatch[1].split('|').map(c => c.trim())
      rows.push({ type: 'table-row', children: headers.map(h => ({ type: 'table-cell', children: [{ type: 'paragraph', children: parseInlineMarks(h) }] })) })
      i++
      // Skip separator row if present
      if (i < lines.length && /^\|[-:\s|]+\|$/.test(lines[i])) i++
      // Data rows
      while (i < lines.length) {
        const dm = lines[i].match(/^\|(.+)\|$/)
        if (!dm) break
        const cells = dm[1].split('|').map(c => c.trim())
        rows.push({ type: 'table-row', children: cells.map(c => ({ type: 'table-cell', children: [{ type: 'paragraph', children: parseInlineMarks(c) }] })) })
        i++
      }
      nodes.push({ type: 'table', children: rows })
      continue
    }

    // Empty line → skip
    if (line.trim() === '') {
      i++
      continue
    }

    // Paragraph
    nodes.push({ type: 'paragraph', children: parseInlineMarks(line) })
    i++
  }

  if (nodes.length === 0) {
    nodes.push({ type: 'paragraph', children: [{ text: '' }] })
  }

  return nodes
}
