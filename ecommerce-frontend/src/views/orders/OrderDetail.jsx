import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  ArrowLeft,
  Package,
  Calendar,
  DollarSign,
  CheckCircle,
  MapPin,
  CreditCard,
  Phone,
  AlertCircle,
  ShoppingBag,
  Ban,
  Truck
} from "lucide-react";
import axios from "axios";
import { API_BASE_URL, getUserToken, withAuthHeaders } from "../../services/http";
import { joinOrderRoom, subscribeRealtimeEvent } from "../../services/realtime";

const API_URL = API_BASE_URL;

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id || !user) {
      return undefined;
    }

    const leaveOrderRoom = joinOrderRoom(id);
    const unsubscribeOrderUpdate = subscribeRealtimeEvent("order:updated", (payload) => {
      if (!payload?.orderId || payload.orderId !== id) {
        return;
      }

      setOrder((prevOrder) =>
        prevOrder
          ? {
              ...prevOrder,
              orderStatus: payload.orderStatus ?? prevOrder.orderStatus,
              paymentStatus: payload.paymentStatus ?? prevOrder.paymentStatus,
              isPaid: payload.isPaid ?? prevOrder.isPaid,
              isDelivered: payload.isDelivered ?? prevOrder.isDelivered,
              updatedAt: payload.updatedAt || prevOrder.updatedAt,
            }
          : prevOrder
      );
    });

    return () => {
      unsubscribeOrderUpdate();
      leaveOrderRoom();
    };
  }, [id, user]);

  const getAuthToken = () => {
    return getUserToken();
  };

  const fetchOrderDetails = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const token = getUserToken();
      if (!token) {
        throw new Error("Not authenticated");
      }

      const response = await axios.get(`${API_URL}/orders/${id}`, {
        headers: withAuthHeaders(token),
      });

      setOrder(response.data);
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || "Failed to fetch order details"
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id && user) {
      fetchOrderDetails();
    }
  }, [id, user, fetchOrderDetails]);

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

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount || 0);
  };

  const canCancelOrder =
    order && (order.orderStatus === "Pending" || order.orderStatus === "Processing");

  const handleCancelOrder = async () => {
    const token = getAuthToken();
    if (!token) {
      setError("Not authenticated");
      return;
    }

    const confirmed = window.confirm("Cancel this order? You can only cancel before shipping.");
    if (!confirmed) {
      return;
    }

    try {
      setError("");
      const response = await axios.put(
        `${API_URL}/orders/${id}/cancel`,
        {},
        {
          headers: withAuthHeaders(token),
        }
      );
      setOrder(response.data);
    } catch (cancelError) {
      setError(cancelError.response?.data?.message || "Failed to cancel order");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-base font-sans">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary/20 border-t-primary mx-auto mb-4"></div>
          <p className="text-primary font-bold text-xs uppercase tracking-wide">Loading Order...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-base font-sans">
        <div className="text-center bg-white p-12 rounded-[2rem] shadow-lg border border-stone-100">
          <AlertCircle className="w-12 h-12 text-red-200 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-text-main mb-4">
            {error || "Order Not Found"}
          </h2>
          <button
            onClick={() => navigate("/orders")}
            className="mt-4 px-8 py-3 bg-primary text-text-main rounded-xl hover:bg-primary-hover transition-all font-bold text-sm shadow-md"
          >
            Back to Orders
          </button>
        </div>
      </div>
    );
  }

  // Simplified, easy-to-maintain layout to avoid JSX nesting issues
  return (
    <div className="min-h-screen bg-bg-base py-12 pt-32 px-6 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="bg-white rounded-3xl border border-stone-100 p-8 shadow-sm flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <button
              onClick={() => navigate("/orders")}
              className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-primary mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to orders</span>
            </button>
            <h1 className="text-3xl font-bold text-text-main">
              Order #{order._id.slice(-8).toUpperCase()}
            </h1>
            <p className="text-sm text-text-muted mt-2 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {new Date(order.createdAt).toLocaleDateString(undefined, {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </div>
          <div
            className={`px-4 py-2 rounded-full text-xs font-semibold border ${getStatusColor(
              order.orderStatus
            )}`}
          >
            {order.orderStatus}
          </div>
        </div>

        {canCancelOrder && (
          <div className="bg-red-50 border border-red-100 rounded-2xl px-5 py-4 flex items-center justify-between gap-4">
            <p className="text-sm font-semibold text-red-700">
              You can cancel this order before it is shipped.
            </p>
            <button
              onClick={handleCancelOrder}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition-all"
            >
              <Ban className="w-4 h-4" />
              Cancel Order
            </button>
          </div>
        )}

        {/* Items */}
        <div className="bg-white rounded-3xl border border-stone-100 p-8 space-y-4">
          <h2 className="text-lg font-semibold text-text-main flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-primary" />
            Items
          </h2>
          {order.orderItems?.map((item, index) => (
            <div
              key={index}
              className="flex items-center gap-4 py-4 border-t border-stone-100 first:border-t-0"
            >
              <div className="w-16 h-16 bg-stone-50 rounded-xl flex items-center justify-center overflow-hidden">
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <Package className="w-6 h-6 text-stone-300" />
                )}
              </div>
              <div className="flex-1">
                <p className="font-medium text-text-main">{item.name}</p>
                <p className="text-sm text-text-muted">
                  Qty {item.quantity} · {formatCurrency(item.price)}
                </p>
              </div>
              <div className="font-semibold text-text-main">
                {formatCurrency(item.price * item.quantity)}
              </div>
            </div>
          ))}
        </div>

        {/* Shipping & Payment */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {order.shippingAddress && (
            <div className="bg-white rounded-3xl border border-stone-100 p-8 space-y-3">
              <h2 className="text-lg font-semibold text-text-main flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" />
                Shipping
              </h2>
              <p className="font-medium text-text-main">
                {order.shippingAddress.fullName}
              </p>
              <p className="text-sm text-text-muted">
                {order.shippingAddress.address}
              </p>
              <p className="text-sm text-text-muted">
                {order.shippingAddress.city}
                {order.shippingAddress.postalCode
                  ? `, ${order.shippingAddress.postalCode}`
                  : ""}
              </p>
              <p className="text-sm text-text-muted">
                {order.shippingAddress.country}
              </p>
              {order.shippingAddress.phone && (
                <p className="text-sm text-text-muted flex items-center gap-2 mt-2">
                  <Phone className="w-4 h-4" />
                  {order.shippingAddress.phone}
                </p>
              )}
              {order.shippingCarrier && (
                <p className="text-xs font-semibold inline-flex items-center gap-2 rounded-full bg-blue-soft/50 px-3 py-1 text-text-main border border-primary/10">
                  <Truck className="w-4 h-4 text-primary" />
                  {order.shippingCarrier}
                </p>
              )}
            </div>
          )}

          <div className="bg-white rounded-3xl border border-stone-100 p-8 space-y-4">
            <h2 className="text-lg font-semibold text-text-main flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-primary" />
              Payment
            </h2>
            <div className="space-y-1 text-sm text-text-muted">
              <p>
                Method:{" "}
                <span className="font-semibold text-text-main">
                  {order.paymentMethod
                    ? order.paymentMethod.toUpperCase()
                    : "UNDEFINED"}
                </span>
              </p>
              <p>
                Status:{" "}
                <span className="font-semibold text-text-main">
                  {order.paymentStatus
                    ? order.paymentStatus.toUpperCase()
                    : "PENDING"}
                </span>
              </p>
              {order.isPaid && order.paidAt && (
                <p>
                  Paid on{" "}
                  <span className="font-semibold text-text-main">
                    {new Date(order.paidAt).toLocaleDateString()}
                  </span>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="bg-white rounded-3xl border border-stone-100 p-8 space-y-3">
          <h2 className="text-lg font-semibold text-text-main flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-primary" />
            Summary
          </h2>
          <div className="space-y-2 text-sm text-text-muted">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-semibold text-text-main">
                {formatCurrency(
                  order.totalPrice -
                  (order.taxPrice || 0) -
                  (order.shippingPrice || 0)
                )}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Shipping</span>
              <span className="font-semibold text-text-main">
                {order.shippingPrice > 0
                  ? formatCurrency(order.shippingPrice)
                  : "Free"}
              </span>
            </div>
            {order.shippingCarrier && (
              <div className="flex justify-between">
                <span>Carrier</span>
                <span className="font-semibold text-text-main">{order.shippingCarrier}</span>
              </div>
            )}
            {order.taxPrice > 0 && (
              <div className="flex justify-between">
                <span>Tax</span>
                <span className="font-semibold text-text-main">
                  {formatCurrency(order.taxPrice)}
                </span>
              </div>
            )}
            <div className="h-px bg-stone-100 my-2" />
            <div className="flex justify-between text-base">
              <span className="font-semibold text-text-main">Total</span>
              <span className="font-bold text-text-main">
                {formatCurrency(order.totalPrice)}
              </span>
            </div>
          </div>
        </div>

        {/* Delivery badge */}
        {order.isDelivered && (
          <div className="bg-green-50 border border-green-100 rounded-3xl p-4 flex items-center gap-3 text-sm text-green-800">
            <CheckCircle className="w-5 h-5" />
            <div>
              <p className="font-semibold">Delivered</p>
              {order.deliveredAt && (
                <p>
                  {new Date(order.deliveredAt).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderDetail;
