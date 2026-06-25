import { useState, useEffect } from "react";
import { useAuth } from "../../context/useAuth";
import { Link, useLocation } from "react-router-dom";
import {
  Save,
  User,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  Shield,
  Settings,
  ChevronRight,
  CheckCircle,
} from "lucide-react";
import axios from "axios";
import { motion as Motion, AnimatePresence } from "framer-motion";

// UI Components
import AlertMessage from "../../components/ui/AlertMessage";
import ProfileSidebar from "../../components/user/ProfileSidebar";
import { config } from "../../config/index.js";
import { useDarkMode } from "../../hooks";
import { useLanguage } from "../../context/useLanguage";
import {
  forgotPassword,
  resendResetCode,
  resetPassword,
  verifyResetCode,
} from "../../services/authApi";

const API_URL = config.API_BASE_URL;
const CAMBODIA_DIAL_CODE = "+855";

const validateStrongPassword = (password = "") =>
  password.length >= 10
  && /[a-z]/.test(password)
  && /[A-Z]/.test(password)
  && /\d/.test(password)
  && /[^A-Za-z0-9]/.test(password);

const generateStrongPassword = () => {
  const requiredGroups = [
    "ABCDEFGHJKLMNPQRSTUVWXYZ",
    "abcdefghijkmnopqrstuvwxyz",
    "23456789",
    "!@#$%&*?",
  ];
  const allCharacters = requiredGroups.join("");
  const randomIndex = (length) => {
    const values = new Uint32Array(1);
    window.crypto.getRandomValues(values);
    return values[0] % length;
  };
  const characters = requiredGroups.map(
    (group) => group[randomIndex(group.length)]
  );

  while (characters.length < 14) {
    characters.push(allCharacters[randomIndex(allCharacters.length)]);
  }

  for (let index = characters.length - 1; index > 0; index -= 1) {
    const swapIndex = randomIndex(index + 1);
    [characters[index], characters[swapIndex]] = [
      characters[swapIndex],
      characters[index],
    ];
  }

  return characters.join("");
};

const toLocalPhoneDigits = (phone = "") => {
  const digits = String(phone).replace(/\D/g, "");

  if (digits.startsWith("855")) {
    return digits.slice(3);
  }

  return digits.replace(/^0/, "");
};

const toCambodiaPhone = (phone = "") => {
  const localDigits = toLocalPhoneDigits(phone);
  return localDigits ? `${CAMBODIA_DIAL_CODE}${localDigits}` : "";
};

const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.5, staggerChildren: 0.1, ease: "easeOut" } 
  },
  exit: { opacity: 0, y: -20, transition: { duration: 0.3 } }
};

const Profile = () => {
  const { user, login } = useAuth();
  const location = useLocation();
  const [isDark] = useDarkMode();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState(
    () => location.state?.activeTab === "security" ? "security" : "edit"
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [securityStep, setSecurityStep] = useState("email");
  const [securityEmail, setSecurityEmail] = useState("");
  const [securityCode, setSecurityCode] = useState("");
  const [securityResetToken, setSecurityResetToken] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        phone: toLocalPhoneDigits(user.phone || ""),
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setSecurityEmail(user.email || "");
    }
  }, [user]);

  useEffect(() => {
    if (resendCooldown <= 0) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setResendCooldown((current) => Math.max(0, current - 1));
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [resendCooldown]);

  const getAuthToken = () => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      return userData.token;
    }
    return null;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "phone" ? toLocalPhoneDigits(value) : value,
    }));
    setError("");
    setSuccess("");
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const token = getAuthToken();
      if (!token) throw new Error(t("profile.notAuthenticated"));

      const updateData = {
        name: formData.name,
        email: formData.email,
        phone: toCambodiaPhone(formData.phone),
      };

      const response = await axios.put(`${API_URL}/users/profile`, updateData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const updatedUser = {
        ...user,
        _id: response.data._id,
        name: response.data.name,
        email: response.data.email,
        phone: response.data.phone,
        role: response.data.role,
        token: response.data.token || token,
        createdAt: user.createdAt || response.data.createdAt,
      };

      localStorage.setItem("user", JSON.stringify(updatedUser));
      login(updatedUser);

      setSuccess(t("profile.profileUpdated"));
      setFormData((prev) => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }));

      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.message || err.message || t("profile.updateFailed"));
    } finally {
      setLoading(false);
    }
  };

  const resetSecurityForm = () => {
    setShowPassword(false);
    setSecurityStep("email");
    setSecurityCode("");
    setSecurityResetToken("");
    setResendCooldown(0);
    setFormData((prev) => ({
      ...prev,
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    }));
  };

  const handleSendSecurityCode = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const email = securityEmail.trim();
      if (!email) {
        throw new Error(t("profile.enterEmailRequired"));
      }

      if (user?.email && email.toLowerCase() !== user.email.toLowerCase()) {
        throw new Error(t("profile.accountEmailRequired"));
      }

      await forgotPassword({ email });
      setSecurityStep("code");
      setResendCooldown(60);
      setSuccess(t("profile.verificationCodeSent"));
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.message || err.message || t("profile.sendVerificationFailed"));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifySecurityCode = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const code = securityCode.trim();
      if (code.length !== 6) {
        throw new Error(t("profile.enterSixDigitCode"));
      }

      const { data } = await verifyResetCode({
        email: securityEmail.trim(),
        code,
      });
      setSecurityResetToken(data.resetToken);
      setSecurityStep("password");
      setSuccess(t("profile.codeVerified"));
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.message || err.message || t("profile.verifyCodeFailed"));
    } finally {
      setLoading(false);
    }
  };

  const handleResendSecurityCode = async () => {
    if (loading || resendCooldown > 0) return;
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      await resendResetCode({ email: securityEmail.trim() });
      setSecurityCode("");
      setResendCooldown(60);
      setSuccess(t("profile.newVerificationCodeSent"));
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.message || t("profile.resendCodeFailed"));
    } finally {
      setLoading(false);
    }
  };

  const handleSecurityPasswordReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      if (!securityResetToken) {
        throw new Error(t("profile.verifyEmailFirst"));
      }

      if (formData.newPassword !== formData.confirmPassword) {
        throw new Error(t("profile.passwordsDoNotMatch"));
      }

      if (!validateStrongPassword(formData.newPassword)) {
        throw new Error(t("profile.strongPasswordRequired"));
      }

      await resetPassword({
        token: securityResetToken,
        password: formData.newPassword,
      });

      resetSecurityForm();
      setSuccess(t("profile.passwordUpdated"));
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.message || err.message || t("profile.passwordUpdateFailed"));
    } finally {
      setLoading(false);
    }
  };

  const useSuggestedSecurityPassword = () => {
    const suggestedPassword = generateStrongPassword();
    setFormData((current) => ({
      ...current,
      newPassword: suggestedPassword,
      confirmPassword: suggestedPassword,
    }));
    setShowPassword(true);
    setError("");
  };

  const securityPasswordRules = [
    {
      label: t("registerPage.passwordRules.upperAndLower"),
      valid: /[a-z]/.test(formData.newPassword) && /[A-Z]/.test(formData.newPassword),
    },
    {
      label: t("registerPage.passwordRules.number"),
      valid: /\d/.test(formData.newPassword),
    },
    {
      label: t("registerPage.passwordRules.special"),
      valid: /[^A-Za-z0-9]/.test(formData.newPassword),
    },
    {
      label: t("registerPage.passwordRules.length"),
      valid: formData.newPassword.length >= 10,
    },
  ];
  const passedSecurityPasswordRules = securityPasswordRules.filter((rule) => rule.valid).length;
  const securityPasswordStrength = passedSecurityPasswordRules === 4
    ? {
        label: t("registerPage.passwordStrength.strong"),
        barClassName: "bg-emerald-500",
        textClassName: "text-emerald-600 dark:text-emerald-400",
      }
    : passedSecurityPasswordRules >= 2
      ? {
          label: t("registerPage.passwordStrength.medium"),
          barClassName: "bg-amber-400",
          textClassName: "text-amber-600 dark:text-amber-400",
        }
      : {
          label: t("registerPage.passwordStrength.weak"),
          barClassName: "bg-rose-400",
          textClassName: "text-rose-600 dark:text-rose-400",
        };

  if (!user) {
    return (
      <div className={`min-h-screen flex items-center justify-center font-sans transition-colors ${isDark ? "bg-slate-950" : "bg-stone-50"}`}>
        <Motion.div
          initial={{ scale: 0.9, opacity: 0 }} 
          animate={{ scale: 1, opacity: 1 }} 
          className={`text-center p-12 rounded-[2rem] shadow-xl border max-w-md w-full transition-colors ${
            isDark ? "bg-slate-900/95 border-slate-800 text-slate-100" : "bg-white border-stone-100"
          }`}
        >
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${isDark ? "bg-red-500/10 text-red-300" : "bg-red-50 text-red-500"}`}>
            <Lock className="w-10 h-10" />
          </div>
          <h2 className={`text-3xl font-bold mb-3 tracking-tight ${isDark ? "text-slate-50" : "text-stone-800"}`}>{t("profile.accessDenied")}</h2>
          <p className={`${isDark ? "text-slate-400" : "text-stone-500"} font-medium mb-8`}>{t("profile.accessDeniedMessage")}</p>
          <Link to="/login" className="w-full rounded-xl bg-primary py-4 font-bold text-white flex items-center justify-center gap-2 transition-all shadow-lg hover:bg-primary-dark hover:shadow-primary/30">
            {t("profile.signInNow")} <ChevronRight className="w-5 h-5" />
          </Link>
        </Motion.div>
      </div>
    );
  }

  return (
    <div className={`no-scrollbar h-[100dvh] overflow-y-auto overscroll-none pb-6 pt-16 font-sans transition-colors lg:pt-20 ${isDark ? "bg-transparent" : "bg-[#FCF9F5]"}`}>
      {/* Visual Header Banner */}
      <div className="relative h-32 w-full overflow-hidden sm:h-40 md:h-44">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,#6F8A73_0%,#AFC7B2_48%,#F1D2C2_100%)]" />
        <div className="absolute inset-0 opacity-70 [background:radial-gradient(circle_at_18%_20%,rgba(255,255,255,0.42),transparent_26%),radial-gradient(circle_at_82%_24%,rgba(255,255,255,0.28),transparent_24%)]" />
        <div className="absolute -bottom-20 left-[-10%] h-44 w-[120%] rounded-[50%] bg-white/18 blur-2xl" />
        <div className="absolute bottom-[-5.5rem] left-[-8%] h-40 w-[116%] rounded-[50%] border border-white/30" />
        <div className="relative mx-auto h-full max-w-7xl px-4 sm:px-6 md:px-8" aria-hidden="true" />
      </div>

      <div className="relative z-20 mx-auto -mt-6 max-w-7xl px-4 sm:px-6 md:px-8">
        
        <AnimatePresence>
          {success && (
            <Motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="mb-6">
              <AlertMessage type="success" message={success} title={t("profile.success")} onClose={() => setSuccess("")} />
            </Motion.div>
          )}
          {error && (
            <Motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="mb-6">
              <AlertMessage type="error" message={error} title={t("profile.error")} onClose={() => setError("")} />
            </Motion.div>
          )}
        </AnimatePresence>

        <ProfileSidebar activeTab={activeTab} onTabChange={setActiveTab} variant="mobile" />

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">
          
          {/* Sidebar Area */}
          <div className="hidden lg:block">
            <Motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="sticky top-24"
            >
              <ProfileSidebar activeTab={activeTab} onTabChange={setActiveTab} />
            </Motion.div>
          </div>

          {/* Main Profile Area */}
          <div className="min-w-0 space-y-6">
            {/* Content Area */}
            <AnimatePresence mode="wait">
              {activeTab === "edit" && (
                <Motion.div
                  key="edit"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className={`rounded-[2rem] p-8 md:p-10 border shadow-sm ${isDark ? "bg-slate-900/90 border-slate-800" : "bg-white border-stone-100"}`}
                >
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h2 className={`text-2xl font-bold ${isDark ? "text-slate-50" : "text-stone-800"}`}>{t("profile.updateProfile")}</h2>
                      <p className={`text-sm mt-1 ${isDark ? "text-slate-400" : "text-stone-500"}`}>{t("profile.updateProfileDescription")}</p>
                    </div>
                    {!isEditing ? (
                      <button
                        type="button"
                        onClick={() => setIsEditing(true)}
                        className="flex shrink-0 items-center gap-2 whitespace-nowrap rounded-xl bg-primary px-4 py-3 text-sm font-bold text-white transition-all hover:bg-primary-dark active:scale-95 sm:px-6"
                      >
                        <Settings className="h-4 w-4" />
                        {t("profile.editProfile")}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditing(false);
                          setFormData((prev) => ({
                            ...prev,
                            name: user.name || "",
                            email: user.email || "",
                            phone: toLocalPhoneDigits(user.phone || ""),
                          }));
                        }}
                        className={`flex items-center gap-2 rounded-xl border px-6 py-3 text-sm font-bold transition-all active:scale-95 ${isDark ? "border-slate-700 text-slate-300 hover:bg-slate-800" : "border-stone-200 text-stone-600 hover:bg-stone-50"}`}
                      >
                        {t("profile.cancel")}
                      </button>
                    )}
                  </div>

                  {!isEditing ? (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {[
                          { icon: User, label: t("profile.fullName"), value: formData.name },
                          { icon: Mail, label: t("profile.emailAddress"), value: formData.email },
                        ].map((item) => (
                          <div key={item.label} className="group">
                            <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${isDark ? "text-slate-400" : "text-stone-500"}`}>{item.label}</label>
                            <div className={`flex items-center gap-3 rounded-xl border px-4 py-4 ${isDark ? "border-slate-800 bg-slate-950" : "border-stone-100 bg-stone-50"}`}>
                              <item.icon className={`h-5 w-5 ${isDark ? "text-slate-500" : "text-stone-400"}`} />
                              <span className={`font-medium ${isDark ? "text-slate-100" : "text-stone-800"}`}>{item.value}</span>
                            </div>
                          </div>
                        ))}
                        <div className="group md:col-span-2">
                          <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${isDark ? "text-slate-400" : "text-stone-500"}`}>{t("profile.phoneNumber")}</label>
                          <div className={`flex items-center gap-3 rounded-xl border px-4 py-4 md:w-1/2 ${isDark ? "border-slate-800 bg-slate-950" : "border-stone-100 bg-stone-50"}`}>
                            <Phone className={`h-5 w-5 ${isDark ? "text-slate-500" : "text-stone-400"}`} />
                            <span className={`font-medium ${isDark ? "text-slate-100" : "text-stone-800"}`}>{CAMBODIA_DIAL_CODE}{formData.phone}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleUpdateProfile} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="group">
                          <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${isDark ? "text-slate-400" : "text-stone-500"}`}>{t("profile.fullName")}</label>
                          <div className="relative">
                            <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors ${isDark ? "text-slate-500 group-focus-within:text-indigo-300" : "text-stone-400 group-focus-within:text-indigo-500"}`}>
                              <User className="h-5 w-5" />
                            </div>
                            <input type="text" name="name" value={formData.name} onChange={handleInputChange} required
                              className={`block w-full pl-11 pr-4 py-4 border rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium ${
                                isDark ? "bg-slate-950 border-slate-700 text-slate-100 placeholder:text-slate-500" : "bg-stone-50 border-stone-200 focus:bg-white text-stone-800"
                              }`}
                              placeholder="John Doe"
                            />
                          </div>
                        </div>

                        <div className="group">
                          <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${isDark ? "text-slate-400" : "text-stone-500"}`}>{t("profile.emailAddress")}</label>
                          <div className="relative">
                            <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors ${isDark ? "text-slate-500 group-focus-within:text-indigo-300" : "text-stone-400 group-focus-within:text-indigo-500"}`}>
                              <Mail className="h-5 w-5" />
                            </div>
                            <input type="email" name="email" value={formData.email} onChange={handleInputChange} required
                              className={`block w-full pl-11 pr-4 py-4 border rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium ${
                                isDark ? "bg-slate-950 border-slate-700 text-slate-100 placeholder:text-slate-500" : "bg-stone-50 border-stone-200 focus:bg-white text-stone-800"
                              }`}
                              placeholder="john@example.com"
                            />
                          </div>
                        </div>

                        <div className="group md:col-span-2">
                          <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${isDark ? "text-slate-400" : "text-stone-500"}`}>{t("profile.phoneNumber")}</label>
                          <div className="relative md:w-1/2 md:pr-3">
                            <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors ${isDark ? "text-slate-500 group-focus-within:text-indigo-300" : "text-stone-400 group-focus-within:text-indigo-500"}`}>
                              <Phone className="h-5 w-5" />
                            </div>
                            <span className={`absolute left-12 top-1/2 -translate-y-1/2 text-sm font-bold ${isDark ? "text-slate-200" : "text-stone-800"}`}>
                              {CAMBODIA_DIAL_CODE}
                            </span>
                            <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} required
                              className={`block w-full pl-28 pr-4 py-4 border rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium ${
                                isDark ? "bg-slate-950 border-slate-700 text-slate-100 placeholder:text-slate-500" : "bg-stone-50 border-stone-200 focus:bg-white text-stone-800"
                              }`}
                              placeholder="16568335"
                            />
                          </div>
                        </div>
                      </div>

                      <div className={`pt-6 mt-6 border-t flex justify-end gap-3 ${isDark ? "border-slate-800" : "border-stone-100"}`}>
                        <button type="submit" disabled={loading} className="bg-indigo-600 text-white py-4 px-8 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-500/30 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed">
                          {loading ? <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white" /> : <Save className="w-5 h-5" />}
                          {loading ? t("profile.saving") : t("profile.saveChanges")}
                        </button>
                      </div>
                    </form>
                  )}
                </Motion.div>
              )}

              {activeTab === "security" && (
                <Motion.div
                  key="security"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className={`rounded-[2rem] p-8 md:p-10 border shadow-sm max-w-3xl mx-auto ${isDark ? "bg-slate-900/90 border-slate-800" : "bg-white border-stone-100"}`}
                >
                  <div className="text-center mb-10">
                    <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 text-indigo-600 relative ${isDark ? "bg-indigo-500/10" : "bg-indigo-50"}`}>
                      <div className={`absolute inset-0 rounded-full animate-ping opacity-20 ${isDark ? "bg-indigo-400" : "bg-indigo-100"}`}></div>
                      <Shield className="w-10 h-10 relative z-10" />
                    </div>
                    <h2 className={`text-2xl font-bold ${isDark ? "text-slate-50" : "text-stone-800"}`}>{t("profile.securitySettings")}</h2>
                    <p className={`text-sm mt-2 ${isDark ? "text-slate-400" : "text-stone-500"}`}>{t("profile.securityDescription")}</p>
                  </div>

                  <div className="mb-8 grid grid-cols-3 gap-2">
                    {[
                      ["email", t("profile.emailStep")],
                      ["code", t("profile.verifyStep")],
                      ["password", t("profile.passwordStep")],
                    ].map(([stepKey, label], index) => {
                      const steps = ["email", "code", "password"];
                      const isActive = securityStep === stepKey;
                      const isComplete = steps.indexOf(securityStep) > index;

                      return (
                        <div
                          key={stepKey}
                          className={`rounded-xl px-3 py-3 text-center text-xs font-black uppercase tracking-wider ${
                            isActive || isComplete
                              ? "bg-green-600 text-white"
                              : isDark
                                ? "bg-slate-950 text-slate-500"
                                : "bg-stone-100 text-stone-400"
                          }`}
                        >
                          {label}
                        </div>
                      );
                    })}
                  </div>

                  {securityStep === "email" && (
                    <form onSubmit={handleSendSecurityCode} className="space-y-6">
                      <div className="group">
                        <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${isDark ? "text-slate-400" : "text-stone-500"}`}>{t("profile.emailAddress")}</label>
                        <div className="relative">
                          <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors ${isDark ? "text-slate-500 group-focus-within:text-emerald-300" : "text-stone-400 group-focus-within:text-emerald-500"}`}>
                            <Mail className="h-5 w-5" />
                          </div>
                          <input
                            type="email"
                            value={securityEmail}
                            onChange={(event) => {
                              setSecurityEmail(event.target.value);
                              setError("");
                              setSuccess("");
                            }}
                            className={`block w-full pl-11 pr-4 py-4 border rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium ${
                              isDark ? "bg-slate-950 border-slate-700 text-slate-100 placeholder:text-slate-500" : "bg-stone-50 border-stone-200 focus:bg-white text-stone-800"
                            }`}
                            placeholder={t("profile.enterAccountEmail")}
                          />
                        </div>
                      </div>

                      <div className="pt-4 flex justify-center">
                        <button type="submit" disabled={loading || !securityEmail.trim()} className="text-white w-full md:w-auto py-4 md:px-12 rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95 disabled:cursor-not-allowed bg-green-600 hover:bg-green-700 disabled:opacity-60">
                          {loading ? <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white" /> : <Mail className="w-5 h-5" />}
                          {loading ? t("profile.sendingCode") : t("profile.sendVerificationCode")}
                        </button>
                      </div>
                    </form>
                  )}

                  {securityStep === "code" && (
                    <form onSubmit={handleVerifySecurityCode} className="space-y-6">
                      <div className="group">
                        <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${isDark ? "text-slate-400" : "text-stone-500"}`}>{t("profile.verificationCode")}</label>
                        <div className="relative">
                          <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors ${isDark ? "text-slate-500 group-focus-within:text-emerald-300" : "text-stone-400 group-focus-within:text-emerald-500"}`}>
                            <Shield className="h-5 w-5" />
                          </div>
                          <input
                            type="text"
                            inputMode="numeric"
                            maxLength={6}
                            value={securityCode}
                            onChange={(event) => {
                              setSecurityCode(event.target.value.replace(/\D/g, "").slice(0, 6));
                              setError("");
                              setSuccess("");
                            }}
                            className={`block w-full pl-11 pr-4 py-4 border rounded-xl text-center text-2xl font-black tracking-[0.35em] focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all ${
                              isDark ? "bg-slate-950 border-slate-700 text-slate-100 placeholder:text-slate-500" : "bg-stone-50 border-stone-200 focus:bg-white text-stone-800"
                            }`}
                            placeholder="000000"
                          />
                        </div>
                        <p className={`mt-3 text-sm font-medium ${isDark ? "text-slate-400" : "text-stone-500"}`}>
                          {t("profile.codeSentTo", { email: securityEmail })}
                        </p>
                      </div>

                      <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:justify-center">
                        <button type="submit" disabled={loading || securityCode.length !== 6} className="text-white w-full sm:w-auto py-4 sm:px-12 rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95 disabled:cursor-not-allowed bg-green-600 hover:bg-green-700 disabled:opacity-60">
                          {loading ? <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white" /> : <Shield className="w-5 h-5" />}
                          {loading ? t("profile.verifying") : t("profile.verifyCode")}
                        </button>
                        <button type="button" onClick={handleResendSecurityCode} disabled={loading || resendCooldown > 0} className={`w-full rounded-xl border py-4 font-bold transition-all active:scale-95 disabled:cursor-not-allowed sm:w-auto sm:px-8 ${
                          isDark ? "border-slate-700 text-slate-300 hover:bg-slate-800 disabled:text-slate-600" : "border-stone-200 text-stone-700 hover:bg-stone-50 disabled:text-stone-400"
                        }`}>
                          {resendCooldown > 0
                            ? t("profile.resendIn", { seconds: resendCooldown })
                            : t("profile.resendCode")}
                        </button>
                      </div>
                    </form>
                  )}

                  {securityStep === "password" && (
                    <form onSubmit={handleSecurityPasswordReset} className="mx-auto w-full max-w-3xl space-y-6 text-left">
                      <div>
                        <h2 className={`font-display text-2xl font-black sm:text-3xl ${isDark ? "text-slate-100" : "text-stone-800"}`}>
                          {t("registerPage.passwordValidatorTitle")}
                        </h2>
                        <p className={`mt-2 text-sm font-medium leading-relaxed ${isDark ? "text-slate-300" : "text-stone-500"}`}>
                          {t("registerPage.passwordValidatorSubtitle")}
                        </p>
                      </div>

                      <div>
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <label htmlFor="security-new-password" className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                            {t("profile.newPassword")}
                          </label>
                          <button
                            type="button"
                            onClick={useSuggestedSecurityPassword}
                            className="w-full rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-black text-white transition-colors hover:bg-emerald-700 sm:w-auto"
                          >
                            {t("registerPage.useSuggestedPassword")}
                          </button>
                        </div>

                        <div className="relative mt-2">
                          <input
                            id="security-new-password"
                            autoFocus
                            type={showPassword ? "text" : "password"}
                            name="newPassword"
                            value={formData.newPassword}
                            onChange={handleInputChange}
                            autoComplete="new-password"
                            className={`h-14 w-full border-0 border-b-2 border-emerald-500 bg-transparent pr-12 text-lg font-bold outline-none sm:text-xl ${
                              isDark ? "text-slate-50" : "text-stone-800"
                            }`}
                            placeholder={t("profile.enterNewPassword")}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword((visible) => !visible)}
                            aria-label={showPassword ? "Hide password" : "Show password"}
                            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-2 text-emerald-600 transition-colors hover:bg-emerald-500/10 dark:text-emerald-400"
                          >
                            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                          </button>
                        </div>
                      </div>

                      <div className={`rounded-[1.5rem] p-4 sm:p-6 ${isDark ? "bg-slate-800/75" : "bg-stone-100/90"}`}>
                        <div className={`h-2 overflow-hidden rounded-full ${isDark ? "bg-slate-700" : "bg-stone-200"}`}>
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${securityPasswordStrength.barClassName}`}
                            style={{ width: `${Math.max((passedSecurityPasswordRules / securityPasswordRules.length) * 100, formData.newPassword ? 12 : 0)}%` }}
                          />
                        </div>

                        <div className="mt-4 flex items-center justify-between gap-4">
                          <span className={`text-sm font-bold ${isDark ? "text-slate-300" : "text-stone-500"}`}>
                            {t("registerPage.passwordStrength.label")}
                          </span>
                          <span className={`text-sm font-black ${securityPasswordStrength.textClassName}`}>
                            {securityPasswordStrength.label}
                          </span>
                        </div>

                        <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                          {securityPasswordRules.map((rule) => (
                            <li
                              key={rule.label}
                              className={`flex items-center gap-3 text-sm font-bold transition-colors ${
                                rule.valid
                                  ? "text-emerald-600 dark:text-emerald-400"
                                  : isDark ? "text-slate-500" : "text-stone-400"
                              }`}
                            >
                              <CheckCircle
                                className={`h-5 w-5 shrink-0 ${
                                  rule.valid ? "fill-emerald-500 text-white dark:text-slate-900" : ""
                                }`}
                              />
                              <span>{rule.label}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="group">
                        <label htmlFor="security-confirm-password" className={`mb-2 block text-xs font-bold uppercase tracking-wider ${isDark ? "text-slate-400" : "text-stone-500"}`}>
                          {t("profile.confirmNewPassword")}
                        </label>
                        <div className="relative">
                          <div className={`pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 ${isDark ? "text-slate-500" : "text-stone-400"}`}>
                            <Lock className="h-5 w-5" />
                          </div>
                          <input
                            id="security-confirm-password"
                            type={showPassword ? "text" : "password"}
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleInputChange}
                            autoComplete="new-password"
                            className={`block w-full rounded-xl border py-4 pl-11 pr-4 font-medium transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 ${
                              isDark
                                ? "border-slate-700 bg-slate-950 text-slate-100 placeholder:text-slate-500"
                                : "border-stone-200 bg-stone-50 text-stone-800 focus:bg-white"
                            }`}
                            placeholder={t("profile.confirmNewPasswordPlaceholder")}
                          />
                        </div>
                        {formData.confirmPassword && formData.newPassword !== formData.confirmPassword && (
                          <p className="mt-2 text-sm font-bold text-rose-500">
                            {t("profile.passwordsDoNotMatch")}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-center">
                        <button
                          type="submit"
                          disabled={loading || !validateStrongPassword(formData.newPassword) || formData.newPassword !== formData.confirmPassword}
                          className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 py-4 font-bold text-white transition-all hover:bg-green-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:px-12"
                        >
                          {loading ? <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <Shield className="h-5 w-5" />}
                          {loading ? t("profile.updatingSecurity") : t("profile.updatePassword")}
                        </button>
                        <button type="button" onClick={resetSecurityForm} className={`w-full rounded-xl border py-4 font-bold transition-all active:scale-95 sm:w-auto sm:px-8 ${
                          isDark ? "border-slate-700 text-slate-300 hover:bg-slate-800" : "border-stone-200 text-stone-700 hover:bg-stone-50"
                        }`}>
                          {t("profile.startOver")}
                        </button>
                      </div>
                    </form>
                  )}
                </Motion.div>
              )}

            </AnimatePresence>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Profile;
