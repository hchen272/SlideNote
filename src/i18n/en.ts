import type { Translations } from './zh'

const en: Translations = {
  app: {
    title: 'Slide Note',
    dockedLabel: 'Slide Note',
    dockedTooltip: 'Click to expand / Drag to move',
  },
  titlebar: {
    toggleSidebar: 'Sidebar',
    dock: 'Dock to edge',
    undock: 'Expand window',
    minimize: 'Minimize',
    maximize: 'Maximize',
    close: 'Close',
  },
  sidebar: {
    newNote: '+ New Note',
    searchPlaceholder: 'Search notes...',
    sortLabel: 'Sort: ',
    sortModified: 'Modified',
    sortCreated: 'Created',
    sortWords: 'Word count',
    noNotes: 'No notes',
    untitled: 'Untitled',
    confirmDelete: 'Delete this note?',
    needOneNote: 'Keep at least one note',
    settings: 'Settings',
  },
  editor: {
    placeholder: 'Start writing... Markdown supported',
    empty: 'Select a note or create a new one',
    preview: 'Preview Markdown',
    edit: 'Switch to edit',
  },
  toolbar: {
    heading: 'Heading',
    bold: 'Bold',
    italic: 'Italic',
    code: 'Code',
    list: 'List',
    todo: 'Todo',
    quote: 'Quote',
    link: 'Link',
    fontSize: 'Font size',
    fontBold: 'Bold',
    fontColor: 'Font color',
    switchTheme: 'Switch theme',
  },
  theme: {
    cyberpunk: 'Cyberpunk',
    nature: 'Nature',
    medieval: 'Medieval',
  },
  settings: {
    title: 'Settings',
    dataPathLabel: 'Data storage path',
    save: 'Save',
    pathHint: '✅ Path saved, data migrated',
    pathHint2: 'Current data is still in the old location. Copy it manually if needed.',
    currentPath: 'Current path: ',
    languageLabel: 'Language',
    languageHint: 'Takes effect immediately',
  },
  insert: {
    boldText: 'bold text',
    italicText: 'italic text',
    headingText: 'Heading',
    listItem: 'list item',
    todoItem: 'todo item',
    quoteText: 'quote',
    codeText: 'code',
    linkText: 'link text',
  },
  welcome: {
    title: 'Welcome to Slide Note',
    content: `# Welcome to Slide Note! 🎉

## Features

- **Markdown** rendering
- Checkable TODO lists
- Multiple themes

## TODO Example

- [x] Project initialized
- [ ] Learn Markdown syntax
- [ ] Try switching themes

> Slide Note — take notes while viewing slides

Enjoy!`,
  },
}

export default en
