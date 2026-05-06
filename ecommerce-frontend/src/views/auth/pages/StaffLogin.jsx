import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { adminService } from "../../../services/adminService.js";
import {
  clearAdminSession,
  getStoredAdminUser,
  hasStoredAdminSession,
  persistAdminSession,
} from "../../../utils/adminSession.js";
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

const StaffLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setIsVisible(true);

    const validateExistingStaffSession = async () => {
      if (!hasStoredAdminSession()) {
        return;
      }

      try {
        const response = await adminService.getCurrentAdmin();
        const sessionUser = response.data || getStoredAdminUser();

        if (STAFF_ROLES.includes(sessionUser?.role)) {
          navigate("/admin/orders", { replace: true });
          return;
        }

        clearAdminSession();
      } catch {
        clearAdminSession();
      }
    };

    validateExistingStaffSession();
  }, [navigate]);

  const submitHandler = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await adminService.login({ email, password });
      const data = response.data || response;

      if (!data || !data.token) {
        throw new Error("Invalid response from server");
      }

      if (!STAFF_ROLES.includes(data.role)) {
        throw new Error("This login is only for staff and delivery accounts.");
      }

      persistAdminSession(data.token, data);
      navigate("/admin/orders", { replace: true });
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

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#F9FAFB] p-4 font-sans text-[#1F2937]">
      <div
        className={`w-full max-w-lg relative z-10 transition-all duration-700 ease-out transform ${
          isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
        }`}
      >
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.10)]">
          <div className="px-8 pb-8 pt-12 text-center sm:px-10">
            <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 shadow-sm ring-1 ring-blue-100">
              <Truck className="h-8 w-8 text-[#2563EB]" />
            </div>

            <h1 className="font-sans text-2xl font-bold tracking-normal text-[#1F2937]">
              Staff Login
            </h1>
            <p className="mt-2 text-sm font-medium text-gray-500">
              Sign in with your staff or delivery account
            </p>
          </div>

          <form onSubmit={submitHandler} className="space-y-5 px-8 pb-10 sm:px-10">
            {error && (
              <div className="flex animate-fade-in items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-3">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
                <p className="text-sm leading-snug text-red-700">{error}</p>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="ml-1 text-sm font-semibold text-[#1F2937]">Email Address</label>
              <div className="relative group">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400 transition-colors group-focus-within:text-[#2563EB]">
                  <Mail className="h-5 w-5" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full rounded-lg border border-[#D1D5DB] bg-white py-3 pl-10 pr-4 text-[#1F2937] shadow-sm transition-all placeholder:text-gray-400 focus:border-[#2563EB] focus:outline-none focus:ring-4 focus:ring-blue-100"
                  placeholder="staff@company.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="ml-1 text-sm font-semibold text-[#1F2937]">Password</label>
              <div className="relative group">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400 transition-colors group-focus-within:text-[#2563EB]">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full rounded-lg border border-[#D1D5DB] bg-white py-3 pl-10 pr-10 text-[#1F2937] shadow-sm transition-all placeholder:text-gray-400 focus:border-[#2563EB] focus:outline-none focus:ring-4 focus:ring-blue-100"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex cursor-pointer items-center pr-3 text-gray-400 transition-colors hover:text-[#1F2937]"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-[#2563EB] px-4 py-3.5 font-semibold text-white shadow-[0_12px_24px_rgba(37,99,235,0.22)] transition-all duration-200 hover:bg-blue-700 hover:shadow-[0_14px_30px_rgba(37,99,235,0.28)] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? (
                <>
                  <Loader className="h-5 w-5 animate-spin" />
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

          <div className="flex items-center justify-center border-t border-gray-100 bg-gray-50 px-8 py-5">
            <a
              href="/login"
              className="flex items-center gap-2 text-sm font-semibold text-gray-500 transition-colors hover:text-[#2563EB]"
            >
              Back to Customer Login
            </a>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-gray-400">
            <Truck className="h-3 w-3 text-[#2563EB]" />
            Staff And Delivery Access
          </p>
        </div>
      </div>
    </div>
  );
};

export default StaffLogin;
