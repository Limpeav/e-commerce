import { useTheme } from "../context/ThemeContext";

export const useDarkMode = () => {
  const { isDark, toggleDarkMode } = useTheme();
  return [isDark, toggleDarkMode];
};
