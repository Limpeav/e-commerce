// ─── Normalization helpers ───
export const normalizeOrderStatus = (status = "") => {
  const s = String(status).trim().toLowerCase();
  if (["cancelled", "canceled"].includes(s)) return "Cancelled";
  const map = {
    pending: "Pending",
    processing: "Processing",
    shipped: "Shipped",
    delivered: "Delivered",
  };
  return map[s] || status;
};

// ─── Status colour helpers ───
export const getStatusColor = (status, isDelivery = false) => {
  const s = normalizeOrderStatus(status);
  const colors = {
    Pending: "bg-amber-50 text-amber-700 border-amber-200",
    Processing: "bg-blue-50 text-blue-700 border-blue-200",
    Shipped: "bg-sky-50 text-sky-700 border-sky-200",
    Delivered: "bg-emerald-50 text-emerald-700 border-emerald-200",
    Cancelled: "bg-rose-50 text-rose-700 border-rose-200",
  };
  return colors[s] || "bg-gray-100 text-gray-800";
};

export const getStatusStyle = (status) => {
  if (normalizeOrderStatus(status) === "Cancelled") {
    return {
      backgroundColor: "#342331",
      color: "#ffc7cf",
      borderColor: "#7b2942",
    };
  }
  return {};
};

export const getStatusLabel = (status, isDelivery = false) => {
  if (normalizeOrderStatus(status) === "Shipped" && !isDelivery) return "Confirmed";
  return status || "Pending";
};

// ─── Payment helpers ───
export const getPaymentStatusColor = (status) => {
  const colors = {
    Pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
    Paid: "bg-green-100 text-green-800 border-green-300",
    Failed: "bg-red-100 text-red-800 border-red-300",
    Refunded: "bg-orange-100 text-orange-800 border-orange-300",
  };
  return colors[status] || "bg-gray-100 text-gray-800 border-gray-300";
};

export const getPaymentColor = (status) => {
  const colors = {
    Paid: "bg-green-50 text-green-700 border-green-200",
    Pending: "bg-amber-50 text-amber-700 border-amber-200",
    Failed: "bg-red-50 text-red-700 border-red-200",
    Refunded: "bg-purple-50 text-purple-700 border-purple-200",
    "Cash on Delivery": "bg-blue-50 text-blue-700 border-blue-200",
  };
  return colors[status] || "bg-gray-100 text-gray-800";
};

// ─── Price helpers ───
export const formatUSD = (amount) => `$${Number(amount || 0).toFixed(2)}`;
export const getDeliveryFee = (order) => Number(order?.shippingPrice) || 2;

// ─── Phone helpers ───
export const formatPhoneNumber = (phone, fallback = "No phone") => {
  if (!phone) return fallback;
  const digits = String(phone).replace(/\D/g, "");
  const local = digits.startsWith("855") ? `0${digits.slice(3)}` : digits;
  if (local.length <= 3) return local;
  if (local.length <= 6) return `${local.slice(0, 3)} ${local.slice(3)}`;
  return `${local.slice(0, 3)} ${local.slice(3, 6)} ${local.slice(6)}`;
};

// ─── Address helpers ───
export const formatAddress = (addr) => {
  if (!addr) return "N/A";
  return [addr.address, addr.city, addr.state, addr.postalCode, addr.country]
    .filter(Boolean)
    .join(", ");
};

export const formatDeliveryAddress = (addr) => {
  if (!addr) return "N/A";
  return [addr.address, addr.city].filter(Boolean).join(", ");
};

export const formatFullAddress = (addr) => {
  if (!addr) return "N/A";
  const address = addr.address || addr.street || "";
  const city = addr.city || "";
  return [address, city].filter(Boolean).join(", ");
};

// ─── Maps helper ───
export const getMapUrl = (addr) => {
  if (!addr) return null;
  const q = [addr.address, addr.city, addr.state, addr.country]
    .filter(Boolean)
    .join(", ");
  return q ? `https://www.google.com/maps?q=${encodeURIComponent(q)}` : null;
};

// ─── Date helpers ───
export const getOrderDateKey = (createdAt) => {
  if (!createdAt) return "unknown";
  return new Date(createdAt).toISOString().slice(0, 10);
};

export const formatOrderDate = (dateKey) => {
  if (!dateKey || dateKey === "unknown") return "Unknown date";
  const d = new Date(`${dateKey}T00:00:00`);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString(undefined, {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  });
};
