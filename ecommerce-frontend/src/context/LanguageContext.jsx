import { useCallback, useEffect, useMemo, useState } from "react";
import i18n from "../i18n";
import { translations } from "../i18n/translations";
import { LanguageContext } from "./language-context";

const STORAGE_KEY = "language";
const DEFAULT_LANGUAGE = "en";

const getInitialLanguage = () => {
  if (typeof window === "undefined") {
    return DEFAULT_LANGUAGE;
  }

  const storedLanguage = window.localStorage.getItem(STORAGE_KEY);
  return translations[storedLanguage] ? storedLanguage : DEFAULT_LANGUAGE;
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState(getInitialLanguage);

  useEffect(() => {
    i18n.changeLanguage(language);
    document.documentElement.lang = language;
    document.documentElement.dataset.language = language;
    window.localStorage.setItem(STORAGE_KEY, language);
  }, [language]);

  const setLanguage = useCallback((nextLanguage) => {
    if (translations[nextLanguage]) {
      setLanguageState(nextLanguage);
    }
  }, []);

  const t = useCallback(
    (key, options = {}) => i18n.t(key, { ...options, lng: language, defaultValue: key }),
    [language]
  );

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t,
      isKhmer: language === "km",
    }),
    [language, setLanguage, t]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};
