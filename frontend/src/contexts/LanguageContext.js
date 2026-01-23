import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations, getTranslation } from '../i18n/translations';

const LanguageContext = createContext();

export const languages = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦', rtl: true },
  { code: 'nl', name: 'Nederlands', flag: '🇳🇱' }
];

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    const saved = localStorage.getItem('homedeco-language');
    return saved || 'en';
  });

  useEffect(() => {
    localStorage.setItem('homedeco-language', language);
    // Set RTL for Arabic
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  }, [language]);

  const t = (path) => getTranslation(language, path);

  const value = {
    language,
    setLanguage,
    t,
    languages,
    isRTL: language === 'ar'
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
