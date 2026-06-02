import { useMemo, useState } from "react";
import { Package, Truck, MapPin, CheckCircle, Search, Clock, Send, AlertCircle } from "lucide-react";
import PageLayout from "../../components/ui/PageLayout";
import { trackOrder } from "../../services/orderService";
import { useLanguage } from "../../context/useLanguage";

const statusIcons = {
  orderPlaced: Package,
  orderProcessed: CheckCircle,
  shipped: Truck,
  delivered: CheckCircle,
};

const statusColors = {
  orderPlaced: "text-blue-500",
  orderProcessed: "text-green-500",
  shipped: "text-orange-500",
  delivered: "text-green-600",
};

const statusRank = {
  Pending: 0,
  Processing: 1,
  Shipped: 2,
  Delivered: 3,
  Cancelled: -1,
};

const getLocale = (language) => (language === "kh" ? "km-KH" : undefined);

const formatDateTime = (value, language, pendingText) => {
  if (!value) return pendingText;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return pendingText;

  return date.toLocaleString(getLocale(language), {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const formatDate = (value, language, pendingText) => {
  if (!value) return pendingText;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return pendingText;

  return date.toLocaleDateString(getLocale(language), {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const addDays = (value, days) => {
  const date = value ? new Date(value) : new Date();
  date.setDate(date.getDate() + days);
  return date;
};

const normalizeOrderNumber = (value) => String(value || "").trim().replace(/^#/, "");

export default function OrderTracking() {
  const { t, language } = useLanguage();
  const [orderNumber, setOrderNumber] = useState("");
  const [trackingData, setTrackingData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const pendingText = t("orderTracking.pending");

  const translateStatus = (status) =>
    t(`orderDetail.status.${String(status || "Pending").trim().toLowerCase()}`, {
      defaultValue: status || pendingText,
    });

  const timeline = useMemo(() => {
    if (!trackingData) return [];

    const rank = statusRank[trackingData.orderStatus] ?? 0;
    const processedAt = trackingData.processedAt;
    const shippedAt = trackingData.shippedAt || processedAt;
    const deliveredAt = trackingData.deliveredAt;

    return [
      {
        date: trackingData.createdAt,
        statusKey: "orderPlaced",
        location: t("orderTracking.locations.onlineCheckout"),
        complete: true,
      },
      {
        date: processedAt,
        statusKey: "orderProcessed",
        location: t("orderTracking.locations.sellerConfirmation"),
        complete: rank >= statusRank.Processing || Boolean(processedAt),
      },
      {
        date: shippedAt,
        statusKey: "shipped",
        location: t("orderTracking.locations.readyForDelivery"),
        complete: rank >= statusRank.Shipped || Boolean(shippedAt),
      },
      {
        date: deliveredAt,
        statusKey: "delivered",
        location: trackingData.shippingAddress?.city || t("orderTracking.deliveryAddress"),
        complete: rank >= statusRank.Delivered || Boolean(deliveredAt),
      },
    ];
  }, [t, trackingData]);

  const handleTrackOrder = async () => {
    const trimmedOrderNumber = normalizeOrderNumber(orderNumber);

    setError("");
    setTrackingData(null);

    if (!trimmedOrderNumber) {
      setError(t("orderTracking.errors.enterOrderNumber"));
      return;
    }

    setLoading(true);
    try {
      const order = await trackOrder(trimmedOrderNumber);
      setTrackingData(order);
    } catch (err) {
      const statusCode = err.response?.status;
      setError(
        statusCode === 404
          ? t("orderTracking.errors.notFound")
          : statusCode === 403
            ? t("orderTracking.errors.notAuthorized")
            : err.response?.data?.message ||
          err.message ||
          t("orderTracking.errors.trackFailed")
      );
    } finally {
      setLoading(false);
    }
  };

  const currentStatus = trackingData?.orderStatus || "Pending";
  const delivered = currentStatus === "Delivered";
  const estimatedDelivery = delivered
    ? trackingData?.deliveredAt
    : addDays(trackingData?.processedAt || trackingData?.createdAt, 5);
  const displayOrderId = trackingData?._id ? trackingData._id.slice(-8).toUpperCase() : "";
  const destination = [
    trackingData?.shippingAddress?.address,
    trackingData?.shippingAddress?.city,
    trackingData?.shippingAddress?.postalCode,
    trackingData?.shippingAddress?.country,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <PageLayout
      title={t("orderTracking.title")}
      subtitle={t("orderTracking.subtitle")}
      badge={t("orderTracking.badge")}
      icon={Send}
      badgeColor="primary"
      maxWidth="4xl"
    >
      <div className="space-y-8 sm:space-y-10">
        <div className="rounded-2xl bg-bg-card p-4 sm:p-6 md:p-8">
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="relative min-w-0 flex-1">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                value={orderNumber}
                onChange={(e) => {
                  setOrderNumber(e.target.value);
                  setError("");
                }}
                onKeyDown={(e) => e.key === "Enter" && handleTrackOrder()}
                placeholder={t("orderTracking.placeholder")}
                className="w-full rounded-xl bg-[color:var(--color-surface-soft)] py-3.5 pl-12 pr-4 text-sm font-medium text-text-main shadow-inner outline-none transition-all placeholder:text-text-muted focus:bg-bg-card focus:ring-2 focus:ring-primary/20"
              />
              {error && (
                <p className="mt-1.5 flex items-start gap-1.5 text-xs font-medium leading-5 text-red-500">
                  <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  {error}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={handleTrackOrder}
              disabled={loading}
              className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-primary px-8 py-3 text-sm font-bold text-white shadow-lg shadow-primary/15 transition-all hover:bg-primary-dark hover:shadow-primary/25 active:scale-95 disabled:cursor-not-allowed disabled:opacity-70 md:w-auto"
            >
              <Search className="h-4 w-4" />
              {loading ? t("orderTracking.tracking") : t("orderTracking.track")}
            </button>
          </div>
        </div>

        {trackingData && (
          <div className="space-y-6 animate-[fadeIn_0.4s_ease-out]">
            <div
              className="rounded-2xl border bg-bg-card p-4 sm:p-6 md:p-8"
              style={{ borderColor: "var(--color-border)" }}
            >
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <div className="min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-text-muted sm:text-xs">{t("orderTracking.order")}</p>
                  <p className="mt-1.5 break-all font-mono text-sm font-bold text-text-main">#{displayOrderId}</p>
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-text-muted sm:text-xs">{t("orderTracking.status")}</p>
                  <span className="mt-1.5 inline-flex max-w-full items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                    <span className="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-primary" />
                    <span className="min-w-0 truncate">{translateStatus(currentStatus)}</span>
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-text-muted sm:text-xs">
                    {delivered ? t("orderTracking.deliveredOn") : t("orderTracking.estimatedDelivery")}
                  </p>
                  <p className="mt-1.5 break-words text-sm font-bold text-text-main">{formatDate(estimatedDelivery, language, pendingText)}</p>
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-text-muted sm:text-xs">{t("orderTracking.trackingId")}</p>
                  <p className="mt-1.5 break-all font-mono text-sm font-bold text-text-main">#{displayOrderId}</p>
                  <p className="text-xs text-text-muted">{t("orderTracking.storeDelivery")}</p>
                </div>
              </div>
            </div>

            <div
              className="rounded-2xl border bg-bg-card p-4 sm:p-6 md:p-8"
              style={{ borderColor: "var(--color-border)" }}
            >
              <div className="mb-6 flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-primary">{t("orderTracking.trackingHistory")}</h3>
              </div>
              <div className="relative space-y-0">
                <div className="absolute bottom-3 left-[17px] top-3 w-0.5 bg-primary/10 sm:left-[19px]" />
                {timeline.map((event) => {
                  const Icon = statusIcons[event.statusKey] || Package;
                  const color = event.complete
                    ? statusColors[event.statusKey] || "text-primary"
                    : "text-text-muted";

                  return (
                    <div key={event.statusKey} className="relative flex gap-3 pb-8 last:pb-0 sm:gap-6">
                      <div
                        className={`relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border-2 bg-bg-card sm:h-10 sm:w-10 ${
                          event.complete ? "border-primary" : ""
                        }`}
                        style={{ borderColor: event.complete ? undefined : "var(--color-border)" }}
                      >
                        <Icon className={`h-4 w-4 ${color}`} />
                      </div>
                      <div className="min-w-0 flex-1 pt-1.5">
                        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                          <p className="text-sm font-bold text-text-main">{t(`orderTracking.timeline.${event.statusKey}`)}</p>
                          <span className="text-xs font-medium text-text-muted sm:text-right">
                            {event.complete ? formatDateTime(event.date, language, pendingText) : pendingText}
                          </span>
                        </div>
                        <div className="mt-1 flex items-start gap-1.5">
                          <MapPin className="mt-0.5 h-3 w-3 shrink-0 text-text-muted" />
                          <span className="min-w-0 break-words text-xs font-medium text-text-muted">{event.location}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div
              className="rounded-2xl border bg-bg-card p-4 sm:p-6 md:p-8"
              style={{ borderColor: "var(--color-border)" }}
            >
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-text-muted sm:text-xs">{t("orderTracking.timeline.orderPlaced")}</p>
                  <p className="mt-1.5 break-words text-sm font-bold text-text-main">{formatDateTime(trackingData.createdAt, language, pendingText)}</p>
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-text-muted sm:text-xs">{t("orderTracking.processed")}</p>
                  <p className="mt-1.5 break-words text-sm font-bold text-text-main">{formatDateTime(trackingData.processedAt, language, pendingText)}</p>
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-text-muted sm:text-xs">{t("orderTracking.destination")}</p>
                  <p className="mt-1.5 break-words text-sm font-bold text-text-main">{destination || t("orderTracking.deliveryAddress")}</p>
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-text-muted sm:text-xs">{t("orderTracking.recipient")}</p>
                  <p className="mt-1.5 break-words text-sm font-bold text-text-main">
                    {trackingData.shippingAddress?.fullName || trackingData.user?.name || t("orderTracking.customer")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </PageLayout>
  );
}
