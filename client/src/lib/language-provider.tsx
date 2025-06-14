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

  // Set language from user preferences or browser
  useEffect(() => {
    if (user?.language && user.language in translations) {
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
    
    // Save language preference to user profile
    if (user) {
      try {
        const response = await fetch('/api/profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ language: lang }),
        });
        
        if (!response.ok) {
          throw new Error('Failed to save language preference');
        }
        
        // Force a re-render by updating the state again after successful save
        setLanguageState(lang);
      } catch (error) {
        console.warn('Failed to save language preference:', error);
        // Revert to previous language if save failed
        if (user?.language) {
          setLanguageState(user.language as Language);
        }
      }
    }
  };

  const t = (key: string) => {
    const translation = getTranslation(language, key);
    console.log(`Translation: ${key} -> ${translation} (lang: ${language})`);
    return translation;
  };

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