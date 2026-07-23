import { useState, useEffect } from "react";
import { ThemeContext } from "./theme-context";

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    document.documentElement.classList.remove("dark");
    localStorage.setItem("theme", "light");
  }, []);

  const toggleDarkMode = () => {
    setIsDark(false);
    document.documentElement.classList.remove("dark");
    localStorage.setItem("theme", "light");
  };

  return (
    <ThemeContext.Provider value={{ isDark, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
};
