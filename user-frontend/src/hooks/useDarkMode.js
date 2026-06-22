import { useTheme } from "../context/ThemeContext";

export const useDarkMode = () => {
  const { isDark, toggleDarkMode, themeMode, setThemeMode, cycleThemeMode } = useTheme();
  return [isDark, toggleDarkMode, themeMode, setThemeMode, cycleThemeMode];
};
