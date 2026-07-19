import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle,
  Copy,
  Eye,
  EyeOff,
  KeyRound,
  Loader,
  Mail,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { AuthController } from "../../../controllers";

const PASSWORD_WORDS = [
  "Market",
  "River",
  "Green",
  "Cloud",
  "Order",
  "Parcel",
  "Store",
  "Route",
];

const generateSuggestedPassword = (role = "staff") => {
  const rolePrefix = role === "delivery" ? "Delivery" : "Seller";
  const word = PASSWORD_WORDS[Math.floor(Math.random() * PASSWORD_WORDS.length)];
  const number = Math.floor(100 + Math.random() * 900);
  return `${rolePrefix}${word}${number}!`;
};

const getPortal = (pathname) => {
  if (pathname.startsWith("/delivery")) {
    return {
      role: "delivery",
      title: "Delivery Password Reset",
      loginPath: "/delivery/login",
    };
  }

  return {
    role: "seller",
    title: "Seller Password Reset",
    loginPath: "/seller/login",
  };
};

const StaffForgotPassword = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const portal = useMemo(() => getPortal(location.pathname), [location.pathname]);
  const [step, setStep] = useState("email");
  const [email, setEmail] = useState("");
  const [maskedEmail, setMaskedEmail] = useState("");
  const [code, setCode] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [suggestedPassword, setSuggestedPassword] = useState(() =>
    generateSuggestedPassword(portal.role)
  );
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown <= 0) {
      return undefined;
    }

    const timer = setTimeout(() => {
      setResendCooldown((current) => Math.max(current - 1, 0));
    }, 1000);

    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const submitEmail = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const normalizedEmail = email.trim().toLowerCase();
      const response = await AuthController.forgotPassword({
        email: normalizedEmail,
        role: portal.role,
      });
      setEmail(response.data?.email || normalizedEmail);
      setMaskedEmail(response.data?.maskedEmail || normalizedEmail);
      setSuccess(response.data?.message || "We sent a code to your email.");
      setResendCooldown(60);
      setStep("code");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to send reset code.");
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async () => {
    if (resendCooldown > 0 || resendLoading) return;

    setError("");
    setSuccess("");
    setResendLoading(true);

    try {
      const response = await AuthController.resendResetCode({
        email: email.trim().toLowerCase(),
        role: portal.role,
      });
      setEmail(response.data?.email || email);
      setMaskedEmail(response.data?.maskedEmail || maskedEmail);
      setCode("");
      setSuccess(response.data?.message || "A new code has been sent to your email.");
      setResendCooldown(60);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to resend reset code.");
    } finally {
      setResendLoading(false);
    }
  };

  const submitCode = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const response = await AuthController.verifyResetCode({
        email,
        code,
        role: portal.role,
      });
      setResetToken(response.data?.resetToken || "");
      setSuggestedPassword(generateSuggestedPassword(portal.role));
      setSuccess(response.data?.message || "Code verified successfully.");
      setStep("password");
    } catch (err) {
      setError(err.response?.data?.message || "Invalid or expired code.");
    } finally {
      setLoading(false);
    }
  };

  const useSuggestedPassword = () => {
    setPassword(suggestedPassword);
    setConfirmPassword(suggestedPassword);
    setShowPassword(true);
    setError("");
  };

  const refreshSuggestedPassword = () => {
    setSuggestedPassword(generateSuggestedPassword(portal.role));
  };

  const copySuggestedPassword = async () => {
    try {
      await navigator.clipboard.writeText(suggestedPassword);
      setSuccess("Suggested password copied.");
    } catch {
      setError("Unable to copy password. You can type it manually.");
    }
  };

  const submitPassword = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await AuthController.resetPassword({
        token: resetToken,
        password,
      });
      setSuccess("Password reset successfully. Redirecting to login...");
      setTimeout(() => navigate(portal.loginPath, { replace: true }), 1300);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to reset password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[var(--color-bg-base)] p-4 font-sans text-[var(--color-text-main)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(122,150,126,0.18),transparent_34%),linear-gradient(180deg,#FCF9F5_0%,#F1ECE6_100%)]" />
      <div className="relative z-10 w-full max-w-lg">
        <div className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white/95 shadow-2xl shadow-[var(--color-primary)]/10 backdrop-blur-xl">
          <div className="px-8 pb-6 pt-10 text-center sm:px-10">
            <div className="mb-5 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--color-primary)]/10 shadow-sm ring-1 ring-[var(--color-primary)]/20">
              <KeyRound className="h-8 w-8 text-[var(--color-primary-dark)]" />
            </div>
            <h1 className="text-2xl font-bold tracking-normal">{portal.title}</h1>
            <p className="mt-2 text-sm font-medium text-[var(--color-text-muted)]">
              {step === "email" && "Enter your staff email to receive a reset code."}
              {step === "code" && `Enter the six-digit code sent to ${maskedEmail || email}.`}
              {step === "password" && "Create a new staff password for your account."}
            </p>
          </div>

          <div className="space-y-4 px-8 pb-10 sm:px-10">
            {error && (
              <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-3">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
                <p className="text-sm leading-snug text-red-700">{error}</p>
              </div>
            )}

            {success && (
              <div className="flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-3">
                <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
                <p className="text-sm leading-snug text-green-700">{success}</p>
              </div>
            )}

            {step === "email" && (
              <form onSubmit={submitEmail} className="space-y-5">
                <label className="block space-y-1.5">
                  <span className="ml-1 text-sm font-semibold">Email Address</span>
                  <span className="relative block">
                    <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--color-text-muted)]" />
                    <input
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      className="w-full rounded-lg border border-[var(--color-border)] bg-transparent py-3 pl-10 pr-4 text-[var(--color-text-main)] shadow-sm transition-all placeholder:text-stone-400 focus:border-[var(--color-primary)] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[var(--color-primary)]/10"
                      placeholder={`${portal.role}@company.com`}
                      required
                    />
                  </span>
                </label>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 py-3.5 font-semibold text-white shadow-lg shadow-[var(--color-primary)]/20 transition-all hover:bg-[var(--color-primary-dark)] disabled:cursor-wait disabled:opacity-70"
                >
                  {loading && <Loader className="h-5 w-5 animate-spin" />}
                  Send OTP
                </button>
              </form>
            )}

            {step === "code" && (
              <form onSubmit={submitCode} className="space-y-5">
                <label className="block space-y-1.5">
                  <span className="ml-1 text-sm font-semibold">Verification Code</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    value={code}
                    onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
                    className="w-full rounded-lg border border-[var(--color-border)] bg-transparent px-4 py-3 text-center text-xl font-bold tracking-[0.35em] focus:border-[var(--color-primary)] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[var(--color-primary)]/10"
                    placeholder="000000"
                    required
                    autoFocus
                  />
                </label>
                <button
                  type="submit"
                  disabled={loading || code.length !== 6}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 py-3.5 font-semibold text-white shadow-lg shadow-[var(--color-primary)]/20 transition-all hover:bg-[var(--color-primary-dark)] disabled:cursor-wait disabled:opacity-70"
                >
                  {loading ? <Loader className="h-5 w-5 animate-spin" /> : <ShieldCheck className="h-5 w-5" />}
                  Verify OTP
                </button>
                <div className="text-center">
                  {resendCooldown > 0 ? (
                    <p className="text-xs font-bold text-[var(--color-text-muted)]">
                      Resend OTP in{" "}
                      <span className="text-[var(--color-primary-dark)]">{resendCooldown}s</span>
                    </p>
                  ) : (
                    <button
                      type="button"
                      onClick={resendOtp}
                      disabled={resendLoading}
                      className="inline-flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wide text-[var(--color-primary-dark)] transition-colors hover:text-[var(--color-primary)] disabled:cursor-wait disabled:opacity-70"
                    >
                      {resendLoading ? (
                        <Loader className="h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4" />
                      )}
                      Didn't get a code? Resend OTP
                    </button>
                  )}
                </div>
              </form>
            )}

            {step === "password" && (
              <form onSubmit={submitPassword} className="space-y-5">
                <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-soft)]/70 p-3">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold">Suggested password</span>
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        onClick={refreshSuggestedPassword}
                        className="rounded-md p-2 text-[var(--color-text-muted)] transition-colors hover:bg-white hover:text-[var(--color-primary)]"
                        title="Generate another password"
                        aria-label="Generate another password"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={copySuggestedPassword}
                        className="rounded-md p-2 text-[var(--color-text-muted)] transition-colors hover:bg-white hover:text-[var(--color-primary)]"
                        title="Copy suggested password"
                        aria-label="Copy suggested password"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={useSuggestedPassword}
                    className="flex w-full items-center justify-between gap-3 rounded-lg border border-[var(--color-border)] bg-white px-3 py-2.5 text-left transition-colors hover:border-[var(--color-primary)]"
                  >
                    <span className="break-all font-mono text-sm font-semibold text-[var(--color-text-main)]">
                      {suggestedPassword}
                    </span>
                    <span className="shrink-0 text-xs font-bold uppercase tracking-wide text-[var(--color-primary-dark)]">
                      Use
                    </span>
                  </button>
                </div>

                {[["New Password", password, setPassword], ["Confirm Password", confirmPassword, setConfirmPassword]].map(
                  ([label, value, setter]) => (
                    <label key={label} className="block space-y-1.5">
                      <span className="ml-1 text-sm font-semibold">{label}</span>
                      <span className="relative block">
                        <input
                          type={showPassword ? "text" : "password"}
                          value={value}
                          onChange={(event) => setter(event.target.value)}
                          className="w-full rounded-lg border border-[var(--color-border)] bg-transparent px-4 py-3 pr-10 text-[var(--color-text-main)] shadow-sm transition-all placeholder:text-stone-400 focus:border-[var(--color-primary)] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[var(--color-primary)]/10"
                          placeholder="At least 12 strong characters"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((current) => !current)}
                          className="absolute inset-y-0 right-0 flex items-center pr-3 text-[var(--color-text-muted)] hover:text-[var(--color-primary)]"
                        >
                          {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </span>
                    </label>
                  )
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 py-3.5 font-semibold text-white shadow-lg shadow-[var(--color-primary)]/20 transition-all hover:bg-[var(--color-primary-dark)] disabled:cursor-wait disabled:opacity-70"
                >
                  {loading && <Loader className="h-5 w-5 animate-spin" />}
                  Reset Password
                </button>
              </form>
            )}

            <Link
              to={portal.loginPath}
              className="flex items-center justify-center gap-2 text-sm font-semibold text-[var(--color-primary-dark)] hover:underline"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffForgotPassword;
