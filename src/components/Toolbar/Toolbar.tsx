import React from 'react'
import { useTheme } from '../../contexts/ThemeContext'
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
}

const COLORS = ['#ffffff', '#e0e0ff', '#00ff88', '#ffcc00', '#ff6b6b', '#7ddf90', '#daa520', '#ff69b4', '#87ceeb']

export default function Toolbar({ previewMode, onTogglePreview, onInsertMarkdown, fontSettings, onFontChange }: ToolbarProps) {
  const { theme } = useTheme()

  return (
    <div className={`toolbar theme-${theme}`}>
      <div className="toolbar-section">
        <button
          className={`toolbar-btn ${previewMode ? 'active' : ''}`}
          onClick={onTogglePreview}
          title={previewMode ? '切换到编辑' : '预览 Markdown'}
        >
          {previewMode ? '✏️' : '👁️'}
        </button>
        <div className="toolbar-divider" />

        <button className="toolbar-btn" onClick={() => onInsertMarkdown('heading')} title="标题">H</button>
        <button className="toolbar-btn" onClick={() => onInsertMarkdown('bold')} title="粗体"><b>B</b></button>
        <button className="toolbar-btn" onClick={() => onInsertMarkdown('italic')} title="斜体"><i>I</i></button>
        <button className="toolbar-btn" onClick={() => onInsertMarkdown('code')} title="代码">{'<>'}</button>

        <div className="toolbar-divider" />

        <button className="toolbar-btn" onClick={() => onInsertMarkdown('list')} title="列表">•≡</button>
        <button className="toolbar-btn" onClick={() => onInsertMarkdown('todo')} title="待办事项">☑</button>
        <button className="toolbar-btn" onClick={() => onInsertMarkdown('quote')} title="引用">❝</button>
        <button className="toolbar-btn" onClick={() => onInsertMarkdown('link')} title="链接">🔗</button>
      </div>

      <div className="toolbar-section">
        <div className="toolbar-divider" />

        <select
          className="font-size-select"
          value={fontSettings.fontSize}
          onChange={(e) => onFontChange({ fontSize: parseInt(e.target.value) })}
          title="字体大小"
        >
          {[10, 12, 14, 16, 18, 20, 24, 28].map(size => (
            <option key={size} value={size}>{size}px</option>
          ))}
        </select>

        <button
          className={`toolbar-btn ${fontSettings.fontWeight === 'bold' ? 'active' : ''}`}
          onClick={() => onFontChange({ fontWeight: fontSettings.fontWeight === 'bold' ? 'normal' : 'bold' })}
          title="加粗"
        >
          <b>B</b>
        </button>

        <div className="color-picker-wrapper">
          <button
            className="toolbar-btn color-btn"
            title="字体颜色"
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
