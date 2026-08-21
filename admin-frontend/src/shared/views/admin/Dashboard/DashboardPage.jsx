import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion as Motion, useReducedMotion } from "framer-motion";
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  CalendarDays,
  Check,
  CheckCheck,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleDollarSign,
  Clock,
  Clock3,
  CreditCard,
  DollarSign,
  Download,
  Inbox,
  Info,
  LifeBuoy,
  Loader2,
  MessageSquareText,
  Package,
  Search,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Star,
  ThumbsUp,
  TrendingUp,
  Trash2,
  Users,
  UserPlus,
  X,
} from "lucide-react";
import { NotificationController } from "../../../controllers";
import { normalizeProductCategory } from "../../../constants/productCategories";
import {
  getAvailableStock,
  isOutOfStockProduct,
  isProductIssue,
  LOW_STOCK_THRESHOLD,
} from "../../../utils/adminProducts";
import { subscribeRealtimeEvent } from "../../../services/realtime";
import {
  DASHBOARD_CATEGORY_COLORS as CATEGORY_COLORS,
  DASHBOARD_PERIODS as PERIODS,
  exportDashboardSummary,
  formatDashboardDateRangeLabel,
  formatDateDisplayValue,
  formatDateInputValue,
  formatMoney as money,
  formatNumber as number,
  parseDateInputValue,
  formatRiel as riel,
} from "./dashboardFormatters";
import {
  EmptyState,
  MetricCard,
  RevenueChart,
} from "./DashboardWidgets";

const startOfDay = (date) => {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
};

const endOfDay = (date) => {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
};

const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const getCalendarDayCount = (startDate, endDate) => {
  const startUtc = Date.UTC(
    startDate.getFullYear(),
    startDate.getMonth(),
    startDate.getDate()
  );
  const endUtc = Date.UTC(
    endDate.getFullYear(),
    endDate.getMonth(),
    endDate.getDate()
  );

  return Math.max(1, Math.floor((endUtc - startUtc) / 86400000) + 1);
};

const getDateRangeBounds = (dateRange = {}) => {
  const parsedStartDate = parseDateInputValue(dateRange.startDate);
  const parsedEndDate = parseDateInputValue(dateRange.endDate);
  const startDate =
    parsedStartDate && parsedEndDate && parsedStartDate > parsedEndDate
      ? parsedEndDate
      : parsedStartDate;
  const endDate =
    parsedStartDate && parsedEndDate && parsedStartDate > parsedEndDate
      ? parsedStartDate
      : parsedEndDate;
  const currentStart = startDate ? startOfDay(startDate) : null;
  const currentEnd = endDate ? endOfDay(endDate) : null;
  const dayCount =
    currentStart && currentEnd ? getCalendarDayCount(currentStart, currentEnd) : null;

  return {
    currentStart,
    currentEnd,
    dayCount,
    previousStart: dayCount ? startOfDay(addDays(currentStart, -dayCount)) : null,
    previousEnd: dayCount ? endOfDay(addDays(currentStart, -1)) : null,
    hasComparableRange: Boolean(currentStart && currentEnd),
  };
};

const getOrderDate = (order) => {
  const date = new Date(order?.createdAt || 0);
  return Number.isNaN(date.getTime()) ? null : date;
};

const getCustomerKey = (order) => {
  if (typeof order?.user === "string") return order.user;
  return order?.user?._id || order?.user?.email || order?.shippingAddress?.phone || null;
};

const getProductId = (item) =>
  typeof item?.product === "string" ? item.product : item?.product?._id;

const getOrderItemQuantity = (item) => Number(item?.quantity || 0);

const getOrderItemRevenue = (item) =>
  Number(item?.price || 0) * getOrderItemQuantity(item);

const getOrderItemCost = (item, productMap) => {
  const quantity = getOrderItemQuantity(item);
  const snapshotCost = Number(item?.costPrice);

  if (
    item?.costPrice !== undefined &&
    item?.costPrice !== null &&
    Number.isFinite(snapshotCost)
  ) {
    return Math.max(0, snapshotCost) * quantity;
  }

  const product = productMap.get(String(getProductId(item)));
  const productCost = Number(product?.costPrice || 0);
  return Math.max(0, Number.isFinite(productCost) ? productCost : 0) * quantity;
};

const getOrderItemProfit = (item, productMap) =>
  getOrderItemRevenue(item) - getOrderItemCost(item, productMap);

const SENTIMENT_LABELS = ["Positive", "Neutral", "Negative"];
const NEGATIVE_CATEGORY_PREVIEW_LIMIT = 6;
const MIN_VISIBLE_BAR_WIDTH = 3;
const NOTIFICATION_UPDATED_EVENT = "admin-notifications-updated";
const MARK_ALL_READ_NOTICE = "All notifications marked as read.";
const DELETE_NOTIFICATION_NOTICE = "Notification deleted.";

const NOTIFICATION_CATEGORY_STYLES = {
  orders: {
    label: "Orders",
    icon: ShoppingCart,
    pill: "border-blue-200 bg-blue-50 text-blue-700",
    iconBox: "bg-blue-100 text-blue-700",
  },
  payments: {
    label: "Payments",
    icon: CircleDollarSign,
    pill: "border-emerald-200 bg-emerald-50 text-emerald-700",
    iconBox: "bg-emerald-600 text-white shadow-emerald-600/20",
  },
  stock: {
    label: "Stock",
    icon: Package,
    pill: "border-orange-200 bg-orange-50 text-orange-700",
    iconBox: "bg-orange-100 text-orange-700",
  },
  support: {
    label: "Support",
    icon: LifeBuoy,
    pill: "border-violet-200 bg-violet-50 text-violet-700",
    iconBox: "bg-violet-100 text-violet-700",
  },
  products: {
    label: "Products",
    icon: Package,
    pill: "border-amber-200 bg-amber-50 text-amber-700",
    iconBox: "bg-amber-100 text-amber-700",
  },
  users: {
    label: "Users",
    icon: UserPlus,
    pill: "border-cyan-200 bg-cyan-50 text-cyan-700",
    iconBox: "bg-cyan-100 text-cyan-700",
  },
  system: {
    label: "System",
    icon: Info,
    pill: "border-gray-200 bg-gray-50 text-gray-700",
    iconBox: "bg-gray-100 text-gray-700",
  },
};

const NOTIFICATION_FILTERS = [
  { key: "all", label: "All" },
  { key: "unread", label: "Unread" },
  { key: "read", label: "Read" },
];

const NOTIFICATION_CATEGORY_FILTERS = [
  { key: "all", label: "All" },
  { key: "orders", label: "Orders" },
  { key: "payments", label: "Payments" },
  { key: "stock", label: "Stock" },
  { key: "support", label: "Support" },
  { key: "products", label: "Products" },
  { key: "users", label: "Users" },
  { key: "system", label: "System" },
];

const toNumber = (value, fallback = 0) => {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
};

const normalizePercent = (value) => Math.max(0, Math.min(100, toNumber(value)));

const getNotificationEntityId = (value) => {
  if (!value) return "";
  if (typeof value === "object") return value._id || value.id || "";
  return String(value);
};

const getNotificationPathFromLink = (link) => {
  const trimmedLink = String(link || "").trim();
  if (!trimmedLink) return "";

  if (trimmedLink.startsWith("http://") || trimmedLink.startsWith("https://")) {
    try {
      const url = new URL(trimmedLink);
      return `${url.pathname}${url.search}${url.hash}`;
    } catch {
      return "";
    }
  }

  return trimmedLink.startsWith("/") ? trimmedLink : "";
};

const getNotificationOrderIdFromPath = (path) => {
  const match = path.match(/^\/(?:admin|seller|delivery)\/orders\/([^/?#]+)/);
  return match?.[1] || "";
};

const PRODUCT_LIST_ROUTE_SEGMENTS = new Set([
  "add",
  "best-sellers",
  "edit",
  "new-arrivals",
  "promotions",
  "sold",
]);

const getNotificationProductIdFromPath = (path) => {
  const match = path.match(/^\/(?:admin|seller|delivery)\/products\/(?:edit\/)?([^/?#]+)/);
  const productId = match?.[1] || "";

  return PRODUCT_LIST_ROUTE_SEGMENTS.has(productId) ? "" : productId;
};

const isStockNotification = (notification) => {
  const title = String(notification?.title || "").toLowerCase();
  const message = String(notification?.message || "").toLowerCase();
  const link = String(notification?.link || "").toLowerCase();
  const haystack = `${title} ${message} ${link}`;

  return (
    haystack.includes("low stock") ||
    haystack.includes("out of stock") ||
    haystack.includes("stock threshold")
  );
};

const normalizeNotificationAdminPath = (path) => {
  if (!path) return "";

  const orderId = getNotificationOrderIdFromPath(path);
  if (orderId) {
    return `/admin/orders/${orderId}`;
  }

  if (path === "/admin" || path.startsWith("/admin?") || path.startsWith("/admin#")) {
    return path;
  }

  if (path.startsWith("/admin/") && !path.startsWith("/admin/login")) {
    return path;
  }

  return "";
};

const getNotificationTarget = (notification) => {
  const linkPath = normalizeNotificationAdminPath(
    getNotificationPathFromLink(notification?.link)
  );

  if (notification?.type === "product" && isStockNotification(notification)) {
    const productId =
      getNotificationEntityId(notification?.productId) ||
      getNotificationProductIdFromPath(linkPath);

    if (productId) return `/admin/products/${productId}`;
  }

  if (linkPath) return linkPath;

  const orderId = getNotificationEntityId(notification?.orderId);
  if (orderId) return `/admin/orders/${orderId}`;

  if (notification?.type === "user") return "/admin/users";
  if (notification?.type === "product") return "/admin/products";

  return "/admin";
};

const isNotificationDetailTarget = (target) =>
  Boolean(
    getNotificationOrderIdFromPath(target) ||
      getNotificationProductIdFromPath(target) ||
      target.match(/^\/admin\/support\/tickets\/[^/?#]+/)
  );

const getNotificationReturnState = (target) =>
  isNotificationDetailTarget(target)
    ? { returnTo: "/admin", returnState: { openNotifications: true } }
    : undefined;

const getNotificationCategory = (notification) => {
  const title = String(notification?.title || "").toLowerCase();
  const message = String(notification?.message || "").toLowerCase();
  const link = String(notification?.link || "").toLowerCase();
  const haystack = `${title} ${message} ${link}`;

  if (haystack.includes("payment") || haystack.includes("paid by")) {
    return "payments";
  }

  if (isStockNotification(notification)) {
    return "stock";
  }

  if (link.includes("/admin/support/tickets") || haystack.includes("support ticket")) {
    return "support";
  }

  if (notification?.type === "order" || notification?.orderId) return "orders";
  if (notification?.type === "product") return "products";
  if (notification?.type === "user") return "users";

  return "system";
};

const getNotificationPerson = (notification) => {
  const user = notification?.userId;
  if (!user || typeof user !== "object") return "";
  return user.name || user.email || "";
};

const getNotificationTime = (value) => {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return "Date unavailable";

  const seconds = Math.round((date.getTime() - Date.now()) / 1000);
  const absoluteSeconds = Math.abs(seconds);
  const formatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

  if (absoluteSeconds < 45) return "Just now";
  if (absoluteSeconds < 3600) return formatter.format(Math.round(seconds / 60), "minute");
  if (absoluteSeconds < 86400) return formatter.format(Math.round(seconds / 3600), "hour");
  if (absoluteSeconds < 604800) return formatter.format(Math.round(seconds / 86400), "day");

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
};

const getNotificationDateTitle = (value) => {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

const dispatchNotificationUpdate = () => {
  window.dispatchEvent(new Event(NOTIFICATION_UPDATED_EVENT));
};

const formatDayLabel = (date, dayCount) =>
  date.toLocaleDateString("en-US", {
    month: "short",
    day: dayCount <= 14 ? "numeric" : undefined,
  });

const changeFrom = (current, previous) => {
  if (!previous) return current ? 100 : 0;
  return ((current - previous) / previous) * 100;
};

const getDashboardReviewHealth = (reviewHealth = {}, sentiment = {}) => {
  const healthPayload =
    reviewHealth && typeof reviewHealth === "object" ? reviewHealth : {};
  const sentimentPayload =
    sentiment && typeof sentiment === "object" ? sentiment : {};
  const totalReviews = toNumber(healthPayload.totalReviews ?? sentimentPayload.total);
  const sentimentCounts = {
    Positive: toNumber(
      healthPayload.sentimentCounts?.Positive ?? sentimentPayload.positive
    ),
    Neutral: toNumber(
      healthPayload.sentimentCounts?.Neutral ?? sentimentPayload.neutral
    ),
    Negative: toNumber(
      healthPayload.sentimentCounts?.Negative ?? sentimentPayload.negative
    ),
  };
  const categorySource = Array.isArray(healthPayload.categoryRatings)
    ? healthPayload.categoryRatings
    : (sentimentPayload.categoryInsights || []).map((category) => {
        const reviewCount = toNumber(category.totalReviews);
        const negative = toNumber(category.negative);

        return {
          name: category.category || "Uncategorized",
          reviewCount,
          negative,
          negativeRate: reviewCount ? (negative / reviewCount) * 100 : 0,
          averageSentimentScore: toNumber(category.averageScore),
        };
      });

  return {
    totalReviews,
    averageRating: toNumber(healthPayload.averageRating),
    positiveReviewRate: toNumber(healthPayload.positiveReviewRate),
    positiveSentimentRate: toNumber(
      healthPayload.positiveSentimentRate ?? sentimentPayload.positiveRate
    ),
    negativeSentimentRate: toNumber(
      healthPayload.negativeSentimentRate ?? sentimentPayload.negativeRate
    ),
    averageSentimentScore: toNumber(
      healthPayload.averageSentimentScore ?? sentimentPayload.averageScore
    ),
    sentimentCounts,
    lowReviews: toNumber(healthPayload.lowReviews),
    unratedProducts: toNumber(healthPayload.unratedProducts),
    ratingDistribution: Array.isArray(healthPayload.ratingDistribution)
      ? healthPayload.ratingDistribution
      : [],
    categoryRatings: categorySource
      .map((category) => ({
        name: category.name || category.category || "Uncategorized",
        reviewCount: toNumber(category.reviewCount ?? category.totalReviews),
        negative: toNumber(category.negative),
        negativeRate: normalizePercent(category.negativeRate),
        averageSentimentScore: toNumber(category.averageSentimentScore),
      }))
      .filter((category) => category.negative > 0)
      .sort(
        (a, b) =>
          b.negativeRate - a.negativeRate ||
          b.negative - a.negative ||
          a.averageSentimentScore - b.averageSentimentScore ||
          b.reviewCount - a.reviewCount
      ),
  };
};

const DashboardPage = ({
  adminUser,
  stats,
  orders,
  products,
  period,
  setPeriod,
  dateRange,
  setDateRange,
  navigateFromDashboard,
  openNotificationModalOnLoad = false,
}) => {
  const backendReviewHealth = stats?.reviewHealth;
  const backendSentiment = stats?.sentiment;
  const [showAllNegativeCategories, setShowAllNegativeCategories] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(
    Boolean(openNotificationModalOnLoad)
  );
  const [notificationLoading, setNotificationLoading] = useState(true);
  const [notificationActionBusy, setNotificationActionBusy] = useState("");
  const [notificationBulkBusy, setNotificationBulkBusy] = useState("");
  const [notificationError, setNotificationError] = useState("");
  const [notificationNotice, setNotificationNotice] = useState("");
  const [notificationFilter, setNotificationFilter] = useState("all");
  const [notificationCategory, setNotificationCategory] = useState("all");
  const [notificationSearchTerm, setNotificationSearchTerm] = useState("");
  const notificationNoticeTimerRef = useRef(null);
  const startDatePickerRef = useRef(null);
  const endDatePickerRef = useRef(null);
  const reduceMotion = useReducedMotion();
  const todayInputValue = formatDateInputValue(new Date());
  const selectedPeriodLabel = useMemo(
    () =>
      period === "custom"
        ? formatDashboardDateRangeLabel(dateRange)
        : PERIODS.find((item) => item.value === period)?.label || "Last 30 days",
    [dateRange, period]
  );

  const handlePeriodChange = (event) => {
    setPeriod(event.target.value);
  };

  const openDatePicker = (dateInputRef) => {
    const dateInput = dateInputRef.current;
    if (!dateInput) return;

    if (typeof dateInput.showPicker === "function") {
      try {
        dateInput.showPicker();
        return;
      } catch {
        // Fall back to focus/click for browsers that block showPicker.
      }
    }

    dateInput.focus();
    dateInput.click();
  };

  const handleDatePickerKeyDown = (event, dateInputRef) => {
    if (event.key !== "Enter" && event.key !== " ") return;

    event.preventDefault();
    openDatePicker(dateInputRef);
  };

  const handleStartDateChange = (event) => {
    const nextStartDate = event.target.value;

    setDateRange((currentRange) => {
      if (
        nextStartDate &&
        currentRange.endDate &&
        nextStartDate > currentRange.endDate
      ) {
        return { startDate: nextStartDate, endDate: nextStartDate };
      }

      return { ...currentRange, startDate: nextStartDate };
    });
  };

  const handleEndDateChange = (event) => {
    const nextEndDate = event.target.value;

    setDateRange((currentRange) => {
      if (
        nextEndDate &&
        currentRange.startDate &&
        nextEndDate < currentRange.startDate
      ) {
        return { startDate: nextEndDate, endDate: nextEndDate };
      }

      return { ...currentRange, endDate: nextEndDate };
    });
  };

  const loadNotifications = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setNotificationLoading(true);
    setNotificationError("");

    const result = await NotificationController.getNotifications();
    if (result.success) {
      setNotifications(Array.isArray(result.data) ? result.data : []);
    } else {
      setNotificationError(result.error);
    }

    if (!silent) setNotificationLoading(false);
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      loadNotifications();
    });
  }, [loadNotifications]);

  useEffect(() => {
    const refreshFromRealtime = () => {
      loadNotifications({ silent: true });
      dispatchNotificationUpdate();
    };

    return subscribeRealtimeEvent("notification:created", refreshFromRealtime);
  }, [loadNotifications]);

  useEffect(
    () => () => {
      if (notificationNoticeTimerRef.current) {
        window.clearTimeout(notificationNoticeTimerRef.current);
      }
    },
    []
  );

  const showTimedNotificationNotice = useCallback((message) => {
    setNotificationNotice(message);

    if (notificationNoticeTimerRef.current) {
      window.clearTimeout(notificationNoticeTimerRef.current);
    }

    notificationNoticeTimerRef.current = window.setTimeout(() => {
      setNotificationNotice((currentNotice) =>
        currentNotice === message ? "" : currentNotice
      );
      notificationNoticeTimerRef.current = null;
    }, 2000);
  }, []);

  const analytics = useMemo(() => {
    const now = new Date();
    const periodDays = period === "custom" || period === "all" ? null : Number(period);
    const {
      currentStart,
      currentEnd,
      dayCount,
      previousStart,
      previousEnd,
      hasComparableRange,
    } =
      period === "custom"
        ? getDateRangeBounds(dateRange)
        : {
            currentStart: periodDays
              ? startOfDay(addDays(now, -(periodDays - 1)))
              : null,
            currentEnd: periodDays ? endOfDay(now) : null,
            dayCount: periodDays,
            previousStart: periodDays
              ? startOfDay(addDays(addDays(now, -(periodDays - 1)), -periodDays))
              : null,
            previousEnd: periodDays
              ? endOfDay(addDays(addDays(now, -(periodDays - 1)), -1))
              : null,
            hasComparableRange: Boolean(periodDays),
          };
    const chartByDay = Boolean(dayCount && dayCount <= 90);

    const isCurrent = (order) => {
      const date = getOrderDate(order);
      return (
        date &&
        (!currentStart || date >= currentStart) &&
        (!currentEnd || date <= currentEnd)
      );
    };
    const isPrevious = (order) => {
      const date = getOrderDate(order);
      return (
        date &&
        previousStart &&
        previousEnd &&
        date >= previousStart &&
        date <= previousEnd
      );
    };
    const isPaid = (order) =>
      order.paymentStatus === "Paid" && order.orderStatus !== "Cancelled";

    const currentOrders = orders.filter(isCurrent);
    const previousOrders = orders.filter(isPrevious);
    const paidOrders = currentOrders.filter(isPaid);
    const previousPaidOrders = previousOrders.filter(isPaid);
    const productMap = new Map(products.map((product) => [String(product._id), product]));
    const revenue = paidOrders.reduce((sum, order) => sum + Number(order.totalPrice || 0), 0);
    const previousRevenue = previousPaidOrders.reduce(
      (sum, order) => sum + Number(order.totalPrice || 0),
      0
    );
    const profit = paidOrders.reduce(
      (sum, order) =>
        sum +
        (order.orderItems || []).reduce(
          (itemSum, item) => itemSum + getOrderItemProfit(item, productMap),
          0
        ),
      0
    );
    const previousProfit = previousPaidOrders.reduce(
      (sum, order) =>
        sum +
        (order.orderItems || []).reduce(
          (itemSum, item) => itemSum + getOrderItemProfit(item, productMap),
          0
        ),
      0
    );
    const units = paidOrders.reduce(
      (sum, order) =>
        sum +
        (order.orderItems || []).reduce(
          (itemSum, item) => itemSum + Number(item.quantity || 0),
          0
        ),
      0
    );
    const previousUnits = previousPaidOrders.reduce(
      (sum, order) =>
        sum +
        (order.orderItems || []).reduce(
          (itemSum, item) => itemSum + Number(item.quantity || 0),
          0
        ),
      0
    );
    const aov = paidOrders.length ? revenue / paidOrders.length : 0;
    const previousAov = previousPaidOrders.length
      ? previousRevenue / previousPaidOrders.length
      : 0;

    const dailyMap = new Map();
    if (chartByDay) {
      for (let index = 0; index < dayCount; index += 1) {
        const date = addDays(currentStart, index);
        const key = formatDateInputValue(date);
        dailyMap.set(key, {
          key,
          label: formatDayLabel(date, dayCount),
          revenue: 0,
          profit: 0,
          orders: 0,
        });
      }
      paidOrders.forEach((order) => {
        const date = getOrderDate(order);
        if (!date) return;
        const entry = dailyMap.get(formatDateInputValue(date));
        if (entry) {
          entry.revenue += Number(order.totalPrice || 0);
          entry.profit += (order.orderItems || []).reduce(
            (sum, item) => sum + getOrderItemProfit(item, productMap),
            0
          );
          entry.orders += 1;
        }
      });
    } else {
      const datedOrders = paidOrders
        .map((order) => ({ order, date: getOrderDate(order) }))
        .filter((entry) => entry.date)
        .sort((a, b) => a.date - b.date);
      const finalDate = currentEnd || now;
      const firstDate = currentStart || datedOrders[0]?.date || finalDate;
      const cursor = new Date(firstDate.getFullYear(), firstDate.getMonth(), 1);
      const finalMonth = new Date(finalDate.getFullYear(), finalDate.getMonth(), 1);

      while (cursor <= finalMonth) {
        const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`;
        dailyMap.set(key, {
          key,
          label: cursor.toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
          revenue: 0,
          profit: 0,
          orders: 0,
        });
        cursor.setMonth(cursor.getMonth() + 1);
      }
      datedOrders.forEach(({ order, date }) => {
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        const entry = dailyMap.get(key);
        if (entry) {
          entry.revenue += Number(order.totalPrice || 0);
          entry.profit += (order.orderItems || []).reduce(
            (sum, item) => sum + getOrderItemProfit(item, productMap),
            0
          );
          entry.orders += 1;
        }
      });
    }

    const productSales = new Map();
    const categorySales = new Map();
    paidOrders.forEach((order) => {
      (order.orderItems || []).forEach((item) => {
        const product = productMap.get(String(getProductId(item)));
        const category = normalizeProductCategory(product?.category || "Uncategorized");
        const itemRevenue = Number(item.price || 0) * Number(item.quantity || 0);
        const itemQuantity = Number(item.quantity || 0);
        const productKey = String(getProductId(item) || item.name);
        const existingProduct = productSales.get(productKey) || {
          id: getProductId(item),
          name: item.name || product?.title || "Product",
          image: item.image || product?.image,
          quantity: 0,
          revenue: 0,
          profit: 0,
        };
        existingProduct.quantity += itemQuantity;
        existingProduct.revenue += itemRevenue;
        existingProduct.profit += getOrderItemProfit(item, productMap);
        productSales.set(productKey, existingProduct);
        categorySales.set(category, (categorySales.get(category) || 0) + itemRevenue);
      });
    });

    const topProducts = [...productSales.values()]
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
    const categories = [...categorySales.entries()]
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
    const maxCategory = Math.max(...categories.map((category) => category.value), 1);

    const customerCounts = new Map();
    currentOrders.forEach((order) => {
      const key = getCustomerKey(order);
      if (key) customerCounts.set(key, (customerCounts.get(key) || 0) + 1);
    });
    const repeatCustomers = [...customerCounts.values()].filter((count) => count > 1).length;
    const repeatRate = customerCounts.size
      ? (repeatCustomers / customerCounts.size) * 100
      : 0;

    const productIssues = products
      .filter(isProductIssue)
      .sort((a, b) => getAvailableStock(a) - getAvailableStock(b));
    const outOfStock = products.filter(isOutOfStockProduct);
    const inventoryUnits = products.reduce(
      (sum, product) => sum + getAvailableStock(product),
      0
    );
    const inventoryValue = products.reduce(
      (sum, product) =>
        sum +
        getAvailableStock(product) *
          Number(product.discountPrice || product.price || 0),
      0
    );

    const statusData = ["Pending", "Processing", "Delivered", "Cancelled"].map(
      (status) => ({
        status,
        count: currentOrders.filter((order) =>
          status === "Processing"
            ? ["Processing", "Shipped"].includes(order.orderStatus)
            : order.orderStatus === status
        ).length,
      })
    );
    const maxStatus = Math.max(...statusData.map((item) => item.count), 1);
    const paidRate = currentOrders.length ? (paidOrders.length / currentOrders.length) * 100 : 0;
    const reviewHealth = getDashboardReviewHealth(
      backendReviewHealth,
      backendSentiment
    );
    return {
      currentOrders,
      paidOrders,
      revenue,
      profit,
      units,
      aov,
      paidRate,
      repeatRate,
      hasComparableRange,
      dailyRevenue: [...dailyMap.values()],
      topProducts,
      categories: categories.map((category) => ({
        ...category,
        percentage: (category.value / maxCategory) * 100,
      })),
      productIssues,
      outOfStock,
      inventoryUnits,
      inventoryValue,
      reviewHealth: {
        ...reviewHealth,
      },
      statusData: statusData.map((item) => ({
        ...item,
        percentage: (item.count / maxStatus) * 100,
      })),
      changes: {
        revenue: changeFrom(revenue, previousRevenue),
        profit: changeFrom(profit, previousProfit),
        orders: changeFrom(currentOrders.length, previousOrders.length),
        aov: changeFrom(aov, previousAov),
        units: changeFrom(units, previousUnits),
      },
    };
  }, [backendReviewHealth, backendSentiment, dateRange, orders, period, products]);

  const exportSummary = () => {
    exportDashboardSummary({
      analytics,
      period,
      periodLabel: selectedPeriodLabel,
    });
  };

  const unreadNotificationCount = useMemo(
    () => notifications.filter((notification) => !notification.isRead).length,
    [notifications]
  );

  const filteredNotifications = useMemo(() => {
    const search = notificationSearchTerm.trim().toLowerCase();

    return notifications.filter((notification) => {
      if (notificationFilter === "unread" && notification.isRead) return false;
      if (notificationFilter === "read" && !notification.isRead) return false;
      if (
        notificationCategory !== "all" &&
        getNotificationCategory(notification) !== notificationCategory
      ) {
        return false;
      }

      if (!search) return true;

      const person = getNotificationPerson(notification);
      const category = getNotificationCategory(notification);
      const searchableText = [
        notification.title,
        notification.message,
        notification.type,
        NOTIFICATION_CATEGORY_STYLES[category]?.label,
        notification.audience,
        notification._id,
        getNotificationEntityId(notification.orderId),
        person,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(search);
    });
  }, [notificationCategory, notificationFilter, notificationSearchTerm, notifications]);

  const notificationCategoryCounts = useMemo(() => {
    const counts = NOTIFICATION_CATEGORY_FILTERS.reduce(
      (totals, category) => ({ ...totals, [category.key]: 0 }),
      {}
    );

    notifications.forEach((notification) => {
      if (notificationFilter === "unread" && notification.isRead) return;
      if (notificationFilter === "read" && !notification.isRead) return;

      const category = getNotificationCategory(notification);
      counts.all += 1;
      counts[category] = (counts[category] || 0) + 1;
    });

    return counts;
  }, [notificationFilter, notifications]);

  const markNotificationAsRead = useCallback(async (notificationId, { quiet = false } = {}) => {
    if (!notificationId) return false;

    setNotificationActionBusy(`read:${notificationId}`);
    if (!quiet) {
      setNotificationError("");
      setNotificationNotice("");
    }

    const result = await NotificationController.markAsRead(notificationId);
    setNotificationActionBusy("");

    if (!result.success) {
      if (!quiet) setNotificationError(result.error);
      return false;
    }

    setNotifications((currentNotifications) =>
      currentNotifications.map((notification) =>
        notification._id === notificationId
          ? { ...notification, ...(result.data || {}), isRead: true }
          : notification
      )
    );
    dispatchNotificationUpdate();

    if (!quiet) setNotificationNotice("Notification marked as read.");
    return true;
  }, []);

  const handleOpenNotification = async (notification) => {
    const target = getNotificationTarget(notification);
    const returnState = getNotificationReturnState(target);

    if (!notification.isRead) {
      await markNotificationAsRead(notification._id, { quiet: true });
    }

    setIsNotificationModalOpen(false);
    navigateFromDashboard(target, returnState ? { state: returnState } : undefined);
  };

  const handleMarkAllNotificationsRead = async () => {
    if (unreadNotificationCount === 0 || notificationBulkBusy) return;

    setNotificationBulkBusy("mark-all");
    setNotificationError("");
    setNotificationNotice("");

    const result = await NotificationController.markAllAsRead();
    setNotificationBulkBusy("");

    if (!result.success) {
      setNotificationError(result.error);
      return;
    }

    setNotifications((currentNotifications) =>
      currentNotifications.map((notification) => ({ ...notification, isRead: true }))
    );
    showTimedNotificationNotice(MARK_ALL_READ_NOTICE);
    dispatchNotificationUpdate();
  };

  const handleDeleteNotification = async (notificationId) => {
    if (!notificationId) return;

    setNotificationActionBusy(`delete:${notificationId}`);
    setNotificationError("");
    setNotificationNotice("");

    const result = await NotificationController.deleteNotification(notificationId);
    setNotificationActionBusy("");

    if (!result.success) {
      setNotificationError(result.error);
      return;
    }

    setNotifications((currentNotifications) =>
      currentNotifications.filter((notification) => notification._id !== notificationId)
    );
    showTimedNotificationNotice(DELETE_NOTIFICATION_NOTICE);
    dispatchNotificationUpdate();
  };

  const getNotificationBusy = (action, notificationId) =>
    notificationActionBusy === `${action}:${notificationId}`;

  const negativeCategoryRows = analytics.reviewHealth.categoryRatings;
  const hasMoreNegativeCategories =
    negativeCategoryRows.length > NEGATIVE_CATEGORY_PREVIEW_LIMIT;
  const displayedNegativeCategories = showAllNegativeCategories
    ? negativeCategoryRows
    : negativeCategoryRows.slice(0, NEGATIVE_CATEGORY_PREVIEW_LIMIT);
  const maxNegativeCategoryRate = Math.max(
    ...displayedNegativeCategories.map((category) => category.negativeRate),
    1
  );

  const attentionItems = [
    analytics.outOfStock.length
      ? {
          title: `${analytics.outOfStock.length} product${
            analytics.outOfStock.length === 1 ? "" : "s"
          } out of stock`,
          detail: "Restock now to avoid missed sales.",
          icon: AlertTriangle,
          tone: "bg-[#fff0eb] text-[#a45f4d]",
          action: () => navigateFromDashboard("/admin/products?inventory=sold-out"),
        }
      : null,
    (stats?.pendingOrders || 0) > 0
      ? {
          title: `${stats.pendingOrders} order${stats.pendingOrders === 1 ? "" : "s"} awaiting action`,
          detail: "Review and move pending orders forward.",
          icon: Clock3,
          tone: "bg-[#f7f1e5] text-[#927338]",
          action: () => navigateFromDashboard("/admin/orders?status=Pending"),
        }
      : null,
    (stats?.cashToCollect || 0) > 0
      ? {
          title: `${stats.cashToCollect} cash payment${
            stats.cashToCollect === 1 ? "" : "s"
          } to collect`,
          detail: "Track open cash-on-delivery orders.",
          icon: CreditCard,
          tone: "bg-[#ebf1f4] text-[#5f7f91]",
          action: () => navigateFromDashboard("/admin/cash-report"),
        }
      : null,
  ].filter(Boolean);

  return (
    <div className="min-h-screen bg-[var(--color-bg-base)] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="admin-stagger-container mx-auto max-w-[1500px]">
        <header className="mb-7 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-bold text-[var(--color-primary-dark)]">
              <Sparkles className="h-4 w-4" />
              Business overview
            </div>
            <h1 className="text-3xl font-black tracking-tight text-[var(--color-text-main)] sm:text-4xl">
              Good day, {stats?.admin || adminUser?.name || "Admin"}
            </h1>
            <p className="mt-2 max-w-2xl text-sm font-medium text-[var(--color-text-muted)] sm:text-base">
              Monitor sales, customers, orders, and inventory health from one place.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {period === "custom" ? (
              <Motion.div
                key="custom-date-range"
                initial={reduceMotion ? false : { opacity: 0, y: -8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{
                  duration: 0.22,
                  ease: [0.22, 1, 0.36, 1],
                  staggerChildren: reduceMotion ? 0 : 0.05,
                }}
                className="flex flex-col items-stretch gap-3 sm:items-end"
              >
                <div className="flex flex-nowrap items-center gap-3 overflow-x-auto pb-1">
                  <button
                    type="button"
                    onClick={() => setIsNotificationModalOpen(true)}
                    className="relative inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--color-border)] bg-white text-[var(--color-text-main)] transition hover:bg-[var(--color-surface-soft)] hover:text-[var(--color-primary-dark)]"
                    aria-label="Open notifications"
                    title="Notifications"
                  >
                    <Bell className="h-5 w-5" />
                    {unreadNotificationCount > 0 && (
                      <span className="absolute -right-1.5 -top-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#ff7b7b] px-1 text-[10px] font-black leading-none text-white ring-2 ring-white">
                        {unreadNotificationCount > 99 ? "99+" : unreadNotificationCount}
                      </span>
                    )}
                  </button>
                  <Motion.div
                    initial={reduceMotion ? false : { opacity: 0, scale: 0.985 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                    className="flex w-full flex-col overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white text-[var(--color-text-main)] shadow-sm transition focus-within:border-[var(--color-primary)] sm:w-auto sm:flex-row sm:items-center"
                    role="group"
                    aria-label="Custom dashboard date range"
                    title={selectedPeriodLabel}
                  >
                    <Motion.div
                      initial={reduceMotion ? false : { opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.18, ease: "easeOut" }}
                      role="button"
                      tabIndex={0}
                      onClick={() => openDatePicker(startDatePickerRef)}
                      onKeyDown={(event) =>
                        handleDatePickerKeyDown(event, startDatePickerRef)
                      }
                      className="relative flex h-14 cursor-pointer items-center gap-4 px-4 transition hover:bg-[var(--color-surface-soft)]/55 focus:outline-none focus-visible:bg-[var(--color-surface-soft)]/55 sm:min-w-[13.5rem]"
                    >
                      <input
                        ref={startDatePickerRef}
                        type="date"
                        value={dateRange.startDate || ""}
                        max={dateRange.endDate || todayInputValue}
                        onChange={handleStartDateChange}
                        aria-label="From date"
                        tabIndex={-1}
                        className="pointer-events-none absolute inset-0 h-full w-full opacity-0 [color-scheme:light]"
                      />
                      <span className="text-xs font-black uppercase text-[var(--color-text-muted)]">
                        From
                      </span>
                      <span className="min-w-[6.5rem] text-lg font-black tabular-nums text-[var(--color-text-main)]">
                        {formatDateDisplayValue(dateRange.startDate)}
                      </span>
                      <CalendarDays className="ml-auto h-5 w-5 shrink-0 text-[var(--color-text-main)]" />
                    </Motion.div>
                    <span className="h-px bg-[var(--color-border)] sm:h-8 sm:w-px" />
                    <Motion.div
                      initial={reduceMotion ? false : { opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.18, ease: "easeOut" }}
                      role="button"
                      tabIndex={0}
                      onClick={() => openDatePicker(endDatePickerRef)}
                      onKeyDown={(event) =>
                        handleDatePickerKeyDown(event, endDatePickerRef)
                      }
                      className="relative flex h-14 cursor-pointer items-center gap-4 px-4 transition hover:bg-[var(--color-surface-soft)]/55 focus:outline-none focus-visible:bg-[var(--color-surface-soft)]/55 sm:min-w-[13.5rem]"
                    >
                      <input
                        ref={endDatePickerRef}
                        type="date"
                        value={dateRange.endDate || ""}
                        min={dateRange.startDate || undefined}
                        max={todayInputValue}
                        onChange={handleEndDateChange}
                        aria-label="End date"
                        tabIndex={-1}
                        className="pointer-events-none absolute inset-0 h-full w-full opacity-0 [color-scheme:light]"
                      />
                      <span className="text-xs font-black uppercase text-[var(--color-text-muted)]">
                        End
                      </span>
                      <span className="min-w-[6.5rem] text-lg font-black tabular-nums text-[var(--color-text-main)]">
                        {formatDateDisplayValue(dateRange.endDate)}
                      </span>
                      <CalendarDays className="ml-auto h-5 w-5 shrink-0 text-[var(--color-text-main)]" />
                    </Motion.div>
                  </Motion.div>
                  <Motion.label
                    initial={reduceMotion ? false : { opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.18, ease: "easeOut", delay: reduceMotion ? 0 : 0.08 }}
                    className="relative shrink-0"
                  >
                    <select
                      value={period}
                      onChange={handlePeriodChange}
                      className="h-14 appearance-none rounded-2xl border border-[var(--color-border)] bg-white pl-4 pr-12 text-sm font-bold text-[var(--color-text-main)] outline-none focus:border-[var(--color-primary)]"
                      aria-label="Dashboard period"
                    >
                      {PERIODS.map((item) => (
                        <option key={item.value} value={item.value}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-main)]" />
                  </Motion.label>
                </div>
                <Motion.button
                  type="button"
                  onClick={exportSummary}
                  initial={reduceMotion ? false : { opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.18, ease: "easeOut", delay: reduceMotion ? 0 : 0.1 }}
                  className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-text-main)] px-4 text-sm font-bold text-white transition hover:opacity-90 sm:w-auto"
                >
                  <Download className="h-4 w-4" />
                  Export
                </Motion.button>
              </Motion.div>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setIsNotificationModalOpen(true)}
                  className="relative inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--color-border)] bg-white text-[var(--color-text-main)] transition hover:bg-[var(--color-surface-soft)] hover:text-[var(--color-primary-dark)]"
                  aria-label="Open notifications"
                  title="Notifications"
                >
                  <Bell className="h-5 w-5" />
                  {unreadNotificationCount > 0 && (
                    <span className="absolute -right-1.5 -top-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#ff7b7b] px-1 text-[10px] font-black leading-none text-white ring-2 ring-white">
                      {unreadNotificationCount > 99 ? "99+" : unreadNotificationCount}
                    </span>
                  )}
                </button>
                <label className="relative">
                  <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-muted)]" />
                  <select
                    value={period}
                    onChange={handlePeriodChange}
                    className="h-11 appearance-none rounded-xl border border-[var(--color-border)] bg-white pl-10 pr-12 text-sm font-bold text-[var(--color-text-main)] outline-none focus:border-[var(--color-primary)]"
                    aria-label="Dashboard period"
                  >
                    {PERIODS.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-main)]" />
                </label>
                <button
                  type="button"
                  onClick={exportSummary}
                  className="inline-flex h-11 items-center gap-2 rounded-xl bg-[var(--color-text-main)] px-4 text-sm font-bold text-white transition hover:opacity-90"
                >
                  <Download className="h-4 w-4" />
                  Export
                </button>
              </>
            )}
          </div>
        </header>

        <section className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            title="Net revenue"
            value={money(analytics.revenue)}
            secondaryValue={riel(analytics.revenue)}
            change={
              analytics.hasComparableRange ? analytics.changes.revenue : null
            }
            note={
              analytics.hasComparableRange
                ? period === "custom"
                  ? "vs previous range"
                  : "vs previous period"
                : "from paid orders"
            }
            icon={DollarSign}
            tone="sage"
            onClick={() => navigateFromDashboard("/admin/net-revenue")}
          />
          <MetricCard
            title="Orders"
            value={number(analytics.currentOrders.length)}
            change={
              analytics.hasComparableRange ? analytics.changes.orders : null
            }
            note={`${analytics.paidRate.toFixed(0)}% paid`}
            icon={ShoppingCart}
            tone="peach"
          />
          <MetricCard
            title="Average order value"
            value={money(analytics.aov)}
            change={analytics.hasComparableRange ? analytics.changes.aov : null}
            note="per paid order"
            icon={TrendingUp}
            tone="gold"
          />
          <MetricCard
            title="Units sold"
            value={number(analytics.units)}
            change={
              analytics.hasComparableRange ? analytics.changes.units : null
            }
            note={`${analytics.repeatRate.toFixed(0)}% repeat buyers`}
            icon={ShoppingBag}
            tone="blue"
          />
        </section>

        <section className="mb-6 grid gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(320px,0.75fr)]">
          <article className="rounded-2xl border border-[var(--color-border)] bg-white p-5 shadow-[0_8px_30px_rgba(61,66,62,0.05)] sm:p-6">
            <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-[var(--color-text-main)]">Revenue trend</h2>
                <p className="mt-1 text-sm font-medium text-[var(--color-text-muted)]">
                  Revenue from successfully paid orders
                </p>
              </div>
              <div className="rounded-xl bg-[#edf4ee] px-4 py-2 text-right">
                <p className="text-xs font-bold uppercase tracking-wide text-[#66806b]">
                  Period total
                </p>
                <p className="text-lg font-black text-[#4f6954]">{money(analytics.revenue)}</p>
                <p className="text-xs font-extrabold text-[#66806b]">{riel(analytics.revenue)}</p>
              </div>
            </div>
            <RevenueChart data={analytics.dailyRevenue} />
          </article>

          <article className="rounded-2xl border border-[var(--color-border)] bg-white p-5 shadow-[0_8px_30px_rgba(61,66,62,0.05)] sm:p-6">
            <div className="mb-5">
              <h2 className="text-xl font-bold text-[var(--color-text-main)]">Needs attention</h2>
              <p className="mt-1 text-sm font-medium text-[var(--color-text-muted)]">
                Priority tasks that can affect sales
              </p>
            </div>
            {attentionItems.length ? (
              <div className="space-y-3">
                {attentionItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      type="button"
                      key={item.title}
                      onClick={item.action}
                      className="flex w-full items-center gap-3 rounded-xl border border-[var(--color-border)] p-3.5 text-left transition hover:-translate-y-0.5 hover:shadow-md"
                    >
                      <span className={`rounded-lg p-2 ${item.tone}`}>
                        <Icon className="h-5 w-5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-black text-[var(--color-text-main)]">
                          {item.title}
                        </span>
                        <span className="mt-0.5 block text-xs font-medium text-[var(--color-text-muted)]">
                          {item.detail}
                        </span>
                      </span>
                      <ChevronRight className="h-4 w-4 shrink-0 text-[var(--color-text-muted)]" />
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="flex min-h-52 flex-col items-center justify-center text-center">
                <span className="rounded-full bg-[#edf5ee] p-3 text-[#66806b]">
                  <CheckCircle2 className="h-7 w-7" />
                </span>
                <p className="mt-3 font-black text-[var(--color-text-main)]">Everything looks healthy</p>
                <p className="mt-1 text-sm text-[var(--color-text-muted)]">No urgent actions right now.</p>
              </div>
            )}
          </article>
        </section>

        <section className="mb-6 grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
          <article className="rounded-2xl border border-[var(--color-border)] bg-white p-5 shadow-[0_8px_30px_rgba(61,66,62,0.05)] sm:p-6">
            <h2 className="text-xl font-bold text-[var(--color-text-main)]">Sales by category</h2>
            <p className="mt-1 text-sm font-medium text-[var(--color-text-muted)]">
              Categories driving paid revenue
            </p>
            {analytics.categories.length ? (
              <div className="mt-6 space-y-4">
                {analytics.categories.map((category, index) => (
                  <div key={category.name}>
                    <div className="mb-1.5 flex items-center justify-between gap-4 text-sm">
                      <span className="truncate font-bold text-[var(--color-text-main)]">
                        {category.name}
                      </span>
                      <span className="shrink-0 font-black">{money(category.value)}</span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-[var(--color-surface-soft)]">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${category.percentage}%`,
                          backgroundColor: CATEGORY_COLORS[index],
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-5">
                <EmptyState>Category sales will appear after paid orders.</EmptyState>
              </div>
            )}
          </article>

          <article className="rounded-2xl border border-[var(--color-border)] bg-white p-5 shadow-[0_8px_30px_rgba(61,66,62,0.05)] sm:p-6">
            <h2 className="text-xl font-bold text-[var(--color-text-main)]">Order progress</h2>
            <p className="mt-1 text-sm font-medium text-[var(--color-text-muted)]">
              Fulfillment status for the selected period
            </p>
            <div className="mt-6 space-y-4">
              {analytics.statusData.map((item, index) => (
                <div key={item.status} className="grid grid-cols-[86px_1fr_34px] items-center gap-3">
                  <span className="text-sm font-bold text-[var(--color-text-muted)]">{item.status}</span>
                  <div className="h-2.5 overflow-hidden rounded-full bg-[var(--color-surface-soft)]">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${item.percentage}%`,
                        backgroundColor: CATEGORY_COLORS[index],
                      }}
                    />
                  </div>
                  <span className="text-right text-sm font-black text-[var(--color-text-main)]">
                    {item.count}
                  </span>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => navigateFromDashboard("/admin/orders")}
              className="mt-6 inline-flex items-center gap-2 text-sm font-black text-[var(--color-primary-dark)]"
            >
              Manage all orders <ArrowRight className="h-4 w-4" />
            </button>
          </article>

          <article className="rounded-2xl border border-[var(--color-border)] bg-white p-5 shadow-[0_8px_30px_rgba(61,66,62,0.05)] sm:p-6 lg:col-span-2 xl:col-span-1">
            <h2 className="text-xl font-bold text-[var(--color-text-main)]">Inventory health</h2>
            <p className="mt-1 text-sm font-medium text-[var(--color-text-muted)]">
              Current stock exposure and value
            </p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-[#edf4ee] p-4">
                <Package className="h-5 w-5 text-[#66806b]" />
                <p className="mt-3 text-2xl font-black text-[#4f6954]">{number(analytics.inventoryUnits)}</p>
                <p className="mt-1 text-xs font-bold text-[#66806b]">Units in stock</p>
              </div>
              <div className="rounded-xl bg-[#f7f1e5] p-4">
                <CircleDollarSign className="h-5 w-5 text-[#96773e]" />
                <p className="mt-3 text-2xl font-black text-[#735c31]">{money(analytics.inventoryValue, true)}</p>
                <p className="mt-1 text-xs font-bold text-[#96773e]">Retail value</p>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between rounded-xl border border-[var(--color-border)] p-4">
              <div>
                <p className="text-sm font-black text-[var(--color-text-main)]">Product issues</p>
                <p className="mt-1 text-xs font-medium text-[var(--color-text-muted)]">
                  1 to {LOW_STOCK_THRESHOLD} units remaining
                </p>
              </div>
              <span className={`text-2xl font-black ${analytics.productIssues.length ? "text-[#ad6856]" : "text-[#66806b]"}`}>
                {analytics.productIssues.length}
              </span>
            </div>
            <div className="mt-3 flex items-center justify-between rounded-xl border border-[var(--color-border)] p-4">
              <div>
                <p className="text-sm font-black text-[var(--color-text-main)]">Sold out</p>
                <p className="mt-1 text-xs font-medium text-[var(--color-text-muted)]">
                  No stock remaining
                </p>
              </div>
              <span className={`text-2xl font-black ${analytics.outOfStock.length ? "text-[#ad6856]" : "text-[#66806b]"}`}>
                {analytics.outOfStock.length}
              </span>
            </div>
            <button
              type="button"
              onClick={() => navigateFromDashboard("/admin/products?inventory=issues")}
              className="mt-5 inline-flex items-center gap-2 text-sm font-black text-[var(--color-primary-dark)]"
            >
              Review inventory <ArrowRight className="h-4 w-4" />
            </button>
          </article>
        </section>

        <section className="mb-6 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <article className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white shadow-[0_8px_30px_rgba(61,66,62,0.05)]">
            <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-5 sm:px-6">
              <div>
                <h2 className="text-xl font-bold text-[var(--color-text-main)]">Top products</h2>
                <p className="mt-1 text-sm font-medium text-[var(--color-text-muted)]">
                  Ranked by paid revenue
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigateFromDashboard("/admin/products/best-sellers")}
                className="text-sm font-black text-[var(--color-primary-dark)]"
              >
                View all
              </button>
            </div>
            {analytics.topProducts.length ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[620px] text-left">
                  <thead className="bg-[var(--color-surface-soft)]/65 text-xs uppercase tracking-wide text-[var(--color-text-muted)]">
                    <tr>
                      <th className="px-6 py-3 font-black">Product</th>
                      <th className="px-4 py-3 text-right font-black">Units</th>
                      <th className="px-6 py-3 text-right font-black">Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-border)]">
                    {analytics.topProducts.map((product, index) => (
                      <tr key={`${product.id || product.name}-${index}`} className="hover:bg-[var(--color-surface-soft)]/35">
                        <td className="px-6 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[var(--color-surface-soft)]">
                              {product.image ? (
                                <img src={product.image} alt="" className="h-full w-full object-cover" />
                              ) : (
                                <Package className="h-5 w-5 text-[var(--color-text-muted)]" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-black text-[var(--color-text-main)]">
                                {product.name}
                              </p>
                              <p className="mt-0.5 text-xs font-medium text-[var(--color-text-muted)]">
                                #{index + 1} seller
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-right text-sm font-bold">
                          {number(product.quantity)}
                        </td>
                        <td className="px-6 py-3.5 text-right text-sm font-black">
                          {money(product.revenue)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-6">
                <EmptyState>Top-selling products will appear after paid orders.</EmptyState>
              </div>
            )}
          </article>

          <article className="rounded-2xl border border-[var(--color-border)] bg-white p-5 shadow-[0_8px_30px_rgba(61,66,62,0.05)] sm:p-6">
            <h2 className="text-xl font-bold text-[var(--color-text-main)]">Customer signals</h2>
            <p className="mt-1 text-sm font-medium text-[var(--color-text-muted)]">
              Indicators of loyalty and payment quality
            </p>
            <div className="mt-6 space-y-5">
              <div>
                <div className="mb-2 flex justify-between text-sm">
                  <span className="flex items-center gap-2 font-bold text-[var(--color-text-main)]">
                    <Users className="h-4 w-4 text-[var(--color-primary)]" />
                    Repeat customer rate
                  </span>
                  <span className="font-black">{analytics.repeatRate.toFixed(1)}%</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-[var(--color-surface-soft)]">
                  <div
                    className="h-full rounded-full bg-[var(--color-primary)]"
                    style={{ width: `${Math.min(analytics.repeatRate, 100)}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="mb-2 flex justify-between text-sm">
                  <span className="flex items-center gap-2 font-bold text-[var(--color-text-main)]">
                    <CreditCard className="h-4 w-4 text-[#b17b62]" />
                    Paid order rate
                  </span>
                  <span className="font-black">{analytics.paidRate.toFixed(1)}%</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-[var(--color-surface-soft)]">
                  <div
                    className="h-full rounded-full bg-[#E6BAA3]"
                    style={{ width: `${Math.min(analytics.paidRate, 100)}%` }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="rounded-xl border border-[var(--color-border)] p-4">
                  <p className="text-xs font-bold text-[var(--color-text-muted)]">Registered users</p>
                  <p className="mt-2 text-2xl font-black text-[var(--color-text-main)]">
                    {number(stats?.users)}
                  </p>
                </div>
                <div className="rounded-xl border border-[var(--color-border)] p-4">
                  <p className="text-xs font-bold text-[var(--color-text-muted)]">Catalog size</p>
                  <p className="mt-2 text-2xl font-black text-[var(--color-text-main)]">
                    {number(stats?.products)}
                  </p>
                </div>
              </div>
            </div>
          </article>
        </section>

        <section className="mb-6">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 fill-[#e2b95f] text-[#e2b95f]" />
                <h2 className="text-2xl font-bold text-[var(--color-text-main)]">Review health</h2>
              </div>
              <p className="mt-1 text-sm font-medium text-[var(--color-text-muted)]">
                Product satisfaction, rating quality, and items needing attention
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigateFromDashboard("/admin/products")}
              className="inline-flex items-center gap-2 text-sm font-black text-[var(--color-primary-dark)]"
            >
              View products <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <article className="rounded-2xl border border-[var(--color-border)] bg-white p-5 shadow-[0_8px_30px_rgba(61,66,62,0.05)]">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-[var(--color-text-muted)]">Avg sentiment score</p>
                <Star className="h-5 w-5 fill-[#e2b95f] text-[#e2b95f]" />
              </div>
              <p className="mt-3 text-3xl font-black">
                {analytics.reviewHealth.averageSentimentScore.toFixed(2)}
                <span className="text-base text-[var(--color-text-muted)]"> NLP</span>
              </p>
            </article>
            <button
              type="button"
              onClick={() => navigateFromDashboard("/admin/reviews")}
              className="rounded-2xl border border-[var(--color-border)] bg-white p-5 text-left shadow-[0_8px_30px_rgba(61,66,62,0.05)] transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-[var(--color-text-muted)]">Total reviews</p>
                <MessageSquareText className="h-5 w-5 text-[#668698]" />
              </div>
              <p className="mt-3 text-3xl font-black">{number(analytics.reviewHealth.totalReviews)}</p>
            </button>
            <button
              type="button"
              onClick={() => navigateFromDashboard("/admin/reviews/positive")}
              className="rounded-2xl border border-[var(--color-border)] bg-white p-5 text-left shadow-[0_8px_30px_rgba(61,66,62,0.05)] transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-[var(--color-text-muted)]">Positive reviews</p>
                <ThumbsUp className="h-5 w-5 text-[#66806b]" />
              </div>
              <p className="mt-3 text-3xl font-black">
                {analytics.reviewHealth.positiveSentimentRate.toFixed(0)}%
              </p>
              <p className="mt-1 text-xs font-semibold text-[var(--color-text-muted)]">AI-classified positive</p>
            </button>
            <button
              type="button"
              onClick={() => navigateFromDashboard("/admin/reviews/negative")}
              className="rounded-2xl border border-[var(--color-border)] bg-white p-5 text-left shadow-[0_8px_30px_rgba(61,66,62,0.05)] transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-[var(--color-text-muted)]">Needs attention</p>
                <AlertTriangle className="h-5 w-5 text-[#ad6856]" />
              </div>
              <p className="mt-3 text-3xl font-black text-[#ad6856]">
                {number(analytics.reviewHealth.sentimentCounts.Negative)}
              </p>
              <p className="mt-1 text-xs font-semibold text-[var(--color-text-muted)]">
                AI-classified negative
              </p>
            </button>
          </div>

          <div className="mb-6 grid gap-6 lg:grid-cols-2">
            <article className="rounded-2xl border border-[var(--color-border)] bg-white p-5 shadow-[0_8px_30px_rgba(61,66,62,0.05)] sm:p-6">
              <h3 className="text-xl font-bold text-[var(--color-text-main)]">Sentiment distribution</h3>
              <p className="mt-1 text-sm font-medium text-[var(--color-text-muted)]">
                Share of reviews by AI sentiment label
              </p>
              {analytics.reviewHealth.totalReviews ? (
                <div className="mt-6 space-y-4">
                  {SENTIMENT_LABELS.map((label) => {
                    const count = analytics.reviewHealth.sentimentCounts[label];
                    const percentage = analytics.reviewHealth.totalReviews
                      ? (count / analytics.reviewHealth.totalReviews) * 100
                      : 0;
                    const colors = {
                      Positive: "bg-[#66806b]",
                      Neutral: "bg-[#8EA7B8]",
                      Negative: "bg-[#ad6856]",
                    };

                    return (
                    <div key={label} className="grid grid-cols-[78px_1fr_48px] items-center gap-3">
                      <span className="text-sm font-black">
                        {label}
                      </span>
                      <div className="h-3 overflow-hidden rounded-full bg-[var(--color-surface-soft)]">
                        <div
                          className={`h-full rounded-full ${colors[label]}`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-right text-sm font-black">{count}</span>
                    </div>
                    );
                  })}
                </div>
              ) : (
                <div className="mt-5">
                  <EmptyState>Sentiment distribution will appear after customers submit reviews.</EmptyState>
                </div>
              )}
            </article>

            <article className="rounded-2xl border border-[var(--color-border)] bg-white p-5 shadow-[0_8px_30px_rgba(61,66,62,0.05)] sm:p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="text-xl font-bold text-[var(--color-text-main)]">Top negative sentiment categories</h3>
                  <p className="mt-1 text-sm font-medium text-[var(--color-text-muted)]">
                    Categories ranked by customer dissatisfaction signals
                  </p>
                </div>
                {hasMoreNegativeCategories && (
                  <button
                    type="button"
                    onClick={() => setShowAllNegativeCategories((current) => !current)}
                    className="inline-flex h-9 shrink-0 items-center justify-center rounded-xl border border-[var(--color-border)] px-3 text-xs font-black text-[var(--color-primary-dark)] transition hover:bg-[var(--color-surface-soft)]"
                  >
                    {showAllNegativeCategories
                      ? "Show top 6"
                      : `Show all ${negativeCategoryRows.length}`}
                  </button>
                )}
              </div>
              {negativeCategoryRows.length ? (
                <div
                  className="mt-6 space-y-4"
                  aria-label="Horizontal bar chart of categories with negative review sentiment"
                >
                  <div className="hidden grid-cols-[minmax(130px,0.8fr)_minmax(160px,1.45fr)_minmax(132px,0.7fr)] gap-4 px-1 text-[11px] font-black uppercase tracking-wide text-[var(--color-text-muted)] sm:grid">
                    <span>Category</span>
                    <span>Negative rate</span>
                    <span className="text-right">Reviews</span>
                  </div>
                  {displayedNegativeCategories.map((category) => {
                    const scaledWidth = Math.max(
                      (category.negativeRate / maxNegativeCategoryRate) * 100,
                      MIN_VISIBLE_BAR_WIDTH
                    );

                    return (
                      <div
                        key={category.name}
                        className="grid gap-2 rounded-xl border border-transparent px-1 py-1.5 transition hover:border-[var(--color-border)] hover:bg-[var(--color-surface-soft)] sm:grid-cols-[minmax(130px,0.8fr)_minmax(160px,1.45fr)_minmax(132px,0.7fr)] sm:items-center sm:gap-4"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-black text-[var(--color-text-main)]">
                            {category.name}
                          </p>
                          <p className="text-xs font-bold text-[var(--color-text-muted)] sm:hidden">
                            {number(category.negative)} negative / {number(category.reviewCount)}
                          </p>
                        </div>
                        <div className="relative h-8 min-w-0 overflow-hidden rounded-xl bg-[var(--color-surface-soft)]">
                          <div className="pointer-events-none absolute inset-0 grid grid-cols-4">
                            {[0, 1, 2, 3].map((index) => (
                              <span
                                key={index}
                                className="border-r border-white/70 last:border-r-0"
                              />
                            ))}
                          </div>
                          <div
                            className="relative h-full rounded-xl bg-[#ad6856] shadow-[inset_0_-1px_0_rgba(88,48,38,0.16)]"
                            style={{ width: `${scaledWidth}%` }}
                          />
                          <span className="absolute inset-y-0 right-3 flex items-center text-xs font-black text-[var(--color-text-main)]">
                            {category.negativeRate.toFixed(0)}%
                          </span>
                        </div>
                        <div className="hidden text-right sm:block">
                          <p className="text-sm font-black text-[var(--color-text-main)]">
                            {number(category.negative)}
                            <span className="text-xs text-[var(--color-text-muted)]">
                              {" "}negative
                            </span>
                          </p>
                          <p className="text-xs font-bold text-[var(--color-text-muted)]">
                            {number(category.reviewCount)} total
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  {hasMoreNegativeCategories && !showAllNegativeCategories && (
                    <p className="text-xs font-bold text-[var(--color-text-muted)]">
                      Showing top {NEGATIVE_CATEGORY_PREVIEW_LIMIT} of {negativeCategoryRows.length} categories with negative reviews.
                    </p>
                  )}
                </div>
              ) : (
                <div className="mt-5">
                  <EmptyState>Category sentiment will appear after customers submit reviews.</EmptyState>
                </div>
              )}
            </article>
          </div>

        </section>
      </div>

      {isNotificationModalOpen && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/55 px-4 py-6 backdrop-blur-sm"
          role="presentation"
          onClick={() => setIsNotificationModalOpen(false)}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="dashboard-notifications-title"
            className="flex max-h-[88vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="border-b border-[var(--color-border)] px-5 py-4 sm:px-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="mb-1 inline-flex items-center gap-2 text-sm font-black text-[var(--color-primary-dark)]">
                    <Bell className="h-4 w-4" />
                    {unreadNotificationCount} unread
                  </div>
                  <h2
                    id="dashboard-notifications-title"
                    className="text-2xl font-black text-[var(--color-text-main)]"
                  >
                    Notifications
                  </h2>
                  <p className="mt-1 text-sm font-medium text-[var(--color-text-muted)]">
                    Admin alerts and order activity.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsNotificationModalOpen(false)}
                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--color-border)] text-[var(--color-text-muted)] transition hover:bg-[var(--color-surface-soft)] hover:text-[var(--color-text-main)]"
                  aria-label="Close notifications"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="inline-flex w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-base)] p-1 sm:w-auto">
                  {NOTIFICATION_FILTERS.map((filter) => (
                    <button
                      key={filter.key}
                      type="button"
                      onClick={() => setNotificationFilter(filter.key)}
                      className={`h-9 flex-1 rounded-lg px-4 text-sm font-black transition sm:flex-none ${
                        notificationFilter === filter.key
                          ? "bg-[var(--color-primary)] text-white"
                          : "text-[var(--color-text-muted)] hover:bg-white hover:text-[var(--color-text-main)]"
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <label className="relative block w-full sm:w-64">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-muted)]" />
                    <input
                      type="search"
                      value={notificationSearchTerm}
                      onChange={(event) => setNotificationSearchTerm(event.target.value)}
                      placeholder="Search notifications"
                      className="h-10 w-full rounded-xl border border-[var(--color-border)] bg-white px-10 text-sm font-bold text-[var(--color-text-main)] outline-none focus:border-[var(--color-primary)]"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={handleMarkAllNotificationsRead}
                    disabled={unreadNotificationCount === 0 || notificationBulkBusy === "mark-all"}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] px-4 text-sm font-black text-white transition hover:bg-[var(--color-primary-dark)] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {notificationBulkBusy === "mark-all" ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCheck className="h-4 w-4" />
                    )}
                    Mark All Read
                  </button>
                </div>
              </div>

              <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
                {NOTIFICATION_CATEGORY_FILTERS.map((category) => (
                  <button
                    key={category.key}
                    type="button"
                    onClick={() => setNotificationCategory(category.key)}
                    className={`inline-flex h-9 shrink-0 items-center gap-2 rounded-full border px-3 text-xs font-black transition ${
                      notificationCategory === category.key
                        ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-white"
                        : "border-[var(--color-border)] bg-white text-[var(--color-text-muted)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary-dark)]"
                    }`}
                  >
                    {category.label}
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] ${
                        notificationCategory === category.key
                          ? "bg-white/20 text-white"
                          : "bg-[var(--color-surface-soft)] text-[var(--color-text-muted)]"
                      }`}
                    >
                      {notificationCategoryCounts[category.key] || 0}
                    </span>
                  </button>
                ))}
              </div>
            </header>

            {(notificationError || notificationNotice) && (
              <div className="space-y-2 border-b border-[var(--color-border)] px-5 py-3 sm:px-6">
                {notificationError && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                    {notificationError}
                  </div>
                )}
                {notificationNotice && (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
                    {notificationNotice}
                  </div>
                )}
              </div>
            )}

            <div className="min-h-0 flex-1 overflow-y-auto">
              {notificationLoading ? (
                <div className="flex min-h-72 flex-col items-center justify-center gap-3 px-6 py-10 text-center">
                  <Loader2 className="h-7 w-7 animate-spin text-[var(--color-primary)]" />
                  <p className="text-sm font-black text-[var(--color-text-muted)]">
                    Loading notifications...
                  </p>
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div className="flex min-h-72 flex-col items-center justify-center px-6 py-10 text-center">
                  <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-[var(--color-surface-soft)] text-[var(--color-text-muted)]">
                    <Inbox className="h-7 w-7" />
                  </div>
                  <h3 className="text-xl font-black text-[var(--color-text-main)]">
                    No notifications found
                  </h3>
                  <p className="mt-2 max-w-md text-sm font-medium text-[var(--color-text-muted)]">
                    {notifications.length === 0
                      ? "New admin notifications will appear here."
                      : "Try a different filter or search term."}
                  </p>
                </div>
              ) : (
                <ul className="divide-y divide-[var(--color-border)]">
                  {filteredNotifications.map((notification) => {
                    const notificationId = notification._id;
                    const categoryKey = getNotificationCategory(notification);
                    const categoryStyle =
                      NOTIFICATION_CATEGORY_STYLES[categoryKey] ||
                      NOTIFICATION_CATEGORY_STYLES.system;
                    const CategoryIcon = categoryStyle.icon || Bell;
                    const person = getNotificationPerson(notification);
                    const createdAtTitle = getNotificationDateTitle(notification.createdAt);

                    return (
                      <li
                        key={notificationId}
                        className={`transition ${
                          notification.isRead
                            ? "bg-white"
                            : "bg-[var(--color-secondary-light)]/45"
                        }`}
                      >
                        <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between sm:p-5">
                          <button
                            type="button"
                            onClick={() => handleOpenNotification(notification)}
                            className="group flex min-w-0 flex-1 gap-4 text-left"
                          >
                            <span
                              className={`mt-1 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${categoryStyle.iconBox}`}
                            >
                              <CategoryIcon className="h-5 w-5" strokeWidth={2.5} aria-hidden="true" />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="mb-2 flex flex-wrap items-center gap-2">
                                <span
                                  className={`inline-flex h-7 items-center rounded-full border px-3 text-[11px] font-black uppercase ${categoryStyle.pill}`}
                                >
                                  {categoryStyle.label}
                                </span>
                                {!notification.isRead && (
                                  <span className="inline-flex h-6 items-center rounded-full bg-[var(--color-primary)] px-2.5 text-[10px] font-black uppercase text-white">
                                    Unread
                                  </span>
                                )}
                              </span>
                              <span className="block truncate text-base font-black text-[var(--color-text-main)] group-hover:text-[var(--color-primary-dark)]">
                                {notification.title || "Notification"}
                              </span>
                              <span className="mt-1 block text-sm font-medium leading-6 text-[var(--color-text-muted)]">
                                {notification.message || "No message provided."}
                              </span>
                              <span className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-bold text-[var(--color-text-muted)]">
                                <span className="inline-flex items-center gap-1" title={createdAtTitle}>
                                  <Clock className="h-3.5 w-3.5" />
                                  {getNotificationTime(notification.createdAt)}
                                </span>
                                {person && <span>{person}</span>}
                                <span className="text-[var(--color-primary-dark)]">
                                  Open related page
                                </span>
                              </span>
                            </span>
                          </button>

                          <div className="flex shrink-0 items-center gap-2 pl-[60px] sm:pl-0">
                            {!notification.isRead && (
                              <button
                                type="button"
                                onClick={() => markNotificationAsRead(notificationId)}
                                disabled={getNotificationBusy("read", notificationId)}
                                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-50"
                                aria-label="Mark notification as read"
                                title="Mark as read"
                              >
                                {getNotificationBusy("read", notificationId) ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Check className="h-4 w-4" />
                                )}
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleDeleteNotification(notificationId)}
                              disabled={getNotificationBusy("delete", notificationId)}
                              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-red-200 bg-red-50 text-red-600 transition hover:bg-red-100 disabled:opacity-50"
                              aria-label="Delete notification"
                              title="Delete notification"
                            >
                              {getNotificationBusy("delete", notificationId) ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
