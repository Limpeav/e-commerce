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
import PastelCloudBackdrop from "../../../components/ui/PastelCloudBackdrop";

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

  const codeInputRefs = useRef([]);
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

  // Step 1: Find account by email
  const handleFindAccount = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { data } = await forgotPassword({ email });
      setMaskedEmail(data.maskedEmail || email);
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

    const codeString = code.join("");
    if (codeString.length !== 6) {
      setError("Please enter the complete 6-digit code.");
      return;
    }

    setLoading(true);

    try {
      const { data } = await verifyResetCode({ email, code: codeString });
      setResetToken(data.resetToken);
      setStep(STEPS.NEW_PASSWORD);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Invalid code. Please check and try again."
      );
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
      await resendResetCode({ email });
      setResendCooldown(60);
      setCode(["", "", "", "", "", ""]);
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
      <div className="mb-6 flex items-center justify-center gap-2">
        {steps.map((s, i) => (
          <div key={s.num} className="flex items-center gap-2">
            <div
              className={`flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-semibold transition-all duration-500 ${step >= s.num
                ? "bg-primary text-text-main shadow-sm"
                : "bg-primary/10 text-text-muted"
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
                className={`h-0.5 w-9 rounded-full transition-all duration-500 ${step > s.num ? "bg-primary" : "bg-primary/10"
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
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-bg-base px-4 py-10 font-sans">
      <PastelCloudBackdrop />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo/Brand Section */}
        <div className="mb-8 text-center">
          <div className="mb-5 inline-flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/15 bg-white shadow-sm">
            {config.icon}
          </div>
          <h1 className="text-3xl font-bold text-text-main md:text-4xl">
            {config.title}
          </h1>
          <p className="mt-1 text-sm text-text-muted">
            {config.subtitle}
          </p>
        </div>

        {/* Step Indicator */}
        <StepIndicator />

        {/* Card */}
        <div className="rounded-2xl border border-primary/15 bg-white/95 p-6 shadow-sm backdrop-blur md:p-7">
          {/* Error Message */}
          {error && (
            <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 p-3 animate-shake">
              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500" />
              <p className="text-sm font-medium text-red-700">{error}</p>
            </div>
          )}

          {/* ===== STEP 1: Find Account ===== */}
          {step === STEPS.FIND_ACCOUNT && (
            <form onSubmit={handleFindAccount} className="space-y-4">
              <div className="rounded-xl border border-primary/12 bg-blue-soft/25 p-4">
                <p className="text-sm text-text-muted leading-relaxed">
                  Please enter your email address to search for your account.
                  We'll send you a 6-digit code to verify your identity.
                </p>
              </div>

              {/* Email Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-text-main">Email Address</label>
                <div className="relative">
                  <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-primary/45">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    type="email"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoFocus
                    className="w-full rounded-xl border border-primary/20 bg-white py-3 pl-11 pr-4 text-sm text-text-main placeholder:text-text-muted/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
                  />
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <Link
                  to="/login"
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-primary/20 py-3 text-xs font-semibold text-text-muted transition-colors hover:bg-blue-soft/25"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={loading}
                  className={`flex flex-[2] items-center justify-center gap-2 rounded-xl py-3 text-xs font-semibold transition-colors ${loading
                    ? "cursor-not-allowed bg-primary/15 text-primary/60"
                    : "bg-primary text-text-main hover:bg-primary-hover"
                    }`}
                >
                  {loading ? (
                    <>
                      <Loader className="h-4 w-4 animate-spin" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4" />
                      Search
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* ===== STEP 2: Verify Code ===== */}
          {step === STEPS.VERIFY_CODE && (
            <form onSubmit={handleVerifyCode} className="space-y-4">
              <div className="rounded-xl border border-primary/12 bg-blue-soft/25 p-4 text-center">
                <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/12">
                  <Mail className="h-5 w-5 text-primary" />
                </div>
                <p className="text-sm text-text-muted leading-relaxed">
                  We sent a <strong className="text-text-main">6-digit code</strong> to{" "}
                  <strong className="text-primary">{maskedEmail}</strong>.
                  Enter it below to verify your identity.
                </p>
              </div>

              {/* 6-Digit Code Input */}
              <div>
                <label className="mb-3 block text-center text-xs font-semibold text-text-main">Verification Code</label>
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
                      className={`h-12 w-10 rounded-lg border text-center text-lg font-semibold transition-all focus:outline-none sm:h-14 sm:w-12 sm:text-xl ${digit
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-primary/20 bg-white text-text-main focus:border-primary focus:ring-2 focus:ring-primary/15"
                        }`}
                    />
                  ))}
                </div>
              </div>

              {/* Resend Code */}
              <div className="text-center">
                {resendCooldown > 0 ? (
                  <p className="text-xs text-text-muted">
                    Resend code in{" "}
                    <span className="font-semibold text-primary">
                      {resendCooldown}s
                    </span>
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendCode}
                    disabled={resendLoading}
                    className="inline-flex items-center gap-2 text-xs font-semibold text-primary transition-colors hover:text-primary-hover"
                  >
                    {resendLoading ? (
                      <Loader className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <RotateCcw className="h-3.5 w-3.5" />
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
                  }}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-primary/20 py-3 text-xs font-semibold text-text-muted transition-colors hover:bg-blue-soft/25"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading || code.join("").length !== 6}
                  className={`flex flex-[2] items-center justify-center gap-2 rounded-xl py-3 text-xs font-semibold transition-colors ${loading || code.join("").length !== 6
                    ? "cursor-not-allowed bg-primary/15 text-primary/60"
                    : "bg-primary text-text-main hover:bg-primary-hover"
                    }`}
                >
                  {loading ? (
                    <>
                      <Loader className="h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="h-4 w-4" />
                      Continue
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* ===== STEP 3: New Password ===== */}
          {step === STEPS.NEW_PASSWORD && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="flex items-center gap-3 rounded-xl border border-green-100 bg-green-50 p-3">
                <CheckCircle className="h-4 w-4 flex-shrink-0 text-green-500" />
                <p className="text-sm font-medium text-green-800">
                  Identity verified! Now create your new password.
                </p>
              </div>

              {/* New Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-text-main">New Password</label>
                <div className="relative">
                  <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-primary/45">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter new password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    autoFocus
                    className="w-full rounded-xl border border-primary/20 bg-white py-3 pl-11 pr-11 text-sm text-text-main placeholder:text-text-muted/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted transition-colors hover:text-primary focus:outline-none"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                <p className="text-[11px] text-text-muted">Minimum 6 characters</p>
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-text-main">Confirm Password</label>
                <div className="relative">
                  <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-primary/45">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full rounded-xl border border-primary/20 bg-white py-3 pl-11 pr-11 text-sm text-text-main placeholder:text-text-muted/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted transition-colors hover:text-primary focus:outline-none"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>

                {/* Password match indicator */}
                {confirmPassword && (
                  <div className="flex items-center gap-2">
                    {password === confirmPassword ? (
                      <>
                        <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                        <span className="text-[11px] font-medium text-green-600">
                          Passwords match
                        </span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-3.5 w-3.5 text-red-400" />
                        <span className="text-[11px] font-medium text-red-500">
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
                className={`flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold transition-colors ${loading || !password || !confirmPassword
                  ? "cursor-not-allowed bg-primary/15 text-primary/60"
                  : "bg-primary text-text-main hover:bg-primary-hover"
                  }`}
              >
                {loading ? (
                  <>
                    <Loader className="h-4 w-4 animate-spin" />
                    Resetting...
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4" />
                    Reset Password
                  </>
                )}
              </button>
            </form>
          )}

          {/* ===== STEP 4: Success ===== */}
          {step === STEPS.SUCCESS && (
            <div className="space-y-4 text-center">
              <div className="rounded-xl border border-green-100 bg-green-50 p-6">
                <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-green-100">
                  <CheckCircle className="h-7 w-7 text-green-500" />
                </div>
                <h3 className="mb-1 text-lg font-semibold text-green-800">
                  All Set!
                </h3>
                <p className="text-sm text-green-700 leading-relaxed">
                  Your password has been changed successfully. You can now sign
                  in with your new password.
                </p>
              </div>

              <button
                onClick={() => navigate("/login")}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-semibold text-text-main transition-colors hover:bg-primary-hover"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Sign In
              </button>
            </div>
          )}
        </div>

        {/* Security Badge */}
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

export default ForgotPassword;
