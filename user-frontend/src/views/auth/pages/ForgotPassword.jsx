import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  forgotPassword,
  verifyResetCode,
  resendResetCode,
  resetPassword,
} from "../../../services/authApi";
import {
  Mail,
  AlertCircle,
  Loader,
  CheckCircle,
  ArrowLeft,
  Lock,
  Eye,
  EyeOff,
  KeyRound,
  ShieldCheck,
  Search,
  RotateCcw,
} from "lucide-react";

const STEPS = {
  FIND_ACCOUNT: 1,
  VERIFY_CODE: 2,
  NEW_PASSWORD: 3,
  SUCCESS: 4,
};

const ForgotPassword = () => {
  const [step, setStep] = useState(STEPS.FIND_ACCOUNT);
  const [email, setEmail] = useState("");
  const [maskedEmail, setMaskedEmail] = useState("");
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [resetToken, setResetToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendLoading, setResendLoading] = useState(false);
  const [verificationRejected, setVerificationRejected] = useState(false);

  const codeInputRefs = useRef([]);
  const verificationFeedbackTimerRef = useRef(null);
  const navigate = useNavigate();

  // Countdown timer for resend button
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Auto-focus first code input when entering step 2
  useEffect(() => {
    if (step === STEPS.VERIFY_CODE && codeInputRefs.current[0]) {
      setTimeout(() => codeInputRefs.current[0]?.focus(), 300);
    }
  }, [step]);

  useEffect(() => () => {
    if (verificationFeedbackTimerRef.current) {
      clearTimeout(verificationFeedbackTimerRef.current);
    }
  }, []);

  useEffect(() => {
    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };
  }, []);

  useEffect(() => {
    if (step !== STEPS.SUCCESS) {
      return undefined;
    }

    const redirectTimer = setTimeout(() => {
      navigate("/login", { replace: true });
    }, 3000);

    return () => clearTimeout(redirectTimer);
  }, [navigate, step]);

  const showRejectedVerification = () => {
    setVerificationRejected(true);

    if (verificationFeedbackTimerRef.current) {
      clearTimeout(verificationFeedbackTimerRef.current);
    }

    verificationFeedbackTimerRef.current = setTimeout(() => {
      setVerificationRejected(false);
      verificationFeedbackTimerRef.current = null;
    }, 3000);
  };

  // Step 1: Find account by email
  const handleFindAccount = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const normalizedEmail = email.trim();
      const { data } = await forgotPassword({ email: normalizedEmail });
      setEmail(data.email || normalizedEmail);
      setMaskedEmail(data.maskedEmail || data.email || normalizedEmail);
      setStep(STEPS.VERIFY_CODE);
      setResendCooldown(60);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Failed to find account. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // Handle code input
  const handleCodeChange = (index, value) => {
    if (value.length > 1) {
      // Handle paste
      const pastedCode = value.slice(0, 6).split("");
      const newCode = [...code];
      pastedCode.forEach((digit, i) => {
        if (index + i < 6) {
          newCode[index + i] = digit;
        }
      });
      setCode(newCode);
      const nextIndex = Math.min(index + pastedCode.length, 5);
      codeInputRefs.current[nextIndex]?.focus();
      return;
    }

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      codeInputRefs.current[index + 1]?.focus();
    }
  };

  const handleCodeKeyDown = (index, e) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      codeInputRefs.current[index - 1]?.focus();
    }
  };

  // Step 2: Verify code
  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setError("");

    const codeString = code.join("").trim();
    if (codeString.length !== 6) {
      setError("Please enter the complete 6-digit code.");
      return;
    }

    setLoading(true);

    try {
      const { data } = await verifyResetCode({ email: email.trim(), code: codeString });
      setResetToken(data.resetToken);
      setStep(STEPS.NEW_PASSWORD);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Invalid code. Please check and try again."
      );
      showRejectedVerification();
      // Clear code inputs on error
      setCode(["", "", "", "", "", ""]);
      codeInputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  // Resend code
  const handleResendCode = async () => {
    if (resendCooldown > 0 || resendLoading) return;
    setResendLoading(true);
    setError("");

    try {
      await resendResetCode({ email: email.trim() });
      setResendCooldown(60);
      setCode(["", "", "", "", "", ""]);
      setVerificationRejected(false);
      codeInputRefs.current[0]?.focus();
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to resend code. Please try again."
      );
    } finally {
      setResendLoading(false);
    }
  };

  // Step 3: Set new password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    try {
      await resetPassword({ token: resetToken, password });
      setStep(STEPS.SUCCESS);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Failed to reset password. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // Step indicator
  const StepIndicator = () => {
    const steps = [
      { num: 1, label: "Find" },
      { num: 2, label: "Verify" },
      { num: 3, label: "Reset" },
    ];

    if (step === STEPS.SUCCESS) return null;

    return (
      <div className="forgot-password-steps flex items-center justify-center gap-2 mb-3 sm:mb-5">
        {steps.map((s, i) => (
          <div key={s.num} className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all duration-500 ${step >= s.num
                ? "bg-primary text-white shadow-lg shadow-primary/30"
                : "bg-stone-100 text-stone-400"
                }`}
            >
              {step > s.num ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                s.num
              )}
            </div>
            {i < steps.length - 1 && (
              <div
                className={`w-10 h-0.5 rounded-full transition-all duration-500 ${step > s.num ? "bg-primary" : "bg-stone-100"
                  }`}
              />
            )}
          </div>
        ))}
      </div>
    );
  };

  // Get the icon and title for current step
  const getStepConfig = () => {
    switch (step) {
      case STEPS.FIND_ACCOUNT:
        return {
          icon: <Search className="w-8 h-8 text-primary" />,
          title: "Find Your Account",
          subtitle: "Enter the email linked to your account",
        };
      case STEPS.VERIFY_CODE:
        return {
          icon: <KeyRound className="w-8 h-8 text-primary" />,
          title: "Enter Security Code",
          subtitle: `Check ${maskedEmail} for a code`,
        };
      case STEPS.NEW_PASSWORD:
        return {
          icon: <Lock className="w-8 h-8 text-primary" />,
          title: "Choose a New Password",
          subtitle: "Create a strong, unique password",
        };
      case STEPS.SUCCESS:
        return {
          icon: <CheckCircle className="w-8 h-8 text-green-500" />,
          title: "Password Changed!",
          subtitle: "Your password has been updated successfully",
        };
      default:
        return { icon: null, title: "", subtitle: "" };
    }
  };

  const config = getStepConfig();

  return (
    <div className="forgot-password-page h-[100dvh] min-h-0 bg-bg-base flex items-center justify-center px-3 py-3 sm:px-4 sm:py-5 relative overflow-hidden font-sans">
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

      <div className="forgot-password-shell w-full max-w-md relative z-10">
        {/* Logo/Brand Section */}
        <div className="forgot-password-heading text-center mb-4 sm:mb-6">
          <div className="forgot-password-heading-icon inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-white rounded-2xl sm:rounded-3xl shadow-xl border border-stone-100 mb-3 sm:mb-4 transform hover:scale-105 transition-transform duration-300 dark:bg-[#232624] dark:border-[#383D39]">
            {config.icon}
          </div>
          <h1 className="forgot-password-title text-3xl sm:text-4xl font-black text-text-main mb-2 font-display tracking-tight leading-none">
            {config.title}
          </h1>
          <p className="forgot-password-subtitle text-text-muted font-medium text-sm sm:text-base">
            {config.subtitle}
          </p>
        </div>

        {/* Step Indicator */}
        <StepIndicator />

        {/* Card */}
        <div
          className={`forgot-password-card bg-white/80 backdrop-blur-2xl rounded-[1.75rem] sm:rounded-[2.5rem] shadow-2xl border border-white p-5 sm:p-7 dark:bg-[#232624]/95 dark:border-[#383D39] ${
            step === STEPS.VERIFY_CODE
              ? `otp-electric-frame otp-embossed-card ${verificationRejected ? "otp-electric-frame--error" : ""}`
              : ""
          }`}
        >
          {/* Error Message */}
          {step === STEPS.VERIFY_CODE ? (
            <div
              role="alert"
              aria-live="polite"
              className={`forgot-password-error-slot ${
                error ? "forgot-password-error-slot--visible" : ""
              }`}
            >
              <div className="forgot-password-error-message">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <p className="text-red-700 text-sm font-bold">{error || "\u00a0"}</p>
              </div>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-start gap-3 animate-shake mb-6">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-red-700 text-sm font-bold">{error}</p>
            </div>
          ) : null}

          {/* ===== STEP 1: Find Account ===== */}
          {step === STEPS.FIND_ACCOUNT && (
            <form onSubmit={handleFindAccount} className="space-y-6">
              <div className="bg-primary/5 rounded-2xl p-5 border border-primary/10 dark:bg-[#1A1C1B] dark:border-[#383D39]">
                <p className="text-sm text-text-muted leading-relaxed">
                  Please enter your email address to search for your account.
                  We'll send you a 6-digit code to verify your identity.
                </p>
              </div>

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
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoFocus
                    className="w-full pl-12 pr-4 py-4 border-2 border-stone-100 rounded-2xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all text-text-main font-bold placeholder-stone-300 bg-stone-50/50 focus:bg-white dark:bg-[#1A1C1B] dark:border-[#383D39] dark:placeholder-[#727871] dark:focus:bg-[#1A1C1B]"
                  />
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <Link
                  to="/login"
                  className="flex-1 py-4 rounded-2xl font-black uppercase tracking-[0.15em] text-xs border-2 border-stone-100 text-text-muted hover:border-stone-200 hover:bg-stone-50 transition-all flex items-center justify-center gap-2 dark:border-[#383D39] dark:bg-[#1A1C1B] dark:hover:bg-[#2D312E]"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={loading}
                  className={`flex-[2] py-4 rounded-2xl font-black uppercase tracking-[0.15em] text-xs shadow-xl transform transition-all duration-300 flex items-center justify-center gap-2 ${loading
                    ? "bg-stone-200 text-stone-500 cursor-not-allowed"
                    : "bg-primary text-white hover:bg-primary-dark hover:shadow-primary/20 hover:-translate-y-0.5 active:scale-95"
                    }`}
                >
                  {loading ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4" />
                      Search
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* ===== STEP 2: Verify Code ===== */}
          {step === STEPS.VERIFY_CODE && (
            <form onSubmit={handleVerifyCode} className="space-y-6">
              <div className="otp-embossed-panel bg-primary/5 rounded-2xl p-5 border border-primary/10 text-center dark:bg-[#1A1C1B] dark:border-[#383D39]">
                <div className="otp-embossed-icon inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-xl mb-3">
                  <Mail className="w-6 h-6 text-primary" />
                </div>
                <p className="text-sm text-text-muted leading-relaxed">
                  We sent a <strong className="text-text-main">6-digit code</strong> to{" "}
                  <strong className="text-primary">{maskedEmail}</strong>.
                  Enter it below to verify your identity.
                </p>
              </div>

              {/* 6-Digit Code Input */}
              <div>
                <label className="block text-xs font-black text-primary uppercase tracking-[0.2em] mb-4 ml-1 text-center">
                  Verification Code
                </label>
                <div className="flex gap-2 sm:gap-3 justify-center">
                  {code.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => (codeInputRefs.current[index] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={digit}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, "");
                        handleCodeChange(index, val);
                      }}
                      onKeyDown={(e) => handleCodeKeyDown(index, e)}
                      aria-invalid={verificationRejected}
                      onPaste={(e) => {
                        e.preventDefault();
                        const pastedData = e.clipboardData
                          .getData("text")
                          .replace(/[^0-9]/g, "")
                          .slice(0, 6);
                        if (pastedData) {
                          handleCodeChange(0, pastedData);
                        }
                      }}
                      className={`otp-embossed-input w-12 h-14 sm:w-14 sm:h-16 text-center text-xl sm:text-2xl font-black border-2 rounded-xl transition-all focus:outline-none ${digit
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-stone-200 bg-stone-50/50 text-text-main focus:border-primary focus:ring-4 focus:ring-primary/5 dark:border-[#383D39] dark:bg-[#1A1C1B]"
                        }`}
                    />
                  ))}
                </div>
              </div>

              {/* Resend Code */}
              <div className="text-center">
                {resendCooldown > 0 ? (
                  <p className="text-xs text-stone-400 font-bold">
                    Resend code in{" "}
                    <span className="text-primary font-black">
                      {resendCooldown}s
                    </span>
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendCode}
                    disabled={resendLoading}
                    className="inline-flex items-center gap-2 text-xs font-black text-primary hover:text-primary-dark transition-colors uppercase tracking-wider"
                  >
                    {resendLoading ? (
                      <Loader className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <RotateCcw className="w-3.5 h-3.5" />
                    )}
                    Didn't get a code? Resend
                  </button>
                )}
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setStep(STEPS.FIND_ACCOUNT);
                    setError("");
                    setCode(["", "", "", "", "", ""]);
                    setVerificationRejected(false);
                  }}
                  className="otp-embossed-button flex-1 py-4 rounded-2xl font-black uppercase tracking-[0.15em] text-xs border-2 border-stone-100 text-text-muted hover:border-stone-200 hover:bg-stone-50 transition-all flex items-center justify-center gap-2 dark:border-[#383D39] dark:bg-[#1A1C1B] dark:hover:bg-[#2D312E]"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading || code.join("").length !== 6}
                  className={`otp-embossed-button flex-[2] py-4 rounded-2xl font-black uppercase tracking-[0.15em] text-xs shadow-xl transform transition-all duration-300 flex items-center justify-center gap-2 ${loading || code.join("").length !== 6
                    ? "bg-stone-200 text-stone-500 cursor-not-allowed"
                    : "bg-primary text-white hover:bg-primary-dark hover:shadow-primary/20 hover:-translate-y-0.5 active:scale-95"
                    }`}
                >
                  {loading ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      Continue
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* ===== STEP 3: New Password ===== */}
          {step === STEPS.NEW_PASSWORD && (
            <form onSubmit={handleResetPassword} className="space-y-6">
              <div className="bg-green-50 rounded-2xl p-4 border border-green-100 flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                <p className="text-sm text-green-800 font-bold">
                  Identity verified! Now create your new password.
                </p>
              </div>

              {/* New Password */}
              <div className="group">
                <label className="block text-xs font-black text-primary uppercase tracking-[0.2em] mb-3 ml-1">
                  New Password
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/40 group-focus-within:text-primary transition-colors">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter new password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    autoFocus
                    className="w-full pl-12 pr-12 py-4 border-2 border-stone-100 rounded-2xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all text-text-main font-bold placeholder-stone-300 bg-stone-50/50 focus:bg-white dark:bg-[#1A1C1B] dark:border-[#383D39] dark:placeholder-[#727871] dark:focus:bg-[#1A1C1B]"
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
                <p className="mt-2 text-[10px] text-stone-400 font-bold uppercase tracking-widest pl-1">
                  Min. 6 characters
                </p>
              </div>

              {/* Confirm Password */}
              <div className="group">
                <label className="block text-xs font-black text-primary uppercase tracking-[0.2em] mb-3 ml-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/40 group-focus-within:text-primary transition-colors">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full pl-12 pr-12 py-4 border-2 border-stone-100 rounded-2xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all text-text-main font-bold placeholder-stone-300 bg-stone-50/50 focus:bg-white dark:bg-[#1A1C1B] dark:border-[#383D39] dark:placeholder-[#727871] dark:focus:bg-[#1A1C1B]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-stone-400 hover:text-primary transition-colors focus:outline-none"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>

                {/* Password match indicator */}
                {confirmPassword && (
                  <div className="mt-2 flex items-center gap-2 pl-1">
                    {password === confirmPassword ? (
                      <>
                        <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                        <span className="text-[10px] text-green-600 font-bold uppercase tracking-widest">
                          Passwords match
                        </span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                        <span className="text-[10px] text-red-500 font-bold uppercase tracking-widest">
                          Passwords don't match
                        </span>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || !password || !confirmPassword}
                className={`w-full py-5 rounded-2xl font-black uppercase tracking-[0.2em] shadow-xl transform transition-all duration-300 flex items-center justify-center gap-3 text-sm ${loading || !password || !confirmPassword
                  ? "bg-stone-200 text-stone-500 cursor-not-allowed"
                  : "bg-text-main text-white hover:bg-primary hover:shadow-primary/20 hover:-translate-y-1 active:scale-95"
                  }`}
              >
                {loading ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    Resetting...
                  </>
                ) : (
                  <>
                    <Lock className="w-5 h-5" />
                    Reset Password
                  </>
                )}
              </button>
            </form>
          )}

          {/* ===== STEP 4: Success ===== */}
          {step === STEPS.SUCCESS && (
            <div className="forgot-password-success space-y-6 text-center">
              <div className="forgot-password-success-panel bg-green-50 border border-green-100 rounded-2xl p-8">
                <div className="forgot-password-success-icon inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-2xl mb-5">
                  <CheckCircle className="forgot-password-success-check w-8 h-8 text-green-500" />
                </div>
                <h3 className="forgot-password-success-copy text-lg font-black text-green-800 mb-2">
                  All Set!
                </h3>
                <p className="forgot-password-success-copy text-sm text-green-700 leading-relaxed">
                  Your password has been changed successfully. You can now sign
                  in with your new password.
                </p>
                <p className="forgot-password-success-copy mt-4 text-xs font-bold uppercase tracking-wider text-green-600">
                  Redirecting to sign in…
                </p>
                <div className="forgot-password-success-progress mt-3 h-1 overflow-hidden rounded-full bg-green-200">
                  <span className="block h-full rounded-full bg-green-500" />
                </div>
              </div>

              <button
                onClick={() => navigate("/login", { replace: true })}
                className="w-full py-5 rounded-2xl font-black uppercase tracking-[0.2em] shadow-xl transform transition-all duration-300 flex items-center justify-center gap-3 text-sm bg-text-main text-white hover:bg-primary hover:shadow-primary/20 hover:-translate-y-1 active:scale-95"
              >
                <ArrowLeft className="w-5 h-5" />
                Back to Sign In
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
