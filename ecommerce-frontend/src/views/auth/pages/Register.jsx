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
import { useLanguage } from "../../../context/useLanguage";
import {
  isValidCambodiaMobilePhone,
  normalizeCambodiaMobilePhone,
  toCambodiaLocalPhoneDigits,
} from "../../../utils/cambodiaPhone";
import { motion } from "framer-motion";
import BrandLogo from "../../../components/common/BrandLogo";
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

  const submitHandler = async (e) => {
    e.preventDefault();

    const requiredFields = [
      ["name", t("registerPage.fieldNames.fullName")],
      ["email", t("registerPage.fieldNames.emailAddress")],
      ["phone", t("registerPage.fieldNames.phoneNumber")],
      ["password", t("registerPage.fieldNames.password")],
    ];
    const missingFields = requiredFields
      .filter(([key]) => !String(form[key] || "").trim())
      .map(([, label]) => label);

    if (missingFields.length > 0) {
      setError(t("registerPage.errors.requiredFields", { fields: missingFields.join(", ") }));
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      setError(t("registerPage.errors.validEmail"));
      return;
    }

    if (!isValidCambodiaMobilePhone(form.phone)) {
      setError(t("registerPage.errors.validCambodiaPhone"));
      return;
    }

    if (form.password.length < 6) {
      setError(t("registerPage.errors.passwordLength"));
      return;
    }

    if (!agreedToTerms) {
      setError(t("registerPage.errors.acceptTerms"));
      return;
    }

    setError("");
    setLoading(true);

    try {
      const formData = {
        name: form.name,
        email: form.email,
        phone: normalizeCambodiaMobilePhone(form.phone),
        password: form.password,
      };

      const { data } = await registerUser(formData);
      setVerificationEmail(data.email || formData.email);
      setSuccessMessage(data.message || t("registerPage.messages.verificationSent"));
      setLoading(false);
    } catch (err) {
      let errorMessage = t("registerPage.errors.registrationFailed");

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
        errorMessage = t("registerPage.errors.duplicateEmail");
      }

      setError(errorMessage);
      setLoading(false);
    }
  };

  const handleVerifyEmail = async (e) => {
    e.preventDefault();

    if (!verificationCode.trim()) {
      setError(t("registerPage.errors.verificationCodeRequired"));
      return;
    }

    try {
      setError("");
      setLoading(true);
      const { data } = await verifyRegistrationEmail({
        email: verificationEmail,
        code: verificationCode,
      });
      setSuccessMessage(data.message || t("registerPage.messages.verificationSuccess"));
      setLoading(false);
      navigate("/login", { state: { from: safeRedirect } });
    } catch (err) {
      setError(err.response?.data?.message || t("registerPage.errors.verificationFailed"));
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    try {
      setError("");
      setLoading(true);
      const { data } = await resendRegistrationVerification({ email: verificationEmail });
      setSuccessMessage(data.message || t("registerPage.messages.verificationResent"));
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.message || t("registerPage.errors.resendFailed"));
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
      setError(t("registerPage.errors.googleFailed"));
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
        throw new Error(t("registerPage.errors.googleMissingToken"));
      }

      if (data.role !== "user") {
        setError(t("registerPage.errors.wrongAccountType"));
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
        err.response?.data?.message || t("registerPage.errors.googleFailed")
      );
      setLoading(false);
    }
  };

  const handleGoogleCancel = () => {
    setGoogleUser(null);
    setShowGoogleConfirm(false);
  };

  const inputClassName =
    "h-12 w-full rounded-xl border bg-white px-4 font-bold text-text-main transition-all placeholder:text-stone-400 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50 dark:placeholder:text-slate-500";
  const iconClassName =
    "absolute left-4 top-1/2 -translate-y-1/2 text-primary/60 transition-colors group-focus-within:text-primary";
  const labelClassName =
    "mb-2 ml-1 block text-xs font-black uppercase tracking-[0.2em] text-primary dark:text-primary-light";

  return (
    <div className="register-page relative flex h-[100svh] items-center justify-center overflow-hidden bg-bg-base px-3 py-4 font-sans sm:px-4 sm:py-6 lg:p-5">
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

      <div className="register-shell relative z-10 mx-auto grid max-h-full w-full max-w-md grid-cols-1 overflow-hidden rounded-2xl bg-transparent sm:rounded-[2.5rem] lg:h-full lg:max-w-6xl lg:grid-cols-[40%_60%] lg:rounded-[2rem] lg:border lg:border-white/80 lg:bg-white/90 lg:shadow-[0_30px_100px_-35px_rgba(45,49,46,0.4)] lg:backdrop-blur-xl lg:dark:border-slate-700 lg:dark:bg-slate-900/95">
        <section className="register-brand relative hidden min-h-0 overflow-hidden bg-primary text-white lg:flex lg:flex-col lg:justify-between lg:p-8 xl:p-10">
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/10" />
          <div className="absolute -bottom-32 -left-24 h-80 w-80 rounded-full bg-secondary/30" />

          <div className="relative flex min-w-0 flex-col items-center sm:items-start lg:block">
            <div className="register-brand-logo inline-flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white p-1.5 shadow-lg ring-1 ring-white/25 sm:h-12 sm:w-12 lg:mb-5 lg:h-14 lg:w-14 lg:rounded-2xl xl:mb-8">
              <BrandLogo
                alt="Cherish Baby store logo"
                className="h-full w-full object-contain"
              />
            </div>
            <div className="min-w-0 text-center sm:mt-4 sm:text-left lg:mt-0">
              <p className="mt-3 [writing-mode:vertical-rl] rotate-180 text-[9px] font-black uppercase tracking-[0.22em] text-white/80 sm:mt-0 sm:[writing-mode:horizontal-tb] sm:rotate-0 sm:text-xs lg:mb-3 lg:tracking-[0.3em]">
                Cherish Baby
              </p>
              <h1 className="register-brand-title mt-3 hidden max-w-xl text-lg font-black leading-tight text-white sm:block sm:text-xl lg:mt-0 lg:max-w-sm lg:text-4xl lg:leading-[1.08] xl:text-5xl">
                {t("registerPage.brandTitle")}
              </h1>
              <p className="register-brand-copy mt-3 hidden max-w-sm text-xs font-medium leading-5 text-white/75 md:block lg:mt-5 lg:text-base lg:leading-7">
                {t("registerPage.brandDescription")}
              </p>
            </div>
          </div>

          <div className="register-benefits relative hidden space-y-3 lg:block lg:space-y-4">
            {[
              t("registerPage.benefits.secureCheckout"),
              t("registerPage.benefits.liveTracking"),
              t("registerPage.benefits.fasterShopping"),
            ].map((benefit) => (
              <div key={benefit} className="flex items-center gap-2.5 text-xs font-bold text-white/90 lg:gap-3 lg:text-sm">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/15">
                  <CheckCircle className="h-4 w-4" />
                </span>
                {benefit}
              </div>
            ))}
          </div>
        </section>

        <main className="register-main flex min-h-0 justify-center overflow-y-auto rounded-2xl border border-white bg-white/95 px-5 py-5 shadow-[0_18px_50px_-28px_rgba(45,49,46,0.3)] backdrop-blur-2xl dark:border-slate-800 dark:bg-slate-900/95 sm:rounded-[2.5rem] sm:px-8 sm:py-7 lg:items-center lg:overflow-hidden lg:rounded-none lg:border-0 lg:bg-transparent lg:px-10 lg:py-4 lg:shadow-none lg:backdrop-blur-none lg:dark:bg-transparent xl:px-12">
          <div className="mx-auto w-full max-w-xl">
            <div className="register-heading mb-5 text-center sm:mb-6 lg:text-left">
              <h2 className="font-display text-3xl font-black leading-tight tracking-tight text-text-main dark:text-slate-100 sm:text-4xl">
                {t("registerPage.title")}
              </h2>
              <p className="mt-2 text-sm font-medium text-text-muted dark:text-slate-400 sm:text-base">
                {t("registerPage.subtitle")}
              </p>
            </div>

        <div>
          {verificationEmail ? (
            <form onSubmit={handleVerifyEmail} className="space-y-4">
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
                <h2 className="text-2xl font-black text-text-main mb-2">{t("registerPage.verifyEmail")}</h2>
                <p className="text-sm text-text-muted font-semibold">
                  {t("registerPage.verificationInstructions")}{" "}
                  <span className="text-text-main font-black">{verificationEmail}</span>
                </p>
              </div>

              <div className="group">
                <label className={labelClassName}>
                  {t("registerPage.verificationCode")}
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
                    {t("registerPage.verifying")}
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    {t("registerPage.verify")}
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleResendVerification}
                disabled={loading}
                className="w-full py-3 text-sm font-black uppercase tracking-widest text-primary hover:text-primary-dark disabled:opacity-50"
              >
                {t("registerPage.resendCode")}
              </button>
            </form>
          ) : (
          <form onSubmit={submitHandler} noValidate className="register-form grid w-full grid-cols-1 gap-x-4 gap-y-3 lg:grid-cols-2">
            {/* Error Message */}
            {error && (
              <div className="fixed left-3 right-3 top-3 z-50 mx-auto flex max-w-xl animate-shake items-start gap-3 rounded-xl border border-red-200 bg-red-600 p-3 text-white shadow-2xl">
                <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-white" />
                <p className="text-sm font-bold text-white">{error}</p>
              </div>
            )}

            {/* Name Input */}
            <div className="group">
              <label className={labelClassName}>
                {t("registerPage.fullName")}
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
                  className={`${inputClassName} !pl-12`}
                />
              </div>
            </div>

            {/* Email Input */}
            <div className="group">
              <label className={labelClassName}>
                {t("registerPage.emailAddress")}
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
                  className={`${inputClassName} !pl-12`}
                />
              </div>
            </div>

            {/* Phone Input */}
            <div className="group">
              <label className={labelClassName}>
                {t("registerPage.phoneNumber")}
              </label>
              <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-2">
                <div className="flex h-12 shrink-0 items-center rounded-xl border border-stone-200 bg-stone-100 px-4 font-black text-text-main dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50">
                  +855
                </div>
                <input
                  type="tel"
                  name="phone"
                  placeholder="12 345 678"
                  value={form.phone || ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      phone: toCambodiaLocalPhoneDigits(e.target.value).slice(0, 9),
                    })
                  }
                  inputMode="numeric"
                  autoComplete="tel-national"
                  maxLength={9}
                  required
                  className={`${inputClassName} min-w-0 flex-1`}
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="group">
              <label className={labelClassName}>
                {t("registerPage.password")}
              </label>
              <div className="relative">
                <div className={iconClassName}>
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder={t("registerPage.passwordPlaceholder")}
                  value={form.password || ""}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                  required
                  minLength={6}
                  className={`${inputClassName} !pl-12 !pr-12`}
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
              <p className="mt-0.5 text-[8px] font-bold uppercase tracking-widest text-stone-500 dark:text-slate-400 sm:mt-1 sm:text-[9px]">{t("registerPage.passwordHint")}</p>
            </div>

            {/* Terms and Conditions */}
            <div className="col-span-full rounded-xl border border-primary/10 bg-primary/5 p-2.5 dark:border-primary/20 dark:bg-primary/10 sm:p-3">
              <label className="flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="h-5 w-5 shrink-0 rounded border-2 border-stone-300 text-primary accent-primary focus:ring-2 focus:ring-primary"
                />
                <span className="text-[11px] font-semibold leading-relaxed text-text-muted dark:text-slate-300 sm:text-xs">
                  {t("registerPage.agreePrefix")}{" "}
                  <a
                    href="/terms"
                    className="text-primary hover:text-primary-dark font-black transition-colors underline decoration-primary/20 hover:decoration-primary"
                  >
                    {t("registerPage.termsOfService")}
                  </a>{" "}
                  {t("registerPage.and")}{" "}
                  <a
                    href="/privacy"
                    className="text-primary hover:text-primary-dark font-black transition-colors underline decoration-primary/20 hover:decoration-primary"
                  >
                    {t("registerPage.privacyPolicy")}
                  </a>
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              aria-disabled={loading || !isFormValid()}
              className={`col-span-full flex h-12 w-full items-center justify-center gap-3 rounded-xl text-sm font-black uppercase tracking-[0.18em] shadow-lg transition-all duration-300 ${loading || !isFormValid()
                ? `${loading ? "cursor-wait" : "cursor-pointer hover:bg-primary/30"} bg-primary/20 text-primary-dark shadow-primary/10 dark:bg-primary/15 dark:text-primary-light`
                : "bg-primary text-white shadow-primary/25 hover:bg-primary-dark hover:shadow-primary/35 hover:-translate-y-1 active:scale-95"
                }`}
            >
              {loading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  {t("registerPage.creating")}
                </>
              ) : (
                <>
                  <UserPlus className="w-5 h-5" />
                  {t("registerPage.createAccount")}
                </>
              )}
            </button>
          </form>
          )}

          {/* Divider */}
          {!verificationEmail && <div className="relative my-4 w-full">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-stone-200 dark:border-slate-700"></div>
            </div>
            <div className="relative flex justify-center text-[10px] font-black uppercase tracking-[0.3em]">
              <span className="bg-white px-4 text-stone-500 dark:bg-slate-900 dark:text-slate-400">
                {t("registerPage.alternativeSignUp")}
              </span>
            </div>
          </div>}

          {/* Google Sign Up Button */}
          {!verificationEmail && <button
            type="button"
            onClick={handleGoogleSignUp}
            disabled={loading}
            className="flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-stone-200 bg-white font-bold text-text-main shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-primary hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
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
            <span className="text-sm uppercase tracking-widest font-black">{t("registerPage.googleSignUp")}</span>
          </button>}

          {/* Divider */}
          {/* Sign In Link */}
          {!verificationEmail && <div className="mt-3 w-full text-center">
            <a
              href="/login"
              className="inline-flex items-center gap-2 text-xs font-bold text-text-muted transition-colors hover:text-primary sm:text-sm"
            >
              {t("registerPage.alreadyHaveAccount")}
              <span className="font-black text-primary">{t("registerPage.signIn")}</span>
            </a>
          </div>}
        </div>

          <div className="register-security mt-2 hidden items-center justify-center gap-2 text-[9px] font-black uppercase tracking-[0.16em] text-stone-500 dark:text-slate-400 sm:flex sm:mt-3">
            <ShieldCheck className="h-3.5 w-3.5 text-primary" />
            {t("registerPage.secureRegistration")}
          </div>
          </div>
        </main>
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
                  alt={googleUser.name || t("registerPage.googleUserAlt")}
                  className="w-16 h-16 mx-auto mb-4 rounded-full object-cover border-2 border-gray-200 shadow-sm"
                />
              )}

              <h3 className="text-xl font-bold mb-1 text-gray-900">
                {t("registerPage.googleConfirmTitle")}
              </h3>
              
              <p className="text-sm mb-6 text-gray-500">
                {t("registerPage.googleConfirmDescription")}
              </p>
              
              <div className="flex items-center justify-center gap-3 p-3 rounded-xl mb-6 bg-gray-100">
                <div className="text-left">
                  <p className="font-medium text-gray-900">
                    {t("registerPage.googleSelectedAccount")}
                  </p>
                  <p className="text-sm text-gray-500">
                    {t("registerPage.googleChooseAnother")}
                  </p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleGoogleCancel}
                  className="flex-1 py-3 px-4 rounded-xl font-semibold appearance-none bg-gray-100 text-gray-900 hover:bg-gray-200 transition-all"
                >
                  {t("registerPage.cancel")}
                </button>
                <button
                  type="button"
                  onClick={handleGoogleContinue}
                  disabled={loading}
                  className="flex-1 py-3 px-4 rounded-xl font-semibold appearance-none border border-transparent bg-[var(--color-primary)] text-white shadow-sm shadow-black/10 transition-colors hover:bg-[var(--color-primary-dark)] disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{ color: "#FFFFFF" }}
                >
                  {loading && <Loader className="w-4 h-4 animate-spin" />}
                  {t("registerPage.continue")}
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
