import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import zh from './zh'
import en from './en'
import type { Translations } from './zh'

export type Language = 'zh' | 'en'

const translations: Record<Language, Translations> = { zh, en }

interface LanguageContextType {
  lang: Language
  setLang: (lang: Language) => void
  t: Translations
}

const LanguageContext = createContext<LanguageContextType>({
  lang: 'zh',
  setLang: () => {},
  t: zh,
})

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>('zh')

  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.getStore('language').then((saved: string) => {
        if (saved === 'zh' || saved === 'en') {
          setLangState(saved)
        }
      })
    }
  }, [])

  const setLang = useCallback((newLang: Language) => {
    setLangState(newLang)
    if (window.electronAPI) {
      window.electronAPI.setStore('language', newLang)
    }
  }, [])

  return (
    <LanguageContext.Provider value={{ lang, setLang, t: translations[lang] }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLang() {
  return useContext(LanguageContext)
}
