# Slide Note

> A desktop sticky-note app that stays on top, docks to the screen edge like a bookmark, and supports Markdown + rich-text editing with themes.

[中文文档](README_CN.md)

---

## Why This Exists

Modern OS sticky-note tools have two fundamental flaws:

1. **They don't stay on top.** Most built-in note apps get buried the moment you switch to another window. When you're reading a slide deck, watching a lecture, or referencing a document, your notes should be *persistently visible* — not hiding behind your active window.

2. **They take up too much space or are awkward to reach.** Traditional note apps either occupy valuable screen real estate or require Alt-Tab juggling. You need something that lives at the edge of your screen — always there, never in the way.

**Slide Note** solves both: always-on-top, and collapses into a tiny colored tab docked to the left or right edge of your screen. One click and it expands back to full size.

**Core use case:** taking notes while reading slides, PDFs, or watching video lectures — without constantly switching windows.

---

## Features

- **Always on top** — stays visible above other windows (backs down for fullscreen apps)
- **Edge docking** — collapses into a thin colored tab at the screen edge; drag to reposition
- **4 themes** — Cyberpunk, Nature, Medieval, Minimal
- **Markdown + Rich Text** — dual editing modes with one-click conversion
- **TODO lists** — clickable checkboxes in both edit and preview modes
- **Outline panel** — heading tree navigation, click to jump
- **Note folders** — tag-based folder system with color labels, multi-select batch operations
- **Links** — insert/edit links; Ctrl+Click to open in browser
- **LaTeX formulas** — KaTeX rendering for inline `$...$` and block `$$...$$`
- **Tables** — custom-size tables; GFM table support
- **Note management** — create, delete, search, sort (modified / created / word count / alphabetical)
- **Custom fonts** — adjustable font size, weight, and color per note
- **Per-note file storage** — each note saved as an individual JSON file for easy backup and Git tracking
- **Custom data path** — configurable in Settings with auto-migration
- **Bilingual** — Chinese / English UI

---

## Setup

### Prerequisites

- [Node.js](https://nodejs.org/) v18+ (v24 recommended)
- npm

### Install & Run

```bash
git clone https://github.com/hchen272/SlideNote.git
cd SlideNote
npm install
npm run electron:dev
```

### Build Installer

```bash
npm run electron:build
# Output: release/Slide Note Setup.exe
```

---

## Usage

| Action | How |
|--------|-----|
| **New note** | Click **+ New Note** in the sidebar |
| **New folder** | Click 📁+ next to New Note, pick a color |
| **Edit / Preview** | Toggle 👁️ button in the toolbar |
| **Switch theme** | Toolbar theme dropdown (🌆 / 🌿 / 🏰 / ⬛) |
| **Dock to edge** | Click ◀ in the titlebar or `Ctrl+Shift+D` |
| **Expand from dock** | Click the colored tab at the screen edge |
| **Outline panel** | Click ☷ in the titlebar |
| **Search notes** | Sidebar search box |
| **Sort notes** | Sidebar dropdown (modified / created / word count / alphabetical) |
| **Multi-select** | Click ☐ in the sort bar |
| **Right-click note** | Delete, Add to folder, Remove from folder |
| **Settings** | Click ⚙ at the bottom of the sidebar |

### Markdown Cheatsheet

```markdown
# Heading 1
## Heading 2
**bold**  *italic*  `code`

- bullet list
- [ ] todo item
- [x] completed item

> blockquote

[link text](url)
```

---

## Tech Stack

- **Electron** — desktop framework
- **React 18** + **TypeScript** — UI
- **Vite** — build tooling
- **Slate.js** — rich-text editing
- **marked** — Markdown rendering
- **KaTeX** — LaTeX formula rendering
- **electron-store** — app config persistence

---

## Roadmap

### Completed

- [x] Always-on-top window with fullscreen-aware layering
- [x] Edge-docking: collapse to a draggable colored tab, click to expand
- [x] 4 themes: Cyberpunk, Nature, Medieval, Minimal
- [x] Markdown editing with live preview and clickable TODO checkboxes
- [x] Rich-text editing (Slate.js) with H1-H5 headings, inline marks, tables, formulas
- [x] One-click Markdown ↔ Rich Text conversion
- [x] Note management: create, delete, search, sort
- [x] Per-note font customization (size, weight, color)
- [x] Heading outline tree with click-to-jump navigation
- [x] Note folders: tag-based, color labels, multi-select batch operations
- [x] Right-click context menu for note actions
- [x] Per-note JSON file storage (folder-based)
- [x] Custom data storage path with auto-migration
- [x] Chinese / English bilingual UI
- [x] LaTeX formula support (KaTeX)
- [x] Table support (custom-size + GFM)
- [x] Alphabetical note sorting
- [x] Scroll position memory across dock/undock

### Planned

- [ ] UI / visual polish
- [ ] More themes
- [ ] Slide integration (inspired by ShareNote Engine)
- [ ] Image paste support
- [ ] Export notes as Markdown files
- [ ] Cloud sync

---

[GitHub Link](https://github.com/hchen272/SlideNote)
