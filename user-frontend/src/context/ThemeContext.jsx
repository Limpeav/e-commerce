import { useCallback, useLayoutEffect, useState } from "react";
import { ThemeContext } from "./theme-context";

const THEME_MODES = ["light", "dark"];
const THEME_COLORS = {
  light: "#FCF9F5",
  dark: "#1A1C1B",
};

const getInitialThemeMode = () => {
  const stored = localStorage.getItem("theme");
  return THEME_MODES.includes(stored) ? stored : "light";
};

const applyThemeMode = (mode) => {
  const resolvedDark = mode === "dark";
  const html = document.documentElement;

  html.dataset.theme = mode;
  html.classList.toggle("dark", resolvedDark);
  html.style.colorScheme = resolvedDark ? "dark" : "light";
  document
    .querySelector("#theme-color")
    ?.setAttribute("content", THEME_COLORS[mode]);
  document
    .querySelector("#apple-status-bar-style")
    ?.setAttribute("content", resolvedDark ? "black" : "default");

  return resolvedDark;
};

export const ThemeProvider = ({ children }) => {
  const [themeMode, setStoredThemeMode] = useState(getInitialThemeMode);

  const isDark = themeMode === "dark";

  const setThemeMode = useCallback((nextMode) => {
    setStoredThemeMode((currentMode) => {
      const resolvedMode =
        typeof nextMode === "function" ? nextMode(currentMode) : nextMode;
      const safeMode = THEME_MODES.includes(resolvedMode) ? resolvedMode : "light";

      applyThemeMode(safeMode);
      localStorage.setItem("theme", safeMode);

      return safeMode;
    });
  }, []);

  useLayoutEffect(() => {
    applyThemeMode(themeMode);
    localStorage.setItem("theme", themeMode);
  }, [themeMode]);

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
