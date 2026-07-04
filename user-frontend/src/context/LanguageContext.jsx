import { useCallback, useEffect, useMemo, useState } from "react";
import i18n from "../i18n";
import { translations } from "../i18n/translations";
import { LanguageContext } from "./language-context";
import {
  publishLanguageChange,
  subscribeRealtimeEvent,
} from "../services/realtime";

const STORAGE_KEY = "language";
const DEFAULT_LANGUAGE = "en";
const PORTAL_PATH_PREFIXES = ["/admin", "/seller", "/delivery"];

const normalizeLanguage = (language) => (language === "km" ? "kh" : language);

const getEffectiveLanguage = (language) => {
  const normalizedLanguage = normalizeLanguage(language);

  if (typeof window === "undefined") {
    return normalizedLanguage;
  }

  return PORTAL_PATH_PREFIXES.some((prefix) => window.location.pathname.startsWith(prefix))
    ? DEFAULT_LANGUAGE
    : normalizedLanguage;
};

const getInitialLanguage = () => {
  if (typeof window === "undefined") {
    return DEFAULT_LANGUAGE;
  }

  const storedLanguage = normalizeLanguage(window.localStorage.getItem(STORAGE_KEY));
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

  useEffect(() => {
    const unsubscribe = subscribeRealtimeEvent("language:changed", (payload) => {
      const normalizedLanguage = normalizeLanguage(payload?.language);

      if (!translations[normalizedLanguage]) {
        return;
      }

      setLanguageState((currentLanguage) => {
        if (currentLanguage === normalizedLanguage) {
          return currentLanguage;
        }

        window.localStorage.setItem(STORAGE_KEY, normalizedLanguage);
        return normalizedLanguage;
      });
    });

    return unsubscribe;
  }, []);

  const setLanguage = useCallback((nextLanguage) => {
    const normalizedLanguage = normalizeLanguage(nextLanguage);

    if (!translations[normalizedLanguage] || normalizedLanguage === language) {
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, normalizedLanguage);
    setLanguageState(normalizedLanguage);
    publishLanguageChange(normalizedLanguage);
  }, [language]);

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
      isKhmer: getEffectiveLanguage(language) === "kh",
    }),
    [language, setLanguage, t]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};
