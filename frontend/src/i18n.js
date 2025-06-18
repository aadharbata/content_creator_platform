import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import enTranslation from './locales/en/translation.json';
import hiTranslation from './locales/hi/translation.json';

const languageDetector = new LanguageDetector();
languageDetector.addDetector({
  name: 'customDetector',
  lookup() {
    const stored = localStorage.getItem('selectedLanguage');
    if (stored) return stored;
    const browserLang = navigator.language || navigator.userLanguage;
    if (browserLang.startsWith('hi')) return 'hi';
    return 'en';
  }
});

i18n
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    debug: false,
    fallbackLng: 'en',
    detection: {
      order: ['customDetector', 'localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'selectedLanguage',
    },
    resources: {
      en: { translation: enTranslation },
      hi: { translation: hiTranslation },
    },
    interpolation: { escapeValue: false },
  });

export default i18n; 