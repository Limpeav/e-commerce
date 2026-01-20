import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { Link } from "react-router-dom";
import {
  Camera,
  Save,
  X,
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
  Package
} from "lucide-react";
import axios from "axios";

// UI Components
import { AlertMessage, StatCard, FormInput } from "../../components";

const API_URL = "http://localhost:4000/api";

const Profile = () => {
  const { user, login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isEditing, setIsEditing] = useState(false);
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

      console.log("Sending update request with data:", updateData);

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

      console.log("Update response:", response.data);

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
      setIsEditing(false);
      setFormData((prev) => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }));

      // Auto-hide success message after 3 seconds
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Profile update error:", err);
      console.error("Error response:", err.response?.data);
      setError(
        err.response?.data?.message || err.message || "Failed to update profile"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setFormData({
      name: user.name || "",
      email: user.email || "",
      phone: user.phone || "",
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
      avatar: null,
    });
    setAvatarPreview(null);
    setError("");
    setSuccess("");
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

  return (
    <div className="min-h-screen bg-bg-base py-12 pt-32 px-6 font-sans">
      <div className="max-w-7xl mx-auto">
        {/* Success/Error Messages - Fixed at top */}
        {success && (
          <AlertMessage
            type="success"
            message={success}
            title="Profile Updated"
            onClose={() => setSuccess("")}
          />
        )}

        {error && (
          <AlertMessage
            type="error"
            message={error}
            title="Error"
            onClose={() => setError("")}
          />
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <StatCard
            to="/orders"
            label="Orders"
            value={stats.totalOrders}
            icon={ShoppingBag}
          />
          <StatCard
            to="/wishlist"
            label="Wishlist"
            value={stats.wishlistItems}
            icon={Heart}
          />
          <StatCard
            to="/cart"
            label="Cart"
            value={stats.cartItems}
            icon={ShoppingCart}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main Profile Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-[2rem] border border-stone-100 overflow-hidden shadow-sm transition-all">
              {/* Header with Avatar */}
              <div className="relative p-10 bg-stone-50 border-b border-stone-100">
                <div className="flex flex-col md:flex-row items-center md:items-start gap-8 relative z-10 text-center md:text-left">
                  {/* Avatar */}
                  <div className="relative flex-shrink-0 group">
                    <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center overflow-hidden border-4 border-white shadow-md group-hover:scale-105 transition-transform duration-300">
                      {avatarPreview ? (
                        <img
                          src={avatarPreview}
                          alt="Avatar"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-text-main flex items-center justify-center text-white text-3xl font-bold">
                          {user.name?.charAt(0) || "U"}
                        </div>
                      )}
                    </div>
                    {isEditing && (
                      <label className="absolute -bottom-2 -right-2 bg-primary text-white rounded-full p-2 shadow-lg cursor-pointer hover:bg-primary-light transition-all active:scale-95 border-2 border-white">
                        <Camera className="w-4 h-4" />
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarChange}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>

                  {/* User Info */}
                  <div className="flex-1 min-w-0 pt-2">
                    <h1 className="text-3xl font-bold text-text-main mb-2 tracking-tight">
                      {user.name}
                    </h1>
                    <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                      <span className="px-3 py-1 bg-text-main text-white rounded-full text-xs font-medium">
                        {user.role === "admin" ? "Admin" : "Customer"}
                      </span>
                      {user.createdAt && (
                        <span className="px-3 py-1 bg-white text-text-muted rounded-full text-xs font-medium border border-stone-200">
                          Joined {new Date(user.createdAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleUpdateProfile} className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Name */}
                  <FormInput
                    label="Full Name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    required
                    icon={User}
                  />

                  {/* Email */}
                  <FormInput
                    label="Email Address"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    required
                    icon={Mail}
                  />

                  {/* Phone */}
                  <FormInput
                    label="Phone Number"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    required
                    icon={Phone}
                  />

                  {/* Empty space for grid on desktop */}
                  <div></div>

                  {/* Password Section - Full width */}
                  {isEditing && (
                    <div className="md:col-span-2 pt-8 border-t border-stone-100">
                      <h3 className="text-sm font-bold text-text-main mb-6 flex items-center gap-2">
                        <Lock className="w-4 h-4 text-primary" />
                        Change Password
                      </h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Current Password */}
                        <div>
                          <label className="block text-xs font-bold text-text-muted mb-2 ml-1">
                            Current Password
                          </label>
                          <div className="relative">
                            <input
                              type={showCurrentPassword ? "text" : "password"}
                              name="currentPassword"
                              value={formData.currentPassword}
                              onChange={handleInputChange}
                              placeholder="Enter current password"
                              className="w-full px-4 py-3 bg-white border border-stone-200 rounded-xl focus:outline-none focus:border-primary transition-all font-medium text-text-main pr-12"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setShowCurrentPassword(!showCurrentPassword)
                              }
                              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-stone-400 hover:text-primary transition-colors"
                            >
                              {showCurrentPassword ? (
                                <EyeOff className="w-4 h-4" />
                              ) : (
                                <Eye className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </div>

                        {/* New Password */}
                        <div>
                          <label className="block text-xs font-bold text-text-muted mb-2 ml-1">
                            New Password
                          </label>
                          <div className="relative">
                            <input
                              type={showPassword ? "text" : "password"}
                              name="newPassword"
                              value={formData.newPassword}
                              onChange={handleInputChange}
                              placeholder="Enter new password"
                              className="w-full px-4 py-3 bg-white border border-stone-200 rounded-xl focus:outline-none focus:border-primary transition-all font-medium text-text-main pr-12"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-stone-400 hover:text-primary transition-colors"
                            >
                              {showPassword ? (
                                <EyeOff className="w-4 h-4" />
                              ) : (
                                <Eye className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Confirm Password */}
                        <div className="md:col-span-2">
                          <label className="block text-xs font-bold text-text-muted mb-2 ml-1">
                            Confirm New Password
                          </label>
                          <input
                            type={showPassword ? "text" : "password"}
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleInputChange}
                            placeholder="Confirm new password"
                            className="w-full px-4 py-3 bg-white border border-stone-200 rounded-xl focus:outline-none focus:border-primary transition-all font-medium text-text-main"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="mt-10 flex gap-4">
                  {!isEditing ? (
                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      className="bg-primary text-white py-3 px-8 rounded-xl hover:bg-primary-dark transition-all font-bold text-sm flex items-center justify-center gap-2 shadow-sm active:scale-95"
                    >
                      <User className="w-4 h-4" />
                      Edit Profile
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        disabled={loading}
                        className="bg-white text-text-muted border border-stone-200 py-3 px-8 rounded-xl hover:bg-stone-50 transition-all font-bold text-sm active:scale-95"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className="bg-primary text-white py-3 px-8 rounded-xl hover:bg-primary-dark shadow-sm transition-all font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-95"
                      >
                        {loading ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                            Updating...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4" />
                            Save Changes
                          </>
                        )}
                      </button>
                    </>
                  )}
                </div>
              </form>
            </div>
          </div>

          {/* Recent Orders Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-[2rem] border border-stone-100 p-6 sticky top-24 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-text-main flex items-center gap-2">
                  <Package className="w-5 h-5 text-primary" />
                  Recent Orders
                </h2>
                {stats.totalOrders > 0 && (
                  <Link
                    to="/orders"
                    className="text-xs font-bold text-primary bg-primary/5 px-3 py-1.5 rounded-full hover:bg-primary hover:text-white transition-all"
                  >
                    View All
                  </Link>
                )}
              </div>

              {recentOrders.length > 0 ? (
                <div className="space-y-4">
                  {recentOrders.map((order) => (
                    <Link
                      key={order._id}
                      to={`/orders/${order._id}`}
                      className="block p-4 bg-stone-50 rounded-xl hover:bg-white hover:shadow-md transition-all border border-stone-100 group"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <span className="text-xs font-medium text-text-muted font-mono bg-white px-2 py-1 rounded border border-stone-100">
                          #{order._id.slice(-6).toUpperCase()}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wide border ${order.orderStatus === "delivered"
                            ? "bg-green-50 text-green-600 border-green-100"
                            : order.orderStatus === "shipped"
                              ? "bg-blue-50 text-blue-600 border-blue-100"
                              : order.orderStatus === "cancelled"
                                ? "bg-red-50 text-red-600 border-red-100"
                                : "bg-primary/5 text-primary border-primary/10"
                            }`}
                        >
                          {order.orderStatus}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-text-muted font-medium">
                          {order.orderItems?.length || 0} items
                        </p>
                        <p className="text-base font-bold text-text-main">
                          ${order.totalPrice?.toFixed(2)}
                        </p>
                      </div>
                      <div className="mt-3 pt-3 border-t border-stone-200/50 flex items-center gap-2 text-text-muted opacity-80">
                        <div className="w-1.5 h-1.5 bg-primary/30 rounded-full"></div>
                        <span className="text-[10px] font-medium">{new Date(order.createdAt).toLocaleDateString()}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-stone-50 rounded-2xl border-2 border-dashed border-stone-100">
                  <Package className="w-10 h-10 mx-auto mb-3 text-stone-300" />
                  <p className="text-xs font-medium text-stone-400 mb-4">No orders found</p>
                  <Link
                    to="/"
                    className="inline-flex items-center gap-2 text-xs text-white bg-primary px-6 py-3 rounded-xl hover:bg-primary-dark transition-all font-bold shadow-sm active:scale-95"
                  >
                    Start Shopping
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
