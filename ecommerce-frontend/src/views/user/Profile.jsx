import { useState, useEffect } from "react";
import { useAuth } from "../../context/useAuth";
import { Link } from "react-router-dom";
import {
  Camera,
  Save,
  AlertCircle,
  ShoppingBag,
  Heart,
  ShoppingCart,
  User,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  Package,
  Shield,
  Settings,
  Calendar,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";

// UI Components
import { AlertMessage, StatCard, FormInput } from "../../components";
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

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } }
};

const Profile = () => {
  const { user, login } = useAuth();
  const [isDark] = useDarkMode();
  const { language, t } = useLanguage();
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [stats, setStats] = useState({
    totalOrders: 0,
    cartItems: 0,
    wishlistItems: 0,
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    avatar: null,
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
        avatar: null,
      });
      fetchUserStats();
      fetchRecentOrders();
    }
  }, [user]);

  const fetchUserStats = async () => {
    try {
      const token = getAuthToken();
      if (!token) return;

      const [ordersRes, cartRes, wishlistRes] = await Promise.allSettled([
        axios.get(`${API_URL}/orders/myorders`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${API_URL}/cart`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${API_URL}/wishlist`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      setStats({
        totalOrders: ordersRes.status === "fulfilled" ? ordersRes.value.data.length || 0 : 0,
        cartItems: cartRes.status === "fulfilled" ? cartRes.value.data.items?.length || 0 : 0,
        wishlistItems: wishlistRes.status === "fulfilled" ? wishlistRes.value.data.length || 0 : 0,
      });
    } catch (err) {
      console.error("Error fetching user stats:", err);
    }
  };

  const fetchRecentOrders = async () => {
    try {
      const token = getAuthToken();
      if (!token) return;

      const response = await axios.get(`${API_URL}/orders/myorders`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setRecentOrders(response.data.slice(0, 3));
    } catch (err) {
      console.error("Error fetching recent orders:", err);
    }
  };

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

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError(t("profile.avatarTooLarge"));
        return;
      }
      setFormData((prev) => ({ ...prev, avatar: file }));
      setAvatarPreview(URL.createObjectURL(file));
    }
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
    <div className={`min-h-screen pb-20 font-sans transition-colors ${isDark ? "bg-transparent" : "bg-stone-50"}`}>
      {/* Dynamic Header Banner */}
      <div className="relative h-72 w-full overflow-hidden bg-[linear-gradient(135deg,#7A967E_0%,#8DAA91_48%,#E6BAA3_100%)]">
        {/* Abstract shapes for visual interest */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-20">
          <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-white mix-blend-overlay blur-3xl"></div>
          <div className="absolute bottom-0 right-10 h-80 w-80 rounded-full bg-secondary/40 mix-blend-overlay blur-3xl"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-full flex flex-col justify-end pb-10 relative z-10">
          <motion.div 
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="flex items-end gap-6"
          >
            <div className="relative group">
              <div className={`w-32 h-32 rounded-2xl p-1 shadow-2xl transform rotate-3 transition-transform group-hover:rotate-0 duration-300 ${
                isDark ? "bg-slate-900/95 ring-1 ring-white/10" : "bg-white"
              }`}>
                <div className={`w-full h-full rounded-xl overflow-hidden flex items-center justify-center relative ${
                  isDark ? "bg-slate-800" : "bg-stone-100"
                }`}>
                  {avatarPreview ? (
                     <img src={avatarPreview} alt={t("profile.myProfile")} className="w-full h-full object-cover" />
                  ) : (
                     <User className={`w-12 h-12 ${isDark ? "text-slate-500" : "text-stone-300"}`} />
                  )}
                  {activeTab === "edit" && (
                    <label className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer backdrop-blur-sm">
                      <Camera className="w-6 h-6 mb-1" />
                      <span className="text-xs font-bold">{t("profile.change")}</span>
                      <input type="file" onChange={handleAvatarChange} className="hidden" accept="image/*" />
                    </label>
                  )}
                </div>
              </div>
            </div>
            
            <div className="mb-2 text-white">
              <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight drop-shadow-md">
                {user.name}
              </h1>
              <p className="mt-2 flex items-center gap-2 font-medium text-white/85">
                <Mail className="w-4 h-4" /> {user.email}
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 -mt-8 relative z-20">
        
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

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Sidebar Area */}
          <div className="lg:col-span-1">
            <motion.div 
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="sticky top-24"
            >
              <ProfileSidebar />
            </motion.div>
          </div>

          {/* Main Dashboard Area */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* Elegant Tab Navigation */}
            <motion.div 
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className={`rounded-2xl p-1.5 shadow-sm border flex flex-nowrap overflow-x-auto no-scrollbar transition-colors ${
                isDark ? "bg-slate-900/90 border-slate-800" : "bg-white border-stone-100"
              }`}
            >
              {[
                { id: "overview", label: t("profile.dashboard"), icon: TrendingUp },
                { id: "edit", label: t("profile.profileDetails"), icon: Settings },
                { id: "security", label: t("profile.securityLogin"), icon: Shield },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-xl transition-all duration-300 font-semibold text-sm whitespace-nowrap ${
                    activeTab === tab.id
                      ? "bg-primary text-white shadow-md transform scale-[1.02]"
                      : isDark
                        ? "text-slate-400 hover:bg-slate-800 hover:text-primary"
                        : "text-stone-500 hover:bg-stone-50 hover:text-primary"
                  }`}
                >
                  <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? "animate-pulse" : ""}`} />
                  {tab.label}
                </button>
              ))}
            </motion.div>

            {/* Content Area */}
            <AnimatePresence mode="wait">
              
              {activeTab === "overview" && (
                <motion.div
                  key="overview"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="space-y-6"
                >
                  {/* Premium Stats Row */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                      { to: "/customer/orders", label: t("profile.totalOrders"), value: stats.totalOrders, icon: ShoppingBag, color: "from-primary-dark to-primary", bg: "bg-[color:var(--color-surface-soft)] border-[color:var(--color-border)]" },
                      { to: "/customer/wishlist", label: t("profile.wishlistItems"), value: stats.wishlistItems, icon: Heart, color: "from-secondary to-primary-light", bg: "bg-[color:var(--color-secondary-light)] border-[color:var(--color-border)]" },
                      { to: "/customer/cart", label: t("profile.itemsInCart"), value: stats.cartItems, icon: ShoppingCart, color: "from-primary-light to-secondary", bg: "bg-[color:color-mix(in_srgb,var(--color-primary-light)_24%,white)] border-[color:var(--color-border)]" }
                    ].map((stat, idx) => (
                      <motion.div
                        key={idx}
                        variants={itemVariants}
                        className={`rounded-[2rem] p-6 border shadow-sm relative overflow-hidden group hover:shadow-md transition-all ${
                          isDark ? "bg-slate-900/90 border-slate-800" : stat.bg
                        }`}
                      >
                        <div className="absolute top-0 right-0 p-4 opacity-10 transform translate-x-4 -translate-y-4 group-hover:scale-110 group-hover:-rotate-12 transition-transform duration-500">
                          <stat.icon className="w-24 h-24" />
                        </div>
                        <div className="relative z-10">
                          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} text-white flex items-center justify-center shadow-lg mb-4`}>
                            <stat.icon className="w-6 h-6" />
                          </div>
                          <p className={`font-medium text-sm ${isDark ? "text-slate-400" : "text-stone-600"}`}>{stat.label}</p>
                          <h3 className={`text-3xl font-black mt-1 ${isDark ? "text-slate-50" : "text-stone-800"}`}>{stat.value}</h3>
                          <Link to={stat.to} className="inline-flex items-center gap-1 text-sm font-bold mt-4 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: `var(--color-primary)` }}>
                            {t("profile.viewAll")} <ChevronRight className="w-4 h-4" />
                          </Link>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Minimalist Quick Info */}
                    <motion.div variants={itemVariants} className={`rounded-[2rem] p-8 border shadow-sm hover:shadow-lg transition-shadow duration-300 ${isDark ? "bg-slate-900/90 border-slate-800" : "bg-white border-stone-100"}`}>
                      <div className={`flex items-center justify-between mb-8 pb-4 border-b ${isDark ? "border-slate-800" : "border-stone-50"}`}>
                        <h3 className={`text-xl font-bold flex items-center gap-2 ${isDark ? "text-slate-50" : "text-stone-800"}`}>
                          <User className="w-5 h-5 text-primary" /> {t("profile.accountSummary")}
                        </h3>
                        <button onClick={() => setActiveTab("edit")} className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${isDark ? "text-primary-light bg-primary/15 hover:bg-primary/25" : "text-primary bg-primary/10 hover:bg-primary/15"}`}>{t("profile.edit")}</button>
                      </div>
                      
                      <div className="space-y-6 relative">
                        {/* Decorative Line */}
                        <div className={`absolute left-6 top-8 bottom-4 w-px z-0 ${isDark ? "bg-slate-800" : "bg-stone-100"}`}></div>
                        
                        {[
                          { icon: User, label: t("profile.fullName"), value: user.name },
                          { icon: Mail, label: t("profile.email"), value: user.email },
                          { icon: Phone, label: t("profile.phone"), value: user.phone || t("profile.notProvided") },
                          { icon: Calendar, label: t("profile.joined"), value: new Date(user.createdAt || Date.now()).toLocaleDateString(language === "kh" ? "km-KH" : "en-US", { month: 'long', year: 'numeric' }) }
                        ].map((item, idx) => (
                          <div key={idx} className="flex gap-4 relative z-10 group">
                            <div className={`w-12 h-12 rounded-full border shadow-sm flex items-center justify-center transition-all ${
                              isDark
                                ? "bg-slate-950 border-slate-700 text-slate-400 group-hover:border-primary group-hover:text-primary-light group-hover:shadow-[0_0_0_1px_rgba(167,199,173,0.18)]"
                                : "bg-white border-stone-200 text-stone-500 group-hover:border-primary-light group-hover:text-primary group-hover:shadow-md"
                            }`}>
                              <item.icon className="w-5 h-5" />
                            </div>
                            <div className="pt-1">
                              <p className={`text-xs font-bold uppercase tracking-wider ${isDark ? "text-slate-500" : "text-stone-400"}`}>{item.label}</p>
                              <p className={`font-medium text-lg ${isDark ? "text-slate-100" : "text-stone-800"}`}>{item.value}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>

                    {/* Exquisite Recent Orders */}
                    <motion.div variants={itemVariants} className={`rounded-[2rem] p-8 border shadow-sm hover:shadow-lg transition-shadow duration-300 flex flex-col ${isDark ? "bg-slate-900/90 border-slate-800" : "bg-white border-stone-100"}`}>
                      <div className={`flex items-center justify-between mb-6 pb-4 border-b ${isDark ? "border-slate-800" : "border-stone-50"}`}>
                        <h3 className={`text-xl font-bold flex items-center gap-2 ${isDark ? "text-slate-50" : "text-stone-800"}`}>
                          <Package className="w-5 h-5 text-primary" /> {t("profile.recentActivity")}
                        </h3>
                        <Link to="/customer/orders" className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${isDark ? "text-primary-light bg-primary/15 hover:bg-primary/25" : "text-primary bg-primary/10 hover:bg-primary/15"}`}>{t("profile.viewAll")}</Link>
                      </div>
                      
                      <div className="space-y-4 flex-1">
                        {recentOrders.length > 0 ? (
                          recentOrders.map((order, idx) => (
                            <Link key={order._id} to={`/customer/orders/${order._id}`} className="block">
                              <motion.div 
                                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.1 }}
                                className={`p-4 rounded-xl border transition-all group flex items-center justify-between relative overflow-hidden ${
                                  isDark
                                    ? "border-slate-800 hover:border-primary/40 hover:bg-slate-800/90"
                                    : "border-stone-100 hover:border-primary/20 hover:bg-primary/5"
                                }`}
                              >
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary to-secondary opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className={`text-xs font-bold font-mono px-2 py-0.5 rounded ${isDark ? "text-slate-300 bg-slate-800" : "text-stone-500 bg-stone-100"}`}>#{order._id.slice(-6).toUpperCase()}</span>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider
                                      ${order.orderStatus === 'delivered' ? 'bg-green-100 text-green-700' :
                                        order.orderStatus === 'shipped' ? 'bg-blue-100 text-blue-700' :
                                        'bg-amber-100 text-amber-700'
                                      }`}
                                    >
                                      {order.orderStatus}
                                    </span>
                                  </div>
                                  <p className={`text-sm font-medium ${isDark ? "text-slate-100" : "text-stone-800"}`}>
                                    {new Date(order.createdAt).toLocaleDateString(language === "kh" ? "km-KH" : undefined)}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="text-lg font-bold text-primary">${order.totalPrice?.toFixed(2)}</p>
                                  <p className={`text-xs font-medium ${isDark ? "text-slate-400" : "text-stone-500"}`}>{order.orderItems?.length} {t("cart.items")}</p>
                                </div>
                              </motion.div>
                            </Link>
                          ))
                        ) : (
                          <div className={`h-full flex flex-col items-center justify-center text-center p-6 rounded-2xl border border-dashed ${isDark ? "bg-slate-950/60 border-slate-800" : "bg-stone-50 border-stone-200"}`}>
                            <div className={`w-16 h-16 rounded-full flex items-center justify-center shadow-sm mb-4 ${isDark ? "bg-slate-900" : "bg-white"}`}>
                              <ShoppingBag className={`w-6 h-6 ${isDark ? "text-slate-500" : "text-stone-300"}`} />
                            </div>
                            <p className={`font-bold ${isDark ? "text-slate-100" : "text-stone-800"}`}>{t("profile.noOrdersYet")}</p>
                            <p className={`text-sm mt-1 ${isDark ? "text-slate-400" : "text-stone-500"}`}>{t("profile.noOrdersMessage")}</p>
                            <Link to="/products" className="mt-4 text-sm font-bold text-primary hover:text-primary-dark underline">{t("profile.startShopping")}</Link>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  </div>
                </motion.div>
              )}

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
