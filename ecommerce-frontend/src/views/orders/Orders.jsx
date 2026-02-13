import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
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
  AlertCircle
} from "lucide-react";
import axios from "axios";
import ProfileSidebar from "../../components/user/ProfileSidebar";

const API_URL = "http://localhost:4000/api";

const Orders = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
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

  const getStatusColor = (status) => {
    const colors = {
      Pending: "bg-stone-50 text-stone-500 border-stone-100",
      Processing: "bg-primary/5 text-primary border-primary/10",
      Shipped: "bg-blue-50 text-blue-600 border-blue-100",
      Delivered: "bg-green-50 text-green-600 border-green-100",
      Cancelled: "bg-red-50 text-red-600 border-red-100",
    };
    return colors[status] || "bg-stone-50 text-stone-500 border-stone-100";
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

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount || 0);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-base font-sans">
        <div className="text-center bg-white p-12 rounded-[3rem] shadow-2xl border border-stone-100">
          <AlertCircle className="w-16 h-16 text-red-200 mx-auto mb-6" />
          <h2 className="text-3xl font-black text-text-main mb-3 font-display tracking-tight uppercase tracking-widest text-xs">
            Identity Needed
          </h2>
          <p className="text-text-muted font-bold text-sm mb-8">Please enter your credentials to view history.</p>
          <button onClick={() => navigate("/login")} className="bg-text-main text-white px-8 py-4 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] shadow-xl hover:bg-primary transition-all">
            Enter Vault
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-base font-sans">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary/10 border-t-primary mx-auto mb-6"></div>
          <p className="text-primary font-black uppercase tracking-[0.2em] text-[10px] animate-pulse">Syncing History...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-base py-12 pt-32 px-4 md:px-8 font-sans">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <ProfileSidebar />
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Header */}
            <div className="bg-white rounded-[2rem] border border-stone-100 p-8 mb-8 flex flex-col md:flex-row items-center justify-between gap-8 shadow-sm">
              <div className="text-center md:text-left">
                <div className="flex items-center gap-2 mb-2 justify-center md:justify-start">
                  <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <ShoppingBag className="w-4 h-4" />
                  </div>
                  <span className="text-primary font-bold text-xs uppercase tracking-wide">My Orders</span>
                </div>
                <h1 className="text-3xl font-bold text-text-main tracking-tight">
                  Order History
                </h1>
                <p className="text-text-muted mt-1 font-medium text-sm">
                  View details of your past orders
                </p>
              </div>
              <div className="flex items-center gap-3 bg-stone-50 text-text-main px-6 py-3 rounded-xl border border-stone-100 font-bold shadow-sm">
                <Package className="w-4 h-4 text-primary" />
                <span className="text-sm">{orders.length} {orders.length === 1 ? 'Order' : 'Orders'} Placed</span>
              </div>
            </div>

            {/* Orders List */}
            {orders.length === 0 ? (
              <div className="bg-white rounded-[3rem] border border-stone-100 p-16 text-center shadow-md">
                <div className="w-20 h-20 bg-stone-50 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-stone-100">
                  <Package className="w-8 h-8 text-stone-300" />
                </div>
                <h2 className="text-2xl font-bold text-text-main mb-3">
                  No Orders Found
                </h2>
                <p className="text-text-muted mb-8 max-w-md mx-auto font-medium text-sm leading-relaxed">
                  You haven't placed any orders yet. Start shopping to find the best essentials for your baby.
                </p>
                <button
                  onClick={() => navigate("/")}
                  className="px-8 py-4 bg-primary text-white rounded-xl hover:bg-primary-dark transition-all font-bold text-sm shadow-md active:scale-95"
                >
                  Start Shopping
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {orders.map((order) => (
                  <div
                    key={order._id}
                    className="bg-white rounded-[2rem] border border-stone-100 overflow-hidden hover:shadow-lg transition-all duration-300 group"
                  >
                    {/* Order Header */}
                    <div className="bg-stone-50/50 p-6 border-b border-stone-100">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                        <div className="space-y-3">
                          <div className="flex flex-wrap items-center gap-3">
                            <h3 className="text-sm font-bold text-text-main font-mono bg-white px-3 py-1.5 rounded-lg border border-stone-100 shadow-sm">
                              #{order._id.slice(-8).toUpperCase()}
                            </h3>
                            <span
                              className={`px-3 py-1.5 rounded-full text-xs font-bold border flex items-center gap-1.5 shadow-sm ${getStatusColor(
                                order.orderStatus
                              )}`}
                            >
                              {getStatusIcon(order.orderStatus)}
                              {order.orderStatus}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-stone-500">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-primary" />
                              {new Date(order.createdAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                            </div>
                            {order.paymentStatus && (
                              <div className="flex items-center gap-2">
                                <div className={`w-1.5 h-1.5 rounded-full ${order.paymentStatus === 'Paid' ? 'bg-green-500' : 'bg-secondary'}`}></div>
                                Status: <span className={order.paymentStatus === 'Paid' ? 'text-green-600 font-bold' : 'text-secondary font-bold'}>{order.paymentStatus}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-xs font-bold text-stone-400 uppercase tracking-wide mb-1 mr-1">Total</span>
                          <div className="flex items-center gap-2 bg-text-main text-white px-6 py-3 rounded-xl shadow-lg shadow-primary/10">
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
                            className="flex items-center gap-4 p-3 bg-stone-50/50 rounded-xl border border-stone-100/50 group/item hover:bg-white hover:shadow-md transition-all duration-300"
                          >
                            <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center flex-shrink-0 p-2 border border-stone-100 overflow-hidden">
                              {item.image ? (
                                <img
                                  src={item.image}
                                  alt={item.name}
                                  className="w-full h-full object-contain transform group-hover/item:scale-105 transition-transform duration-500"
                                />
                              ) : (
                                <Package className="w-5 h-5 text-stone-200" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h5 className="font-bold text-text-main truncate text-sm">
                                {item.name}
                              </h5>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs font-medium text-stone-500 bg-white px-2 py-0.5 rounded border border-stone-100">
                                  Qty: {item.quantity}
                                </span>
                                <span className="text-xs font-bold text-primary">
                                  {formatCurrency(item.price)}
                                </span>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-text-main text-sm">
                                {formatCurrency(item.price * item.quantity)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Order Footer */}
                    <div className="bg-stone-50/30 px-6 py-4 border-t border-stone-100/50">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="space-y-1">
                          {order.shippingAddress && (
                            <div className="text-xs font-medium text-stone-500 flex items-center gap-2">
                              <MapPin className="w-3.5 h-3.5 text-primary" />
                              <span className="text-text-main font-bold">Shipping to:</span>{" "}
                              {order.shippingAddress.address}, {order.shippingAddress.city}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => navigate(`/orders/${order._id}`)}
                          className="flex items-center justify-center gap-2 px-6 py-3 bg-white border border-stone-200 text-text-main rounded-xl hover:border-primary hover:text-primary transition-all font-bold text-xs shadow-sm active:scale-95"
                        >
                          <Eye className="w-4 h-4" />
                          View Details
                        </button>
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
