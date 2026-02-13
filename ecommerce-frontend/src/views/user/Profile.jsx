import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
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
  CreditCard,
  MapPin,
  Clock,
  Settings
} from "lucide-react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";

// UI Components
import { AlertMessage, StatCard, FormInput } from "../../components";
import ProfileSidebar from "../../components/user/ProfileSidebar"; // Make sure to import the new sidebar

const API_URL = "http://localhost:4000/api";

const Profile = () => {
  const { user, login } = useAuth();
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
        phone: user.phone || "",
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
        totalOrders:
          ordersRes.status === "fulfilled" ? ordersRes.value.data.length || 0 : 0,
        cartItems:
          cartRes.status === "fulfilled"
            ? cartRes.value.data.items?.length || 0
            : 0,
        wishlistItems:
          wishlistRes.status === "fulfilled" ? wishlistRes.value.data.length || 0 : 0,
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
      [name]: value,
    }));
    setError("");
    setSuccess("");
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError("Avatar image must be less than 5MB");
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
      if (!token) {
        throw new Error("Not authenticated");
      }

      const updateData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
      };

      if (formData.newPassword) {
        if (!formData.currentPassword) {
          throw new Error("Current password is required to change password");
        }
        if (formData.newPassword !== formData.confirmPassword) {
          throw new Error("New passwords do not match");
        }
        if (formData.newPassword.length < 6) {
          throw new Error("New password must be at least 6 characters");
        }
        updateData.currentPassword = formData.currentPassword;
        updateData.newPassword = formData.newPassword;
      }

      const response = await axios.put(
        `${API_URL}/users/profile`,
        updateData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      // Preserve all user data including createdAt
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

      setSuccess("Profile updated successfully!");
      setFormData((prev) => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }));

      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || "Failed to update profile"
      );
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-base font-sans">
        <div className="text-center bg-white p-12 rounded-[4rem] shadow-2xl border border-stone-100">
          <AlertCircle className="w-16 h-16 text-red-200 mx-auto mb-6" />
          <h2 className="text-3xl font-black text-text-main mb-4 font-display tracking-tight uppercase tracking-widest text-xs">
            Identity Unverified
          </h2>
          <p className="text-text-muted font-bold text-sm mb-10">Verification required to access personal registry logs.</p>
          <Link to="/login" className="bg-text-main text-white px-10 py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] shadow-2xl shadow-primary/10 hover:bg-primary transition-all active:scale-95 inline-block">
            Establish Credentials
          </Link>
        </div>
      </div>
    );
  }

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, x: -20, transition: { duration: 0.2 } }
  };

  return (
    <div className="min-h-screen bg-bg-base py-12 pt-32 px-4 md:px-8 font-sans">
      <div className="max-w-7xl mx-auto">

        {/* Messages */}
        <AnimatePresence>
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-8"
            >
              <AlertMessage type="success" message={success} title="Success" onClose={() => setSuccess("")} />
            </motion.div>
          )}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-8"
            >
              <AlertMessage type="error" message={error} title="Error" onClose={() => setError("")} />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <ProfileSidebar />
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-8">
            {/* Header Tabs */}
            <div className="bg-white rounded-3xl p-2 shadow-sm border border-stone-100 flex flex-wrap gap-2">
              {[
                { id: "overview", label: "Overview", icon: User },
                { id: "edit", label: "Edit Profile", icon: Settings },
                { id: "security", label: "Security", icon: Shield },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-2xl transition-all font-bold text-sm ${activeTab === tab.id
                    ? "bg-text-main text-white shadow-lg"
                    : "text-text-muted hover:bg-stone-50 hover:text-text-main"
                    }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <AnimatePresence mode="wait">
              {activeTab === "overview" && (
                <motion.div
                  key="overview"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="space-y-8"
                >
                  {/* Stats Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <StatCard to="/orders" label="Total Orders" value={stats.totalOrders} icon={ShoppingBag} />
                    <StatCard to="/wishlist" label="Wishlist" value={stats.wishlistItems} icon={Heart} />
                    <StatCard to="/cart" label="In Cart" value={stats.cartItems} icon={ShoppingCart} />
                  </div>

                  {/* Quick Info & Recent Activity */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Personal Info Card */}
                    <div className="bg-white rounded-[2.5rem] p-8 border border-stone-100 shadow-sm hover:shadow-md transition-all">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold text-text-main">Personal Info</h3>
                        <button onClick={() => setActiveTab("edit")} className="text-primary text-xs font-black uppercase tracking-widest hover:underline">Edit</button>
                      </div>
                      <div className="space-y-6">
                        <div className="flex items-center gap-4 p-4 bg-stone-50 rounded-2xl">
                          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-primary shadow-sm">
                            <User className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-xs text-text-muted font-bold uppercase tracking-wider">Full Name</p>
                            <p className="text-text-main font-bold">{user.name}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 p-4 bg-stone-50 rounded-2xl">
                          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-primary shadow-sm">
                            <Mail className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-xs text-text-muted font-bold uppercase tracking-wider">Email Address</p>
                            <p className="text-text-main font-bold truncate max-w-[200px]">{user.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 p-4 bg-stone-50 rounded-2xl">
                          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-primary shadow-sm">
                            <Phone className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-xs text-text-muted font-bold uppercase tracking-wider">Phone Number</p>
                            <p className="text-text-main font-bold">{user.phone || "Not set"}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Recent Orders Preview */}
                    <div className="bg-white rounded-[2.5rem] p-8 border border-stone-100 shadow-sm hover:shadow-md transition-all">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold text-text-main">Recent Orders</h3>
                        <Link to="/orders" className="text-primary text-xs font-black uppercase tracking-widest hover:underline">View All</Link>
                      </div>
                      <div className="space-y-4">
                        {recentOrders.length > 0 ? (
                          recentOrders.map((order) => (
                            <Link key={order._id} to={`/orders/${order._id}`} className="flex items-center justify-between p-4 bg-stone-50 rounded-2xl hover:bg-white hover:shadow-sm border border-transparent hover:border-stone-100 transition-all group">
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-text-muted font-bold text-xs border border-stone-100 group-hover:border-primary/20 group-hover:text-primary transition-colors">
                                  #{order._id.slice(-4).toUpperCase()}
                                </div>
                                <div>
                                  <p className="text-text-main font-bold text-sm">{new Date(order.createdAt).toLocaleDateString()}</p>
                                  <p className="text-text-muted text-xs font-medium">{order.orderItems?.length} Items • ${order.totalPrice?.toFixed(2)}</p>
                                </div>
                              </div>
                              <div className={`w-2 h-2 rounded-full ${order.orderStatus === 'delivered' ? 'bg-green-500' :
                                order.orderStatus === 'shipped' ? 'bg-blue-500' :
                                  'bg-yellow-500'
                                }`} />
                            </Link>
                          ))
                        ) : (
                          <div className="text-center py-8">
                            <Package className="w-12 h-12 text-stone-200 mx-auto mb-2" />
                            <p className="text-text-muted font-bold text-sm">No recent orders</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {(activeTab === "edit" || activeTab === "security") && (
                <motion.div
                  key="form"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="bg-white rounded-[2.5rem] p-8 md:p-12 border border-stone-100 shadow-sm"
                >
                  <form onSubmit={handleUpdateProfile} className="space-y-8">
                    {activeTab === "edit" && (
                      <div className="space-y-8">
                        <div className="flex items-center gap-6 mb-8 pb-8 border-b border-stone-100">
                          <div className="relative group">
                            <div className="w-24 h-24 rounded-full bg-stone-100 border-4 border-white shadow-lg overflow-hidden flex items-center justify-center">
                              {avatarPreview ? (
                                <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
                              ) : (
                                <User className="w-10 h-10 text-stone-300" />
                              )}
                            </div>
                            <label className="absolute bottom-0 right-0 bg-primary text-white p-2 rounded-full cursor-pointer hover:bg-primary-dark transition-colors shadow-lg">
                              <Camera className="w-4 h-4" />
                              <input type="file" onChange={handleAvatarChange} className="hidden" accept="image/*" />
                            </label>
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-text-main">Profile Photo</h3>
                            <p className="text-text-muted text-xs font-medium max-w-xs">Upload a new avatar. Larger images will be resized automatically. Maximum upload size is 5MB.</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <FormInput label="Full Name" name="name" value={formData.name} onChange={handleInputChange} required icon={User} />
                          <FormInput label="Email Address" name="email" value={formData.email} onChange={handleInputChange} required icon={Mail} />
                          <FormInput label="Phone Number" name="phone" value={formData.phone} onChange={handleInputChange} required icon={Phone} />
                          <div className="hidden md:block"></div> {/* Spacer */}
                        </div>
                      </div>
                    )}

                    {activeTab === "security" && (
                      <div className="space-y-6 max-w-2xl mx-auto">
                        <div className="text-center mb-8">
                          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
                            <Lock className="w-8 h-8" />
                          </div>
                          <h3 className="text-xl font-bold text-text-main">Change Password</h3>
                          <p className="text-text-muted text-sm font-medium">Ensure your account is secure by using a strong password.</p>
                        </div>

                        <div className="space-y-6">
                          <div className="group">
                            <label className="block text-xs font-black text-text-muted uppercase tracking-widest mb-2 ml-1">Current Password</label>
                            <div className="relative">
                              <input
                                type={showCurrentPassword ? "text" : "password"}
                                name="currentPassword"
                                value={formData.currentPassword}
                                onChange={handleInputChange}
                                className="w-full px-5 py-4 bg-stone-50 border border-stone-200 rounded-2xl focus:outline-none focus:border-primary focus:bg-white transition-all font-bold text-text-main"
                                placeholder="Enter current password"
                              />
                              <button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-primary transition-colors">
                                {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                              </button>
                            </div>
                          </div>

                          <div className="group">
                            <label className="block text-xs font-black text-text-muted uppercase tracking-widest mb-2 ml-1">New Password</label>
                            <div className="relative">
                              <input
                                type={showPassword ? "text" : "password"}
                                name="newPassword"
                                value={formData.newPassword}
                                onChange={handleInputChange}
                                className="w-full px-5 py-4 bg-stone-50 border border-stone-200 rounded-2xl focus:outline-none focus:border-primary focus:bg-white transition-all font-bold text-text-main"
                                placeholder="Enter new password"
                              />
                              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-primary transition-colors">
                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                              </button>
                            </div>
                          </div>

                          <div className="group">
                            <label className="block text-xs font-black text-text-muted uppercase tracking-widest mb-2 ml-1">Confirm New Password</label>
                            <input
                              type={showPassword ? "text" : "password"}
                              name="confirmPassword"
                              value={formData.confirmPassword}
                              onChange={handleInputChange}
                              className="w-full px-5 py-4 bg-stone-50 border border-stone-200 rounded-2xl focus:outline-none focus:border-primary focus:bg-white transition-all font-bold text-text-main"
                              placeholder="Confirm new password"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="pt-8 border-t border-stone-100 flex justify-end">
                      <button
                        type="submit"
                        disabled={loading}
                        className="bg-primary text-white py-4 px-10 rounded-2xl hover:bg-primary-dark shadow-xl hover:shadow-primary/20 transition-all font-black text-sm uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 active:scale-95"
                      >
                        {loading ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                            Saving Changes...
                          </>
                        ) : (
                          <>
                            <Save className="w-5 h-5" />
                            Save Changes
                          </>
                        )}
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
