import enTranslations from './en.json'
import hiTranslations from './hi.json'

export type Language = 'en' | 'hi'

const translations = {
  en: enTranslations,
  hi: hiTranslations
}

export const getTranslations = (language: Language) => {
  return translations[language]
} 