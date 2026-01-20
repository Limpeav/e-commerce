import { useState } from "react";
import { Link } from "react-router-dom";
import { forgotPassword } from "../../../services/authApi";
import {
  Mail,
  AlertCircle,
  Loader,
  CheckCircle,
  ArrowLeft,
} from "lucide-react";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const submitHandler = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    setSuccess(false);

    try {
      await forgotPassword({ email });
      setSuccess(true);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Failed to send reset email. Please try again."
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
            <Mail className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-5xl font-black text-text-main font-display tracking-tight mb-4">
            Recovery
          </h1>
          <p className="text-text-muted font-bold text-sm uppercase tracking-[0.2em] opacity-40">
            {success
              ? "Access Link Dispatched"
              : "Synchronize Identity"}
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
                    Protocol Initiated
                  </p>
                  <p className="text-green-700 font-bold text-sm leading-relaxed">
                    A secure restoration link has been dispatched to your central communications hub.
                  </p>
                </div>
              </div>

              {/* Back to Login */}
              <Link
                to="/login"
                className="w-full py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] shadow-2xl shadow-primary/10 flex items-center justify-center gap-3 bg-text-main text-white hover:bg-primary transition-all active:scale-95"
              >
                <ArrowLeft className="w-5 h-5" />
                Terminal Access
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

              {/* Email Input */}
              <div className="group">
                <label className="block text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-4 ml-1">
                  Identity Hub (Email)
                </label>
                <div className="relative">
                  <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-300 group-focus-within:text-primary transition-colors" />
                  <input
                    type="email"
                    placeholder="operative@nexus.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-14 pr-6 py-4.5 bg-stone-50 border-2 border-stone-100 rounded-2xl focus:outline-none focus:border-primary transition-all text-text-main font-bold placeholder-stone-300"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] shadow-2xl shadow-primary/10 flex items-center justify-center gap-3 bg-text-main text-white hover:bg-primary transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    DISPATCHING...
                  </>
                ) : (
                  <>
                    <Mail className="w-5 h-5" />
                    INITIATE RECOVERY
                  </>
                )}
              </button>

              {/* Back to Login */}
              <div className="text-center pt-2">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-3 text-[10px] font-black text-primary uppercase tracking-[0.3em] hover:text-text-main transition-all group"
                >
                  <ArrowLeft className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" />
                  Return to Vault
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
