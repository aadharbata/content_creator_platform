"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { Language, getTranslations } from '@/lib/translations'

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  translations: ReturnType<typeof getTranslations>
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export const useLanguage = () => {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}

interface LanguageProviderProps {
  children: ReactNode
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('en')

  useEffect(() => {
    // Read language preference from localStorage
    // Check both 'selectedLanguage' (from landing page) and 'language' (from app)
    const savedLanguage = localStorage.getItem('selectedLanguage') || localStorage.getItem('language') || 'en'
    
    // Validate that the saved language is supported
    if (savedLanguage === 'en' || savedLanguage === 'hi') {
      setLanguageState(savedLanguage as Language)
      // Ensure both keys are set for consistency
      localStorage.setItem('language', savedLanguage)
      localStorage.setItem('selectedLanguage', savedLanguage)
    } else {
      // Default to English if invalid language
      setLanguageState('en')
      localStorage.setItem('language', 'en')
      localStorage.setItem('selectedLanguage', 'en')
    }
  }, [])

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    // Save to both keys for consistency
    localStorage.setItem('language', lang)
    localStorage.setItem('selectedLanguage', lang)
  }

  const translations = getTranslations(language)

  return (
    <LanguageContext.Provider value={{ language, setLanguage, translations }}>
      {children}
    </LanguageContext.Provider>
  )
} 