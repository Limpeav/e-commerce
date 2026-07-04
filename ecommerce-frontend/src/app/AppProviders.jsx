import { BrowserRouter } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { HelmetProvider } from "react-helmet-async";
import { ThemeProvider } from "../context/ThemeContext";
import { AuthProvider } from "../context/AuthContext";
import { ToastProvider } from "../context/ToastContext";
import { CartProvider } from "../context/CartContext";
import { WishlistProvider } from "../context/WishlistContext";
import { LanguageProvider } from "../context/LanguageContext";
import { CurrencyProvider } from "../context/CurrencyContext";

export default function AppProviders({ children }) {
  return (
    <HelmetProvider>
      <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
        <LanguageProvider>
          <ThemeProvider>
            <BrowserRouter>
              <AuthProvider>
                <ToastProvider>
                  <CartProvider>
                    <WishlistProvider>
                      <CurrencyProvider>{children}</CurrencyProvider>
                    </WishlistProvider>
                  </CartProvider>
                </ToastProvider>
              </AuthProvider>
            </BrowserRouter>
          </ThemeProvider>
        </LanguageProvider>
      </GoogleOAuthProvider>
    </HelmetProvider>
  );
}
