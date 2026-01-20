import { authService } from '../services/authService.js'
import { useAuth } from '../context/AuthContext'

// Auth Controller - Handles authentication logic
export class AuthController {
  // Login controller
  static async login(credentials, navigate) {
    try {
      const response = await authService.login(credentials)
      if (response.success) {
        navigate('/dashboard')
        return { success: true, data: response.data }
      }
      return { success: false, error: response.message }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  // Register controller
  static async register(userData, navigate) {
    try {
      const response = await authService.register(userData)
      if (response.success) {
        navigate('/dashboard')
        return { success: true, data: response.data }
      }
      return { success: false, error: response.message }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  // Logout controller
  static logout(navigate) {
    authService.logout()
    navigate('/login')
  }

  // Get current user
  static getCurrentUser() {
    return authService.getCurrentUser()
  }

  // Check if authenticated
  static isAuthenticated() {
    return authService.isAuthenticated()
  }

  // Get user role
  static getUserRole() {
    const user = authService.getCurrentUser()
    return user?.role || 'user'
  }

  // Check if admin
  static isAdmin() {
    return this.getUserRole() === 'admin'
  }
}

// Custom hook for auth controller
export const useAuthController = () => {
  const { user, login, register, logout } = useAuth()

  return {
    user,
    login,
    register,
    logout,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isUser: user?.role === 'user',
  }
}
