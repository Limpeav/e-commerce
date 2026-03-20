import { createContext, useContext, useEffect, useMemo, useState } from "react";

const THEME_STORAGE_KEY = "theme";
const ThemeContext = createContext(null);

const getStoredTheme = () => {
  if (typeof window === "undefined") {
    return null;
  }

  return localStorage.getItem(THEME_STORAGE_KEY);
};

const getSystemPrefersDark = () => {
  if (typeof window === "undefined") {
    return false;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches;
};

const resolveIsDark = (theme) => {
  if (theme === "dark") {
    return true;
  }

  if (theme === "light") {
    return false;
  }

  return getSystemPrefersDark();
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => getStoredTheme());
  const [isDark, setIsDark] = useState(() => resolveIsDark(getStoredTheme()));

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
    document.documentElement.style.colorScheme = isDark ? "dark" : "light";
  }, [isDark]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleSystemThemeChange = (event) => {
      if (!theme) {
        setIsDark(event.matches);
      }
    };

    mediaQuery.addEventListener("change", handleSystemThemeChange);

    return () => {
      mediaQuery.removeEventListener("change", handleSystemThemeChange);
    };
  }, [theme]);

  const toggleDarkMode = (nextValue) => {
    const resolvedValue = typeof nextValue === "boolean" ? nextValue : !isDark;
    const nextTheme = resolvedValue ? "dark" : "light";
    localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    setTheme(nextTheme);
    setIsDark(resolvedValue);
  };

  const value = useMemo(() => ({
    isDark,
    toggleDarkMode,
    theme,
  }), [isDark, theme]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }

  return context;
};
