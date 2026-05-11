import {
  forgotPassword,
  googleAuth,
  loginUser,
  registerUser,
  resendResetCode,
  resetPassword,
  startPhoneVerification,
  verifyPhone,
  verifyResetCode,
} from "./authApi.js";
import { UserModel } from "../models/userModel.js";

const USER_STORAGE_KEY = "user";

const normalizeAuthPayload = (payload) => {
  const rawUser = payload?.user || payload?.data?.user || payload?.data || payload;
  const token =
    payload?.token ||
    payload?.data?.token ||
    rawUser?.token ||
    null;

  const user = new UserModel({
    ...rawUser,
    token,
  });

  return { user, token };
};

export const authService = {
  async login(credentials) {
    const response = await loginUser(credentials);
    return normalizeAuthPayload(response.data);
  },

  async register(userData) {
    const response = await registerUser(userData);
    return normalizeAuthPayload(response.data);
  },

  async loginWithGoogle(payload) {
    const response = await googleAuth(payload);
    return normalizeAuthPayload(response.data);
  },

  async forgotPassword(data) {
    const response = await forgotPassword(data);
    return response.data;
  },

  async verifyResetCode(data) {
    const response = await verifyResetCode(data);
    return response.data;
  },

  async resendResetCode(data) {
    const response = await resendResetCode(data);
    return response.data;
  },

  async resetPassword(data) {
    const response = await resetPassword(data);
    return response.data;
  },

  async startPhoneVerification(token, phone) {
    const response = await startPhoneVerification(token, phone);
    return response.data;
  },

  async verifyPhone(token, code) {
    const response = await verifyPhone(token, code);
    return response.data;
  },
  persistUser(authData) {
    if (!authData?.user) {
      return null;
    }

    const serializableUser = {
      ...authData.user,
      token: authData.token || authData.user.token || null,
    };

    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(serializableUser));
    return serializableUser;
  },

  getCurrentUser() {
    const storedUser = localStorage.getItem(USER_STORAGE_KEY);
    if (!storedUser) {
      return null;
    }

    try {
      const parsedUser = JSON.parse(storedUser);

      if (!parsedUser?.token) {
        localStorage.removeItem(USER_STORAGE_KEY);
        return null;
      }

      return new UserModel(parsedUser);
    } catch {
      localStorage.removeItem(USER_STORAGE_KEY);
      return null;
    }
  },

  logout() {
    localStorage.removeItem(USER_STORAGE_KEY);
  },

  isAuthenticated() {
    return Boolean(this.getCurrentUser());
  },
};

export default authService;
