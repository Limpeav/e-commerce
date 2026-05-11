import { useState } from "react";
import { Package, Truck, MapPin, CheckCircle, Search, Clock, Send } from "lucide-react";
import PageLayout from "../../components/ui/PageLayout";

const statusIcons = {
  "Order Placed": Package,
  "Order Processed": CheckCircle,
  "Shipped": Truck,
  "Out for Delivery": Truck,
  "Delivered": CheckCircle,
};

const statusColors = {
  "Order Placed": "text-blue-500",
  "Order Processed": "text-green-500",
  "Shipped": "text-orange-500",
  "Out for Delivery": "text-orange-500",
  "Delivered": "text-green-600",
};

export default function OrderTracking() {
  const [orderNumber, setOrderNumber] = useState("");
  const [trackingData, setTrackingData] = useState(null);
  const [error, setError] = useState("");

  const handleTrackOrder = () => {
    setError("");
    if (!orderNumber.trim()) {
      setError("Please enter an order number.");
      return;
    }
    // Mock tracking data
    setTrackingData({
      orderNumber: orderNumber.trim(),
      status: "Shipped",
      estimatedDelivery: "2026-05-18",
      carrier: "ExpressPost",
      trackingId: "EXP-9X7K2M",
      origin: "Phnom Penh",
      destination: "Siem Reap",
      recipient: "Sokha Vann",
      trackingHistory: [
        {
          date: "2026-05-11",
          time: "09:15 AM",
          status: "Order Placed",
          location: "Online",
        },
        {
          date: "2026-05-12",
          time: "02:30 PM",
          status: "Order Processed",
          location: "Warehouse - Phnom Penh",
        },
        {
          date: "2026-05-14",
          time: "10:00 AM",
          status: "Shipped",
          location: "Distribution Center - Phnom Penh",
        },
      ],
    });
  };

  return (
    <PageLayout
      title="Track Order"
      subtitle="Enter your order number to check the current status and delivery progress"
      badge="Tracking"
      icon={Send}
      badgeColor="primary"
      maxWidth="4xl"
    >
      <div className="space-y-10">
        {/* Search Input */}
        <div
          className="rounded-2xl border bg-bg-card p-6 sm:p-8"
          style={{ borderColor: "var(--color-border)" }}
        >
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                value={orderNumber}
                onChange={(e) => {
                  setOrderNumber(e.target.value);
                  setError("");
                }}
                onKeyDown={(e) => e.key === "Enter" && handleTrackOrder()}
                placeholder="Enter order number (e.g. ORD-2026-001)"
                className="w-full rounded-xl border bg-bg-card py-3.5 pl-12 pr-4 text-sm font-medium text-text-main outline-none transition-all placeholder:text-text-muted focus:ring-2 focus:ring-primary/20"
                style={{ borderColor: error ? "rgb(239 68 68)" : "var(--color-border)" }}
              />
              {error && (
                <p className="mt-1.5 text-xs font-medium text-red-500">{error}</p>
              )}
            </div>
            <button
              onClick={handleTrackOrder}
              className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-text-main px-8 py-3 text-sm font-bold text-white transition-all hover:bg-primary active:scale-95"
            >
              <Search className="h-4 w-4" />
              Track
            </button>
          </div>
        </div>

        {/* Tracking Results */}
        {trackingData && (
          <div className="space-y-6 animate-[fadeIn_0.4s_ease-out]">
            {/* Status Overview */}
            <div
              className="rounded-2xl border bg-bg-card p-6 sm:p-8"
              style={{ borderColor: "var(--color-border)" }}
            >
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-text-muted sm:text-xs">Order</p>
                  <p className="mt-1.5 font-mono text-sm font-bold text-text-main">{trackingData.orderNumber}</p>
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-text-muted sm:text-xs">Status</p>
                  <span className="mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                    {trackingData.status}
                  </span>
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-text-muted sm:text-xs">Estimated Delivery</p>
                  <p className="mt-1.5 text-sm font-bold text-text-main">
                    {new Date(trackingData.estimatedDelivery).toLocaleDateString(undefined, {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-text-muted sm:text-xs">Carrier</p>
                  <p className="mt-1.5 text-sm font-bold text-text-main">{trackingData.carrier}</p>
                  <p className="text-xs text-text-muted">{trackingData.trackingId}</p>
                </div>
              </div>
            </div>

            {/* Tracking Timeline */}
            <div
              className="rounded-2xl border bg-bg-card p-6 sm:p-8"
              style={{ borderColor: "var(--color-border)" }}
            >
              <div className="mb-6 flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Tracking History</h3>
              </div>
              <div className="relative space-y-0">
                <div className="absolute left-[19px] top-3 bottom-3 w-0.5 bg-primary/10" />
                {trackingData.trackingHistory.map((event, index) => {
                  const Icon = statusIcons[event.status] || Package;
                  const color = statusColors[event.status] || "text-primary";
                  const isLast = index === trackingData.trackingHistory.length - 1;

                  return (
                    <div key={index} className="relative flex gap-6 pb-8 last:pb-0">
                      <div className={`relative z-10 flex h-10 w-10 items-center justify-center rounded-xl border-2 bg-bg-card ${isLast ? "border-primary" : ""}`} style={{ borderColor: isLast ? undefined : "var(--color-border)" }}>
                        <Icon className={`h-4 w-4 ${color}`} />
                      </div>
                      <div className="flex-1 pt-1.5">
                        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                          <p className="text-sm font-bold text-text-main">{event.status}</p>
                          <span className="text-xs font-medium text-text-muted">
                            {new Date(event.date).toLocaleDateString(undefined, { day: "numeric", month: "short" })} at {event.time}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center gap-1.5">
                          <MapPin className="h-3 w-3 text-text-muted" />
                          <span className="text-xs font-medium text-text-muted">{event.location}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Delivery Info */}
            <div
              className="rounded-2xl border bg-bg-card p-6 sm:p-8"
              style={{ borderColor: "var(--color-border)" }}
            >
              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-text-muted sm:text-xs">Origin</p>
                  <p className="mt-1.5 text-sm font-bold text-text-main">{trackingData.origin}</p>
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-text-muted sm:text-xs">Destination</p>
                  <p className="mt-1.5 text-sm font-bold text-text-main">{trackingData.destination}</p>
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-text-muted sm:text-xs">Recipient</p>
                  <p className="mt-1.5 text-sm font-bold text-text-main">{trackingData.recipient}</p>
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-text-muted sm:text-xs">Tracking ID</p>
                  <p className="mt-1.5 font-mono text-sm font-bold text-text-main">{trackingData.trackingId}</p>
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
