import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { adminService } from "../../../services/adminService.js";
import {
  clearAdminSession,
  hasStoredAdminSession,
  persistAdminSession,
} from "../../../utils/adminSession.js";
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
  const [isVisible, setIsVisible] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setIsVisible(true);

    const validateExistingAdminSession = async () => {
      if (!hasStoredAdminSession()) {
        return;
      }

      try {
        const response = await adminService.getCurrentAdmin();
        if (response.data?.role === "admin") {
          navigate("/admin", { replace: true });
          return;
        }

        clearAdminSession();
      } catch {
        clearAdminSession();
      }
    };

    validateExistingAdminSession();
  }, [navigate]);

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

      if (data.role !== "admin") {
        throw new Error("Seller users must sign in at /seller/login. Delivery users must sign in at /delivery/login.");
      }

      persistAdminSession(data.token, data);

      navigate("/admin", { replace: true });
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
    <div className="min-h-screen bg-[#FCF9F5] flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Subtle Static Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#FCF9F5] via-white to-[#FAF0EB]"></div>

      {/* Very Subtle Ambient Glows */}
      <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-[#E6BAA3]/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[-5%] w-[600px] h-[600px] bg-[#8DAA91]/15 rounded-full blur-3xl pointer-events-none"></div>

      <div
        className={`w-full max-w-lg relative z-10 transition-all duration-700 ease-out transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
      >

        {/* Main Card */}
        <div className="bg-white/95 backdrop-blur-xl rounded-2xl border border-[#EAE3DB] shadow-2xl shadow-[#2D312E]/10 overflow-hidden">

          {/* Header Section */}
          <div className="px-8 pt-12 pb-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#F1ECE6] mb-6 shadow-md ring-1 ring-[#EAE3DB]">
              <ShieldCheck className="w-8 h-8 text-[#5F7A63]" />
            </div>

            <h1 className="text-2xl font-bold text-[#2D312E] mb-2 tracking-tight">
              Admin Portal
            </h1>
            <p className="text-[#727871] text-sm">
              Sign in to your administrative account
            </p>
          </div>

          <form onSubmit={submitHandler} className="px-8 pb-10 space-y-5">
            {/* Error Display */}
            {error && (
              <div className="bg-red-50 border border-red-100 rounded-lg p-3 flex gap-3 items-start animate-fade-in">
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <p className="text-red-700 text-sm leading-snug">{error}</p>
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[#2D312E] ml-1">Email Address</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#8D948A] group-focus-within:text-[#5F7A63] transition-colors">
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-[#FCF9F5] border border-[#EAE3DB] rounded-lg focus:outline-none focus:border-[#7A967E] focus:ring-1 focus:ring-[#7A967E] text-[#2D312E] placeholder-[#A3A8A2] transition-all shadow-sm"
                  placeholder="name@company.com"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[#2D312E] ml-1">Password</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#8D948A] group-focus-within:text-[#5F7A63] transition-colors">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 bg-[#FCF9F5] border border-[#EAE3DB] rounded-lg focus:outline-none focus:border-[#7A967E] focus:ring-1 focus:ring-[#7A967E] text-[#2D312E] placeholder-[#A3A8A2] transition-all shadow-sm"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#8D948A] hover:text-[#5F7A63] transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-[#7A967E] hover:bg-[#5F7A63] text-white rounded-lg font-medium shadow-lg shadow-[#7A967E]/20 hover:shadow-[#7A967E]/30 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed mt-2"
            >
              {loading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <LogIn className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer Section */}
          <div className="bg-[#FCF9F5] px-8 py-5 border-t border-[#EAE3DB] flex items-center justify-center">
            <a
              href="/login"
              className="text-sm text-[#727871] hover:text-[#5F7A63] transition-colors flex items-center gap-2 font-medium"
            >
              Back to Customer Login
            </a>
          </div>

        </div>

        {/* Footer info - simple */}
        <div className="mt-8 text-center opacity-70">
          <p className="text-[#727871] text-xs flex items-center justify-center gap-2 font-medium uppercase tracking-wider">
            <ShieldCheck className="w-3 h-3" />
            Secure Admin Environment
          </p>
        </div>

      </div>
    </div>
  );
};

export default AdminLogin;
