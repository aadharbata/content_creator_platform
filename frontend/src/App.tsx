import React from 'react';
import './i18n';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './components/LanguageSwitcher';
// import other components as needed

const App: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
  const { t } = useTranslation();

  return (
    <div>
      <header className="flex items-center justify-between px-4 py-2 bg-white/80 border-b border-white/20">
        <div className="flex items-center space-x-2">
          <span className="font-bold text-xl">LearnHub</span>
        </div>
        <div className="flex items-center space-x-2">
          <LanguageSwitcher />
          <button className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition" type="button">
            {t('nav.signIn')}
          </button>
          <button className="px-4 py-2 rounded-lg bg-orange-500 text-white font-semibold hover:bg-orange-600 transition" type="button">
            {t('nav.signUp')}
          </button>
        </div>
      </header>
      {/* Render children or main content here */}
      {children}
    </div>
  );
};

export default App; 