import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { adminService } from "../../../services/adminService.js";
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
import PastelCloudBackdrop from "../../../components/ui/PastelCloudBackdrop";

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const submitHandler = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await adminService.login({ email, password });

      // Handle both response.data and direct data
      const data = response.data || response;

      if (!data || !data.token) {
        throw new Error("Invalid response from server");
      }

      // Store admin token and user info
      localStorage.setItem("adminToken", data.token);
      localStorage.setItem("adminUser", JSON.stringify(data));

      navigate("/admin");
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
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-bg-base px-4 py-10 font-sans">
      <PastelCloudBackdrop />

      <div
        className={`relative z-10 w-full max-w-md transform transition-all duration-700 ease-out ${isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}
      >
        <div className="mb-8 text-center">
          <div className="mb-5 inline-flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/15 bg-white shadow-sm">
            <ShieldCheck className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-text-main md:text-4xl">Admin Portal</h1>
          <p className="mt-1 text-sm text-text-muted">Sign in with administrator credentials</p>
        </div>

        <div className="rounded-2xl border border-primary/15 bg-white/95 p-6 shadow-sm backdrop-blur md:p-7">
          <form onSubmit={submitHandler} className="space-y-4">
            {error && (
              <div className="flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 p-3">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
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
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-primary/20 bg-white py-3 pl-11 pr-4 text-sm text-text-main placeholder:text-text-muted/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
                  placeholder="admin@company.com"
                  required
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
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-primary/20 bg-white py-3 pl-11 pr-11 text-sm text-text-main placeholder:text-text-muted/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 cursor-pointer text-text-muted transition-colors hover:text-primary"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`mt-1 flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold transition-colors ${loading
                ? "cursor-not-allowed bg-primary/15 text-primary/60"
                : "bg-primary text-text-main hover:bg-primary-hover"
                }`}
            >
              {loading ? (
                <>
                  <Loader className="h-4 w-4 animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <LogIn className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-5 border-t border-primary/12 pt-4 text-center">
            <a
              href="/login"
              className="text-sm text-text-muted transition-colors hover:text-primary"
            >
              Back to Customer Login
            </a>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="inline-flex items-center justify-center gap-2 rounded-full border border-primary/10 bg-white/70 px-4 py-2 text-[11px] font-medium text-text-muted">
            <ShieldCheck className="h-3.5 w-3.5 text-primary" />
            Secure Admin Environment
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
