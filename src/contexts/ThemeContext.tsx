import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import type { ThemeName } from '../types'

interface ThemeContextType {
  theme: ThemeName
  setTheme: (theme: ThemeName) => void
  themes: ThemeName[]
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'cyberpunk',
  setTheme: () => {},
  themes: ['cyberpunk', 'nature', 'medieval', 'minimal'],
})

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeName>('cyberpunk')
  const themes: ThemeName[] = ['cyberpunk', 'nature', 'medieval', 'minimal']

  useEffect(() => {
    // Load saved theme
    if (window.electronAPI) {
      window.electronAPI.getStore('theme').then((saved: ThemeName) => {
        if (saved && themes.includes(saved)) {
          setThemeState(saved)
        }
      })
    }
  }, [])

  const setTheme = useCallback((newTheme: ThemeName) => {
    setThemeState(newTheme)
    if (window.electronAPI) {
      window.electronAPI.setStore('theme', newTheme)
    }
  }, [])

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themes }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
