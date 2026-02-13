import { useState, useEffect } from "react";
import { loginUser, googleAuth } from "../../../services/authApi";
import { useAuth } from "../../../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { useGoogleLogin } from "@react-oauth/google";
import { motion } from "framer-motion";
import axios from "axios";
import {
  Mail,
  Lock,
  LogIn,
  AlertCircle,
  Loader,
  Eye,
  EyeOff,
  ShieldCheck,
} from "lucide-react";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login, user } = useAuth();
  const navigate = useNavigate();


  // Add this useEffect
  useEffect(() => {
    // If user is already logged in, redirect appropriately
    if (user) {
      if (!user.phone) {
        navigate("/complete-profile", { replace: true });
      } else {
        navigate("/", { replace: true });
      }
    }
  }, [user, navigate]);

  // Load saved credentials on component mount
  useEffect(() => {
    const savedEmail = localStorage.getItem("rememberedEmail");
    const savedPassword = localStorage.getItem("rememberedPassword");

    if (savedEmail && savedPassword) {
      setEmail(savedEmail);
      setPassword(savedPassword);
      setRememberMe(true);
    }
  }, []);

  const submitHandler = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { data } = await loginUser({ email, password });

      if (data.role !== "user") {
        setError("Not a user account. Please use appropriate credentials.");
        setLoading(false);
        return;
      }

      // Handle Remember Me
      if (rememberMe) {
        localStorage.setItem("rememberedEmail", email);
        localStorage.setItem("rememberedPassword", password);
      } else {
        localStorage.removeItem("rememberedEmail");
        localStorage.removeItem("rememberedPassword");
      }

      login(data);
      // Redirect to complete-profile if phone is missing
      if (!data.phone) {
        navigate("/complete-profile");
      } else {
        navigate("/");
      }
    } catch (err) {
      setError(
        err.response?.data?.message || "Login failed. Please try again."
      );
      setLoading(false);
    }
  };

  // Google Login Handler
  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        setLoading(true);
        setError("");

        // Get user info from Google
        const userInfoResponse = await axios.get(
          "https://www.googleapis.com/oauth2/v3/userinfo",
          {
            headers: {
              Authorization: `Bearer ${tokenResponse.access_token}`,
            },
          }
        );

        const { email, name, picture, sub } = userInfoResponse.data;

        // Send to backend
        const { data } = await googleAuth({
          email,
          name,
          picture,
          sub,
        });

        if (data.role !== "user") {
          setError("Not a user account. Please use appropriate credentials.");
          setLoading(false);
          return;
        }

        login(data);
        // Redirect to complete-profile if phone is missing (Google users)
        if (!data.phone) {
          navigate("/complete-profile");
        } else {
          navigate("/");
        }
      } catch (err) {
        setError(
          err.response?.data?.message || "Google login failed. Please try again."
        );
        setLoading(false);
      }
    },
    onError: () => {
      setError("Google login failed. Please try again.");
      setLoading(false);
    },
  });

  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center px-4 py-12 relative overflow-hidden font-sans">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ x: [0, 10, 0], y: [0, -10, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-20 left-10 w-72 h-72 bg-primary-light/10 rounded-full mix-blend-multiply filter blur-3xl opacity-30"
        />
        <motion.div
          animate={{ x: [0, -20, 0], y: [0, 20, 0], scale: [1, 1.2, 1] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute top-40 right-10 w-72 h-72 bg-primary/5 rounded-full mix-blend-multiply filter blur-3xl opacity-40"
        />
        <motion.div
          animate={{ x: [0, 15, 0], y: [0, 15, 0], scale: [1, 0.9, 1] }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute bottom-20 left-1/2 w-72 h-72 bg-secondary/5 rounded-full mix-blend-multiply filter blur-3xl opacity-30"
        />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo/Brand Section */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-3xl shadow-xl border border-stone-100 mb-8 transform hover:scale-105 transition-transform duration-300">
            <LogIn className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-5xl font-black text-text-main mb-3 font-display tracking-tight leading-none">
            Welcome Back
          </h1>
          <p className="text-text-muted font-medium text-lg">Sign in to continue shopping</p>
        </div>

        {/* Login Card */}
        <div className="bg-white/70 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl border border-white p-10">
          <form onSubmit={submitHandler} className="space-y-6">
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-start gap-3 animate-shake">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-red-700 text-sm font-bold">{error}</p>
              </div>
            )}

            {/* Email Input */}
            <div className="group">
              <label className="block text-xs font-black text-primary uppercase tracking-[0.2em] mb-3 ml-1">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/40 group-focus-within:text-primary transition-colors">
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  type="email"
                  placeholder="john@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-12 pr-4 py-4 border-2 border-stone-100 rounded-2xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all text-text-main font-bold placeholder-stone-300 bg-stone-50/50 focus:bg-white"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="group">
              <label className="block text-xs font-black text-primary uppercase tracking-[0.2em] mb-3 ml-1">
                Password
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/40 group-focus-within:text-primary transition-colors">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-12 pr-12 py-4 border-2 border-stone-100 rounded-2xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all text-text-main font-bold placeholder-stone-300 bg-stone-50/50 focus:bg-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-stone-400 hover:text-primary transition-colors focus:outline-none"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between text-xs px-1">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-primary bg-stone-100 border-2 border-stone-300 rounded focus:ring-2 focus:ring-primary/20 accent-primary"
                />
                <span className="text-text-muted font-bold group-hover:text-primary transition-colors select-none uppercase tracking-widest">
                  Remember me
                </span>
              </label>
              <Link
                to="/forgot-password"
                className="text-primary hover:text-primary-dark font-black uppercase tracking-widest transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-5 rounded-2xl font-black uppercase tracking-[0.2em] shadow-xl transform transition-all duration-300 flex items-center justify-center gap-3 text-sm ${loading
                ? "bg-stone-200 text-stone-500 cursor-not-allowed"
                : "bg-text-main text-white hover:bg-primary hover:shadow-primary/20 hover:-translate-y-1 active:scale-95"
                }`}
            >
              {loading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Identifying...
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  Sign In
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-10">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-stone-100"></div>
            </div>
            <div className="relative flex justify-center text-[10px] font-black uppercase tracking-[0.3em]">
              <span className="px-6 bg-white text-stone-400">
                OR
              </span>
            </div>
          </div>

          {/* Google Sign In Button */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full py-4 bg-white border border-stone-100 rounded-2xl font-bold shadow-sm hover:shadow-md transform hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center gap-3 text-text-main hover:border-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span className="text-sm uppercase tracking-widest">Sign in with Google</span>
          </button>

          {/* Sign Up Link */}
          <div className="text-center mt-10">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 text-text-muted hover:text-primary font-bold text-sm transition-colors group"
            >
              Dont have an account?
              <span className="text-primary font-black uppercase tracking-widest border-b-2 border-primary/20 group-hover:border-primary transition-all">
                Create one now
              </span>
            </Link>
          </div>
        </div>

        {/* Security Badge */}
        <div className="mt-10 text-center">
          <div className="inline-flex items-center gap-3 text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] bg-white/50 px-6 py-3 rounded-full border border-white/20 shadow-sm backdrop-blur-sm">
            <ShieldCheck className="w-4 h-4 text-primary" />
            <span>Secure SSL Encryption</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
