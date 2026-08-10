const REALTIME_ORDER_PATCH_FIELDS = [
  "orderStatus",
  "paymentStatus",
  "isPaid",
  "isDelivered",
  "processedAt",
  "shippedAt",
  "deliveredAt",
  "paidAt",
  "updatedAt",
];

export const getRealtimeOrderId = (payload = {}) => payload.orderId || payload._id || "";

export const buildRealtimeOrderPatch = (payload = {}) =>
  Object.fromEntries(
    REALTIME_ORDER_PATCH_FIELDS
      .map((field) => [field, payload[field]])
      .filter(([, value]) => value !== undefined)
  );
