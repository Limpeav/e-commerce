import { useEffect, useState } from "react";
import axios from "axios";
import { Package, Truck, MapPin, CheckCircle, AlertCircle } from "lucide-react";
import { API_BASE_URL, getUserToken, withAuthHeaders } from "../../services/http";
import { joinOrderRoom, subscribeRealtimeEvent } from "../../services/realtime";

const statusIcon = {
  placed: <Package className="w-5 h-5 text-blue-600" />,
  payment: <CheckCircle className="w-5 h-5 text-green-600" />,
  shipped: <Truck className="w-5 h-5 text-orange-600" />,
  delivered: <CheckCircle className="w-5 h-5 text-emerald-600" />,
  cancelled: <AlertCircle className="w-5 h-5 text-red-600" />,
};

const formatDate = (value) =>
  new Date(value).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

const formatTime = (value) =>
  new Date(value).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });

const buildTimeline = (order) => {
  const history = [
    {
      date: order.createdAt,
      status: "Order Placed",
      location: order.shippingAddress?.city || "Warehouse",
      icon: statusIcon.placed,
    },
  ];

  if (order.isPaid || order.paymentStatus === "Paid") {
    history.push({
      date: order.paidAt || order.updatedAt,
      status: "Payment Confirmed",
      location: "Payment Gateway",
      icon: statusIcon.payment,
    });
  }

  if (order.orderStatus === "Processing") {
    history.push({
      date: order.updatedAt,
      status: "Processing",
      location: "Warehouse",
      icon: statusIcon.placed,
    });
  }

  if (order.orderStatus === "Shipped" || order.orderStatus === "Delivered") {
    history.push({
      date: order.updatedAt,
      status: "Shipped",
      location: order.shippingAddress?.city || "Distribution Center",
      icon: statusIcon.shipped,
    });
  }

  if (order.orderStatus === "Delivered") {
    history.push({
      date: order.deliveredAt || order.updatedAt,
      status: "Delivered",
      location: order.shippingAddress?.city || "Destination",
      icon: statusIcon.delivered,
    });
  }

  if (order.orderStatus === "Cancelled") {
    history.push({
      date: order.updatedAt,
      status: "Cancelled",
      location: "Order Management",
      icon: statusIcon.cancelled,
    });
  }

  return history.sort((a, b) => new Date(a.date) - new Date(b.date));
};

export default function OrderTracking() {
  const [orderNumber, setOrderNumber] = useState("");
  const [trackingData, setTrackingData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!trackingData?.id) {
      return undefined;
    }

    const leaveOrderRoom = joinOrderRoom(trackingData.id);
    const unsubscribeOrderUpdate = subscribeRealtimeEvent("order:updated", (payload) => {
      if (!payload?.orderId || payload.orderId !== trackingData.id) {
        return;
      }

      setTrackingData((prevData) => {
        if (!prevData) {
          return prevData;
        }

        const nextStatus = payload.orderStatus || prevData.status;
        const newEvent = {
          date: payload.updatedAt || new Date().toISOString(),
          status: nextStatus,
          location: "Live status update",
          icon:
            nextStatus === "Delivered"
              ? statusIcon.delivered
              : nextStatus === "Cancelled"
                ? statusIcon.cancelled
                : nextStatus === "Shipped"
                  ? statusIcon.shipped
                  : statusIcon.placed,
        };

        const history = [...prevData.trackingHistory, newEvent];

        return {
          ...prevData,
          status: nextStatus,
          estimatedDelivery: payload.updatedAt || prevData.estimatedDelivery,
          trackingHistory: history,
        };
      });
    });

    return () => {
      unsubscribeOrderUpdate();
      leaveOrderRoom();
    };
  }, [trackingData?.id]);

  const handleTrackOrder = async () => {
    const query = orderNumber.trim().toLowerCase();
    if (!query) {
      setError("Enter an order ID or the last 8 characters.");
      return;
    }

    const token = getUserToken();
    if (!token) {
      setError("Please sign in to track your orders.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await axios.get(`${API_BASE_URL}/orders/myorders`, {
        headers: withAuthHeaders(token),
      });

      const orders = Array.isArray(response.data) ? response.data : [];
      const matchedOrder = orders.find((order) => {
        const id = order._id?.toLowerCase() || "";
        const shortId = id.slice(-8);
        return id === query || shortId === query;
      });

      if (!matchedOrder) {
        setTrackingData(null);
        setError("Order not found in your account.");
        return;
      }

      setTrackingData({
        id: matchedOrder._id,
        orderNumber: matchedOrder._id.slice(-8),
        status: matchedOrder.orderStatus,
        estimatedDelivery:
          matchedOrder.orderStatus === "Delivered"
            ? matchedOrder.deliveredAt || matchedOrder.updatedAt
            : matchedOrder.updatedAt,
        trackingHistory: buildTimeline(matchedOrder),
      });
    } catch (trackError) {
      setTrackingData(null);
      setError(trackError.response?.data?.message || "Failed to track order");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-base py-12 pt-32 px-6 font-sans">
      <div className="max-w-4xl mx-auto">
        <div className="mb-12">
          <h1 className="text-5xl font-black text-text-main mb-4 font-display tracking-tight leading-none">
            Orbital Tracking
          </h1>
          <p className="text-text-muted font-bold text-sm uppercase tracking-[0.2em] opacity-40">
            Real-time Logistics Sync
          </p>
        </div>

        <div className="bg-white rounded-[3rem] shadow-2xl shadow-primary/5 p-10 mb-12 border border-stone-100">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1 relative group">
              <Package className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-300 group-focus-within:text-primary transition-colors" />
              <input
                type="text"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                placeholder="Enter full order ID or last 8 characters"
                className="w-full pl-14 pr-6 py-4.5 bg-stone-50 border-2 border-stone-100 rounded-[2rem] focus:outline-none focus:border-primary transition-all text-text-main font-bold placeholder-stone-300"
              />
            </div>
            <button
              onClick={handleTrackOrder}
              disabled={loading}
              className="bg-text-main text-white px-10 py-4.5 rounded-[2rem] hover:bg-primary-hover hover:text-text-main transition-all shadow-2xl shadow-primary/10 font-black uppercase tracking-[0.2em] text-[10px] active:scale-95 flex items-center justify-center gap-3 disabled:opacity-60"
            >
              {loading ? "Tracking..." : "Track Order"}
            </button>
          </div>
          {error && (
            <p className="mt-4 text-red-500 font-bold text-xs uppercase tracking-wider">
              {error}
            </p>
          )}
        </div>

        {trackingData && (
          <div className="space-y-10 animate-slideUp">
            <div className="bg-white rounded-[3.5rem] shadow-2xl shadow-primary/5 p-10 border border-stone-100 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <Truck className="w-32 h-32 text-text-main" />
              </div>
              <h2 className="text-[10px] font-black text-text-main mb-10 flex items-center gap-3 uppercase tracking-[0.3em] relative z-10">
                <div className="w-2 h-2 bg-secondary rounded-full animate-pulse"></div>
                Telemetry Overview
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-10 relative z-10">
                <div>
                  <p className="text-[10px] font-black text-primary/40 mb-3 uppercase tracking-[0.3em]">
                    Registry Index
                  </p>
                  <p className="font-mono text-sm font-black text-text-main bg-stone-50 px-3 py-1.5 rounded-xl border border-stone-100 inline-block">
                    #{trackingData.orderNumber.toUpperCase()}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-primary/40 mb-3 uppercase tracking-[0.3em]">
                    Current Protocol
                  </p>
                  <p className="font-black text-secondary text-sm uppercase tracking-widest bg-secondary/5 px-4 py-2 rounded-full border border-secondary/10 inline-block">
                    {trackingData.status}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-primary/40 mb-3 uppercase tracking-[0.3em]">
                    Last Update
                  </p>
                  <p className="font-black text-text-main text-sm">
                    {formatDate(trackingData.estimatedDelivery).toUpperCase()}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-[3.5rem] shadow-2xl shadow-primary/5 p-10 border border-stone-100">
              <h2 className="text-[10px] font-black text-text-main mb-10 flex items-center gap-3 uppercase tracking-[0.3em]">
                <MapPin className="w-4 h-4 text-primary" />
                Transit Logs
              </h2>
              <div className="space-y-8 relative">
                <div className="absolute left-[26px] top-2 bottom-2 w-0.5 bg-stone-100"></div>

                {trackingData.trackingHistory.map((event, index) => (
                  <div key={index} className="flex items-start gap-8 relative group">
                    <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-lg border border-stone-100 group-hover:scale-110 transition-transform relative z-10 ring-8 ring-white">
                      {event.icon}
                    </div>
                    <div className="flex-1 pt-2">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-3">
                        <p className="font-black text-text-main uppercase tracking-widest text-sm">
                          {event.status}
                        </p>
                        <span className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em]">
                          {formatDate(event.date).toUpperCase()} // {formatTime(event.date)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] font-black text-primary/60 uppercase tracking-widest">
                        <MapPin className="w-3 h-3" />
                        <span>{event.location}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
