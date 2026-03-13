"use client";

import {
  type AppLocale,
  defaultLocale,
  getMessages,
  isAppLocale,
  supportedLanguages,
} from "@/app/i18n/messages";
import { createContext, useContext, useEffect, useState } from "react";

const LOCALE_STORAGE_KEY = "app-locale";

type LocaleContextType = {
  locale: AppLocale;
  setLocale: (nextLocale: AppLocale) => void;
  messages: ReturnType<typeof getMessages>;
  supportedLanguages: typeof supportedLanguages;
};

const LocaleContext = createContext<LocaleContextType | null>(null);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<AppLocale>(() => {
    if (typeof window === "undefined") {
      return defaultLocale;
    }

    const storedLocale = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    return isAppLocale(storedLocale) ? storedLocale : defaultLocale;
  });

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = locale;
    }

    if (typeof window !== "undefined") {
      window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
    }
  }, [locale]);

  return (
    <LocaleContext.Provider
      value={{
        locale,
        setLocale: setLocaleState,
        messages: getMessages(locale),
        supportedLanguages,
      }}
    >
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const context = useContext(LocaleContext);

  if (!context) {
    throw new Error("useLocale must be used within LocaleProvider");
  }

  return context;
}
