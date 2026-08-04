const asArray = (value) => (Array.isArray(value) ? value : []);
const asObject = (value) =>
  value && typeof value === "object" && !Array.isArray(value) ? value : {};

export const AdminModels = {
  dashboard: (value) => asObject(value),
  orders: (value) => asArray(value),
  order: (value) => asObject(value),
  products: (value) => asArray(value),
  product: (value) => asObject(value),
  users: (value) => asArray(value),
  banners: (value) => asArray(value),
  cashReport: (value) => {
    const payload = asObject(value);
    const summary = asObject(payload.summary);

    return {
      ...payload,
      summary: {
        totalCash: Number(summary.totalCash || 0),
        totalCashKhr: Number(summary.totalCashKhr || 0),
        orderCount: Number(summary.orderCount || 0),
        averageOrderValue: Number(summary.averageOrderValue || 0),
        pendingCashCount: Number(summary.pendingCashCount || 0),
        pendingCashAmount: Number(summary.pendingCashAmount || 0),
        pendingCashAmountKhr: Number(summary.pendingCashAmountKhr || 0),
      },
      dailyBreakdown: asArray(payload.dailyBreakdown).map((day) => ({
        ...day,
        totalCash: Number(day.totalCash || 0),
        totalCashKhr: Number(day.totalCashKhr || 0),
        orderCount: Number(day.orderCount || 0),
        averageOrderValue: Number(day.averageOrderValue || 0),
      })),
      orders: asArray(payload.orders),
    };
  },
  reviewQueue: (value) => {
    const payload = asObject(value);

    return {
      items: asArray(payload.items),
      counts: {
        Pending: Number(payload.counts?.Pending || 0),
        Approved: Number(payload.counts?.Approved || 0),
        Rejected: Number(payload.counts?.Rejected || 0),
      },
      pagination: {
        page: Number(payload.pagination?.page || 1),
        limit: Number(payload.pagination?.limit || 20),
        total: Number(payload.pagination?.total || 0),
        totalPages: Number(payload.pagination?.totalPages || 1),
      },
    };
  },
};

export const modelResponse = (response, model = (value) => value) => ({
  ...response,
  data: model(response?.data),
});
