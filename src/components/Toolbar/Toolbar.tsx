import React from 'react'
import { useTheme } from '../../contexts/ThemeContext'
import { useLang } from '../../i18n'
import ThemeSwitcher from '../ThemeSwitcher/ThemeSwitcher'
import './Toolbar.css'

interface ToolbarProps {
  previewMode: boolean
  onTogglePreview: () => void
  onInsertMarkdown: (syntax: string) => void
  fontSettings: {
    fontSize: number
    fontWeight: 'normal' | 'bold'
    fontColor: string
  }
  onFontChange: (settings: { fontSize?: number; fontWeight?: 'normal' | 'bold'; fontColor?: string }) => void
  isSlate?: boolean
  onConvert?: () => void
}

const COLORS = ['#ffffff', '#e0e0ff', '#00ff88', '#ffcc00', '#ff6b6b', '#7ddf90', '#daa520', '#ff69b4', '#87ceeb']

export default function Toolbar({ previewMode, onTogglePreview, onInsertMarkdown, fontSettings, onFontChange, isSlate, onConvert }: ToolbarProps) {
  const { theme } = useTheme()
  const { t } = useLang()

  return (
    <div className={`toolbar theme-${theme}`}>
      <div className="toolbar-section">
        {onConvert && (
          <>
            <button className="toolbar-btn" onClick={onConvert}
              title={isSlate ? '转为 Markdown' : '转为富文本'}>
              {isSlate ? 'MD' : '📝'}
            </button>
            <div className="toolbar-divider" />
          </>
        )}

        {!isSlate && (
          <>
            <button
              className={`toolbar-btn ${previewMode ? 'active' : ''}`}
          onClick={onTogglePreview}
          title={previewMode ? t.editor.edit : t.editor.preview}
        >
          {previewMode ? '✏️' : '👁️'}
        </button>
        <div className="toolbar-divider" />

        <button className="toolbar-btn" onClick={() => onInsertMarkdown('heading')} title={t.toolbar.heading}>H</button>
        <button className="toolbar-btn" onClick={() => onInsertMarkdown('bold')} title={t.toolbar.bold}><b>B</b></button>
        <button className="toolbar-btn" onClick={() => onInsertMarkdown('italic')} title={t.toolbar.italic}><i>I</i></button>
        <button className="toolbar-btn" onClick={() => onInsertMarkdown('code')} title={t.toolbar.code}>{'<>'}</button>

        <div className="toolbar-divider" />

        <button className="toolbar-btn" onClick={() => onInsertMarkdown('list')} title={t.toolbar.list}>•≡</button>
        <button className="toolbar-btn" onClick={() => onInsertMarkdown('todo')} title={t.toolbar.todo}>☑</button>
        <button className="toolbar-btn" onClick={() => onInsertMarkdown('quote')} title={t.toolbar.quote}>❝</button>
        <button className="toolbar-btn" onClick={() => onInsertMarkdown('link')} title={t.toolbar.link}>🔗</button>
          </>
        )}
      </div>

      <div className="toolbar-section">
        <div className="toolbar-divider" />

        <select
          className="font-size-select"
          value={fontSettings.fontSize}
          onChange={(e) => onFontChange({ fontSize: parseInt(e.target.value) })}
          title={t.toolbar.fontSize}
        >
          {[10, 12, 14, 16, 18, 20, 24, 28].map(size => (
            <option key={size} value={size}>{size}px</option>
          ))}
        </select>

        <button
          className={`toolbar-btn ${fontSettings.fontWeight === 'bold' ? 'active' : ''}`}
          onClick={() => onFontChange({ fontWeight: fontSettings.fontWeight === 'bold' ? 'normal' : 'bold' })}
          title={t.toolbar.fontBold}
        >
          <b>B</b>
        </button>

        <div className="color-picker-wrapper">
          <button
            className="toolbar-btn color-btn"
            title={t.toolbar.fontColor}
            style={{ color: fontSettings.fontColor }}
          >
            A
          </button>
          <div className="color-dropdown">
            {COLORS.map(color => (
              <div
                key={color}
                className={`color-option ${fontSettings.fontColor === color ? 'selected' : ''}`}
                style={{ backgroundColor: color }}
                onClick={() => onFontChange({ fontColor: color })}
              />
            ))}
          </div>
        </div>

        <div className="toolbar-divider" />
        <ThemeSwitcher />
      </div>
    </div>
  )
}
