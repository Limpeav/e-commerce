import { registerUser, googleAuth } from "../../../services/authApi";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useGoogleLogin } from "@react-oauth/google";
import { useAuth } from "../../../context/AuthContext";
import axios from "axios";
import {
  User,
  Mail,
  Phone,
  Lock,
  UserPlus,
  AlertCircle,
  Loader,
  CheckCircle,
  ShieldCheck,
  Eye,
  EyeOff,
} from "lucide-react";

const Register = () => {
  const [form, setForm] = useState({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const submitHandler = async (e) => {
    e.preventDefault();

    if (!agreedToTerms) {
      setError("Please agree to the Terms of Service and Privacy Policy");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const formData = {
        name: form.name,
        email: form.email,
        phone: `+855${form.phone}`,
        password: form.password,
        role: "user",
      };

      console.log("Sending data:", formData);

      const response = await registerUser(formData);
      console.log("Registration successful:", response);
      navigate("/login");
    } catch (err) {
      console.error("Registration error:", err);
      console.error("Error response:", err.response);

      let errorMessage = "Registration failed. Please try again.";

      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.message) {
        errorMessage = err.message;
      }

      if (
        errorMessage.includes("duplicate") ||
        errorMessage.includes("E11000")
      ) {
        errorMessage =
          "This email is already registered. Please use a different email or login.";
      }

      setError(errorMessage);
      setLoading(false);
    }
  };

  const isFormValid = () => {
    return (
      form.name && form.email && form.phone && form.password && agreedToTerms
    );
  };

  // Google Sign Up Handler
  const handleGoogleSignUp = useGoogleLogin({
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
        navigate("/");
      } catch (err) {
        setError(
          err.response?.data?.message || "Google sign up failed. Please try again."
        );
        setLoading(false);
      }
    },
    onError: () => {
      setError("Google sign up failed. Please try again.");
      setLoading(false);
    },
  });

  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center px-4 py-12 relative overflow-hidden font-sans">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary-light/10 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
        <div
          className="absolute top-40 right-10 w-72 h-72 bg-primary/5 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-pulse"
          style={{ animationDelay: "2s" }}
        ></div>
        <div
          className="absolute bottom-20 left-1/2 w-72 h-72 bg-secondary/5 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"
          style={{ animationDelay: "4s" }}
        ></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo/Brand Section */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-3xl shadow-xl border border-stone-100 mb-8 transform hover:scale-105 transition-transform duration-300">
            <UserPlus className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-5xl font-black text-text-main mb-3 font-display tracking-tight leading-none">
            Create Account
          </h1>
          <p className="text-text-muted font-medium text-lg text-center">
            Join thousands of happy parents today
          </p>
        </div>

        {/* Register Card */}
        <div className="bg-white/70 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl border border-white p-10 mb-6">
          {/* Google Sign Up Button */}
          <button
            type="button"
            onClick={handleGoogleSignUp}
            disabled={loading}
            className="w-full py-4 bg-white border border-stone-100 rounded-2xl font-bold shadow-sm hover:shadow-md transform hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center gap-3 text-text-main hover:border-primary disabled:opacity-50 disabled:cursor-not-allowed mb-6"
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
            <span className="text-sm uppercase tracking-widest font-black">Sign up with Google</span>
          </button>

          {/* Divider */}
          <div className="relative my-10">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-stone-100"></div>
            </div>
            <div className="relative flex justify-center text-[10px] font-black uppercase tracking-[0.3em]">
              <span className="px-6 bg-white text-stone-400">
                OR EMAIL
              </span>
            </div>
          </div>

          <form onSubmit={submitHandler} className="space-y-6">
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-start gap-3 animate-shake">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-red-700 text-sm font-bold">{error}</p>
              </div>
            )}

            {/* Name Input */}
            <div className="group">
              <label className="block text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-2 ml-1">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/40 group-focus-within:text-primary transition-colors">
                  <User className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  placeholder="John Doe"
                  value={form.name || ""}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  className="w-full pl-12 pr-4 py-4 border-2 border-stone-100 rounded-2xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all text-text-main font-bold placeholder-stone-300 bg-stone-50/50 focus:bg-white"
                />
              </div>
            </div>

            {/* Email Input */}
            <div className="group">
              <label className="block text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-2 ml-1">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/40 group-focus-within:text-primary transition-colors">
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  type="email"
                  placeholder="john@example.com"
                  value={form.email || ""}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                  className="w-full pl-12 pr-4 py-4 border-2 border-stone-100 rounded-2xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all text-text-main font-bold placeholder-stone-300 bg-stone-50/50 focus:bg-white"
                />
              </div>
            </div>

            {/* Phone Input */}
            <div className="group">
              <label className="block text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-2 ml-1">
                Phone Number
              </label>
              <div className="flex gap-2">
                <div className="flex items-center px-4 py-4 bg-stone-100 border-2 border-stone-100 rounded-2xl text-text-main font-black shadow-sm text-sm">
                  +855
                </div>
                <input
                  type="tel"
                  name="phone"
                  placeholder="12 345 678"
                  value={form.phone || ""}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  required
                  className="flex-1 px-5 py-4 border-2 border-stone-100 rounded-2xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all text-text-main font-bold placeholder-stone-300 bg-stone-50/50 focus:bg-white"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="group">
              <label className="block text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-2 ml-1">
                Password
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/40 group-focus-within:text-primary transition-colors">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a strong password"
                  value={form.password || ""}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                  required
                  minLength={6}
                  className="w-full pl-12 pr-12 py-4 border-2 border-stone-100 rounded-2xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all text-text-main font-bold placeholder-stone-300 bg-stone-50/50 focus:bg-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-stone-400 hover:text-primary transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              <p className="mt-2 text-[10px] text-stone-400 font-bold uppercase tracking-widest pl-1">Min. 6 characters</p>
            </div>

            {/* Terms and Conditions */}
            <div className="bg-primary/5 rounded-[1.5rem] p-5 border border-primary/10">
              <label className="flex items-start gap-4 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="w-5 h-5 mt-0.5 text-primary border-2 border-stone-300 rounded focus:ring-2 focus:ring-primary accent-primary"
                />
                <span className="text-xs text-text-muted leading-relaxed font-semibold">
                  I agree to the{" "}
                  <a
                    href="/terms"
                    className="text-primary hover:text-primary-dark font-black transition-colors underline decoration-primary/20 hover:decoration-primary"
                  >
                    Terms of Service
                  </a>{" "}
                  and{" "}
                  <a
                    href="/privacy"
                    className="text-primary hover:text-primary-dark font-black transition-colors underline decoration-primary/20 hover:decoration-primary"
                  >
                    Privacy Policy
                  </a>
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !isFormValid()}
              className={`w-full py-5 rounded-2xl font-black uppercase tracking-[0.2em] shadow-xl transform transition-all duration-300 flex items-center justify-center gap-3 text-sm ${loading || !isFormValid()
                ? "bg-stone-200 text-stone-500 cursor-not-allowed"
                : "bg-text-main text-white hover:bg-primary hover:shadow-primary/20 hover:-translate-y-1 active:scale-95 shadow-stone-200"
                }`}
            >
              {loading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <UserPlus className="w-5 h-5" />
                  Create Account
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
                Already Joined?
              </span>
            </div>
          </div>

          {/* Sign In Link */}
          <div className="text-center">
            <a
              href="/login"
              className="inline-flex items-center gap-2 text-text-muted hover:text-primary font-bold text-sm transition-colors group"
            >
              Sign in to your account
              <span className="text-primary font-black uppercase tracking-widest border-b-2 border-primary/20 group-hover:border-primary transition-all">
                Login here
              </span>
            </a>
          </div>
        </div>

        {/* Security Badge */}
        <div className="mt-10 text-center">
          <div className="inline-flex items-center gap-3 text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] bg-white/50 px-6 py-3 rounded-full border border-white/20 shadow-sm backdrop-blur-sm">
            <ShieldCheck className="w-4 h-4 text-primary" />
            <span>Secure Registration • SSL Encrypted</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
