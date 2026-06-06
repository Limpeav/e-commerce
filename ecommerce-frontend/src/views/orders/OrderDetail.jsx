import { useState, useEffect } from "react";
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
import { cancelOrder } from "../../services/orderService";

const API_URL = config.API_BASE_URL;

const getLocalizedOrderItemName = (item, language) =>
  language === "kh" && (item.titleKm || item.product?.titleKm)
    ? item.titleKm || item.product.titleKm
    : item.name;

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (id && user) {
      fetchOrderDetails();
    }
  }, [id, user]);

  const getAuthToken = () => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      return userData.token;
    }
    return null;
  };

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
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
      setLoading(false);
    }
  };

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

  const formatDate = (value) =>
    new Date(value).toLocaleDateString(language === "kh" ? "km-KH" : undefined, {
      month: "long",
      day: "numeric",
      year: "numeric",
    });

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
  const canCancelOrder = currentOrderStatus === "Pending";

  const handleCancelOrder = async () => {
    if (!canCancelOrder || cancelling) return;

    if (!window.confirm(t("orderDetail.cancelConfirm"))) {
      return;
    }

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
    <div className="min-h-screen bg-bg-base py-12 pt-32 px-6 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="bg-white rounded-3xl border border-stone-100 p-8 shadow-sm flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <button
              onClick={() => navigate("/customer")}
              className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-primary mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{t("orderDetail.backToHome", { defaultValue: "Back to home" })}</span>
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
        <div className="bg-white rounded-3xl border border-stone-100 p-8 space-y-4">
          <h2 className="text-lg font-semibold text-text-main flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-primary" />
            {t("orderDetail.items")}
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
                <p className="font-medium text-text-main">
                  {getLocalizedOrderItemName(item, language)}
                </p>
                <p className="text-sm text-text-muted">
                  {t("orderDetail.qty")} {item.quantity} · {formatCurrency(item.price)}
                  {item.size ? ` · ${t("orderDetail.size")} ${item.size}` : ""}
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
                {t("orderDetail.shipping")}
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
            </div>
          )}

          <div className="bg-white rounded-3xl border border-stone-100 p-8 space-y-4">
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
        <div className="bg-white rounded-3xl border border-stone-100 p-8 space-y-3">
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
            <div className="h-px bg-stone-100 my-2" />
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
          <div className="bg-green-50 border border-green-100 rounded-3xl p-4 flex items-center gap-3 text-sm text-green-800">
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
    </div>
  );
};

export default OrderDetail;
