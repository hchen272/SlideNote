import { marked } from 'marked'

// Custom renderer for TODO checkboxes
const renderer = new marked.Renderer()

renderer.checkbox = function (checked: boolean) {
  return `<input type="checkbox" class="md-checkbox" ${checked ? 'checked' : ''} disabled />`
}

// Configure marked with extensions for task lists
marked.setOptions({
  renderer,
  gfm: true,
  breaks: true,
})

export function renderMarkdown(text: string): string {
  if (!text) return ''
  // Parse markdown and add custom class for task list items
  let html = marked.parse(text) as string
  
  // Add custom styling for task list items
  html = html.replace(
    /<li>\s*<input type="checkbox" class="md-checkbox"([^>]*)>/g,
    '<li class="task-list-item"><input type="checkbox" class="md-checkbox"$1>'
  )
  
  return html
}

export function extractTodoStats(text: string): { total: number; completed: number } {
  const lines = text.split('\n')
  let total = 0
  let completed = 0
  
  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed.startsWith('- [ ]') || trimmed.startsWith('* [ ]')) {
      total++
    } else if (trimmed.startsWith('- [x]') || trimmed.startsWith('* [x]') ||
               trimmed.startsWith('- [X]') || trimmed.startsWith('* [X]')) {
      total++
      completed++
    }
  }
  
  return { total, completed }
}

// Toggle a specific TODO item
export function toggleTodoInText(text: string, lineIndex: number): string {
  const lines = text.split('\n')
  let todoCount = 0
  
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim()
    if (trimmed.startsWith('- [ ]') || trimmed.startsWith('* [ ]')) {
      if (todoCount === lineIndex) {
        lines[i] = lines[i].replace(/\[ \]/, '[x]')
        break
      }
      todoCount++
    } else if (trimmed.startsWith('- [x]') || trimmed.startsWith('* [x]') ||
               trimmed.startsWith('- [X]') || trimmed.startsWith('* [X]')) {
      if (todoCount === lineIndex) {
        lines[i] = lines[i].replace(/\[x\]/i, '[ ]')
        break
      }
      todoCount++
    }
  }
  
  return lines.join('\n')
}
