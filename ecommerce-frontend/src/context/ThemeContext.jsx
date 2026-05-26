import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useState } from "react";

const ThemeContext = createContext();
const THEME_MODES = ["light", "dark", "system"];

const getInitialThemeMode = () => {
  const stored = localStorage.getItem("theme");
  return THEME_MODES.includes(stored) ? stored : "system";
};

const applyThemeMode = (mode, systemPrefersDark) => {
  const resolvedDark = mode === "system" ? systemPrefersDark : mode === "dark";
  const html = document.documentElement;

  html.dataset.theme = mode;
  html.classList.toggle("dark", resolvedDark);
  html.style.colorScheme = resolvedDark ? "dark" : "light";

  return resolvedDark;
};

export const ThemeProvider = ({ children }) => {
  const [themeMode, setStoredThemeMode] = useState(getInitialThemeMode);
  const [systemPrefersDark, setSystemPrefersDark] = useState(() =>
    window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false
  );

  const isDark = themeMode === "system" ? systemPrefersDark : themeMode === "dark";

  const setThemeMode = useCallback((nextMode) => {
    setStoredThemeMode((currentMode) => {
      const resolvedMode =
        typeof nextMode === "function" ? nextMode(currentMode) : nextMode;
      const safeMode = THEME_MODES.includes(resolvedMode) ? resolvedMode : "system";

      applyThemeMode(safeMode, systemPrefersDark);
      localStorage.setItem("theme", safeMode);

      return safeMode;
    });
  }, [systemPrefersDark]);

  useEffect(() => {
    const mediaQuery = window.matchMedia?.("(prefers-color-scheme: dark)");
    if (!mediaQuery) return undefined;

    const handleChange = (event) => {
      setSystemPrefersDark(event.matches);
    };

    setSystemPrefersDark(mediaQuery.matches);
    mediaQuery.addEventListener("change", handleChange);

    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, []);

  useLayoutEffect(() => {
    applyThemeMode(themeMode, systemPrefersDark);
    localStorage.setItem("theme", themeMode);
  }, [systemPrefersDark, themeMode]);

  const cycleThemeMode = () => {
    setThemeMode((currentMode) => {
      const currentIndex = THEME_MODES.indexOf(currentMode);
      return THEME_MODES[(currentIndex + 1) % THEME_MODES.length];
    });
  };

  const toggleDarkMode = cycleThemeMode;

  return (
    <ThemeContext.Provider value={{ isDark, themeMode, setThemeMode, toggleDarkMode, cycleThemeMode }}>
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

export default ThemeContext;
