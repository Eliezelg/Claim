import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'en' | 'he' | 'fr' | 'es';

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');

  // Get browser language preference on mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem('preferred-language') as Language;
    if (savedLanguage && ['en', 'he', 'fr', 'es'].includes(savedLanguage)) {
      setLanguageState(savedLanguage);
    } else {
      // Detect from browser
      const browserLang = navigator.language.split('-')[0];
      if (['en', 'he', 'fr', 'es'].includes(browserLang)) {
        setLanguageState(browserLang as Language);
      }
    }
  }, []);

  // Update document attributes when language changes
  useEffect(() => {
    document.documentElement.setAttribute('lang', language);
    document.documentElement.setAttribute('dir', language === 'he' ? 'rtl' : 'ltr');
    
    if (language === 'he') {
      document.body.classList.add('rtl');
    } else {
      document.body.classList.remove('rtl');
    }
  }, [language]);

  const setLanguage = (newLanguage: Language) => {
    setLanguageState(newLanguage);
    localStorage.setItem('preferred-language', newLanguage);
  };

  const isRTL = language === 'he';

  return (
    <LanguageContext.Provider value={{ language, setLanguage, isRTL }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
