import { authService } from "../services/authService.js";
import { UserModel } from "../models/userModel.js";

// Auth Controller - Handles authentication logic
export class AuthController {
  static async login(credentials, navigate) {
    try {
      const authData = await authService.login(credentials);
      const storedUser = authService.persistUser(authData);

      if (navigate) {
        navigate("/");
      }

      return { success: true, data: storedUser };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  static async register(userData, navigate) {
    try {
      const validation = UserModel.validate(userData);
      if (!validation.isValid) {
        return { success: false, error: validation.errors[0] };
      }

      const authData = await authService.register(userData);
      const storedUser = authService.persistUser(authData);

      if (navigate) {
        navigate("/");
      }

      return { success: true, data: storedUser };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  static logout(navigate) {
    authService.logout();
    if (navigate) {
      navigate("/login");
    }
  }

  static getCurrentUser() {
    return authService.getCurrentUser();
  }

  static isAuthenticated() {
    return authService.isAuthenticated();
  }

  static getUserRole() {
    const user = authService.getCurrentUser();
    return user?.role || "user";
  }

  static isAdmin() {
    return this.getUserRole() === "admin";
  }
}
