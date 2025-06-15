import React, { createContext, useContext, useEffect, useState } from "react";
import { languages, translations, type Language, getTranslation } from "./i18n";
import { useAuth } from "@/hooks/use-auth";

type LanguageContextType = {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  languages: typeof languages;
};

const LanguageContext = createContext<LanguageContextType | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [language, setLanguageState] = useState<Language>("en");

  // Initialize language from localStorage or browser preference
  useEffect(() => {
    const savedLang = localStorage.getItem('preferred-language') as Language;
    if (savedLang && savedLang in translations) {
      setLanguageState(savedLang);
    } else if (user?.language && user.language in translations) {
      setLanguageState(user.language as Language);
    } else {
      // Fallback to browser language
      const browserLang = navigator.language.split('-')[0] as Language;
      if (browserLang in translations) {
        setLanguageState(browserLang);
      }
    }
  }, [user]);

  const setLanguage = async (lang: Language) => {
    // Update the language state immediately for instant UI feedback
    setLanguageState(lang);
    
    // Save to localStorage for immediate persistence
    localStorage.setItem('preferred-language', lang);
    
    // Save language preference to user profile if user is logged in
    if (user) {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/profile`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ language: lang }),
        });
        
        if (!response.ok) {
          console.warn('Failed to save language preference to profile');
        }
      } catch (error) {
        console.warn('Failed to save language preference:', error);
      }
    }
  };

  const t = (key: string) => getTranslation(language, key);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, languages }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return context;
}