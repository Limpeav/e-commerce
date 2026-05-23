import { useCallback, useEffect, useMemo, useState } from "react";
import i18n from "../i18n";
import { translations } from "../i18n/translations";
import { LanguageContext } from "./language-context";

const STORAGE_KEY = "language";
const DEFAULT_LANGUAGE = "en";
const PORTAL_PATH_PREFIXES = ["/admin", "/seller", "/delivery"];

const getEffectiveLanguage = (language) => {
  if (typeof window === "undefined") {
    return language;
  }

  return PORTAL_PATH_PREFIXES.some((prefix) => window.location.pathname.startsWith(prefix))
    ? DEFAULT_LANGUAGE
    : language;
};

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
    const effectiveLanguage = getEffectiveLanguage(language);

    i18n.changeLanguage(effectiveLanguage);
    document.documentElement.lang = effectiveLanguage;
    document.documentElement.dataset.language = effectiveLanguage;
    window.localStorage.setItem(STORAGE_KEY, language);
  }, [language]);

  const setLanguage = useCallback((nextLanguage) => {
    if (translations[nextLanguage]) {
      setLanguageState(nextLanguage);
    }
  }, []);

  const t = useCallback(
    (key, options = {}) =>
      i18n.t(key, { ...options, lng: getEffectiveLanguage(language), defaultValue: key }),
    [language]
  );

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t,
      isKhmer: getEffectiveLanguage(language) === "km",
    }),
    [language, setLanguage, t]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};
