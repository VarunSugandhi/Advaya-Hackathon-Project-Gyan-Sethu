
import React, { createContext, useContext, useEffect, useState } from 'react';
import { en } from '../locales/en';
import { kn } from '../locales/kn';

export type LanguageCode = 'en' | 'kn';
type Translations = typeof en;

interface LanguageContextType {
  language: LanguageCode;
  t: (key: keyof typeof en) => string;
  changeLanguage: (lang: LanguageCode) => void;
}

const translations: Record<LanguageCode, Translations> = {
  en,
  kn,
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<LanguageCode>('en');

  // Load language from localStorage on mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') as LanguageCode | null;
    if (savedLanguage && Object.keys(translations).includes(savedLanguage)) {
      setLanguage(savedLanguage);
    }
  }, []);

  // Save language preference to localStorage
  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  const t = (key: keyof typeof en): string => {
    return translations[language][key] || translations.en[key] || key;
  };

  const changeLanguage = (lang: LanguageCode) => {
    if (Object.keys(translations).includes(lang)) {
      setLanguage(lang);
    }
  };

  return (
    <LanguageContext.Provider value={{ language, t, changeLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
