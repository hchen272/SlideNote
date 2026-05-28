import React, { useState, useEffect } from 'react'
import { useTheme } from '../../contexts/ThemeContext'
import './SettingsModal.css'

interface Props {
  isOpen: boolean
  onClose: () => void
}

export default function SettingsModal({ isOpen, onClose }: Props) {
  const { theme } = useTheme()
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
          <span>设置</span>
          <button className="settings-close" onClick={onClose}>✕</button>
        </div>

        <div className="settings-body">
          <label className="settings-label">数据存储路径</label>
          <div className="settings-path-row">
            <input
              className="settings-input"
              value={newPath}
              onChange={e => setNewPath(e.target.value)}
              placeholder="输入文件夹路径..."
            />
            <button className="settings-save-btn" onClick={handleSave}>保存</button>
          </div>
          {saved && (
            <p className="settings-hint">
              ✅ 路径已保存。下次启动应用时将使用新路径。<br />
              当前数据仍在原位置，如需迁移请手动复制。
            </p>
          )}
          <p className="settings-current">当前路径：{dataPath}</p>
        </div>
      </div>
    </div>
  )
}
