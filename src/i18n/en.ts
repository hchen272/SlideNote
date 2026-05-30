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
    sortTitle: 'Alphabetical',
    noNotes: 'No notes',
    untitled: 'Untitled',
    confirmDelete: 'Delete this note?',
    needOneNote: 'Keep at least one note',
    settings: 'Settings',
    richText: 'Rich Text',
    newFolder: '+ New Folder',
    deleteNote: 'Delete note',
    addToFolder: 'Add to folder',
    removeFromFolder: 'Remove from folder',
    folderNamePlaceholder: 'Folder name',
    selectFolder: 'Select folder',
    batchDelete: 'Delete selected',
    multiSelect: 'Multi-select',
    confirmDeleteNotes: 'Delete {count} selected notes?',
    noFolders: 'No folders',
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
  outline: {
    title: 'Outline',
    empty: 'No headings\nUse # to add headings for outline',
    toggleTooltip: 'Toggle outline panel',
  },
  welcome: {
    title: 'Welcome to Slide Note',
    content: `# Welcome to Slide Note! 🎉

Slide Note is an always-on-top desktop sticky-note app with Markdown and rich-text editing.

## ✨ Core Features

- **📝 Dual Editing** — Markdown source / Slate rich text, one-click conversion
- **☑ TODO Lists** — Use \`- [ ]\` to create tasks, click checkbox to toggle
- **🎨 Three Themes** — Cyberpunk / Nature / Medieval, switch via gear icon
- **📋 Outline Panel** — Click ☷ in the titlebar to open heading tree navigation
- **📌 Screen Docking** — Drag to screen edge to dock, click to expand

## ⌨ Quick Actions

| Action | How |
|--------|-----|
| New note | Sidebar + button |
| Search notes | Sidebar search box |
| Sort notes | Sidebar dropdown (date/words/alphabetical) |
| Switch theme | Toolbar rightmost dropdown |
| Dock / Expand | \`Ctrl+Shift+D\` or titlebar ◀ button |
| Toggle outline | Titlebar ☷ button |
| Md ↔ Rich Text | Toolbar MD / 📝 button |
| Font / Color | Toolbar right-side dropdown & swatches |

## 📂 Data Storage

Each note is stored as an individual JSON file (\`data-path/notes/<id>.json\`), making backups, Git tracking, and migration easy.

> 💡 Tip: You can customize the data storage path in Settings.

## 🔗 Project Link

[GitHub Link](https://github.com/hchen272/SlideNote)

---

Enjoy!`,
  },
}

export default en
