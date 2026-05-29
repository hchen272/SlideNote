import React from 'react'
import { useTheme } from '../../contexts/ThemeContext'
import { useLang } from '../../i18n'
import type { ThemeName } from '../../types'
import './ThemeSwitcher.css'

const themeIcons: Record<ThemeName, string> = {
  cyberpunk: '🌆',
  nature: '🌿',
  medieval: '🏰',
}

export default function ThemeSwitcher() {
  const { theme, setTheme, themes } = useTheme()
  const { t } = useLang()

  return (
    <div className="theme-switcher">
      <div className="theme-dropdown-wrapper">
        <button className="theme-current" title={t.toolbar.switchTheme}>
          {themeIcons[theme]}
        </button>
        <div className="theme-dropdown">
          {themes.map(th => (
            <button
              key={th}
              className={`theme-option ${th === theme ? 'selected' : ''}`}
              onClick={() => setTheme(th)}
              title={t.theme[th]}
            >
              <span className="theme-option-icon">{themeIcons[th]}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
