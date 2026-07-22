import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import { useLanguage } from "../../context/useLanguage";
import {
  ArrowLeft,
  Package,
  Calendar,
  DollarSign,
  Truck,
  CheckCircle,
  XCircle,
  MapPin,
  CreditCard,
  User,
  Mail,
  Phone,
  AlertCircle,
  ShoppingBag,
  Star
} from "lucide-react";
import axios from "axios";
import { config } from "../../config/index.js";
import Loading from "../../components/common/Loading";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import { cancelOrder } from "../../services/orderService";
import { joinOrderRoom, subscribeRealtimeDomains } from "../../services/realtime";
import { useDarkMode } from "../../hooks";

const API_URL = config.API_BASE_URL;
const KHMER_MONTHS = [
  "មករា",
  "កុម្ភៈ",
  "មីនា",
  "មេសា",
  "ឧសភា",
  "មិថុនា",
  "កក្កដា",
  "សីហា",
  "កញ្ញា",
  "តុលា",
  "វិច្ឆិកា",
  "ធ្នូ",
];

const isKhmerLanguage = (language = "") =>
  ["kh", "km"].includes(String(language).toLowerCase());

const getLocalizedOrderItemName = (item, language) =>
  language === "kh" && (item.titleKm || item.product?.titleKm)
    ? item.titleKm || item.product.titleKm
    : item.name;

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const [isDark] = useDarkMode();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [error, setError] = useState("");

  const getAuthToken = () => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      return userData.token;
    }
    return null;
  };

  const fetchOrderDetails = useCallback(async ({ silent = false } = {}) => {
    try {
      if (!silent) setLoading(true);
      setError("");
      const token = getAuthToken();
      if (!token) {
        throw new Error(t("orderDetail.notAuthenticated"));
      }

      const response = await axios.get(`${API_URL}/orders/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setOrder(response.data);
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || t("orderDetail.fetchFailed")
      );
    } finally {
      if (!silent) setLoading(false);
    }
  }, [id, t]);

  useEffect(() => {
    if (!id || !user) return undefined;
    fetchOrderDetails();
    const leaveOrderRoom = joinOrderRoom(id);
    const unsubscribe = subscribeRealtimeDomains(
      ["orders"],
      (payload) => {
        if (!payload?.orderId || String(payload.orderId) === String(id)) {
          fetchOrderDetails({ silent: true });
        }
      }
    );

    return () => {
      unsubscribe();
      leaveOrderRoom();
    };
  }, [fetchOrderDetails, id, user]);

  const getStatusColor = (status) => {
    const colors = {
      Pending: "bg-stone-50 text-stone-500 border-stone-100",
      Processing: "bg-primary/5 text-primary border-primary/10",
      Delivered: "bg-green-50 text-green-600 border-green-100",
      Cancelled: "bg-[#342331] text-[#ffc7cf] border-[#7b2942]",
    };
    return colors[status] || "bg-stone-50 text-stone-500 border-stone-100";
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount || 0);
  };

  const formatDate = (value) => {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "";
    }

    if (isKhmerLanguage(language)) {
      return `${date.getDate()} ${KHMER_MONTHS[date.getMonth()]} ${date.getFullYear()}`;
    }

    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const normalizeTranslationKey = (value = "") =>
    String(value).trim().toLowerCase().replace(/[\s_-]+/g, "");

  const translateStatus = (status, fallback = "Pending") => {
    const displayStatus = status === "Shipped" ? "Processing" : status;
    return t(`orderDetail.status.${normalizeTranslationKey(displayStatus || fallback)}`, {
      defaultValue: displayStatus || fallback,
    });
  };

  const translatePaymentMethod = (method) =>
    t(`orderDetail.paymentMethods.${normalizeTranslationKey(method || "undefined")}`, {
      defaultValue: method || t("orderDetail.undefined"),
    });

  const getStatusIcon = (status) => {
    if (status === "Cancelled") {
      return <XCircle className="h-4 w-4" />;
    }

    return null;
  };

  const currentOrderStatus = String(order?.orderStatus || "").trim();
  const isPaidBakongOrder =
    order?.paymentMethod === "BAKONG_KHQR"
    && (order?.isPaid || order?.paymentStatus === "Paid");
  const canCancelOrder = currentOrderStatus === "Pending" && !isPaidBakongOrder;

  const handleCancelOrder = () => {
    if (!canCancelOrder || cancelling) return;
    setShowCancelDialog(true);
  };

  const confirmCancelOrder = async () => {
    if (!canCancelOrder || cancelling) return;
    try {
      setCancelling(true);
      setError("");
      const updatedOrder = await cancelOrder(order._id);
      setOrder(updatedOrder);
      await fetchOrderDetails();
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || t("orderDetail.cancelFailed")
      );
    } finally {
      setCancelling(false);
      setShowCancelDialog(false);
    }
  };

  if (loading) {
    return <Loading message={t("orderDetail.loading")} />;
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-base font-sans">
        <div className="text-center bg-white p-12 rounded-[2rem] shadow-lg border border-stone-100">
          <AlertCircle className="w-12 h-12 text-red-200 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-text-main mb-4">
            {error || t("orderDetail.notFound")}
          </h2>
          <button
            onClick={() => navigate("/customer/orders")}
            className="mt-4 px-8 py-3 bg-primary text-white rounded-xl hover:bg-primary-dark transition-all font-bold text-sm shadow-md"
          >
            {t("orderDetail.backToOrders")}
          </button>
        </div>
      </div>
    );
  }

  // Simplified, easy-to-maintain layout to avoid JSX nesting issues
  return (
    <div className={`min-h-screen pt-14 sm:pt-16 lg:pt-20 pb-16 lg:pb-0 font-sans transition-colors duration-300 ${
      isDark ? 'bg-slate-950' : 'bg-bg-base'
    }`}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-8">
        {/* Header */}
        <div className={`rounded-3xl border p-8 shadow-sm flex flex-col md:flex-row md:items-end justify-between gap-4 ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-stone-100'
        }`}>
          <div>
            <button
              onClick={() => navigate("/customer/orders")}
              className={`inline-flex items-center gap-2 text-sm mb-4 transition-colors ${
                isDark ? 'text-slate-400 hover:text-primary' : 'text-text-muted hover:text-primary'
              }`}
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{t("orderDetail.back", { defaultValue: "Back" })}</span>
            </button>
            <h1 className="text-3xl font-bold text-text-main">
              {t("orderDetail.orderNumber", {
                number: order._id.slice(-8).toUpperCase(),
              })}
            </h1>
            <p className="text-sm text-text-muted mt-2 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {formatDate(order.createdAt)}
            </p>
          </div>
          <div className="flex flex-col items-start gap-3 md:items-end">
            <div
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold ${getStatusColor(
                order.orderStatus === "Shipped" ? "Processing" : order.orderStatus
              )}`}
            >
              {getStatusIcon(order.orderStatus === "Shipped" ? "Processing" : order.orderStatus)}
              {translateStatus(order.orderStatus)}
            </div>
            {canCancelOrder && (
              <button
                type="button"
                onClick={handleCancelOrder}
                disabled={cancelling}
                className="inline-flex h-11 items-center justify-center rounded-xl border border-[#b94747] bg-[#c94f4f] px-5 text-sm font-bold text-white shadow-sm transition-all hover:border-[#913838] hover:bg-[#a94040] hover:text-white focus:outline-none focus:ring-2 focus:ring-[#c94f4f]/30 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {cancelling
                  ? t("orderDetail.cancelling")
                  : t("orderDetail.cancelOrder")}
              </button>
            )}
            {currentOrderStatus === "Cancelled" && (
              <p className="max-w-[220px] text-right text-xs font-semibold text-red-600">
                {t("orderDetail.cancelledNotice")}
              </p>
            )}
          </div>
        </div>

        {/* Items */}
        <div className={`rounded-3xl border p-8 space-y-4 ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-stone-100'
        }`}>
          <h2 className="text-lg font-semibold text-text-main flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-primary" />
            {t("orderDetail.items")}
          </h2>
          {order.orderItems?.map((item, index) => (
            <div
              key={index}
              className={`flex items-center gap-4 py-4 border-t first:border-t-0 ${
                isDark ? 'border-slate-800' : 'border-stone-100'
              }`}
            >
              <div className={`w-16 h-16 rounded-xl flex items-center justify-center overflow-hidden ${
                isDark ? 'bg-slate-800' : 'bg-stone-50'
              }`}>
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.name}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <Package className="w-6 h-6 text-stone-300" />
                )}
              </div>
              <div className="flex-1">
                <p className="font-medium text-text-main">
                  {getLocalizedOrderItemName(item, language)}
                </p>
                <p className="text-sm text-text-muted">
                  {t("orderDetail.qty")} {item.quantity} · {formatCurrency(item.price)}
                  {item.size ? ` · ${t("orderDetail.size")} ${item.size}` : ""}
                  {item.color ? ` · ${t("orderDetail.color")} ${item.color}` : ""}
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
            <div className={`rounded-3xl border p-8 space-y-3 ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-stone-100'
            }`}>
              <h2 className="text-lg font-semibold text-text-main flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" />
                {t("orderDetail.shipping")}
              </h2>
              <p className="font-medium text-text-main">
                {order.shippingAddress.fullName}
              </p>
              {[
                order.shippingAddress.street,
                order.shippingAddress.address,
                [order.shippingAddress.city, order.shippingAddress.postalCode]
                  .filter(Boolean)
                  .join(", "),
                order.shippingAddress.country,
              ].filter(Boolean).map((line) => (
                <p key={line} className="text-sm text-text-muted">{line}</p>
              ))}
              {order.shippingAddress.phone && (
                <p className="text-sm text-text-muted flex items-center gap-2 mt-2">
                  <Phone className="w-4 h-4" />
                  {order.shippingAddress.phone}
                </p>
              )}
            </div>
          )}

          <div className={`rounded-3xl border p-8 space-y-4 ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-stone-100'
          }`}>
            <h2 className="text-lg font-semibold text-text-main flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-primary" />
              {t("orderDetail.payment")}
            </h2>
            <div className="space-y-1 text-sm text-text-muted">
              <p>
                {t("orderDetail.method")}:{" "}
                <span className="font-semibold text-text-main">
                  {translatePaymentMethod(order.paymentMethod)}
                </span>
              </p>
              <p>
                {t("orderDetail.paymentStatus")}:{" "}
                <span className="font-semibold text-text-main">
                  {translateStatus(order.paymentStatus)}
                </span>
              </p>
              {order.isPaid && order.paidAt && (
                <p>
                  {t("orderDetail.paidOn")}{" "}
                  <span className="font-semibold text-text-main">
                    {formatDate(order.paidAt)}
                  </span>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className={`rounded-3xl border p-8 space-y-3 ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-stone-100'
        }`}>
          <h2 className="text-lg font-semibold text-text-main flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-primary" />
            {t("orderDetail.summary")}
          </h2>
          <div className="space-y-2 text-sm text-text-muted">
            <div className="flex justify-between">
              <span>{t("orderDetail.subtotal")}</span>
              <span className="font-semibold text-text-main">
                {formatCurrency(
                  order.totalPrice -
                  (order.taxPrice || 0) -
                  (order.shippingPrice || 0)
                )}
              </span>
            </div>
            <div className="flex justify-between">
              <span>{t("orderDetail.shipping")}</span>
              <span className="font-semibold text-text-main">
                {order.shippingPrice > 0
                  ? formatCurrency(order.shippingPrice)
                  : t("orderDetail.free")}
              </span>
            </div>
            {order.taxPrice > 0 && (
              <div className="flex justify-between">
                <span>{t("orderDetail.tax")}</span>
                <span className="font-semibold text-text-main">
                  {formatCurrency(order.taxPrice)}
                </span>
              </div>
            )}
            <div className={`h-px my-2 ${isDark ? 'bg-slate-800' : 'bg-stone-100'}`} />
            <div className="flex justify-between text-base">
              <span className="font-semibold text-text-main">{t("orderDetail.total")}</span>
              <span className="font-bold text-text-main">
                {formatCurrency(order.totalPrice)}
              </span>
            </div>
          </div>
        </div>

        {/* Delivery badge */}
        {order.isDelivered && (
          <div className={`rounded-3xl p-4 flex items-center gap-3 text-sm ${
            isDark ? 'bg-green-900/30 border border-green-800/40 text-green-300' : 'bg-green-50 border border-green-100 text-green-800'
          }`}>
            <CheckCircle className="w-5 h-5" />
            <div>
              <p className="font-semibold">{t("orderDetail.status.delivered")}</p>
              {order.deliveredAt && (
                <p>
                  {formatDate(order.deliveredAt)}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
      <ConfirmDialog
        open={showCancelDialog}
        title={t("orderDetail.cancelConfirmTitle")}
        message={t("orderDetail.cancelConfirm")}
        cancelLabel={t("orderDetail.keepOrder")}
        confirmLabel={
          cancelling
            ? t("orderDetail.cancelling")
            : t("orderDetail.confirmCancel")
        }
        onCancel={() => setShowCancelDialog(false)}
        onConfirm={confirmCancelOrder}
        isDark={isDark}
        loading={cancelling}
      />
    </div>
  );
};

export default OrderDetail;
