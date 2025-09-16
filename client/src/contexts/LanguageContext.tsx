import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocation } from 'wouter';

export type Language = 'en' | 'he' | 'fr' | 'es';

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');
  const [location, setLocation] = useLocation();

  // Get browser language preference on mount and sync with URL
  useEffect(() => {
    // First, check if there's a language in the URL
    const pathSegments = location.split('/').filter(Boolean);
    const urlLanguage = pathSegments[0];
    
    if (['en', 'he', 'fr', 'es'].includes(urlLanguage)) {
      setLanguageState(urlLanguage as Language);
      localStorage.setItem('preferred-language', urlLanguage);
    } else {
      // If no language in URL, use saved preference or browser language
      const savedLanguage = localStorage.getItem('preferred-language') as Language;
      if (savedLanguage && ['en', 'he', 'fr', 'es'].includes(savedLanguage)) {
        setLanguageState(savedLanguage);
        // Redirect to include language in URL if not English
        if (savedLanguage !== 'en') {
          setLocation(`/${savedLanguage}${location}`);
        }
      } else {
        // Detect from browser
        const browserLang = navigator.language.split('-')[0];
        if (['en', 'he', 'fr', 'es'].includes(browserLang)) {
          setLanguageState(browserLang as Language);
          localStorage.setItem('preferred-language', browserLang);
          // Redirect to include language in URL if not English
          if (browserLang !== 'en') {
            setLocation(`/${browserLang}${location}`);
          }
        }
      }
    }
  }, [location, setLocation]);

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

  // Helper function to get path without language prefix
  const getPathWithoutLanguage = (path: string) => {
    const segments = path.split('/').filter(Boolean);
    if (['en', 'he', 'fr', 'es'].includes(segments[0])) {
      return '/' + segments.slice(1).join('/');
    }
    return path;
  };

  const setLanguage = (newLanguage: Language) => {
    setLanguageState(newLanguage);
    localStorage.setItem('preferred-language', newLanguage);
    
    // Update URL to include language prefix
    const currentPath = getPathWithoutLanguage(location);
    const newPath = newLanguage === 'en' ? currentPath : `/${newLanguage}${currentPath}`;
    
    if (newPath !== location) {
      setLocation(newPath);
    }
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
