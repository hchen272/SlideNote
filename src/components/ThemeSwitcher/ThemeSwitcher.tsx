import React from 'react'
import { useTheme } from '../../contexts/ThemeContext'
import type { ThemeName } from '../../types'
import './ThemeSwitcher.css'

const themeInfo: Record<ThemeName, { label: string; icon: string }> = {
  cyberpunk: { label: '赛博朋克', icon: '🌆' },
  nature: { label: '自然', icon: '🌿' },
  medieval: { label: '中世纪', icon: '🏰' },
}

export default function ThemeSwitcher() {
  const { theme, setTheme, themes } = useTheme()

  return (
    <div className="theme-switcher">
      <div className="theme-dropdown-wrapper">
        <button className="theme-current" title="切换主题">
          {themeInfo[theme].icon}
        </button>
        <div className="theme-dropdown">
          {themes.map(t => (
            <button
              key={t}
              className={`theme-option ${t === theme ? 'selected' : ''}`}
              onClick={() => setTheme(t)}
              title={themeInfo[t].label}
            >
              <span className="theme-option-icon">{themeInfo[t].icon}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
