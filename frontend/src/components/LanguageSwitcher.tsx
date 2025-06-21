import React from 'react';
import { useTranslation } from 'react-i18next';

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();

  const changeLanguage = (language: string) => {
    i18n.changeLanguage(language);
    localStorage.setItem('selectedLanguage', language);
  };

  return (
    <div className="mr-4">
      <select
        value={i18n.language}
        onChange={(e) => changeLanguage(e.target.value)}
        className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-sm"
      >
        <option value="en">🇺🇸 English</option>
        <option value="hi">🇮🇳 हिंदी</option>
      </select>
    </div>
  );
};

export default LanguageSwitcher; 