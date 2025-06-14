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

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
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