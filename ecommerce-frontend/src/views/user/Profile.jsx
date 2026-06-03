import { useState, useEffect } from "react";
import { useAuth } from "../../context/useAuth";
import { Link } from "react-router-dom";
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
} from "lucide-react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";

// UI Components
import { AlertMessage } from "../../components";
import ProfileSidebar from "../../components/user/ProfileSidebar";
import { config } from "../../config/index.js";
import { useDarkMode } from "../../hooks";
import { useLanguage } from "../../context/useLanguage";

const API_URL = config.API_BASE_URL;
const CAMBODIA_DIAL_CODE = "+855";

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
  const [isDark] = useDarkMode();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState("edit");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

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
    }
  }, [user]);

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

      if (formData.newPassword) {
        if (!formData.currentPassword) throw new Error(t("profile.currentPasswordRequired"));
        if (formData.newPassword !== formData.confirmPassword) throw new Error(t("profile.passwordsDoNotMatch"));
        if (formData.newPassword.length < 6) throw new Error(t("profile.passwordTooShort"));
        
        updateData.currentPassword = formData.currentPassword;
        updateData.newPassword = formData.newPassword;
      }

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

  if (!user) {
    return (
      <div className={`min-h-screen flex items-center justify-center font-sans transition-colors ${isDark ? "bg-slate-950" : "bg-stone-50"}`}>
        <motion.div 
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
        </motion.div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen pb-20 font-sans transition-colors ${isDark ? "bg-transparent" : "bg-[#FCF9F5]"}`}>
      {/* Visual Header Banner */}
      <div className="relative h-56 w-full overflow-hidden md:h-64">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,#6F8A73_0%,#AFC7B2_48%,#F1D2C2_100%)]" />
        <div className="absolute inset-0 opacity-70 [background:radial-gradient(circle_at_18%_20%,rgba(255,255,255,0.42),transparent_26%),radial-gradient(circle_at_82%_24%,rgba(255,255,255,0.28),transparent_24%)]" />
        <div className="absolute -bottom-20 left-[-10%] h-44 w-[120%] rounded-[50%] bg-white/18 blur-2xl" />
        <div className="absolute bottom-[-5.5rem] left-[-8%] h-40 w-[116%] rounded-[50%] border border-white/30" />
        <div className="relative mx-auto h-full max-w-7xl px-4 sm:px-6 md:px-8" aria-hidden="true" />
      </div>

      <div className="relative z-20 mx-auto -mt-8 max-w-7xl px-4 sm:px-6 md:px-8">
        
        <AnimatePresence>
          {success && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="mb-6">
              <AlertMessage type="success" message={success} title={t("profile.success")} onClose={() => setSuccess("")} />
            </motion.div>
          )}
          {error && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="mb-6">
              <AlertMessage type="error" message={error} title={t("profile.error")} onClose={() => setError("")} />
            </motion.div>
          )}
        </AnimatePresence>

        <ProfileSidebar activeTab={activeTab} onTabChange={setActiveTab} variant="mobile" />

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">
          
          {/* Sidebar Area */}
          <div className="hidden lg:block">
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="sticky top-24"
            >
              <ProfileSidebar activeTab={activeTab} onTabChange={setActiveTab} />
            </motion.div>
          </div>

          {/* Main Profile Area */}
          <div className="min-w-0 space-y-6">
            {/* Content Area */}
            <AnimatePresence mode="wait">
              {activeTab === "edit" && (
                <motion.div
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
                        className="flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-white transition-all hover:bg-primary-dark active:scale-95"
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
                </motion.div>
              )}

              {activeTab === "security" && (
                <motion.div
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

                  <form onSubmit={handleUpdateProfile} className="space-y-6">
                    <div className="space-y-5">
                      <div className="group">
                        <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${isDark ? "text-slate-400" : "text-stone-500"}`}>{t("profile.currentPassword")}</label>
                        <div className="relative">
                          <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors ${isDark ? "text-slate-500 group-focus-within:text-amber-300" : "text-stone-400 group-focus-within:text-amber-500"}`}>
                            <Lock className="h-5 w-5" />
                          </div>
                          <input type={showCurrentPassword ? "text" : "password"} name="currentPassword" value={formData.currentPassword} onChange={handleInputChange}
                            className={`block w-full pl-11 pr-12 py-4 border rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-medium ${
                              isDark ? "bg-slate-950 border-slate-700 text-slate-100 placeholder:text-slate-500" : "bg-stone-50 border-stone-200 focus:bg-white text-stone-800"
                            }`}
                            placeholder={t("profile.enterCurrentPassword")}
                          />
                          <button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)} className={`absolute inset-y-0 right-0 pr-4 flex items-center transition-colors ${isDark ? "text-slate-500 hover:text-amber-300" : "text-stone-400 hover:text-amber-600"}`}>
                            {showCurrentPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                          </button>
                        </div>
                      </div>

                      <div className="group">
                        <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${isDark ? "text-slate-400" : "text-stone-500"}`}>{t("profile.newPassword")}</label>
                        <div className="relative">
                          <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors ${isDark ? "text-slate-500 group-focus-within:text-emerald-300" : "text-stone-400 group-focus-within:text-emerald-500"}`}>
                            <Lock className="h-5 w-5" />
                          </div>
                          <input type={showPassword ? "text" : "password"} name="newPassword" value={formData.newPassword} onChange={handleInputChange}
                            className={`block w-full pl-11 pr-12 py-4 border rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium ${
                              isDark ? "bg-slate-950 border-slate-700 text-slate-100 placeholder:text-slate-500" : "bg-stone-50 border-stone-200 focus:bg-white text-stone-800"
                            }`}
                            placeholder={t("profile.enterNewPassword")}
                          />
                          <button type="button" onClick={() => setShowPassword(!showPassword)} className={`absolute inset-y-0 right-0 pr-4 flex items-center transition-colors ${isDark ? "text-slate-500 hover:text-emerald-300" : "text-stone-400 hover:text-emerald-600"}`}>
                            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                          </button>
                        </div>
                      </div>

                      <div className="group">
                        <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${isDark ? "text-slate-400" : "text-stone-500"}`}>{t("profile.confirmNewPassword")}</label>
                        <div className="relative">
                           <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors ${isDark ? "text-slate-500 group-focus-within:text-emerald-300" : "text-stone-400 group-focus-within:text-emerald-500"}`}>
                            <Lock className="h-5 w-5" />
                          </div>
                          <input type={showPassword ? "text" : "password"} name="confirmPassword" value={formData.confirmPassword} onChange={handleInputChange}
                            className={`block w-full pl-11 pr-4 py-4 border rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium ${
                              isDark ? "bg-slate-950 border-slate-700 text-slate-100 placeholder:text-slate-500" : "bg-stone-50 border-stone-200 focus:bg-white text-stone-800"
                            }`}
                            placeholder={t("profile.confirmNewPasswordPlaceholder")}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="pt-8 flex justify-center">
                      <button type="submit" disabled={loading || !formData.currentPassword || !formData.newPassword} className={`text-white w-full md:w-auto py-4 md:px-12 rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95 disabled:cursor-not-allowed ${isDark ? "bg-green-600 hover:bg-green-700" : "bg-green-600 hover:bg-green-700"}`}>
                        {loading ? <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white" /> : <Shield className="w-5 h-5" />}
                        {loading ? t("profile.updatingSecurity") : t("profile.updatePassword")}
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
