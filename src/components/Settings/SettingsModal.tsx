import React, { useState, useEffect } from 'react'
import { useTheme } from '../../contexts/ThemeContext'
import { useLang, Language } from '../../i18n'
import './SettingsModal.css'

interface Props {
  isOpen: boolean
  onClose: () => void
}

export default function SettingsModal({ isOpen, onClose }: Props) {
  const { theme } = useTheme()
  const { lang, setLang, t } = useLang()
  const [dataPath, setDataPath] = useState('')
  const [newPath, setNewPath] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (isOpen) {
      window.electronAPI?.getDataPath().then(p => {
        setDataPath(p)
        setNewPath(p)
        setSaved(false)
      })
    }
  }, [isOpen])

  const handleSave = async () => {
    if (!newPath.trim()) return
    await window.electronAPI?.setDataPath(newPath.trim())
    setDataPath(newPath.trim())
    setSaved(true)
  }

  if (!isOpen) return null

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className={`settings-modal theme-${theme}`} onClick={e => e.stopPropagation()}>
        <div className="settings-header">
          <span>{t.settings.title}</span>
          <button className="settings-close" onClick={onClose}>✕</button>
        </div>

        <div className="settings-body">
          <label className="settings-label">{t.settings.languageLabel}</label>
          <div className="settings-path-row">
            <select
              className="settings-input"
              value={lang}
              onChange={e => setLang(e.target.value as Language)}
            >
              <option value="zh">中文</option>
              <option value="en">English</option>
            </select>
          </div>
          <p className="settings-current" style={{ marginBottom: 16 }}>{t.settings.languageHint}</p>

          <label className="settings-label">{t.settings.dataPathLabel}</label>
          <div className="settings-path-row">
            <input
              className="settings-input"
              value={newPath}
              onChange={e => setNewPath(e.target.value)}
              placeholder="C:\Users\..."
            />
            <button
              className="settings-browse-btn"
              onClick={async () => {
                const folder = await window.electronAPI?.pickFolder()
                if (folder) setNewPath(folder)
              }}
            >
              ...
            </button>
            <button className="settings-save-btn" onClick={handleSave}>{t.settings.save}</button>
          </div>
          {saved && (
            <p className="settings-hint">
              {t.settings.pathHint}
            </p>
          )}
          <p className="settings-current">{t.settings.currentPath}{dataPath}</p>
        </div>
      </div>
    </div>
  )
}
