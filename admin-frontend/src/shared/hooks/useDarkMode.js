import { useTheme } from "../context/useTheme";

export const useDarkMode = () => {
  const { isDark, toggleDarkMode } = useTheme();
  return [isDark, toggleDarkMode];
};
