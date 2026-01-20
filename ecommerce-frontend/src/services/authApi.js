import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:4000/api/users",
});

const AUTH_API = axios.create({
  baseURL: "http://localhost:4000/api/auth",
});

export const registerUser = (data) => API.post("/register", data);
export const loginUser = (data) => API.post("/login", data);
export const googleAuth = (data) => AUTH_API.post("/google", data);
export const forgotPassword = (data) => API.post("/forgot-password", data);
export const resetPassword = (data) => API.post("/reset-password", data);