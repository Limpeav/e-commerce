import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { adminService } from "../../../services/adminService.js";
import {
  Mail,
  Lock,
  ShieldCheck,
  AlertCircle,
  Loader,
  Eye,
  EyeOff,
  LogIn,
} from "lucide-react";

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const submitHandler = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await adminService.login({ email, password });
      
      // Handle both response.data and direct data
      const data = response.data || response;

      if (!data || !data.token) {
        throw new Error("Invalid response from server");
      }

      // Store admin token and user info
      localStorage.setItem("adminToken", data.token);
      localStorage.setItem("adminUser", JSON.stringify(data));

      navigate("/admin");
    } catch (err) {
      console.error("Admin login error:", err);
      setError(
        err.response?.data?.message || err.message || "Admin login failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center px-4 py-12">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-600 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div
          className="absolute top-40 right-10 w-72 h-72 bg-purple-600 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"
          style={{ animationDelay: "2s" }}
        ></div>
        <div
          className="absolute bottom-20 left-1/2 w-72 h-72 bg-red-600 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"
          style={{ animationDelay: "4s" }}
        ></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo/Brand Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-red-600 via-orange-600 to-yellow-600 rounded-2xl shadow-2xl mb-4 transform hover:scale-110 transition-transform duration-300">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-red-600 via-orange-600 to-yellow-600 bg-clip-text text-transparent mb-2">
            Admin Portal
          </h1>
          <p className="text-gray-400 text-lg">Sign in to access admin dashboard</p>
        </div>

        {/* Login Card */}
        <div className="bg-gray-800/80 backdrop-blur-lg rounded-3xl shadow-2xl border border-gray-700/50 p-8">
          <form onSubmit={submitHandler} className="space-y-6">
            {/* Error Message */}
            {error && (
              <div className="bg-red-900/80 backdrop-blur-sm border-2 border-red-700 rounded-2xl p-4 flex items-start gap-3 animate-shake">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-red-300 text-sm font-medium">{error}</p>
              </div>
            )}

            {/* Email Input */}
            <div className="group">
              <label className="block text-sm font-bold text-gray-300 mb-2 flex items-center gap-2">
                <Mail className="w-4 h-4 text-blue-400" />
                Admin Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3.5 bg-gray-700/50 border-2 border-gray-600 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all text-gray-200 placeholder-gray-400 group-hover:border-gray-500"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="group">
              <label className="block text-sm font-bold text-gray-300 mb-2 flex items-center gap-2">
                <Lock className="w-4 h-4 text-purple-400" />
                Admin Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter admin password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3.5 pr-12 bg-gray-700/50 border-2 border-gray-600 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20 transition-all text-gray-200 placeholder-gray-400 group-hover:border-gray-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-200 transition-colors focus:outline-none"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-4 rounded-xl font-bold shadow-xl transform transition-all duration-300 flex items-center justify-center gap-2 text-lg ${
                loading
                  ? "bg-gray-600 text-gray-300 cursor-not-allowed"
                  : "bg-gradient-to-r from-red-600 via-orange-600 to-yellow-600 text-white hover:shadow-2xl hover:scale-105 active:scale-95"
              }`}
            >
              {loading ? (
                <>
                  <Loader className="w-6 h-6 animate-spin" />
                  Authenticating...
                </>
              ) : (
                <>
                  <LogIn className="w-6 h-6" />
                  Admin Sign In
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t-2 border-gray-600"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-gray-800 text-gray-400 font-medium">
                Secure Admin Access
              </span>
            </div>
          </div>

          {/* User Login Link */}
          <div className="text-center">
            <a
              href="/login"
              className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 font-bold text-lg transition-colors group"
            >
              User Login
              <span className="transform group-hover:translate-x-1 transition-transform">
                →
              </span>
            </a>
          </div>
        </div>

        {/* Security Badge */}
        <div className="mt-6 text-center">
          <div className="inline-flex items-center gap-2 text-xs text-gray-500">
            <ShieldCheck className="w-4 h-4 text-green-500" />
            <span>Protected by enterprise-grade security</span>
          </div>
        </div>

        {/* Warning */}
        <div className="mt-4 bg-yellow-900/30 border border-yellow-700/50 rounded-xl p-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
            <p className="text-yellow-300 text-xs">
              This is a restricted area. Unauthorized access attempts will be logged and may result in account suspension.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
