"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  detectPreferredLanguage,
  LANGUAGE_STORAGE_KEY,
  type Language,
} from "@/lib/i18n";

interface LanguageContextValue {
  readonly language: Language;
  readonly setLanguage: (language: Language) => void;
  readonly toggleLanguage: () => void;
}

const LanguageContext = createContext<LanguageContextValue>({
  language: "en",
  setLanguage: () => {},
  toggleLanguage: () => {},
});

export function useLanguage(): LanguageContextValue {
  return useContext(LanguageContext);
}

export function LanguageProvider({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [language, setLanguageState] = useState<Language>("en");

  useEffect(() => {
    setLanguageState(detectPreferredLanguage());
  }, []);

  const setLanguage = useCallback((next: Language) => {
    setLanguageState(next);
    document.documentElement.lang = next === "zh" ? "zh-CN" : "en";
    document.documentElement.setAttribute("data-language", next);

    try {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, next);
    } catch {
      // Ignore storage failures and keep the current session functional.
    }
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguage(language === "en" ? "zh" : "en");
  }, [language, setLanguage]);

  return (
    <LanguageContext value={{ language, setLanguage, toggleLanguage }}>
      {children}
    </LanguageContext>
  );
}
