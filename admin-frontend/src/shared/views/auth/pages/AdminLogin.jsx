import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthController } from "../../../controllers";
import {
  clearAdminSession,
  hasStoredAdminSession,
  persistAdminSession,
} from "../../../utils/adminSession.js";
import {
  Mail,
  Lock,
  ShieldCheck,
  AlertCircle,
  Loader,
  Eye,
  EyeOff,
  LogIn,
} from "lucide-react";

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [challengeToken, setChallengeToken] = useState("");
  const [securityCode, setSecurityCode] = useState("");
  const [isVisible, setIsVisible] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setIsVisible(true);

    const validateExistingAdminSession = async () => {
      if (!hasStoredAdminSession()) {
        return;
      }

      try {
        const response = await AuthController.getCurrentUser();
        if (response.data?.role === "admin") {
          navigate("/admin", { replace: true });
          return;
        }

        clearAdminSession();
      } catch {
        clearAdminSession();
      }
    };

    validateExistingAdminSession();
  }, [navigate]);

  const submitHandler = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = challengeToken
        ? await AuthController.verifyLogin({ challengeToken, code: securityCode })
        : await AuthController.login({ email, password });

      // Handle both response.data and direct data
      const data = response.data || response;

      if (data?.mfaRequired && data.challengeToken) {
        setChallengeToken(data.challengeToken);
        setPassword("");
        return;
      }

      if (!data?.token) {
        throw new Error("Invalid response from server");
      }

      if (data.role !== "admin") {
        throw new Error("Seller users must sign in at /seller/login. Delivery users must sign in at /delivery/login.");
      }

      persistAdminSession(data.token, data);

      navigate("/admin", { replace: true });
    } catch (err) {
      console.error("Admin login error:", err);
      setError(
        err.response?.data?.message || err.message || "Admin login failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg-base)] flex items-center justify-center p-4 relative overflow-hidden font-sans text-[var(--color-text-main)]">
      {/* Subtle Static Background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(122,150,126,0.18),transparent_34%),linear-gradient(180deg,#FCF9F5_0%,#F1ECE6_100%)]"></div>

      {/* Very Subtle Ambient Glows */}
      <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-[var(--color-primary)]/15 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[-5%] w-[600px] h-[600px] bg-[var(--color-secondary)]/25 rounded-full blur-3xl pointer-events-none"></div>

      <div
        className={`w-full max-w-lg relative z-10 transition-all duration-700 ease-out transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
      >

        {/* Main Card */}
        <div className="bg-white/95 backdrop-blur-xl rounded-2xl border border-[var(--color-border)] shadow-2xl shadow-[var(--color-primary)]/10 overflow-hidden">

          {/* Header Section */}
          <div className="px-8 pt-12 pb-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[var(--color-primary)]/10 mb-6 shadow-md ring-1 ring-[var(--color-primary)]/20">
              <ShieldCheck className="w-8 h-8 text-[var(--color-primary-dark)]" />
            </div>

            <h1 className="text-2xl font-bold text-[var(--color-text-main)] mb-2 tracking-tight">
              Admin Portal
            </h1>
            <p className="text-[var(--color-text-muted)] text-sm">
              Sign in to your administrative account
            </p>
          </div>

          <form onSubmit={submitHandler} className="px-8 pb-10 space-y-5">
            {/* Error Display */}
            {error && (
              <div className="bg-red-50 border border-red-100 rounded-lg p-3 flex gap-3 items-start animate-fade-in">
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <p className="text-red-700 text-sm leading-snug">{error}</p>
              </div>
            )}

            {!challengeToken && <div className="space-y-1.5">
              <label className="text-sm font-medium text-[var(--color-text-main)] ml-1">Email Address</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--color-text-muted)] group-focus-within:text-[var(--color-primary)] transition-colors">
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-[var(--color-surface-soft)]/70 border border-[var(--color-border)] rounded-lg focus:outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] text-[var(--color-text-main)] placeholder-stone-400 transition-all shadow-sm"
                  placeholder="name@company.com"
                  required
                />
              </div>
            </div>}

            {/* Password Field */}
            {!challengeToken && <div className="space-y-1.5">
              <label className="text-sm font-medium text-[var(--color-text-main)] ml-1">Password</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--color-text-muted)] group-focus-within:text-[var(--color-primary)] transition-colors">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 bg-[var(--color-surface-soft)]/70 border border-[var(--color-border)] rounded-lg focus:outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] text-[var(--color-text-main)] placeholder-stone-400 transition-all shadow-sm"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>}

            {challengeToken && (
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-[var(--color-text-main)] ml-1">
                  Email security code
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={securityCode}
                  onChange={(event) => setSecurityCode(event.target.value.replace(/\D/g, ""))}
                  className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-soft)]/70 px-4 py-3 text-center text-xl font-bold tracking-[0.35em] focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
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

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white rounded-lg font-medium shadow-lg shadow-[var(--color-primary)]/20 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed mt-2"
            >
              {loading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <span>{challengeToken ? "Verify Code" : "Sign In"}</span>
                  <LogIn className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

        </div>

        {/* Footer info - simple */}
        <div className="mt-8 text-center opacity-70">
          <p className="text-[var(--color-text-muted)] text-xs flex items-center justify-center gap-2 font-medium uppercase tracking-wider">
            <ShieldCheck className="w-3 h-3" />
            Secure Admin Environment
          </p>
        </div>

      </div>
    </div>
  );
};

export default AdminLogin;
