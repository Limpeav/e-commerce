import { useState, useEffect } from "react";
import { authService } from "../../../services/authService";
import { useAuth } from "../../../context/useAuth";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useGoogleLogin } from "@react-oauth/google";
import { motion } from "framer-motion";
import { useDarkMode } from "../../../hooks";
import { useLanguage } from "../../../context/useLanguage";
import BrandLogo from "../../../components/common/BrandLogo";
import {
  Mail,
  Lock,
  AlertCircle,
  Loader,
  Eye,
  EyeOff,
  CheckCircle,
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
  const location = useLocation();
  const [isDark] = useDarkMode();
  const { t } = useLanguage();
  const requestedRedirect = location.state?.from;
  const safeRedirect =
    typeof requestedRedirect === "string" &&
    requestedRedirect.startsWith("/") &&
    !requestedRedirect.startsWith("//") &&
    !requestedRedirect.startsWith("/login") &&
    !requestedRedirect.startsWith("/register")
      ? requestedRedirect
      : "/customer";

  const getGoogleLoginErrorMessage = (err) => {
    const backendMessage = err?.response?.data?.message;
    if (backendMessage) {
      return backendMessage;
    }

    if (!err?.response) {
      return "Cannot reach the backend API. Make sure the local backend is running and your device is on the same network.";
    }

    return "Google login failed. Please try again.";
  };

  // Add this useEffect
  useEffect(() => {
    // If user is already logged in, redirect appropriately
    if (user) {
      if (!user.phone) {
        navigate("/complete-profile", { replace: true });
      } else {
        navigate(safeRedirect, { replace: true });
      }
    }
  }, [user, navigate, safeRedirect]);

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
      const authData = await authService.login({ email, password });
      const data = authData.user;

      if (!data?.token) {
        throw new Error("Login response is missing an authentication token.");
      }

      if (data.role !== "user") {
        setError("Not a user account. Please use appropriate credentials.");
        setLoading(false);
        return;
      }

      const storedUser = authService.persistUser(authData);

      // Handle Remember Me
      if (rememberMe) {
        localStorage.setItem("rememberedEmail", email);
      } else {
        localStorage.removeItem("rememberedEmail");
      }

      login(storedUser);
      // Redirect to complete-profile if phone is missing
      if (!storedUser.phone) {
        navigate("/complete-profile");
      } else {
        navigate(safeRedirect);
      }
    } catch (err) {
      setError(
        err.response?.data?.message || "Login failed. Please try again."
      );
      setLoading(false);
    }
  };

  const completeGoogleLogin = async (accessToken) => {
    try {
      setLoading(true);
      setError("");

      const authData = await authService.loginWithGoogle({
        accessToken,
      });
      const data = authData.user;

      if (!data?.token) {
        throw new Error("Google login response is missing an authentication token.");
      }

      if (data.role !== "user") {
        setError("Not a user account. Please use appropriate credentials.");
        setLoading(false);
        return;
      }

      const storedUser = authService.persistUser(authData);

      login(storedUser);
      if (!storedUser.phone) {
        navigate("/complete-profile");
      } else {
        navigate(safeRedirect);
      }
    } catch (err) {
      setError(getGoogleLoginErrorMessage(err));
      setLoading(false);
    }
  };

  const startGoogleLogin = useGoogleLogin({
    scope: "openid profile email",
    onSuccess: (tokenResponse) => {
      completeGoogleLogin(tokenResponse.access_token);
    },
    onError: () => {
      setError(`Google login failed. Add ${window.location.origin} to the OAuth client's Authorized JavaScript origins.`);
      setLoading(false);
    },
  });

  const handleGoogleLogin = () => {
    setError("");
    startGoogleLogin();
  };

  return (
    <div
      className={`relative flex h-[100svh] items-center justify-center overflow-hidden px-3 py-4 font-sans transition-colors duration-300 sm:px-4 sm:py-6 lg:p-5 ${
        isDark ? "bg-slate-950 text-slate-100" : "bg-bg-base"
      }`}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          animate={{ x: [0, 10, 0], y: [0, -10, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className={`absolute left-10 top-20 h-72 w-72 rounded-full opacity-30 blur-3xl ${
            isDark ? "bg-indigo-500/10" : "bg-primary-light/10 mix-blend-multiply"
          }`}
        />
        <motion.div
          animate={{ x: [0, -20, 0], y: [0, 20, 0], scale: [1, 1.2, 1] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className={`absolute right-10 top-40 h-72 w-72 rounded-full opacity-40 blur-3xl ${
            isDark ? "bg-cyan-500/10" : "bg-primary/5 mix-blend-multiply"
          }`}
        />
        <motion.div
          animate={{ x: [0, 15, 0], y: [0, 15, 0], scale: [1, 0.9, 1] }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className={`absolute bottom-20 left-1/2 h-72 w-72 rounded-full opacity-30 blur-3xl ${
            isDark ? "bg-fuchsia-500/10" : "bg-secondary/5 mix-blend-multiply"
          }`}
        />
      </div>

      <div className="relative z-10 mx-auto grid max-h-full w-full max-w-md grid-cols-1 overflow-hidden rounded-2xl bg-transparent sm:rounded-[2.5rem] lg:h-full lg:max-w-6xl lg:grid-cols-[40%_60%] lg:rounded-[2rem] lg:border lg:border-white/80 lg:bg-white/90 lg:shadow-[0_32px_90px_-38px_rgba(45,49,46,0.45)] lg:backdrop-blur-xl lg:dark:border-slate-700 lg:dark:bg-slate-900/95">
        <section className="relative hidden min-h-0 overflow-hidden bg-primary p-8 text-white lg:flex lg:flex-col lg:justify-between xl:p-10">
          <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-white/10" />
          <div className="absolute -bottom-32 -left-24 h-80 w-80 rounded-full bg-white/10" />

          <div className="relative z-10 flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-lg">
              <BrandLogo
                alt="Cherish Baby"
                className="h-12 w-12 object-contain"
              />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.28em] text-white/70">
                Welcome to
              </p>
              <h2 className="font-display text-2xl font-black">Cherish Baby</h2>
            </div>
          </div>

          <div className="relative z-10">
            <p className="mb-3 text-xs font-black uppercase tracking-[0.3em] text-white/70">
              Everything for your little one
            </p>
            <h1 className="max-w-sm font-display text-4xl font-black leading-tight xl:text-5xl">
              Welcome back to simpler family shopping.
            </h1>
            <p className="mt-5 max-w-md text-base font-medium leading-relaxed text-white/75">
              Sign in to manage your orders, save your favorite products, and
              continue shopping with confidence.
            </p>
          </div>

          <div className="relative z-10 space-y-3">
            {[
              "Quick and secure checkout",
              "Track every order in one place",
              "Products selected for growing families",
            ].map((benefit) => (
              <div key={benefit} className="flex items-center gap-3 text-sm font-bold">
                <CheckCircle className="h-5 w-5 flex-none text-white/85" />
                <span>{benefit}</span>
              </div>
            ))}
          </div>
        </section>

        <main className="flex min-h-0 justify-center overflow-y-auto rounded-2xl border border-white bg-white/95 px-5 py-5 shadow-[0_18px_50px_-28px_rgba(45,49,46,0.3)] backdrop-blur-2xl dark:border-slate-800 dark:bg-slate-900/95 sm:rounded-[2.5rem] sm:px-8 sm:py-7 lg:items-center lg:overflow-hidden lg:rounded-none lg:border-0 lg:bg-transparent lg:px-10 lg:py-4 lg:shadow-none lg:backdrop-blur-none lg:dark:bg-transparent xl:px-12">
          <div className="mx-auto w-full max-w-md">
            <div className="mb-5 text-center sm:mb-6">
              <h1 className="font-display text-3xl font-black leading-tight tracking-tight text-text-main dark:text-slate-100 sm:text-4xl">
                {t("Welcome Back")}
              </h1>
              <p className="mt-2 text-sm font-medium text-text-muted dark:text-slate-400 sm:text-base">
                {t("Sign in to continue shopping")}
              </p>
            </div>

            <form onSubmit={submitHandler} className="space-y-4">
              {error && (
                <div className="flex animate-shake items-start gap-3 rounded-xl border border-red-400/30 bg-red-600/90 p-3 shadow-lg shadow-red-950/20">
                  <AlertCircle className="mt-0.5 h-5 w-5 flex-none text-white" />
                  <p className="text-sm font-bold leading-relaxed text-white">{error}</p>
                </div>
              )}

              <div className="group">
                <label className="mb-2 ml-1 block text-xs font-black uppercase tracking-[0.2em] text-primary">
                  {t("Email Address")}
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-4 top-1/2 z-10 h-5 w-5 -translate-y-1/2 text-primary/45 transition-colors group-focus-within:text-primary" />
                  <input
                    type="email"
                    placeholder="john@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-12 w-full rounded-xl border border-stone-200 bg-white !pl-12 pr-4 font-bold text-text-main outline-none transition-all placeholder:text-stone-400 focus:border-primary focus:ring-4 focus:ring-primary/10 dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-100 dark:placeholder:text-slate-500"
                  />
                </div>
              </div>

              <div className="group">
                <label className="mb-2 ml-1 block text-xs font-black uppercase tracking-[0.2em] text-primary">
                  {t("Password")}
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-4 top-1/2 z-10 h-5 w-5 -translate-y-1/2 text-primary/45 transition-colors group-focus-within:text-primary" />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder={t("Enter your password")}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-12 w-full rounded-xl border border-stone-200 bg-white !pl-12 !pr-12 font-bold text-text-main outline-none transition-all placeholder:text-stone-400 focus:border-primary focus:ring-4 focus:ring-primary/10 dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-100 dark:placeholder:text-slate-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 transition-colors hover:text-primary focus:outline-none dark:text-slate-500"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 px-1 text-xs">
                <label className="group flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 rounded border-2 border-stone-300 bg-stone-100 accent-primary focus:ring-2 focus:ring-primary/20 dark:border-slate-600 dark:bg-slate-800"
                  />
                  <span className="select-none font-bold uppercase tracking-wider text-text-muted transition-colors group-hover:text-primary dark:text-slate-400">
                    {t("Remember me")}
                  </span>
                </label>
                <Link
                  to="/forgot-password"
                  className="font-black uppercase tracking-wider text-primary transition-colors hover:text-primary-dark"
                >
                  {t("Forgot password?")}
                </Link>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex h-12 w-full items-center justify-center gap-3 rounded-xl bg-primary px-5 text-sm font-black uppercase tracking-[0.18em] text-white shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5 hover:bg-primary-dark hover:shadow-xl disabled:cursor-not-allowed disabled:bg-stone-300 disabled:text-stone-500 disabled:shadow-none disabled:hover:translate-y-0 dark:disabled:bg-slate-700 dark:disabled:text-slate-400"
              >
                {loading ? (
                  <>
                    <Loader className="h-5 w-5 animate-spin" />
                    {t("Identifying...")}
                  </>
                ) : (
                  t("Sign In")
                )}
              </button>
            </form>

            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-stone-200 dark:border-slate-700" />
              </div>
              <div className="relative flex justify-center text-[10px] font-black uppercase tracking-[0.3em]">
                <span className="bg-white px-5 text-stone-400 dark:bg-slate-900 dark:text-slate-500">
                  {t("OR")}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-stone-200 bg-white px-4 font-bold text-text-main shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950/70 dark:text-slate-100"
            >
              <svg className="h-5 w-5 flex-none" viewBox="0 0 24 24">
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
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 0 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span className="text-xs uppercase tracking-wider sm:text-sm">
                {t("Sign in with Google")}
              </span>
            </button>

            <div className="mt-4 text-center">
              <Link
                to="/register"
                className="inline-flex flex-wrap items-center justify-center gap-x-2 text-sm font-bold text-text-muted transition-colors hover:text-primary dark:text-slate-400"
              >
                {t("Dont have an account?")}
                <span className="border-b-2 border-primary/20 font-black uppercase tracking-wider text-primary transition-all hover:border-primary">
                  {t("Create one now")}
                </span>
              </Link>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
};

export default Login;
