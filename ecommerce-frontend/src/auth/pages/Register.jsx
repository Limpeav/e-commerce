import { registerUser } from "../../api/authApi";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
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

  // Add this inside Register component
  const { user } = useAuth(); // Import from your context
  const navigate = useNavigate();

  // Add this useEffect at the top
  useEffect(() => {
    if (user) {
      navigate("/", { replace: true });
    }
  }, [user, navigate]);

  const submitHandler = async (e) => {
    e.preventDefault();

    if (!agreedToTerms) {
      setError("Please agree to the Terms of Service and Privacy Policy");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const formData = {
        name: form.name,
        email: form.email,
        phone: `+855${form.phone}`,
        password: form.password,
        role: "user",
      };

      console.log("Sending data:", formData);

      const response = await registerUser(formData);
      console.log("Registration successful:", response);
      navigate("/login");
    } catch (err) {
      console.error("Registration error:", err);
      console.error("Error response:", err.response);

      let errorMessage = "Registration failed. Please try again.";

      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.message) {
        errorMessage = err.message;
      }

      if (
        errorMessage.includes("duplicate") ||
        errorMessage.includes("E11000")
      ) {
        errorMessage =
          "This email is already registered. Please use a different email or login.";
      }

      setError(errorMessage);
      setLoading(false);
    }
  };

  const isFormValid = () => {
    return (
      form.name && form.email && form.phone && form.password && agreedToTerms
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center px-4 py-12">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
        <div
          className="absolute top-40 right-10 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"
          style={{ animationDelay: "2s" }}
        ></div>
        <div
          className="absolute bottom-20 left-1/2 w-72 h-72 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"
          style={{ animationDelay: "4s" }}
        ></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo/Brand Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 rounded-2xl shadow-2xl mb-4 transform hover:scale-110 transition-transform duration-300">
            <UserPlus className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
            Create Account
          </h1>
          <p className="text-gray-600 text-lg">
            Join thousands of happy shoppers today
          </p>
        </div>

        {/* Register Card */}
        <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/50 p-8 mb-6">
          <form onSubmit={submitHandler} className="space-y-5">
            {/* Error Message */}
            {error && (
              <div className="bg-red-50/80 backdrop-blur-sm border-2 border-red-300 rounded-2xl p-4 flex items-start gap-3 animate-shake">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-red-800 text-sm font-medium">{error}</p>
              </div>
            )}

            {/* Name Input */}
            <div className="group">
              <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                <User className="w-4 h-4 text-blue-600" />
                Full Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="John Doe"
                  value={form.name || ""}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all text-gray-700 placeholder-gray-400 group-hover:border-gray-300"
                />
              </div>
            </div>

            {/* Email Input */}
            <div className="group">
              <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                <Mail className="w-4 h-4 text-purple-600" />
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  placeholder="john@example.com"
                  value={form.email || ""}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                  className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all text-gray-700 placeholder-gray-400 group-hover:border-gray-300"
                />
              </div>
            </div>

            {/* Phone Input */}
            <div className="group">
              <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                <Phone className="w-4 h-4 text-pink-600" />
                Phone Number
              </label>
              <div className="flex gap-2">
                <div className="flex items-center px-4 py-3.5 bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-200 rounded-xl text-gray-700 font-bold shadow-sm">
                  +855
                </div>
                <input
                  type="tel"
                  name="phone"
                  placeholder="16568335"
                  value={form.phone || ""}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  required
                  className="flex-1 px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-pink-500 focus:ring-4 focus:ring-pink-100 transition-all text-gray-700 placeholder-gray-400 group-hover:border-gray-300"
                />
              </div>
              <p className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                Your number is secure and never shared
              </p>
            </div>

            {/* Password Input */}
            <div className="group">
              <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                <Lock className="w-4 h-4 text-indigo-600" />
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a strong password"
                  value={form.password || ""}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                  required
                  minLength={6}
                  className="w-full px-4 py-3.5 pr-12 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all text-gray-700 placeholder-gray-400 group-hover:border-gray-300"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              <p className="mt-2 text-xs text-gray-500">Minimum 6 characters</p>
            </div>

            {/* Terms and Conditions */}
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-4 border-2 border-blue-100">
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="w-5 h-5 mt-0.5 text-blue-600 border-2 border-gray-300 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
                />
                <span className="text-sm text-gray-700 leading-relaxed">
                  I agree to the{" "}
                  <a
                    href="/terms"
                    className="text-blue-600 hover:text-purple-600 font-semibold underline decoration-2 underline-offset-2"
                  >
                    Terms of Service
                  </a>{" "}
                  and{" "}
                  <a
                    href="/privacy"
                    className="text-blue-600 hover:text-purple-600 font-semibold underline decoration-2 underline-offset-2"
                  >
                    Privacy Policy
                  </a>
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !isFormValid()}
              className={`w-full py-4 rounded-xl font-bold shadow-xl transform transition-all duration-300 flex items-center justify-center gap-2 text-lg ${
                loading || !isFormValid()
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white hover:shadow-2xl hover:scale-105 active:scale-95"
              }`}
            >
              {loading ? (
                <>
                  <Loader className="w-6 h-6 animate-spin" />
                  Creating Your Account...
                </>
              ) : (
                <>
                  <UserPlus className="w-6 h-6" />
                  Create Account
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t-2 border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500 font-medium">
                Already have an account?
              </span>
            </div>
          </div>

          {/* Sign In Link */}
          <div className="text-center">
            <a
              href="/login"
              className="inline-flex items-center gap-2 text-blue-600 hover:text-purple-600 font-bold text-lg transition-colors group"
            >
              Sign in here
              <span className="transform group-hover:translate-x-1 transition-transform">
                →
              </span>
            </a>
          </div>
        </div>

        {/* Benefits */}
        <div className="bg-white/80 backdrop-blur-lg rounded-3xl p-6 shadow-xl border border-white/50">
          <h3 className="text-sm font-bold text-gray-700 mb-4 text-center uppercase tracking-wide">
            Why Join Us?
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col items-center text-center p-3 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100">
              <CheckCircle className="w-8 h-8 text-green-600 mb-2" />
              <span className="text-xs font-semibold text-gray-700">
                Exclusive Deals
              </span>
            </div>
            <div className="flex flex-col items-center text-center p-3 rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-100">
              <CheckCircle className="w-8 h-8 text-blue-600 mb-2" />
              <span className="text-xs font-semibold text-gray-700">
                Fast Checkout
              </span>
            </div>
            <div className="flex flex-col items-center text-center p-3 rounded-xl bg-gradient-to-br from-purple-50 to-violet-50 border border-purple-100">
              <CheckCircle className="w-8 h-8 text-purple-600 mb-2" />
              <span className="text-xs font-semibold text-gray-700">
                Order Tracking
              </span>
            </div>
            <div className="flex flex-col items-center text-center p-3 rounded-xl bg-gradient-to-br from-pink-50 to-rose-50 border border-pink-100">
              <CheckCircle className="w-8 h-8 text-pink-600 mb-2" />
              <span className="text-xs font-semibold text-gray-700">
                24/7 Support
              </span>
            </div>
          </div>
        </div>

        {/* Security Badge */}
        <div className="mt-6 text-center">
          <div className="inline-flex items-center gap-2 text-xs text-gray-500">
            <ShieldCheck className="w-4 h-4 text-green-600" />
            <span>Secure registration • SSL encrypted</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
