import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AuthController } from "../../../controllers";
import {
  clearAdminSession,
  getPortalDashboardPath,
  getStoredAdminUser,
  hasStoredAdminSession,
  persistAdminSession,
} from "../../../utils/adminSession.js";
import Loading from "../../../components/common/Loading.jsx";
import {
  AlertCircle,
  Eye,
  EyeOff,
  Loader,
  Lock,
  LogIn,
  Mail,
  Truck,
} from "lucide-react";

const STAFF_ROLES = ["seller", "delivery"];

const getLoginPortal = (pathname) => {
  if (pathname.startsWith("/delivery")) {
    return {
      roles: ["delivery"],
      title: "Delivery Login",
      description: "Sign in with your delivery account",
      error: "This login is only for delivery accounts.",
      footer: "Delivery Access",
      forgotPath: "/delivery/forgot-password",
    };
  }

  if (pathname.startsWith("/seller")) {
    return {
      roles: ["seller"],
      title: "Seller Login",
      description: "Sign in with your seller account",
      error: "This login is only for seller accounts.",
      footer: "Seller Access",
      forgotPath: "/seller/forgot-password",
    };
  }

  return {
    roles: STAFF_ROLES,
    title: "Staff Login",
    description: "Sign in with your seller or delivery account",
    error: "This login is only for seller and delivery accounts.",
    footer: "Seller And Delivery Access",
    forgotPath: "/seller/forgot-password",
  };
};

const StaffLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(() => hasStoredAdminSession());
  const [showPassword, setShowPassword] = useState(false);
  const [challengeToken, setChallengeToken] = useState("");
  const [securityCode, setSecurityCode] = useState("");
  const [isVisible, setIsVisible] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const portal = useMemo(() => getLoginPortal(location.pathname), [location.pathname]);

  useEffect(() => {
    const animationFrame = requestAnimationFrame(() => setIsVisible(true));
    let isMounted = true;

    const validateExistingStaffSession = async () => {
      if (!hasStoredAdminSession()) {
        setCheckingSession(false);
        return;
      }

      try {
        const response = await AuthController.getCurrentUser();
        const sessionUser = response.data || getStoredAdminUser();

        if (portal.roles.includes(sessionUser?.role)) {
          navigate(getPortalDashboardPath(sessionUser), { replace: true });
          return;
        }

        clearAdminSession();
      } catch {
        clearAdminSession();
      } finally {
        if (isMounted) {
          setCheckingSession(false);
        }
      }
    };

    validateExistingStaffSession();

    return () => {
      isMounted = false;
      cancelAnimationFrame(animationFrame);
    };
  }, [navigate, portal.roles]);

  const submitHandler = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = challengeToken
        ? await AuthController.verifyLogin({ challengeToken, code: securityCode })
        : await AuthController.login({ email, password });
      const data = response.data || response;

      if (data?.mfaRequired && data.challengeToken) {
        setChallengeToken(data.challengeToken);
        setPassword("");
        return;
      }

      if (!data?.token) {
        throw new Error("Invalid response from server");
      }

      if (!portal.roles.includes(data.role)) {
        throw new Error(portal.error);
      }

      persistAdminSession(data.token, data);
      navigate(getPortalDashboardPath(data), { replace: true });
    } catch (err) {
      clearAdminSession();
      setError(
          err.response?.data?.message ||
          err.message ||
          "Staff login failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  if (checkingSession) {
    return <Loading message="Loading your portal..." fullScreen />;
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[var(--color-bg-base)] p-4 font-sans text-[var(--color-text-main)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(122,150,126,0.18),transparent_34%),linear-gradient(180deg,#FCF9F5_0%,#F1ECE6_100%)]"></div>
      <div className="absolute top-[-10%] right-[-5%] h-[500px] w-[500px] rounded-full bg-[var(--color-primary)]/15 blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[-5%] h-[600px] w-[600px] rounded-full bg-[var(--color-secondary)]/25 blur-3xl pointer-events-none"></div>
      <div
        className={`w-full max-w-lg relative z-10 transition-all duration-700 ease-out transform ${
          isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
        }`}
      >
        <div className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white/95 shadow-2xl shadow-[var(--color-primary)]/10 backdrop-blur-xl">
          <div className="px-8 pb-8 pt-12 text-center sm:px-10">
            <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--color-primary)]/10 shadow-sm ring-1 ring-[var(--color-primary)]/20">
              <Truck className="h-8 w-8 text-[var(--color-primary-dark)]" />
            </div>

            <h1 className="font-sans text-2xl font-bold tracking-normal text-[var(--color-text-main)]">
              {portal.title}
            </h1>
            <p className="mt-2 text-sm font-medium text-[var(--color-text-muted)]">
              {portal.description}
            </p>
          </div>

          <form onSubmit={submitHandler} className="staff-login-form space-y-5 px-8 pb-10 sm:px-10">
            {error && (
              <div className="flex animate-fade-in items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-3">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
                <p className="text-sm leading-snug text-red-700">{error}</p>
              </div>
            )}

            {!challengeToken && <div className="space-y-1.5">
              <label className="ml-1 text-sm font-semibold text-[var(--color-text-main)]">Email Address</label>
              <div className="relative group">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-[var(--color-text-muted)] transition-colors group-focus-within:text-[var(--color-primary)]">
                  <Mail className="h-5 w-5" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full rounded-lg border border-[var(--color-border)] bg-transparent py-3 pl-10 pr-4 text-[var(--color-text-main)] shadow-sm transition-all placeholder:text-stone-400 focus:border-[var(--color-primary)] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[var(--color-primary)]/10"
                  placeholder={portal.roles.includes("seller") ? "seller@company.com" : "delivery@company.com"}
                  required
                />
              </div>
            </div>}

            {!challengeToken && <div className="space-y-1.5">
              <label className="ml-1 text-sm font-semibold text-[var(--color-text-main)]">Password</label>
              <div className="relative group">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-[var(--color-text-muted)] transition-colors group-focus-within:text-[var(--color-primary)]">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full rounded-lg border border-[var(--color-border)] bg-transparent py-3 pl-10 pr-10 text-[var(--color-text-main)] shadow-sm transition-all placeholder:text-stone-400 focus:border-[var(--color-primary)] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[var(--color-primary)]/10"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex cursor-pointer items-center pr-3 text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-primary)]"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => navigate(portal.forgotPath)}
                  className="text-sm font-semibold text-[var(--color-primary-dark)] transition-colors hover:text-[var(--color-primary)] hover:underline"
                >
                  Forgot password?
                </button>
              </div>
            </div>}

            {challengeToken && (
              <div className="space-y-1.5">
                <label className="ml-1 text-sm font-semibold text-[var(--color-text-main)]">
                  Email security code
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={securityCode}
                  onChange={(event) => setSecurityCode(event.target.value.replace(/\D/g, ""))}
                  className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-soft)]/70 px-4 py-3 text-center text-xl font-bold tracking-[0.35em] focus:border-[var(--color-primary)] focus:outline-none focus:ring-4 focus:ring-[var(--color-primary)]/10"
                  placeholder="000000"
                  required
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => {
                    setChallengeToken("");
                    setSecurityCode("");
                    setError("");
                  }}
                  className="text-sm text-[var(--color-primary-dark)] hover:underline"
                >
                  Use a different account
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 py-3.5 font-semibold text-white shadow-lg shadow-[var(--color-primary)]/20 transition-all duration-200 hover:bg-[var(--color-primary-dark)] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? (
                <>
                  <Loader className="h-5 w-5 animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <span>{challengeToken ? "Verify Code" : "Sign In"}</span>
                  <LogIn className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

        </div>

        <div className="mt-8 text-center">
          <p className="flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-text-muted)]">
            <Truck className="h-3 w-3 text-[var(--color-primary)]" />
            {portal.footer}
          </p>
        </div>
      </div>
    </div>
  );
};

export default StaffLogin;
