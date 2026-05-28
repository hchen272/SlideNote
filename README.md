# Sticky Notes

> A desktop sticky-note app that stays on top, docks to the screen edge like a bookmark, and supports Markdown with themes.

[中文](ChineseVersion.md)

---

## Why This Exists

Modern OS sticky-note tools have two fundamental flaws:

1. **They don't stay on top.** Most built-in note apps (Sticky Notes on Windows, Stickies on macOS) get buried the moment you switch to another window. When you're reading a slide deck, watching a lecture, or referencing a document, your notes should be *persistently visible* — not hiding behind your active window.

2. **They take up too much space or are awkward to reach.** Traditional note apps either occupy valuable screen real estate or require Alt-Tab juggling. You need something that lives at the edge of your screen — always there, never in the way.

**Sticky Notes** solves both: it's always-on-top (except over fullscreen apps) and collapses into a tiny colored tab docked to the left or right edge of your screen. One click and it expands back to full size with all your notes intact.

**Core use case:** taking notes while reading slides, PDFs, or watching video lectures — without constantly switching windows.

---

## Features

- **Always on top** — stays visible above other windows (backs down for fullscreen apps)
- **Edge docking** — collapses into a thin colored tab at the screen edge; drag to reposition
- **3 themes** — Cyberpunk, Nature, Medieval
- **Markdown editing** — write in Markdown with live preview
- **TODO lists** — checkable checkboxes with strikethrough (`- [ ]` / `- [x]`)
- **Note management** — create, delete, search, sort by creation time / modified time / word count
- **Custom fonts** — adjustable font size, weight (bold/normal), and color per note
- **Persistent storage** — all notes saved automatically; customizable storage path in Settings

---

## Setup

### Prerequisites

- [Node.js](https://nodejs.org/) v18+ (v24 recommended)
- npm (comes with Node.js)

### Install & Run

```bash
# Clone the repository
git clone <your-repo-url>
cd sticky-notes

# Install dependencies
npm install

# Start the app in development mode
npm run electron:dev
```

### Build for Distribution

```bash
npm run electron:build
```

The packaged app will be in the `release/` folder.

---

## Usage

| Action | How |
|--------|-----|
| **New note** | Click **+ New Note** in the sidebar |
| **Edit / Preview** | Toggle 👁️ button in the toolbar |
| **Switch theme** | Click the theme icon in the toolbar (🌆 Cyberpunk / 🌿 Nature / 🏰 Medieval) |
| **Dock to edge** | Click ◀ in the titlebar or press `Ctrl+Shift+D` |
| **Expand from dock** | Click the colored tab at the screen edge |
| **Move docked tab** | Drag the tab up/down along the edge |
| **Search notes** | Use the search box in the sidebar |
| **Sort notes** | Use the dropdown (by modified / created / word count) |
| **Insert Markdown** | Use the toolbar buttons (H, **B**, *I*, ☑, etc.) |
| **Change font** | Font size dropdown, B for bold toggle, A for color picker |
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

## Custom Data Path

By default, notes are saved to:

```
C:\Users\<You>\AppData\Roaming\sticky-notes\config.json
```

To change this, click ⚙ in the sidebar, enter a new folder path, and click **Save**. The change takes effect on the next launch.

---

## Tech Stack

- **Electron** — desktop framework
- **React 18** + **TypeScript** — UI
- **Vite** — build tooling
- **marked** — Markdown rendering
- **electron-store** — local persistence

---

## License

MIT
