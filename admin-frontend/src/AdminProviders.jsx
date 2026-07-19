import { BrowserRouter } from "react-router-dom";
import { LanguageProvider } from "@shared/context/LanguageContext";
import { ThemeProvider } from "@shared/context/ThemeContext";

export default function AdminProviders({ children }) {
  return (
    <LanguageProvider>
      <ThemeProvider>
        <BrowserRouter>{children}</BrowserRouter>
      </ThemeProvider>
    </LanguageProvider>
  );
}
