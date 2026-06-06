import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import {
  Package,
  Eye,
  Calendar,
  ShoppingBag,
  MapPin,
  CheckCircle,
  XCircle,
  Truck,
  Clock,
  AlertCircle,
  ArrowLeft
} from "lucide-react";
import axios from "axios";
import { config } from "../../config/index.js";
import { useDarkMode } from "../../hooks";
import { useLanguage } from "../../context/useLanguage";
import Loading from "../../components/common/Loading";
import { cancelOrder } from "../../services/orderService";

const API_URL = config.API_BASE_URL;

const Orders = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [isDark] = useDarkMode();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingOrderId, setCancellingOrderId] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (user) {
      fetchOrders();
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

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError("");
      const token = getAuthToken();
      if (!token) {
        throw new Error("Not authenticated");
      }

      const response = await axios.get(`${API_URL}/orders/myorders`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setOrders(response.data);
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || "Failed to fetch orders"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (cancellingOrderId) return;

    if (!window.confirm(t("orderDetail.cancelConfirm"))) {
      return;
    }

    try {
      setCancellingOrderId(orderId);
      setError("");
      await cancelOrder(orderId);
      await fetchOrders();
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || t("orderDetail.cancelFailed")
      );
    } finally {
      setCancellingOrderId("");
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      Pending: isDark
        ? "bg-slate-800/90 text-slate-300 border-slate-700"
        : "bg-amber-50 text-amber-700 border-amber-200",
      Processing: isDark
        ? "bg-indigo-500/12 text-indigo-200 border-indigo-500/20"
        : "bg-blue-50 text-blue-700 border-blue-200",
      Delivered: isDark
        ? "bg-emerald-500/12 text-emerald-200 border-emerald-500/20"
        : "bg-emerald-50 text-emerald-700 border-emerald-200",
      Cancelled: "bg-[#342331] text-[#ffc7cf] border-[#7b2942]",
    };
    return colors[status] || (isDark
      ? "bg-slate-800/90 text-slate-300 border-slate-700"
      : "bg-stone-100 text-stone-700 border-stone-200");
  };

  const getPaymentStatusClass = (status) => {
    if (status === "Paid") {
      return isDark ? "text-emerald-300 font-bold" : "text-emerald-700 font-bold";
    }

    if (status === "Pending") {
      return isDark ? "text-amber-300 font-bold" : "text-amber-700 font-bold";
    }

    return isDark ? "text-slate-300 font-bold" : "text-stone-700 font-bold";
  };

  const getPaymentStatusDotClass = (status) => {
    if (status === "Paid") return "bg-emerald-500";
    if (status === "Pending") return "bg-amber-500";
    return isDark ? "bg-slate-400" : "bg-stone-400";
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "Delivered":
        return <CheckCircle className="w-3.5 h-3.5" />;
      case "Cancelled":
        return <XCircle className="w-3.5 h-3.5" />;
      case "Pending":
        return <Clock className="w-3.5 h-3.5" />;
      default:
        return <Truck className="w-3.5 h-3.5" />;
    }
  };

  const getStatusLabel = (status) => {
    const displayStatus = status === "Shipped" ? "Processing" : status || "Pending";
    return t(`orderDetail.status.${displayStatus.toLowerCase()}`, {
      defaultValue: displayStatus,
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount || 0);
  };

  const pageClassName = isDark ? "bg-transparent text-slate-100" : "bg-bg-base";
  const cardClassName = isDark
    ? "bg-slate-900/90 border-slate-800 text-slate-100 shadow-2xl shadow-slate-950/20"
    : "bg-white border-stone-100 text-text-main shadow-sm";
  const softPanelClassName = isDark
    ? "bg-slate-800/70 border-slate-700"
    : "bg-stone-50 border-stone-100";
  const mutedClassName = isDark ? "text-slate-400" : "text-text-muted";
  const subtleTextClassName = isDark ? "text-slate-500" : "text-stone-500";
  const invertedSurfaceClassName = isDark
    ? "bg-slate-950 text-slate-50"
    : "bg-text-main text-white";

  if (!user) {
    return (
      <div className={`min-h-screen flex items-center justify-center font-sans transition-colors ${pageClassName}`}>
        <div className={`text-center p-12 rounded-[3rem] shadow-2xl border ${cardClassName}`}>
          <AlertCircle className={`w-16 h-16 mx-auto mb-6 ${isDark ? "text-rose-300" : "text-red-200"}`} />
          <h2 className="text-3xl font-black mb-3 font-display tracking-tight uppercase tracking-widest text-xs">
            Identity Needed
          </h2>
          <p className={`${mutedClassName} font-bold text-sm mb-8`}>Please enter your credentials to view history.</p>
          <button onClick={() => navigate("/login")} className={`px-8 py-4 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] shadow-xl transition-all ${isDark ? "bg-indigo-600 text-white hover:bg-indigo-500" : "bg-text-main text-white hover:bg-primary"}`}>
            Enter Vault
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return <Loading message="Syncing history..." />;
  }

  return (
    <div className={`min-h-screen py-12 pt-20 px-4 md:px-8 font-sans transition-colors ${pageClassName}`}>
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col gap-8">
          {/* Main Content */}
          <div className="w-full">
            {/* Sticky Header */}
            <div className="sticky top-0 z-30 mb-8 -mx-4 px-4 pt-16 md:-mx-8 md:px-8">
              <div className={`absolute inset-0 backdrop-blur-xl ${isDark ? "bg-bg-base/70" : "bg-bg-base/70"}`} />
              <div className={`relative rounded-[2rem] border p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 ${isDark ? "bg-slate-900/90 border-slate-800 text-slate-100" : "bg-white border-stone-100 text-text-main shadow-sm"}`}>
                <div className="flex items-center gap-4 w-full md:w-auto">
                  <button
                    onClick={() => navigate(-1)}
                    className={`flex h-10 w-10 items-center justify-center rounded-xl border transition-all hover:border-primary hover:text-primary active:scale-90 ${isDark ? "border-slate-700 text-slate-400" : "border-stone-200 text-stone-500"}`}
                    style={{ borderColor: "var(--color-border)" }}
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                        <ShoppingBag className="w-4 h-4" />
                      </div>
                      <span className="text-primary font-bold text-xs uppercase tracking-wide">My Orders</span>
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight">
                      Order History
                    </h1>
                    <p className={`${mutedClassName} mt-1 font-medium text-sm`}>
                      View details of your past orders
                    </p>
                  </div>
                </div>
                <div className={`flex items-center gap-3 px-6 py-3 rounded-xl border font-bold ${softPanelClassName}`}>
                  <Package className="w-4 h-4 text-primary" />
                  <span className="text-sm">{orders.length} {orders.length === 1 ? 'Order' : 'Orders'} Placed</span>
                </div>
              </div>
            </div>

            {error && (
              <div className={`mb-6 rounded-2xl border p-4 text-sm font-semibold ${isDark ? "border-rose-500/20 bg-rose-500/10 text-rose-200" : "border-rose-100 bg-rose-50 text-rose-700"}`}>
                {error}
              </div>
            )}

            {/* Orders List */}
            {orders.length === 0 ? (
              <div className={`rounded-[3rem] border p-16 text-center ${cardClassName}`}>
                <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 border ${softPanelClassName}`}>
                  <Package className={`w-8 h-8 ${isDark ? "text-slate-500" : "text-stone-300"}`} />
                </div>
                <h2 className="text-2xl font-bold mb-3">
                  No Orders Found
                </h2>
                <p className={`${mutedClassName} mb-8 max-w-md mx-auto font-medium text-sm leading-relaxed`}>
                  You haven't placed any orders yet. Start shopping to find the best essentials for your baby.
                </p>
                <button
                  onClick={() => navigate("/customer")}
                  className={`px-8 py-4 rounded-xl transition-all font-bold text-sm shadow-md active:scale-95 ${isDark ? "bg-indigo-600 text-white hover:bg-indigo-500" : "bg-primary text-white hover:bg-primary-dark"}`}
                >
                  Start Shopping
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {orders.map((order) => (
                  <div
                    key={order._id}
                    className={`rounded-[2rem] border overflow-hidden hover:shadow-lg transition-all duration-300 group ${cardClassName}`}
                  >
                    {/* Order Header */}
                    <div className={`p-6 border-b ${isDark ? "bg-slate-800/50 border-slate-800" : "bg-stone-50/50 border-stone-100"}`}>
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                        <div className="space-y-3">
                          <div className="flex flex-wrap items-center gap-3">
                            <h3 className={`text-sm font-bold font-mono px-3 py-1.5 rounded-lg border shadow-sm ${isDark ? "bg-slate-950/80 border-slate-700 text-slate-100" : "bg-white border-stone-100 text-text-main"}`}>
                              #{order._id.slice(-8).toUpperCase()}
                            </h3>
                            <span
                              className={`px-3 py-1.5 rounded-full text-xs font-bold border flex items-center gap-1.5 shadow-sm ${getStatusColor(
                                order.orderStatus
                              )}`}
                            >
                              {getStatusIcon(order.orderStatus === "Shipped" ? "Processing" : order.orderStatus)}
                              {getStatusLabel(order.orderStatus)}
                            </span>
                          </div>
                          <div className={`flex flex-wrap items-center gap-4 text-xs font-medium ${subtleTextClassName}`}>
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-primary" />
                              {new Date(order.createdAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                            </div>
                            {order.paymentStatus && (
                              <div className="flex items-center gap-2">
                                <div className={`w-1.5 h-1.5 rounded-full ${getPaymentStatusDotClass(order.paymentStatus)}`}></div>
                                Payment: <span className={getPaymentStatusClass(order.paymentStatus)}>{order.paymentStatus}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className={`text-xs font-bold uppercase tracking-wide mb-1 mr-1 ${isDark ? "text-slate-500" : "text-stone-400"}`}>Total</span>
                          <div className={`flex items-center gap-2 px-6 py-3 rounded-xl shadow-lg ${invertedSurfaceClassName} ${isDark ? "shadow-slate-950/30" : "shadow-primary/10"}`}>
                            <span className="text-xl font-bold tracking-tight">
                              {formatCurrency(order.totalPrice)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Order Items */}
                    <div className="p-6">
                      <h4 className="text-xs font-bold text-primary uppercase tracking-wide mb-4 ml-1">
                        Items ({order.orderItems?.length || 0})
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {order.orderItems?.map((item, index) => (
                          <div
                            key={index}
                            className={`flex items-center gap-4 p-3 rounded-xl border group/item transition-all duration-300 ${
                              isDark
                                ? "bg-slate-800/50 border-slate-700 hover:bg-slate-800 hover:shadow-slate-950/20"
                                : "bg-stone-50/50 border-stone-100/50 hover:bg-white hover:shadow-md"
                            }`}
                          >
                            <div className={`w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0 p-2 border overflow-hidden ${isDark ? "bg-slate-900 border-slate-700" : "bg-white border-stone-100"}`}>
                              {item.image ? (
                                <img
                                  src={item.image}
                                  alt={item.name}
                                  className="w-full h-full object-contain transform group-hover/item:scale-105 transition-transform duration-500"
                                />
                              ) : (
                                <Package className={`w-5 h-5 ${isDark ? "text-slate-500" : "text-stone-200"}`} />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h5 className="font-bold truncate text-sm">
                                {item.name}
                              </h5>
                              <div className="flex items-center gap-2 mt-1">
                                <span className={`text-xs font-medium px-2 py-0.5 rounded border ${isDark ? "text-slate-300 bg-slate-900 border-slate-700" : "text-stone-500 bg-white border-stone-100"}`}>
                                  Qty: {item.quantity}
                                </span>
                                {item.size && (
                                  <span className={`text-xs font-medium px-2 py-0.5 rounded border ${isDark ? "text-slate-300 bg-slate-900 border-slate-700" : "text-stone-500 bg-white border-stone-100"}`}>
                                    Size: {item.size}
                                  </span>
                                )}
                                <span className="text-xs font-bold text-primary">
                                  {formatCurrency(item.price)}
                                </span>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-sm">
                                {formatCurrency(item.price * item.quantity)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Order Footer */}
                    <div className={`px-6 py-4 border-t ${isDark ? "bg-slate-900/80 border-slate-800" : "bg-stone-50/30 border-stone-100/50"}`}>
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="space-y-1">
                          {order.shippingAddress && (
                            <div className={`text-xs font-medium flex items-center gap-2 ${subtleTextClassName}`}>
                              <MapPin className="w-3.5 h-3.5 text-primary" />
                              <span className={isDark ? "text-slate-100 font-bold" : "text-text-main font-bold"}>Shipping to:</span>{" "}
                              {order.shippingAddress.address}, {order.shippingAddress.city}
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col gap-2 sm:flex-row">
                          {String(order.orderStatus || "").trim() === "Pending" && (
                            <button
                              type="button"
                              onClick={() => handleCancelOrder(order._id)}
                              disabled={cancellingOrderId === order._id}
                              className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl transition-all font-bold text-xs shadow-sm active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 ${
                                isDark
                                  ? "bg-rose-500/10 border border-rose-500/20 text-rose-200 hover:bg-rose-500/15"
                                  : "bg-rose-50 border border-rose-100 text-rose-700 hover:bg-rose-100"
                              }`}
                            >
                              <XCircle className="w-4 h-4" />
                              {cancellingOrderId === order._id
                                ? t("orderDetail.cancelling")
                                : t("orderDetail.cancelOrder")}
                            </button>
                          )}
                          <button
                            onClick={() => navigate(`/customer/orders/${order._id}`)}
                            className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl transition-all font-bold text-xs shadow-sm active:scale-95 ${
                              isDark
                                ? "bg-slate-950 border border-slate-700 text-slate-100 hover:border-indigo-400 hover:text-indigo-300"
                                : "bg-white border border-stone-200 text-text-main hover:border-primary hover:text-primary"
                            }`}
                          >
                            <Eye className="w-4 h-4" />
                            View Details
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Orders;
