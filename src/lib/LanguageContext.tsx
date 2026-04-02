import React, { createContext, useContext, useEffect, useState } from 'react';
import type { Language } from './i18n';
import { getTranslation } from './i18n';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('language');
    if (saved === 'en' || saved === 'zh') {
      setLanguageState(saved);
    } else {
      // Default to browser language or 'en'
      const browserLang = navigator.language.toLowerCase();
      setLanguageState(browserLang.startsWith('zh') ? 'zh' : 'en');
    }
    setIsMounted(true);
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
  };

  const t = (key: string) => getTranslation(language, key);

  // Don't render children until mounted to prevent hydration mismatch
  if (!isMounted) {
    return <LanguageContext.Provider value={{ language: 'en', setLanguage, t }}>{children}</LanguageContext.Provider>;
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
}
