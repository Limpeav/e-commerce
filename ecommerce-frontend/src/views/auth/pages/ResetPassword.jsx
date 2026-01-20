import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { resetPassword } from "../../../services/authApi";
import {
  Lock,
  AlertCircle,
  Loader,
  CheckCircle,
  Eye,
  EyeOff,
} from "lucide-react";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get("token");

  useEffect(() => {
    if (!token) {
      setError("Invalid or missing reset token. Please request a new reset link.");
    }
  }, [token]);

  const submitHandler = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    if (!token) {
      setError("Invalid reset token");
      return;
    }

    setLoading(true);

    try {
      await resetPassword({ token, password });
      setSuccess(true);
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Failed to reset password. The link may have expired."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center px-6 py-12 relative overflow-hidden font-sans">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary/5 rounded-full blur-[100px] animate-pulse"></div>
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-secondary/5 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: "2s" }}></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo/Brand Section */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-text-main rounded-[2.5rem] shadow-2xl mb-8 transform hover:rotate-12 transition-all duration-500 border-4 border-white">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-5xl font-black text-text-main font-display tracking-tight mb-4">
            Security
          </h1>
          <p className="text-text-muted font-bold text-sm uppercase tracking-[0.2em] opacity-40">
            {success
              ? "Protocol Finalized"
              : "Reconfigure Passkey"}
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-[4rem] shadow-[0_32px_64px_-16px_rgba(19,78,74,0.1)] border border-stone-100 p-10">
          {success ? (
            <div className="space-y-8">
              {/* Success Message */}
              <div className="bg-green-50 border border-green-100 rounded-[2.5rem] p-8 flex flex-col items-center gap-6">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
                <div className="text-center">
                  <p className="text-green-800 font-black uppercase tracking-widest text-xs mb-3">
                    Encryption Success
                  </p>
                  <p className="text-green-700 font-bold text-sm leading-relaxed">
                    Identity parameters successfully recalibrated. Redirecting to terminal...
                  </p>
                </div>
              </div>

              {/* Go to Login */}
              <Link
                to="/login"
                className="w-full py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] shadow-2xl shadow-primary/10 flex items-center justify-center bg-text-main text-white hover:bg-primary transition-all active:scale-95"
              >
                Enter Terminal
              </Link>
            </div>
          ) : (
            <form onSubmit={submitHandler} className="space-y-8">
              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-100 rounded-[2rem] p-5 flex items-start gap-4 animate-shake">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-red-800 font-black uppercase tracking-widest text-[10px]">{error}</p>
                </div>
              )}

              {/* Password Input */}
              <div className="group">
                <label className="block text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-4 ml-1">
                  New Passkey
                </label>
                <div className="relative">
                  <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-300 group-focus-within:text-primary transition-colors" />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter new passkey"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full pl-14 pr-14 py-4.5 bg-stone-50 border-2 border-stone-100 rounded-2xl focus:outline-none focus:border-primary transition-all text-text-main font-bold placeholder-stone-300"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-5 top-1/2 transform -translate-y-1/2 text-stone-300 hover:text-primary transition-colors focus:outline-none"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Confirm Password Input */}
              <div className="group">
                <label className="block text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-4 ml-1">
                  Confirm Passkey
                </label>
                <div className="relative">
                  <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-300 group-focus-within:text-primary transition-colors" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Duplicate for verification"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full pl-14 pr-14 py-4.5 bg-stone-50 border-2 border-stone-100 rounded-2xl focus:outline-none focus:border-primary transition-all text-text-main font-bold placeholder-stone-300"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword(!showConfirmPassword)
                    }
                    className="absolute right-5 top-1/2 transform -translate-y-1/2 text-stone-300 hover:text-primary transition-colors focus:outline-none"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || !token}
                className="w-full py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] shadow-2xl shadow-primary/10 flex items-center justify-center gap-3 bg-text-main text-white hover:bg-primary transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    COMMITING...
                  </>
                ) : (
                  <>
                    <Lock className="w-5 h-5" />
                    ESTABLISH NEW PASSKEY
                  </>
                )}
              </button>

              {/* Back to Login */}
              <div className="text-center pt-2">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 text-[10px] font-black text-primary uppercase tracking-[0.3em] hover:text-text-main transition-all group"
                >
                  Return to Terminal
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
