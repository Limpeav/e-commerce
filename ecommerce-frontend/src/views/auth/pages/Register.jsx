import {
  registerUser,
  verifyRegistrationEmail,
  resendRegistrationVerification,
} from "../../../services/authApi";
import { authService } from "../../../services/authService";
import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useGoogleLogin } from "@react-oauth/google";
import { useAuth } from "../../../context/useAuth";
import { motion } from "framer-motion";
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
  const [googleUser, setGoogleUser] = useState(null);
  const [showGoogleConfirm, setShowGoogleConfirm] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const requestedRedirect = location.state?.from;
  const safeRedirect =
    typeof requestedRedirect === "string" &&
    requestedRedirect.startsWith("/") &&
    !requestedRedirect.startsWith("//") &&
    !requestedRedirect.startsWith("/login") &&
    !requestedRedirect.startsWith("/register")
      ? requestedRedirect
      : "/customer";

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
      };

      const { data } = await registerUser(formData);
      setVerificationEmail(data.email || formData.email);
      setSuccessMessage(data.message || "We sent a verification code to your email.");
      setLoading(false);
    } catch (err) {
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
        errorMessage.includes("E11000") ||
        errorMessage.toLowerCase().includes("already registered") ||
        errorMessage.toLowerCase().includes("already exists")
      ) {
        errorMessage =
          "This email is already registered. Please use a different email or login.";
      }

      setError(errorMessage);
      setLoading(false);
    }
  };

  const handleVerifyEmail = async (e) => {
    e.preventDefault();

    if (!verificationCode.trim()) {
      setError("Please enter the verification code from your email.");
      return;
    }

    try {
      setError("");
      setLoading(true);
      const { data } = await verifyRegistrationEmail({
        email: verificationEmail,
        code: verificationCode,
      });
      setSuccessMessage(data.message || "Email verified successfully. You can now log in.");
      setLoading(false);
      navigate("/login", { state: { from: safeRedirect } });
    } catch (err) {
      setError(err.response?.data?.message || "Could not verify this code. Please try again.");
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    try {
      setError("");
      setLoading(true);
      const { data } = await resendRegistrationVerification({ email: verificationEmail });
      setSuccessMessage(data.message || "A new verification code has been sent.");
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.message || "Could not resend verification code.");
      setLoading(false);
    }
  };

  const isFormValid = () => {
    return (
      form.name && form.email && form.phone && form.password && agreedToTerms
    );
  };

  const startGoogleSignUp = useGoogleLogin({
    scope: "openid profile email",
    onSuccess: async (tokenResponse) => {
      const profileRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
      });
      const profile = await profileRes.json();
      setGoogleUser({ accessToken: tokenResponse.access_token, picture: profile.picture, name: profile.name, email: profile.email });
      setShowGoogleConfirm(true);
    },
    onError: () => {
      setError("Google sign up failed. Please try again.");
      setLoading(false);
    },
  });

  const handleGoogleSignUp = () => {
    setError("");
    startGoogleSignUp();
  };

  // Continue with Google sign up after confirmation
  const handleGoogleContinue = async () => {
    if (!googleUser) return;
    
    try {
      setLoading(true);
      setError("");

      const authData = await authService.loginWithGoogle({
        accessToken: googleUser.accessToken,
      });
      const data = authData.user;

      if (!data?.token) {
        throw new Error("Google sign up response is missing an authentication token.");
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
      setError(
        err.response?.data?.message || "Google sign up failed. Please try again."
      );
      setLoading(false);
    }
  };

  const handleGoogleCancel = () => {
    setGoogleUser(null);
    setShowGoogleConfirm(false);
  };

  const inputClassName =
    "w-full border-2 rounded-2xl transition-all text-text-main font-bold focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 bg-white/90 border-stone-200 placeholder-stone-400 focus:bg-white dark:bg-slate-900/90 dark:border-slate-700 dark:text-slate-50 dark:placeholder-slate-500 dark:focus:bg-slate-900";
  const iconClassName =
    "absolute left-4 top-1/2 -translate-y-1/2 text-primary/60 group-focus-within:text-primary transition-colors";
  const labelClassName =
    "block text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-2 ml-1 dark:text-primary-light";

  return (
    <div className="min-h-screen bg-bg-base flex items-start lg:items-center justify-center px-3 sm:px-4 py-8 sm:py-12 pb-24 lg:pb-12 relative overflow-x-hidden overflow-y-auto font-sans">
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
        <div className="text-center mb-6 sm:mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 sm:w-20 sm:h-20 bg-white rounded-2xl sm:rounded-3xl shadow-xl border border-stone-100 mb-4 sm:mb-8 transform hover:scale-105 transition-transform duration-300 dark:border-slate-700 dark:bg-slate-900">
            <UserPlus className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-text-main mb-2 sm:mb-3 font-display tracking-tight leading-none">
            Create Account
          </h1>
          <p className="text-text-muted font-medium text-sm sm:text-lg text-center">
            Join thousands of happy parents today
          </p>
        </div>

        {/* Register Card */}
        <div className="bg-white/90 backdrop-blur-2xl rounded-2xl sm:rounded-[2.5rem] shadow-2xl border border-white p-5 sm:p-8 lg:p-10 mb-6 dark:border-slate-700 dark:bg-slate-900/92 dark:shadow-black/40">
          {verificationEmail ? (
            <form onSubmit={handleVerifyEmail} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-start gap-3 animate-shake">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-red-700 text-sm font-bold">{error}</p>
                </div>
              )}

              {successMessage && (
                <div className="bg-green-50 border border-green-100 rounded-2xl p-4 flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <p className="text-green-700 text-sm font-bold">{successMessage}</p>
                </div>
              )}

              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-2xl mb-4">
                  <Mail className="w-7 h-7 text-primary" />
                </div>
                <h2 className="text-2xl font-black text-text-main mb-2">Verify your email</h2>
                <p className="text-sm text-text-muted font-semibold">
                  Enter the 6-digit code sent to{" "}
                  <span className="text-text-main font-black">{verificationEmail}</span>
                </p>
              </div>

              <div className="group">
                <label className={labelClassName}>
                  Verification Code
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="123456"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  required
                  className={`${inputClassName} px-5 py-4 text-center text-2xl font-black tracking-[0.35em]`}
                />
              </div>

              <button
                type="submit"
                disabled={loading || verificationCode.length !== 6}
                className={`w-full py-5 rounded-2xl font-black uppercase tracking-[0.2em] shadow-xl transform transition-all duration-300 flex items-center justify-center gap-3 text-sm ${loading || verificationCode.length !== 6
                  ? "bg-stone-200 text-stone-500 cursor-not-allowed"
                  : "bg-text-main text-white hover:bg-primary hover:shadow-primary/20 hover:-translate-y-1 active:scale-95 shadow-stone-200"
                  }`}
              >
                {loading ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Verify Email
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleResendVerification}
                disabled={loading}
                className="w-full py-3 text-sm font-black uppercase tracking-widest text-primary hover:text-primary-dark disabled:opacity-50"
              >
                Resend Code
              </button>
            </form>
          ) : (
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
              <label className={labelClassName}>
                Full Name
              </label>
              <div className="relative">
                <div className={iconClassName}>
                  <User className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  placeholder="John Doe"
                  value={form.name || ""}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  className={`${inputClassName} py-4 pl-12 pr-4`}
                />
              </div>
            </div>

            {/* Email Input */}
            <div className="group">
              <label className={labelClassName}>
                Email Address
              </label>
              <div className="relative">
                <div className={iconClassName}>
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  type="email"
                  placeholder="john@example.com"
                  value={form.email || ""}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                  className={`${inputClassName} py-4 pl-12 pr-4`}
                />
              </div>
            </div>

            {/* Phone Input */}
            <div className="group">
              <label className={labelClassName}>
                Phone Number
              </label>
              <div className="flex gap-2">
                <div className="flex items-center px-4 py-4 bg-stone-100 border-2 border-stone-200 rounded-2xl text-text-main font-black shadow-sm text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50">
                  +855
                </div>
                <input
                  type="tel"
                  name="phone"
                  placeholder="12 345 678"
                  value={form.phone || ""}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  required
                  className={`${inputClassName} min-w-0 flex-1 px-5 py-4`}
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="group">
              <label className={labelClassName}>
                Password
              </label>
              <div className="relative">
                <div className={iconClassName}>
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
                  className={`${inputClassName} py-4 pl-12 pr-12`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-stone-400 hover:text-primary transition-colors dark:text-slate-400"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              <p className="mt-2 text-[10px] text-stone-500 font-bold uppercase tracking-widest pl-1 dark:text-slate-400">Min. 6 characters</p>
            </div>

            {/* Terms and Conditions */}
            <div className="bg-primary/5 rounded-[1.5rem] p-5 border border-primary/10 dark:bg-primary/10 dark:border-primary/20">
              <label className="flex items-start gap-4 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="w-5 h-5 mt-0.5 text-primary border-2 border-stone-300 rounded focus:ring-2 focus:ring-primary accent-primary"
                />
                <span className="text-xs text-text-muted leading-relaxed font-semibold dark:text-slate-300">
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
                ? "bg-stone-200 text-stone-500 cursor-not-allowed dark:bg-slate-800 dark:text-slate-500"
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
          )}

          {/* Divider */}
          {!verificationEmail && <div className="relative my-10">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-stone-200 dark:border-slate-700"></div>
            </div>
            <div className="relative flex justify-center text-[10px] font-black uppercase tracking-[0.3em]">
              <span className="px-6 bg-white text-stone-500 dark:bg-slate-900 dark:text-slate-400">
                OR SIGN UP WITH
              </span>
            </div>
          </div>}

          {/* Google Sign Up Button */}
          {!verificationEmail && <button
            type="button"
            onClick={handleGoogleSignUp}
            disabled={loading}
            className="w-full py-4 bg-white border border-stone-200 rounded-2xl font-bold shadow-sm hover:shadow-md transform hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center gap-3 text-text-main hover:border-primary disabled:opacity-50 disabled:cursor-not-allowed dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
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
          </button>}

          {/* Divider */}
          {!verificationEmail && <div className="relative my-10">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-stone-200 dark:border-slate-700"></div>
            </div>
            <div className="relative flex justify-center text-[10px] font-black uppercase tracking-[0.3em]">
              <span className="px-6 bg-white text-stone-500 dark:bg-slate-900 dark:text-slate-400">
                Already Joined?
              </span>
            </div>
          </div>}

          {/* Sign In Link */}
          {!verificationEmail && <div className="text-center">
            <a
              href="/login"
              className="inline-flex items-center gap-2 text-text-muted hover:text-primary font-bold text-sm transition-colors group"
            >
              Sign in to your account
              <span className="text-primary font-black uppercase tracking-widest border-b-2 border-primary/20 group-hover:border-primary transition-all">
                Login here
              </span>
            </a>
          </div>}
        </div>

        {/* Security Badge */}
        <div className="mt-10 text-center">
          <div className="inline-flex items-center gap-3 text-[10px] font-black text-stone-500 uppercase tracking-[0.2em] bg-white/70 px-6 py-3 rounded-full border border-white/20 shadow-sm backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-400">
            <ShieldCheck className="w-4 h-4 text-primary" />
            <span>Secure Registration • SSL Encrypted</span>
          </div>
        </div>
      </div>

      {/* Google Account Confirmation Modal */}
      {showGoogleConfirm && googleUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={handleGoogleCancel}
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="relative w-full max-w-sm p-6 rounded-2xl shadow-2xl bg-white"
          >
            <div className="text-center">
              {googleUser.picture && (
                <img
                  src={googleUser.picture}
                  alt={googleUser.name || "Google user"}
                  className="w-16 h-16 mx-auto mb-4 rounded-full object-cover border-2 border-gray-200 shadow-sm"
                />
              )}

              <h3 className="text-xl font-bold mb-1 text-gray-900">
                Continue with Google?
              </h3>
              
              <p className="text-sm mb-6 text-gray-500">
                Google will be verified on the server before account creation completes.
              </p>
              
              <div className="flex items-center justify-center gap-3 p-3 rounded-xl mb-6 bg-gray-100">
                <div className="text-left">
                  <p className="font-medium text-gray-900">
                    Continue with your selected Google account
                  </p>
                  <p className="text-sm text-gray-500">
                    You can cancel and choose a different account if needed.
                  </p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleGoogleCancel}
                  className="flex-1 py-3 px-4 rounded-xl font-semibold appearance-none bg-gray-100 text-gray-900 hover:bg-gray-200 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleGoogleContinue}
                  disabled={loading}
                  className="flex-1 py-3 px-4 rounded-xl font-semibold appearance-none border border-transparent bg-[var(--color-primary)] text-white shadow-sm shadow-black/10 transition-colors hover:bg-[var(--color-primary-dark)] disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{ color: "#FFFFFF" }}
                >
                  {loading && <Loader className="w-4 h-4 animate-spin" />}
                  Continue
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Register;
