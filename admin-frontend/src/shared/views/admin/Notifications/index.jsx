import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  Check,
  CheckCheck,
  CircleDollarSign,
  Clock,
  ExternalLink,
  Inbox,
  Info,
  LifeBuoy,
  Loader2,
  Package,
  RefreshCw,
  Search,
  ShoppingCart,
  Trash2,
  UserPlus,
  X,
} from "lucide-react";
import Loading from "../../../components/common/Loading";
import { NotificationController } from "../../../controllers";
import { subscribeRealtimeEvent } from "../../../services/realtime";
import {
  getPortalDashboardPath,
  getPortalOrderDetailsPath,
  getStoredAdminUser,
} from "../../../utils/adminSession";

const NOTIFICATION_UPDATED_EVENT = "admin-notifications-updated";
const MARK_ALL_READ_NOTICE = "All notifications marked as read.";
const DELETE_NOTIFICATION_NOTICE = "Notification deleted.";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "unread", label: "Unread" },
  { key: "read", label: "Read" },
];

const CATEGORY_FILTERS = [
  { key: "all", label: "All" },
  { key: "orders", label: "Orders" },
  { key: "payments", label: "Payments" },
  { key: "stock", label: "Stock" },
  { key: "support", label: "Support" },
  { key: "products", label: "Products" },
  { key: "users", label: "Users" },
  { key: "system", label: "System" },
];

const SELLER_CATEGORY_KEYS = new Set(["all", "orders", "payments"]);
const SELLER_CATEGORY_FILTERS = CATEGORY_FILTERS.filter((category) =>
  SELLER_CATEGORY_KEYS.has(category.key)
);
const SELLER_NOTIFICATION_CATEGORIES = new Set(["orders", "payments"]);

const CATEGORY_STYLES = {
  orders: {
    label: "Orders",
    icon: ShoppingCart,
    pill: "border-blue-200 bg-blue-50 text-blue-700",
    iconBox: "bg-blue-600 text-white shadow-blue-600/20",
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
    iconBox: "bg-orange-500 text-white shadow-orange-500/20",
  },
  support: {
    label: "Support",
    icon: LifeBuoy,
    pill: "border-violet-200 bg-violet-50 text-violet-700",
    iconBox: "bg-violet-600 text-white shadow-violet-600/20",
  },
  products: {
    label: "Products",
    icon: Package,
    pill: "border-amber-200 bg-amber-50 text-amber-700",
    iconBox: "bg-amber-500 text-white shadow-amber-500/20",
  },
  users: {
    label: "Users",
    icon: UserPlus,
    pill: "border-cyan-200 bg-cyan-50 text-cyan-700",
    iconBox: "bg-cyan-600 text-white shadow-cyan-600/20",
  },
  system: {
    label: "System",
    icon: Info,
    pill: "border-gray-200 bg-gray-50 text-gray-700",
    iconBox: "bg-gray-600 text-white shadow-gray-600/20",
  },
};

const getEntityId = (value) => {
  if (!value) return "";
  if (typeof value === "object") return value._id || value.id || "";
  return String(value);
};

const getPathFromLink = (link) => {
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

const getOrderIdFromPath = (path) => {
  const match = path.match(/^\/(?:admin|seller|delivery)\/orders\/([^/?#]+)/);
  return match?.[1] || "";
};

const normalizeAdminPath = (path) => {
  if (!path) return "";

  const orderId = getOrderIdFromPath(path);
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

const getNotificationTarget = (notification, adminUser) => {
  const linkPath = normalizeAdminPath(getPathFromLink(notification?.link));
  const linkOrderId = getOrderIdFromPath(linkPath);
  if (linkOrderId) return getPortalOrderDetailsPath(linkOrderId, adminUser);
  if (linkPath && adminUser?.role === "admin") return linkPath;

  const orderId = getEntityId(notification?.orderId);
  if (orderId) return getPortalOrderDetailsPath(orderId, adminUser);

  if (adminUser?.role === "admin") {
    if (notification?.type === "user") return "/admin/users";
    if (notification?.type === "product") return "/admin/products";
  }

  return getPortalDashboardPath(adminUser);
};

const getNotificationCategory = (notification) => {
  const title = String(notification?.title || "").toLowerCase();
  const message = String(notification?.message || "").toLowerCase();
  const link = String(notification?.link || "").toLowerCase();
  const haystack = `${title} ${message} ${link}`;

  if (
    notification?.type === "payment" ||
    haystack.includes("payment") ||
    haystack.includes("paid by")
  ) {
    return "payments";
  }

  if (
    haystack.includes("low stock") ||
    haystack.includes("out of stock") ||
    haystack.includes("stock threshold")
  ) {
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

export default function AdminNotifications() {
  const navigate = useNavigate();
  const adminUser = getStoredAdminUser();
  const isSeller = adminUser?.role === "seller";
  const categoryFilters = isSeller ? SELLER_CATEGORY_FILTERS : CATEGORY_FILTERS;
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionBusy, setActionBusy] = useState("");
  const [bulkBusy, setBulkBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedNotification, setSelectedNotification] = useState(null);
  const noticeTimerRef = useRef(null);

  const loadNotifications = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    setError("");

    const result = await NotificationController.getNotifications();
    if (result.success) {
      setNotifications(Array.isArray(result.data) ? result.data : []);
    } else {
      setError(result.error);
    }

    if (!silent) setLoading(false);
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
      if (noticeTimerRef.current) {
        window.clearTimeout(noticeTimerRef.current);
      }
    },
    []
  );

  useEffect(() => {
    if (!selectedNotification) return undefined;

    const handleEscapeKey = (event) => {
      if (event.key === "Escape") {
        setSelectedNotification(null);
      }
    };

    window.addEventListener("keydown", handleEscapeKey);

    return () => {
      window.removeEventListener("keydown", handleEscapeKey);
    };
  }, [selectedNotification]);

  const showTimedNotice = useCallback((message) => {
    setNotice(message);

    if (noticeTimerRef.current) {
      window.clearTimeout(noticeTimerRef.current);
    }

    noticeTimerRef.current = window.setTimeout(() => {
      setNotice((currentNotice) => (currentNotice === message ? "" : currentNotice));
      noticeTimerRef.current = null;
    }, 2000);
  }, []);

  const effectiveActiveCategory =
    isSeller && !categoryFilters.some((category) => category.key === activeCategory)
      ? "all"
      : activeCategory;

  const visibleNotifications = useMemo(
    () =>
      isSeller
        ? notifications.filter((notification) =>
            SELLER_NOTIFICATION_CATEGORIES.has(getNotificationCategory(notification))
          )
        : notifications,
    [isSeller, notifications]
  );

  const unreadCount = useMemo(
    () => visibleNotifications.filter((notification) => !notification.isRead).length,
    [visibleNotifications]
  );

  const filteredNotifications = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return visibleNotifications.filter((notification) => {
      if (activeFilter === "unread" && notification.isRead) return false;
      if (activeFilter === "read" && !notification.isRead) return false;
      if (
        effectiveActiveCategory !== "all" &&
        getNotificationCategory(notification) !== effectiveActiveCategory
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
        CATEGORY_STYLES[category]?.label,
        notification.audience,
        notification._id,
        getEntityId(notification.orderId),
        person,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(search);
    });
  }, [effectiveActiveCategory, activeFilter, searchTerm, visibleNotifications]);

  const categoryCounts = useMemo(() => {
    const counts = categoryFilters.reduce(
      (result, category) => ({ ...result, [category.key]: 0 }),
      {}
    );

    visibleNotifications.forEach((notification) => {
      if (activeFilter === "unread" && notification.isRead) return;
      if (activeFilter === "read" && !notification.isRead) return;

      const category = getNotificationCategory(notification);
      counts.all += 1;
      counts[category] = Number(counts[category] || 0) + 1;
    });

    return counts;
  }, [activeFilter, categoryFilters, visibleNotifications]);

  const markNotificationAsRead = useCallback(async (notificationId, { quiet = false } = {}) => {
    if (!notificationId) return false;

    setActionBusy(`read:${notificationId}`);
    if (!quiet) {
      setError("");
      setNotice("");
    }

    const result = await NotificationController.markAsRead(notificationId);
    setActionBusy("");

    if (!result.success) {
      if (!quiet) setError(result.error);
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

    if (!quiet) setNotice("Notification marked as read.");
    return true;
  }, []);

  const handleOpenNotification = async (notification) => {
    const target = getNotificationTarget(notification, adminUser);

    if (!notification.isRead) {
      await markNotificationAsRead(notification._id, { quiet: true });
    }

    if (isSeller) {
      setSelectedNotification({ ...notification, isRead: true });
      return;
    }

    navigate(target);
  };

  const handleOpenSelectedTarget = () => {
    if (!selectedNotification) return;

    const target = getNotificationTarget(selectedNotification, adminUser);
    setSelectedNotification(null);
    navigate(target);
  };

  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0 || bulkBusy) return;

    setBulkBusy("mark-all");
    setError("");
    setNotice("");

    const result = await NotificationController.markAllAsRead();
    setBulkBusy("");

    if (!result.success) {
      setError(result.error);
      return;
    }

    setNotifications((currentNotifications) =>
      currentNotifications.map((notification) => ({ ...notification, isRead: true }))
    );
    showTimedNotice(MARK_ALL_READ_NOTICE);
    dispatchNotificationUpdate();
  };

  const handleDeleteNotification = async (notificationId) => {
    if (!notificationId) return;

    setActionBusy(`delete:${notificationId}`);
    setError("");
    setNotice("");

    const result = await NotificationController.deleteNotification(notificationId);
    setActionBusy("");

    if (!result.success) {
      setError(result.error);
      return;
    }

    setNotifications((currentNotifications) =>
      currentNotifications.filter((notification) => notification._id !== notificationId)
    );
    setSelectedNotification((currentNotification) =>
      currentNotification?._id === notificationId ? null : currentNotification
    );
    showTimedNotice(DELETE_NOTIFICATION_NOTICE);
    dispatchNotificationUpdate();
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadNotifications({ silent: true });
    setRefreshing(false);
  };

  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
  };

  const handleCategoryChange = (category) => {
    setActiveCategory(category);
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const getBusy = (action, notificationId) => actionBusy === `${action}:${notificationId}`;
  const selectedCategoryKey = selectedNotification
    ? getNotificationCategory(selectedNotification)
    : "system";
  const selectedCategoryStyle = CATEGORY_STYLES[selectedCategoryKey] || CATEGORY_STYLES.system;
  const SelectedCategoryIcon = selectedCategoryStyle.icon || Bell;
  const selectedPerson = getNotificationPerson(selectedNotification);
  const selectedCreatedAtTitle = getNotificationDateTitle(selectedNotification?.createdAt);

  if (loading) {
    return <Loading message="Loading notifications..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {selectedNotification && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-gray-950/50 px-4 py-6 backdrop-blur-sm"
          onClick={() => setSelectedNotification(null)}
        >
          <div
            className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="seller-notification-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-5">
              <div className="flex min-w-0 items-start gap-4">
                <span
                  className={`inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl shadow-lg ${selectedCategoryStyle.iconBox}`}
                >
                  <SelectedCategoryIcon className="h-6 w-6" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <span
                    className={`mb-2 inline-flex h-7 items-center rounded-full border px-3 text-[11px] font-black uppercase ${selectedCategoryStyle.pill}`}
                  >
                    {selectedCategoryStyle.label}
                  </span>
                  <h2 id="seller-notification-title" className="text-xl font-black text-gray-950">
                    {selectedNotification.title || "Notification"}
                  </h2>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedNotification(null)}
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
                aria-label="Close notification"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="px-5 py-5">
              <p className="text-base font-semibold leading-7 text-gray-700">
                {selectedNotification.message || "No message provided."}
              </p>

              <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-bold text-gray-500">
                <span className="inline-flex items-center gap-1" title={selectedCreatedAtTitle}>
                  <Clock className="h-4 w-4" />
                  {getNotificationTime(selectedNotification.createdAt)}
                </span>
                {selectedPerson && <span>{selectedPerson}</span>}
              </div>
            </div>

            <div className="flex flex-col-reverse gap-2 border-t border-gray-100 bg-gray-50 px-5 py-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setSelectedNotification(null)}
                className="inline-flex h-11 items-center justify-center rounded-xl border border-gray-200 bg-white px-4 text-sm font-black text-gray-700 transition-colors hover:bg-gray-100"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleOpenSelectedTarget}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] px-4 text-sm font-black text-white shadow-lg shadow-[var(--color-primary)]/20 transition-colors hover:bg-[var(--color-primary-dark)]"
              >
                <ExternalLink className="h-4 w-4" />
                Open related page
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
              <p className="mt-1 text-sm text-gray-500">
                {isSeller ? "Seller order and payment activity." : "Admin alerts and order activity."}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="inline-flex h-10 items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-4 text-sm font-black text-gray-700">
                <Bell className="h-4 w-4 text-[var(--color-primary)]" />
                {unreadCount} Unread
              </div>
              <div className="inline-flex h-10 items-center rounded-lg border border-gray-200 bg-gray-50 px-4 text-sm font-black text-gray-700">
                {visibleNotifications.length} Total
              </div>
              <button
                type="button"
                onClick={handleRefresh}
                disabled={refreshing}
                className="inline-flex h-10 items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 text-sm font-bold text-gray-700 transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                Refresh
              </button>
              <button
                type="button"
                onClick={handleMarkAllAsRead}
                disabled={unreadCount === 0 || bulkBusy === "mark-all"}
                className="inline-flex h-10 items-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 text-sm font-bold text-white transition hover:bg-[var(--color-primary-dark)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {bulkBusy === "mark-all" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCheck className="h-4 w-4" />
                )}
                Mark All Read
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
            {error}
          </div>
        )}
        {notice && (
          <div className="mb-5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
            {notice}
          </div>
        )}

        <div className="mb-5 space-y-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="inline-flex w-full rounded-lg border border-gray-200 bg-white p-1 shadow-sm sm:w-auto">
              {FILTERS.map((filter) => (
                <button
                  key={filter.key}
                  type="button"
                  onClick={() => handleFilterChange(filter.key)}
                  className={`h-9 flex-1 rounded-md px-4 text-sm font-black transition sm:flex-none ${
                    activeFilter === filter.key
                      ? "bg-[var(--color-primary)] text-white"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-950"
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            <label className="relative block w-full lg:max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="search"
                value={searchTerm}
                onChange={handleSearchChange}
                placeholder="Search notifications"
                className="h-11 w-full rounded-lg border border-gray-200 bg-white px-10 text-sm font-semibold text-gray-800 outline-none transition focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary)]/10"
              />
            </label>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1">
            {categoryFilters.map((category) => (
              <button
                key={category.key}
                type="button"
                onClick={() => handleCategoryChange(category.key)}
                className={`inline-flex h-10 shrink-0 items-center gap-2 rounded-lg border px-3 text-sm font-black transition ${
                  effectiveActiveCategory === category.key
                    ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-white"
                    : "border-gray-200 bg-white text-gray-600 hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
                }`}
              >
                {category.label}
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] ${
                    effectiveActiveCategory === category.key
                      ? "bg-white/20 text-white"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {categoryCounts[category.key] || 0}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          {filteredNotifications.length === 0 ? (
            <div className="flex min-h-80 flex-col items-center justify-center px-6 py-14 text-center">
              <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
                <Inbox className="h-7 w-7" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">No notifications found</h2>
              <p className="mt-2 max-w-md text-sm font-medium text-gray-500">
                {visibleNotifications.length === 0
                  ? isSeller
                    ? "New seller order and payment notifications will appear here."
                    : "New admin notifications will appear here."
                  : "Try a different filter or search term."}
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {filteredNotifications.map((notification) => {
                const notificationId = notification._id;
                const categoryKey = getNotificationCategory(notification);
                const categoryStyle = CATEGORY_STYLES[categoryKey] || CATEGORY_STYLES.system;
                const CategoryIcon = categoryStyle.icon || Bell;
                const person = getNotificationPerson(notification);
                const createdAtTitle = getNotificationDateTitle(notification.createdAt);

                return (
                  <li
                    key={notificationId}
                    className={`transition ${
                      notification.isRead ? "bg-white" : "bg-[var(--color-secondary-light)]/45"
                    }`}
                  >
                    <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between sm:p-5">
                      <button
                        type="button"
                        onClick={() => handleOpenNotification(notification)}
                        className="group flex min-w-0 flex-1 gap-4 text-left"
                      >
                        <span
                          className={`mt-1 inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl shadow-lg ${categoryStyle.iconBox}`}
                        >
                          <CategoryIcon className="h-6 w-6" strokeWidth={2.5} aria-hidden="true" />
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
                          <span className="block truncate text-base font-black text-gray-950 group-hover:text-[var(--color-primary)]">
                            {notification.title || "Notification"}
                          </span>
                          <span className="mt-1 block text-sm font-medium leading-6 text-gray-600">
                            {notification.message || "No message provided."}
                          </span>
                          <span className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-bold text-gray-500">
                            <span className="inline-flex items-center gap-1" title={createdAtTitle}>
                              <Clock className="h-3.5 w-3.5" />
                              {getNotificationTime(notification.createdAt)}
                            </span>
                            {person && <span>{person}</span>}
                            <span className="text-[var(--color-primary)]">Open related page</span>
                          </span>
                        </span>
                      </button>

                      <div className="flex shrink-0 items-center gap-2 pl-[60px] sm:pl-0">
                        {!notification.isRead && (
                          <button
                            type="button"
                            onClick={() => markNotificationAsRead(notificationId)}
                            disabled={getBusy("read", notificationId)}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-50"
                            aria-label="Mark notification as read"
                            title="Mark as read"
                          >
                            {getBusy("read", notificationId) ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Check className="h-4 w-4" />
                            )}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDeleteNotification(notificationId)}
                          disabled={getBusy("delete", notificationId)}
                          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-600 transition hover:bg-red-100 disabled:opacity-50"
                          aria-label="Delete notification"
                          title="Delete notification"
                        >
                          {getBusy("delete", notificationId) ? (
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
      </div>
    </div>
  );
}
