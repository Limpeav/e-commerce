import { useEffect, useState } from "react";
import { AuthController } from "../controllers/index.js";
import { AuthContext } from "./auth-context";
import { AUTH_SESSION_EXPIRED_EVENT } from "../services/authService.js";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => AuthController.getCurrentUser());

  useEffect(() => {
    const handleSessionExpired = () => setUser(null);

    window.addEventListener(AUTH_SESSION_EXPIRED_EVENT, handleSessionExpired);
    return () => window.removeEventListener(AUTH_SESSION_EXPIRED_EVENT, handleSessionExpired);
  }, []);

  const login = (userData) => {
    if (!userData?.token) {
      AuthController.logout();
      setUser(null);
      return;
    }

    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    AuthController.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
