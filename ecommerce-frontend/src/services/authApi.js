import axios from "axios";
import { config } from "../config/index.js";

const API = axios.create({
  baseURL: `${config.API_BASE_URL}/users`,
});

const AUTH_API = axios.create({
  baseURL: `${config.API_BASE_URL}/auth`,
});

export const registerUser = (data) => API.post("/register", data);
export const loginUser = (data) => API.post("/login", data);
export const googleAuth = (data) => AUTH_API.post("/google", data);
export const forgotPassword = (data) => API.post("/forgot-password", data);
export const verifyResetCode = (data) => API.post("/verify-reset-code", data);
export const resendResetCode = (data) => API.post("/resend-reset-code", data);
export const resetPassword = (data) => API.post("/reset-password", data);
export const updateUserProfile = (token, data) =>
  API.put(
    "/profile",
    data,
    { headers: { Authorization: `Bearer ${token}` } }
  );
export const startPhoneVerification = (token, phone) =>
  API.post(
    "/start-phone-verification",
    { phone },
    { headers: { Authorization: `Bearer ${token}` } }
  );

export const verifyPhone = (token, code) =>
  API.post(
    "/verify-phone",
    { code },
    { headers: { Authorization: `Bearer ${token}` } }
  );
