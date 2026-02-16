import { useState, useEffect } from "react";
import { loginUser, googleAuth } from "../../../services/authApi";
import { useAuth } from "../../../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { useGoogleLogin } from "@react-oauth/google";
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
import PastelCloudBackdrop from "../../../components/ui/PastelCloudBackdrop";

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

    if (savedEmail) {
      setEmail(savedEmail);
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
      } else {
        localStorage.removeItem("rememberedEmail");
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

        // Send token to backend for verification and user info retrieval
        const { data } = await googleAuth({
          accessToken: tokenResponse.access_token,
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
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-bg-base px-4 py-10 font-sans">
      <PastelCloudBackdrop />

      <div className="relative z-10 w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mb-5 inline-flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/15 bg-white shadow-sm">
            <LogIn className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-text-main md:text-4xl">
            Welcome Back
          </h1>
          <p className="mt-1 text-sm text-text-muted">Sign in to continue shopping</p>
        </div>

        <div className="rounded-2xl border border-primary/15 bg-white/95 p-6 shadow-sm backdrop-blur md:p-7">
          <form onSubmit={submitHandler} className="space-y-4">
            {error && (
              <div className="flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 p-3">
                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500" />
                <p className="text-sm font-medium text-red-700">{error}</p>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-main">Email Address</label>
              <div className="relative">
                <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-primary/45">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  placeholder="john@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full rounded-xl border border-primary/20 bg-white py-3 pl-11 pr-4 text-sm text-text-main placeholder:text-text-muted/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-main">Password</label>
              <div className="relative">
                <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-primary/45">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full rounded-xl border border-primary/20 bg-white py-3 pl-11 pr-11 text-sm text-text-main placeholder:text-text-muted/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-primary transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <label className="flex cursor-pointer items-center gap-2 text-text-muted">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-primary/30 accent-primary"
                />
                <span>Remember me</span>
              </label>
              <Link
                to="/forgot-password"
                className="font-semibold text-primary hover:text-primary-hover"
              >
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold transition-colors ${loading
                ? "cursor-not-allowed bg-primary/15 text-primary/60"
                : "bg-primary text-text-main hover:bg-primary-hover"
                }`}
            >
              {loading ? (
                <>
                  <Loader className="h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <LogIn className="h-4 w-4" />
                  Sign In
                </>
              )}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-primary/12"></div>
            </div>
            <div className="relative flex justify-center text-[11px] font-semibold uppercase tracking-[0.12em]">
              <span className="bg-white px-4 text-text-muted">Or continue with</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-primary/20 bg-white py-3 text-sm font-medium text-text-main transition-colors hover:border-primary/40 hover:bg-blue-soft/25 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
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
            <span>Sign in with Google</span>
          </button>

          <div className="mt-6 text-center">
            <Link
              to="/register"
              className="text-sm text-text-muted hover:text-primary"
            >
              Don't have an account? <span className="font-semibold text-primary">Create one</span>
            </Link>
          </div>
        </div>

        <div className="mt-6 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/10 bg-white/70 px-4 py-2 text-[11px] font-medium text-text-muted">
            <ShieldCheck className="h-3.5 w-3.5 text-primary" />
            <span>Secure SSL Encryption</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
