import { BrowserRouter } from "react-router-dom";
import { LanguageProvider } from "@shared/context/LanguageContext";
import { ThemeProvider } from "@shared/context/ThemeContext";
import { CurrencyProvider } from "@shared/context/CurrencyContext";

export default function AdminProviders({ children }) {
  return (
    <LanguageProvider>
      <ThemeProvider>
        <BrowserRouter>
          <CurrencyProvider>{children}</CurrencyProvider>
        </BrowserRouter>
      </ThemeProvider>
    </LanguageProvider>
  );
}
