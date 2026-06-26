import { Fragment, useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
    CalendarDays,
    ChevronDown,
    CheckCircle,
    Package,
    Search,
    Filter,
    Eye,
    MapPin,
    Navigation,
    Phone,
    Printer,
    LogOut,
    Loader2,
} from "lucide-react";
import { OrderController } from "../../../controllers";
import Loading from "../../../components/common/Loading";
import { createReceiptImageBlob } from "../../../utils/orderReceiptImage";
import {
    clearAdminSession,
    getPortalLoginPath,
    getPortalOrderDetailsPath,
    getStoredAdminUser,
} from "../../../utils/adminSession";
import {
    disconnectRealtime,
    subscribeRealtimeDomains,
    subscribeRealtimeEvent,
} from "../../../services/realtime";

const DELIVERY_VISIBLE_STATUSES = ["Processing", "Delivered"];
const DELIVERY_ORDERS_CACHE_KEY = "adminDeliveryOrdersCache";
const DELIVERY_ORDERS_VIEW_STATE_KEY = "adminDeliveryOrdersViewState";

const readCachedDeliveryOrders = () => {
    try {
        const cachedOrders = JSON.parse(sessionStorage.getItem(DELIVERY_ORDERS_CACHE_KEY) || "[]");
        return Array.isArray(cachedOrders) ? cachedOrders : [];
    } catch {
        return [];
    }
};

const readCachedDeliveryViewState = () => {
    try {
        const cachedState = JSON.parse(sessionStorage.getItem(DELIVERY_ORDERS_VIEW_STATE_KEY) || "{}");
        return cachedState && typeof cachedState === "object" ? cachedState : {};
    } catch {
        return {};
    }
};

const AdminOrders = ({ renderDelivery }) => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const adminUser = getStoredAdminUser();
    const isDelivery = adminUser?.role === "delivery";
    const isSeller = adminUser?.role === "seller";
    const initialDeliveryOrders = isDelivery ? readCachedDeliveryOrders() : [];
    const initialDeliveryViewState = isDelivery ? readCachedDeliveryViewState() : {};
    const [orders, setOrders] = useState(initialDeliveryOrders);
    const [filteredOrders, setFilteredOrders] = useState(initialDeliveryOrders);
    const [loading, setLoading] = useState(!(isDelivery && initialDeliveryOrders.length > 0));
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState(initialDeliveryViewState.searchTerm || "");
    const initialStatus = searchParams.get("status") || initialDeliveryViewState.statusFilter || "All";
    const [statusFilter, setStatusFilter] = useState(initialStatus);
    const [expandedOrderDates, setExpandedOrderDates] = useState(
        initialDeliveryViewState.expandedOrderDates || {}
    );
    const [confirmingOrderId, setConfirmingOrderId] = useState("");
    const [sendingReceiptOrderId, setSendingReceiptOrderId] = useState("");
    const [receiptNotice, setReceiptNotice] = useState("");
    const [deliveryBusyLabel, setDeliveryBusyLabel] = useState("");
    const [deliveryNavigatingOrderId, setDeliveryNavigatingOrderId] = useState("");
    const [deliveryMapOrderId, setDeliveryMapOrderId] = useState("");
    const receiptNoticeTimeoutRef = useRef(null);
    const fetchOrders = useCallback(async ({ silent = false } = {}) => {
        try {
            if (!silent) {
                setLoading(true);
            }
            const response = await OrderController.getOrders();
            setOrders(response.data);
            setFilteredOrders(response.data);
            if (isDelivery) {
                sessionStorage.setItem(DELIVERY_ORDERS_CACHE_KEY, JSON.stringify(response.data));
            }
            setLoading(false);
        } catch (err) {
            setError(err.response?.data?.message || "Failed to fetch orders");
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchOrders({ silent: isDelivery && initialDeliveryOrders.length > 0 });
    }, [fetchOrders]);

    useEffect(() => {
        if (isDelivery) {
            sessionStorage.setItem(DELIVERY_ORDERS_CACHE_KEY, JSON.stringify(orders));
        }
    }, [isDelivery, orders]);

    useEffect(() => {
        if (isDelivery) {
            sessionStorage.setItem(
                DELIVERY_ORDERS_VIEW_STATE_KEY,
                JSON.stringify({
                    searchTerm,
                    statusFilter,
                    expandedOrderDates,
                })
            );
        }
    }, [expandedOrderDates, isDelivery, searchTerm, statusFilter]);

    useEffect(() => {
        return () => {
            if (receiptNoticeTimeoutRef.current) {
                window.clearTimeout(receiptNoticeTimeoutRef.current);
            }
        };
    }, []);

    useEffect(() => {
        const refreshOrders = () => {
            fetchOrders({ silent: true });
        };

        const patchOrderFromRealtime = (payload = {}) => {
            const orderId = payload.orderId || payload._id;

            if (!orderId) {
                return;
            }

            setOrders((currentOrders) =>
                currentOrders.map((order) =>
                    order._id === orderId
                        ? {
                            ...order,
                            ...Object.fromEntries(
                                Object.entries({
                                    orderStatus: payload.orderStatus,
                                    paymentStatus: payload.paymentStatus,
                                    isPaid: payload.isPaid,
                                    isDelivered: payload.isDelivered,
                                    processedAt: payload.processedAt,
                                    shippedAt: payload.shippedAt,
                                    deliveredAt: payload.deliveredAt,
                                    receiptSent: payload.receiptSent,
                                    orderItems: payload.orderItems,
                                    shippingAddress: payload.shippingAddress,
                                    paymentMethod: payload.paymentMethod,
                                    taxPrice: payload.taxPrice,
                                    shippingPrice: payload.shippingPrice,
                                    totalPrice: payload.totalPrice,
                                    deliveryProof: payload.deliveryProof,
                                    updatedAt: payload.updatedAt,
                                }).filter(([, value]) => value !== undefined)
                            ),
                        }
                        : order
                )
            );
        };

        const unsubscribeCreated = subscribeRealtimeEvent("order:created", refreshOrders);
        const unsubscribeUpdated = subscribeRealtimeEvent("order:updated", patchOrderFromRealtime);
        const unsubscribeOrderChanges = subscribeRealtimeDomains(
            ["orders"],
            refreshOrders
        );

        window.addEventListener("admin-orders-updated", refreshOrders);

        return () => {
            unsubscribeCreated();
            unsubscribeUpdated();
            unsubscribeOrderChanges();
            window.removeEventListener("admin-orders-updated", refreshOrders);
        };
    }, [fetchOrders]);

    useEffect(() => {
        filterOrders();
    }, [searchTerm, statusFilter, orders]);

    const getOrderDateKey = (createdAt) => {
        const date = createdAt ? new Date(createdAt) : null;

        if (!date || Number.isNaN(date.getTime())) {
            return "unknown";
        }

        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");

        return `${year}-${month}-${day}`;
    };

    const formatOrderDate = (dateKey) => {
        if (dateKey === "unknown") {
            return "Date unknown";
        }

        return new Date(`${dateKey}T00:00:00`).toLocaleDateString(undefined, {
            month: "long",
            day: "numeric",
            year: "numeric",
        });
    };

    const groupedOrders = useMemo(() => {
        const groupsByDate = filteredOrders.reduce((groups, order) => {
            const dateKey = getOrderDateKey(order.createdAt);

            if (!groups[dateKey]) {
                groups[dateKey] = {
                    dateKey,
                    label: formatOrderDate(dateKey),
                    orders: [],
                    total: 0,
                };
            }

            groups[dateKey].orders.push(order);
            groups[dateKey].total += order.totalPrice || 0;

            return groups;
        }, {});

        return Object.values(groupsByDate)
            .map((group) => ({
                ...group,
                orders: group.orders.sort(
                    (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
                ),
            }))
            .sort((a, b) => {
                if (a.dateKey === "unknown") return 1;
                if (b.dateKey === "unknown") return -1;
                return new Date(`${b.dateKey}T00:00:00`) - new Date(`${a.dateKey}T00:00:00`);
            });
    }, [filteredOrders]);

    useEffect(() => {
        if (groupedOrders.length === 0) {
            setExpandedOrderDates({});
            return;
        }

        setExpandedOrderDates((current) => {
            const next = groupedOrders.reduce((dates, group) => {
                dates[group.dateKey] = current[group.dateKey] || false;
                return dates;
            }, {});

            const hasOpenVisibleGroup = groupedOrders.some((group) => next[group.dateKey]);

            if (!hasOpenVisibleGroup) {
                next[groupedOrders[0].dateKey] = true;
            }

            return next;
        });
    }, [groupedOrders]);

    const filterOrders = () => {
        let filtered = isDelivery
            ? orders.filter((order) =>
                DELIVERY_VISIBLE_STATUSES.includes(normalizeOrderStatus(order.orderStatus))
            )
            : orders;

        // Filter by status
        if (statusFilter !== "All") {
            filtered = filtered.filter((order) => normalizeOrderStatus(order.orderStatus) === statusFilter);
        }

        // Search by order ID or user email
        if (searchTerm) {
            const normalizedSearchTerm = searchTerm.toLowerCase();
            filtered = filtered.filter(
                (order) =>
                    order._id.toLowerCase().includes(normalizedSearchTerm) ||
                    order.user?.email?.toLowerCase().includes(normalizedSearchTerm) ||
                    order.user?.name?.toLowerCase().includes(normalizedSearchTerm) ||
                    order.shippingAddress?.fullName?.toLowerCase().includes(normalizedSearchTerm) ||
                    (!order.user && "deleted customer account deleted".includes(normalizedSearchTerm))
            );
        }

        setFilteredOrders(filtered);
    };

    const isOrderPaid = (order) =>
        order?.isPaid === true || order?.paymentStatus === "Paid";

    const canAdminCancelOrder = (order) => {
        const status = normalizeOrderStatus(order?.orderStatus);
        return !isOrderPaid(order) && !["Cancelled", "Delivered"].includes(status);
    };

    const handleCancelOrder = async (order) => {
        if (!canAdminCancelOrder(order)) {
            alert("Only unpaid active orders can be cancelled.");
            return;
        }

        if (window.confirm("Cancel this unpaid order?")) {
            try {
                await OrderController.updateStatus(order._id, "Cancelled");
                window.dispatchEvent(new Event("admin-orders-updated"));
                fetchOrders();
            } catch (err) {
                alert(err.response?.data?.message || "Failed to cancel order");
            }
        }
    };

    const clearDeliveryBusySoon = (delay = 900) => {
        window.setTimeout(() => {
            setDeliveryBusyLabel("");
            setDeliveryNavigatingOrderId("");
            setDeliveryMapOrderId("");
        }, delay);
    };

    const handleRowNavigation = (orderId) => {
        if (isDelivery) {
            setDeliveryNavigatingOrderId(orderId);
            setDeliveryBusyLabel("Opening order details...");
        }

        navigate(getPortalOrderDetailsPath(orderId, adminUser), {
            state: isDelivery ? { fromDeliveryOrders: true } : undefined,
        });
    };

    const handleConfirmOrder = async (orderId) => {
        if (!window.confirm("Confirm this order and send it to delivery?")) {
            return;
        }

        setConfirmingOrderId(orderId);
        try {
            const response = await OrderController.updateStatus(orderId, "Processing");
            const updatedOrder = response.data;

            setOrders((currentOrders) =>
                currentOrders.map((order) =>
                    order._id === orderId
                        ? {
                            ...order,
                            ...updatedOrder,
                            user: updatedOrder?.user || order.user,
                            orderStatus: updatedOrder?.orderStatus || "Processing",
                        }
                        : order
                )
            );
        } catch (err) {
            alert(err.response?.data?.message || "Failed to confirm order");
            setConfirmingOrderId("");
            return;
        }

        setConfirmingOrderId("");
    };

    const handleSendReceipt = async (order) => {
        setSendingReceiptOrderId(order._id);

        try {
            const subtotal = (order.orderItems || []).reduce(
                (acc, item) => acc + Number(item.price || 0) * Number(item.quantity || 0),
                0
            );
            const deliveryFee = getDeliveryFee(order);
            const taxPrice = Number(order.taxPrice || 0);
            const displayedTotal = subtotal + taxPrice + deliveryFee;
            const receiptImage = await createReceiptImageBlob({
                displayOrderId: order._id.slice(-8),
                customerName: order.shippingAddress?.fullName || order.user?.name || "N/A",
                customerPhone: formatPhoneNumber(order.shippingAddress?.phone),
                paymentMethod: order.paymentMethod,
                fullAddress: formatFullAddress(order.shippingAddress),
                subtotal,
                deliveryFee,
                taxPrice,
                displayedTotal,
                formatCurrency,
            });
            const formData = new FormData();
            formData.append("receipt", receiptImage, `order-${order._id}-receipt.png`);

            const response = await OrderController.sendReceipt(order._id, formData);
            const updatedOrder = response.data?.order;

            if (updatedOrder) {
                setOrders((currentOrders) =>
                    currentOrders.map((currentOrder) =>
                        currentOrder._id === updatedOrder._id
                            ? {
                                ...currentOrder,
                                ...updatedOrder,
                                user: updatedOrder.user || currentOrder.user,
                            }
                            : currentOrder
                    )
                );
            } else {
                setOrders((currentOrders) =>
                    currentOrders.map((currentOrder) =>
                        currentOrder._id === order._id
                            ? {
                                ...currentOrder,
                                receiptSent: {
                                    sentAt: new Date().toISOString(),
                                    channel: "telegram",
                                },
                            }
                            : currentOrder
                    )
                );
            }

            setReceiptNotice("Receipt photo sent to Telegram. You can now confirm this order.");
            if (receiptNoticeTimeoutRef.current) {
                window.clearTimeout(receiptNoticeTimeoutRef.current);
            }
            receiptNoticeTimeoutRef.current = window.setTimeout(() => {
                setReceiptNotice("");
                receiptNoticeTimeoutRef.current = null;
            }, 3500);
        } catch (err) {
            alert(err.response?.data?.message || err.message || "Failed to send receipt to Telegram");
        } finally {
            setSendingReceiptOrderId("");
        }
    };

    const toggleOrderDate = (dateKey) => {
        setExpandedOrderDates((current) => ({
            ...current,
            [dateKey]: !current[dateKey],
        }));
    };

    const normalizeOrderStatus = (status) => {
        if (!status) return "Pending";

        const trimmedStatus = String(status).trim();
        if (!trimmedStatus) return "Pending";

        const normalized = trimmedStatus.toLowerCase();
        if (normalized === "canceled" || normalized === "cancelled") {
            return "Cancelled";
        }

        if (normalized === "pending") return "Pending";
        if (normalized === "processing") return "Processing";
        // Legacy orders used "Shipped" for the active delivery stage.
        if (normalized === "shipped") return "Processing";
        if (normalized === "delivered") return "Delivered";

        return trimmedStatus;
    };

    const getStatusLabel = (status) => {
        const normalizedStatus = normalizeOrderStatus(status);

        return normalizedStatus;
    };

    const getStatusColor = (status) => {
        const normalizedStatus = normalizeOrderStatus(status);

        const colors = {
            Pending: "bg-yellow-100 text-yellow-800",
            Processing: "bg-blue-100 text-blue-800",
            Delivered: "bg-green-100 text-green-800",
            Cancelled: "",
        };
        return colors[normalizedStatus] || "bg-gray-100 text-gray-800";
    };

    const getStatusStyle = (status) => {
        const normalizedStatus = normalizeOrderStatus(status);

        if (normalizedStatus === "Cancelled") {
            return {
                backgroundColor: "#F6D2C0",
                color: "#9A3412",
            };
        }

        return undefined;
    };

    const getPaymentColor = (status) => {
        const colors = {
            Pending: "bg-yellow-100 text-yellow-800",
            Paid: "bg-green-100 text-green-800",
            Failed: "bg-red-100 text-red-800",
            Refunded: "bg-orange-100 text-orange-800",
            Cancelled: "bg-orange-50 text-orange-800",
        };
        return colors[status] || "bg-gray-100 text-gray-800";
    };

    const getDisplayPaymentStatus = (order) =>
        normalizeOrderStatus(order?.orderStatus) === "Cancelled"
            ? "Cancelled"
            : order?.paymentStatus || "Pending";

    const formatCurrency = (amount) => `$${Number(amount || 0).toFixed(2)}`;

    const formatPhoneNumber = (phone) => {
        if (!phone) return "No phone";

        const digits = String(phone).replace(/\D/g, "");
        const localDigits = digits.startsWith("855") ? `0${digits.slice(3)}` : digits;

        if (localDigits.length <= 3) return localDigits;
        if (localDigits.length <= 6) return `${localDigits.slice(0, 3)} ${localDigits.slice(3)}`;

        return `${localDigits.slice(0, 3)} ${localDigits.slice(3, 6)} ${localDigits.slice(6)}`;
    };

    const formatDeliveryAddress = (shippingAddress = {}) =>
        [shippingAddress.street, shippingAddress.address, shippingAddress.city]
            .filter(Boolean)
            .join(", ") || "Address not set";

    const formatFullAddress = (shippingAddress = {}) =>
        [
            shippingAddress.street,
            shippingAddress.address,
            shippingAddress.city,
            shippingAddress.postalCode,
            shippingAddress.country,
        ]
            .filter(Boolean)
            .join(", ") || "N/A";

    const getDeliveryFee = (order) => {
        const storedFee = Number(order?.shippingPrice || 0);
        return storedFee > 0 ? storedFee : 2;
    };

    const getMapUrl = (shippingAddress = {}) => {
        if (!shippingAddress.latitude || !shippingAddress.longitude) {
            return "";
        }

        return `https://www.google.com/maps/search/?api=1&query=${shippingAddress.latitude},${shippingAddress.longitude}`;
    };

    const handleOpenGoogleMaps = (shippingAddress = {}, orderId = "") => {
        const { latitude, longitude } = shippingAddress;

        if (!latitude || !longitude) {
            return;
        }

        if (isDelivery) {
            setDeliveryMapOrderId(orderId);
            setDeliveryBusyLabel("Opening map...");
        }

        const url = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
        window.open(url, "_blank");

        if (isDelivery) {
            clearDeliveryBusySoon();
        }
    };

    const handleDeliveryLogout = () => {
        if (!window.confirm("Are you sure you want to log out?")) {
            return;
        }

        const loginPath = getPortalLoginPath(adminUser);
        setDeliveryBusyLabel("Logging out...");
        disconnectRealtime();
        clearAdminSession("delivery");
        sessionStorage.removeItem(DELIVERY_ORDERS_CACHE_KEY);
        sessionStorage.removeItem(DELIVERY_ORDERS_VIEW_STATE_KEY);
        navigate(loginPath, { replace: true });
    };

    const deliveryOrders = orders.filter((order) =>
        DELIVERY_VISIBLE_STATUSES.includes(normalizeOrderStatus(order.orderStatus))
    );
    const todayDateKey = getOrderDateKey(new Date().toISOString());
    const todayDeliveryOrders = deliveryOrders.filter(
        (order) => getOrderDateKey(order.createdAt) === todayDateKey
    );
    const deliveryStats = [
        {
            label: "Processing",
            value: todayDeliveryOrders.filter((order) =>
                normalizeOrderStatus(order.orderStatus) === "Processing"
            ).length,
            className: "bg-blue-50 text-blue-800",
        },
        {
            label: "Done",
            value: todayDeliveryOrders.filter((order) => normalizeOrderStatus(order.orderStatus) === "Delivered").length,
            className: "bg-stone-100 text-stone-800",
        },
    ];

    if (loading) {
        return <Loading message="Loading orders..." />;
    }

    if (error) {
  return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
                    <p className="text-red-800">{error}</p>
                    <button
                        onClick={() => navigate("/admin")}
                        className="mt-4 text-blue-600 hover:text-blue-800"
                    >
                        ← Back to Dashboard
                    </button>
      </div>
    </div>
        );
    }

    if (isDelivery && renderDelivery) {
        return renderDelivery({
            deliveryStats,
            expandedOrderDates,
            filteredOrders,
            formatCurrency,
            formatDeliveryAddress,
            formatPhoneNumber,
            getDisplayPaymentStatus,
            getMapUrl,
            getPaymentColor,
            getStatusColor,
            getStatusLabel,
            getStatusStyle,
            groupedOrders,
            handleDeliveryLogout,
            handleOpenGoogleMaps,
            handleRowNavigation,
            deliveryBusyLabel,
            deliveryMapOrderId,
            deliveryNavigatingOrderId,
            normalizeOrderStatus,
            receiptNotice,
            searchTerm,
            setSearchTerm,
            setStatusFilter,
            statusFilter,
            toggleOrderDate,
        });
    }

    if (isDelivery) {
        return (
            <div className="min-h-screen bg-gray-50 px-4 pb-24 pt-20 sm:px-6 lg:px-8 lg:pt-8">
                {deliveryBusyLabel && (
                    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-gray-950/35 px-6 backdrop-blur-[2px]">
                        <div className="flex min-h-28 w-full max-w-xs flex-col items-center justify-center gap-3 rounded-2xl bg-white p-6 text-center shadow-2xl">
                            <Loader2 className="h-8 w-8 animate-spin text-blue-700" />
                            <p className="text-sm font-black text-gray-950">{deliveryBusyLabel}</p>
                        </div>
                    </div>
                )}
                {receiptNotice && (
                    <div className="fixed left-4 right-4 top-5 z-50 mx-auto max-w-xl rounded-2xl bg-gray-950 px-6 py-5 text-center text-base font-black leading-6 text-white shadow-2xl sm:right-6 sm:left-auto sm:text-lg">
                        {receiptNotice}
                    </div>
                )}
                <div className="mx-auto max-w-3xl">
                    <div className="mb-5 flex items-end justify-between gap-4">
                        <div>
                            <p className="text-sm font-semibold text-blue-700">Delivery</p>
                            <h1 className="text-2xl font-black text-gray-950">Today&apos;s Runs</h1>
                        </div>
                        <button
                            type="button"
                            onClick={handleDeliveryLogout}
                            disabled={Boolean(deliveryBusyLabel)}
                            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 text-sm font-black text-red-600 shadow-sm transition-colors hover:bg-red-50 disabled:cursor-wait disabled:opacity-70"
                        >
                            {deliveryBusyLabel === "Logging out..." ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <LogOut className="h-4 w-4" />
                            )}
                            {deliveryBusyLabel === "Logging out..." ? "Logging out..." : "Logout"}
                        </button>
                    </div>

                    <div className="mb-4 grid grid-cols-2 gap-2">
                        {deliveryStats.map((stat) => (
                            <div key={stat.label} className={`rounded-xl p-3 shadow-sm ${stat.className}`}>
                                <p className="text-[11px] font-bold uppercase">{stat.label}</p>
                                <p className="mt-1 truncate text-xl font-black">{stat.value}</p>
                            </div>
                        ))}
                    </div>

                    <div className="sticky top-0 z-20 -mx-4 mb-4 border-y border-gray-200 bg-gray-50/95 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-2xl sm:border">
                        <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_180px]">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search order or customer"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="h-12 w-full rounded-xl border border-gray-200 bg-white pl-10 pr-4 text-base font-medium text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                                />
                            </div>
                            <div className="relative">
                                <Filter className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="h-12 w-full appearance-none rounded-xl border border-gray-200 bg-white pl-10 pr-4 text-base font-bold text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                                >
                                    <option value="All">All status</option>
                                    <option value="Processing">Processing</option>
                                    <option value="Delivered">Delivered</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {filteredOrders.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-5 py-12 text-center">
                            <Package className="mx-auto mb-3 h-10 w-10 text-gray-400" />
                            <p className="font-bold text-gray-900">No deliveries found</p>
                        </div>
                    ) : (
                        <div className="space-y-5">
                            {groupedOrders.map((group) => {
                                const isExpanded = expandedOrderDates[group.dateKey];

                                return (
                                    <section key={group.dateKey} className="space-y-3">
                                        <button
                                            type="button"
                                            onClick={() => toggleOrderDate(group.dateKey)}
                                            className="flex w-full items-center justify-between rounded-xl bg-white px-4 py-3 text-left shadow-sm"
                                            aria-expanded={isExpanded}
                                        >
                                            <span>
                                                <span className="block text-sm font-black text-gray-950">{group.label}</span>
                                                <span className="block text-xs font-semibold text-gray-500">
                                                    {group.orders.length} stop{group.orders.length === 1 ? "" : "s"}
                                                </span>
                                            </span>
                                            <ChevronDown className={`h-5 w-5 text-gray-500 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                                        </button>

                                        {isExpanded && group.orders.map((order) => {
                                            const mapUrl = getMapUrl(order.shippingAddress);
                                            const phone = order.shippingAddress?.phone;
                                            const status = normalizeOrderStatus(order.orderStatus);

                                            return (
                                                <article
                                                    key={order._id}
                                                    className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
                                                >
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRowNavigation(order._id)}
                                                        disabled={Boolean(deliveryBusyLabel)}
                                                        className="block w-full p-4 text-left disabled:cursor-wait disabled:opacity-75"
                                                    >
                                                        <div className="mb-3 flex items-start justify-between gap-3">
                                                            <div className="min-w-0">
                                                                <p className="font-mono text-sm font-black text-gray-950">#{order._id.slice(-8)}</p>
                                                                <p className="mt-1 truncate text-lg font-black text-gray-950">
                                                                    {order.shippingAddress?.fullName || order.user?.name || "Customer"}
                                                                </p>
                                                            </div>
                                                            <span
                                                                className={`shrink-0 rounded-full px-3 py-1 text-xs font-black ${getStatusColor(order.orderStatus)}`}
                                                                style={getStatusStyle(order.orderStatus)}
                                                            >
                                                                {getStatusLabel(status)}
                                                            </span>
                                                        </div>

                                                        <div className="space-y-2 text-sm font-semibold text-gray-600">
                                                            <p className="flex items-start gap-2">
                                                                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                                                                <span className="line-clamp-2">{formatDeliveryAddress(order.shippingAddress)}</span>
                                                            </p>
                                                            <p className="flex items-center gap-2">
                                                                <Phone className="h-4 w-4 text-gray-400" />
                                                                {formatPhoneNumber(phone)}
                                                            </p>
                                                        </div>

                                                        <div className="mt-4 grid grid-cols-2 gap-2">
                                                            <div className="rounded-xl bg-gray-50 p-3">
                                                                <p className="text-[11px] font-bold uppercase text-gray-500">Total</p>
                                                                <p className="text-lg font-black text-gray-950">{formatCurrency(order.totalPrice)}</p>
                                                            </div>
                                                            <div className="rounded-xl bg-gray-50 p-3">
                                                                <p className="text-[11px] font-bold uppercase text-gray-500">Payment</p>
                                                                <p className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-xs font-black ${getPaymentColor(getDisplayPaymentStatus(order))}`}>
                                                                    {getDisplayPaymentStatus(order)}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </button>

                                                    <div className="grid grid-cols-2 border-t border-gray-100">
                                                        {mapUrl ? (
                                                            <button
                                                                type="button"
                                                                onClick={() => handleOpenGoogleMaps(order.shippingAddress, order._id)}
                                                                disabled={Boolean(deliveryBusyLabel)}
                                                                className="inline-flex h-14 items-center justify-center gap-2 border-r border-gray-100 text-sm font-black text-blue-700 disabled:cursor-wait disabled:opacity-70"
                                                            >
                                                                {deliveryMapOrderId === order._id ? (
                                                                    <Loader2 className="h-5 w-5 animate-spin" />
                                                                ) : (
                                                                    <Navigation className="h-5 w-5" />
                                                                )}
                                                                {deliveryMapOrderId === order._id ? "Opening..." : "View Map"}
                                                            </button>
                                                        ) : (
                                                            <div className="inline-flex h-14 items-center justify-center gap-2 border-r border-gray-100 text-sm font-black text-gray-400">
                                                                <Navigation className="h-5 w-5" />
                                                                View Map
                                                            </div>
                                                        )}
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRowNavigation(order._id)}
                                                            disabled={Boolean(deliveryBusyLabel)}
                                                            className="inline-flex h-14 items-center justify-center gap-2 text-sm font-black text-gray-950 disabled:cursor-wait disabled:opacity-70"
                                                        >
                                                            {deliveryNavigatingOrderId === order._id ? (
                                                                <Loader2 className="h-5 w-5 animate-spin" />
                                                            ) : (
                                                                <Eye className="h-5 w-5" />
                                                            )}
                                                            {deliveryNavigatingOrderId === order._id ? "Opening..." : "View Details"}
                                                        </button>
                                                    </div>
                                                </article>
                                            );
                                        })}
                                    </section>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            {receiptNotice && (
                <div className="fixed left-4 right-4 top-5 z-50 mx-auto max-w-xl rounded-2xl bg-gray-950 px-6 py-5 text-center text-base font-black leading-6 text-white shadow-2xl sm:right-6 sm:left-auto sm:text-lg">
                    {receiptNotice}
                </div>
            )}
            {/* Header */}
            <div className="mb-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">
                            {isDelivery ? "Delivery Control" : "Order Management"}
                        </h1>
                        <p className="mt-1 text-sm text-gray-500">
                            {isSeller
                                ? "Confirm new orders and hand them off to delivery"
                                : "Manage and track all customer orders"}
                        </p>
                    </div>
                    <div className="flex items-center space-x-2 bg-blue-100 text-blue-800 px-4 py-2 rounded-lg">
                        <Package className="w-4 h-4" />
                        <span className="text-sm font-medium">
                            {filteredOrders.length} {isDelivery ? "Deliveries" : "Orders"}
                        </span>
                    </div>
                </div>
            </div>

            {/* Summary Stats */}
            <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
                <div className="bg-white rounded-lg shadow-sm p-4">
                    <p className="text-sm text-gray-500">Total Orders</p>
                    <p className="text-2xl font-bold text-green-600">{orders.length}</p>
                </div>
                <div className="bg-white rounded-lg shadow-sm p-4">
                    <p className="text-sm text-gray-500">Pending</p>
                    <p className="text-2xl font-bold text-green-600">
                        {orders.filter((o) => o.orderStatus === "Pending").length}
                    </p>
                </div>
                <div className="bg-white rounded-lg shadow-sm p-4">
                    <p className="text-sm text-gray-500">Delivered</p>
                    <p className="text-2xl font-bold text-green-600">
                        {orders.filter((o) => o.orderStatus === "Delivered").length}
                    </p>
                </div>
                <div className="bg-white rounded-lg shadow-sm p-4">
                    <p className="text-sm text-gray-500">
                        {isDelivery ? "Cash To Collect" : "Total Revenue"}
                    </p>
                    <p className="text-2xl font-bold text-blue-600">
                        ${orders
                            .filter((o) =>
                                isDelivery
                                    ? o.paymentMethod === "Cash on Delivery" &&
                                      o.paymentStatus !== "Paid" &&
                                      o.orderStatus !== "Delivered" &&
                                      normalizeOrderStatus(o.orderStatus) !== "Cancelled"
                                    : o.paymentStatus === "Paid"
                            )
                            .reduce((acc, order) => acc + (order.totalPrice || 0), 0)
                            .toFixed(2)}
                    </p>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search by Order ID, customer name or email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    {/* Status Filter */}
                    <div className="relative">
                        <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                        >
                            <option value="All">All Status</option>
                            <option value="Pending">Pending</option>
                            <option value="Processing">Processing</option>
                            <option value="Delivered">Delivered</option>
                            <option value="Cancelled">Cancelled</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Orders Table */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Order ID
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Customer
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Date
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Total
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Payment
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredOrders.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-12 text-center">
                                        <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                                        <p className="text-gray-500">No orders found</p>
                                    </td>
                                </tr>
                            ) : (
                                groupedOrders.map((group) => {
                                    const isExpanded = expandedOrderDates[group.dateKey];

                                    return (
                                        <Fragment key={group.dateKey}>
                                            <tr className="bg-gray-50">
                                                <td colSpan="7" className="px-6 py-3">
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleOrderDate(group.dateKey)}
                                                        className="flex w-full items-center justify-between gap-4 rounded-lg px-3 py-2 text-left hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                        aria-expanded={isExpanded}
                                                    >
                                                        <span className="flex min-w-0 items-center gap-3">
                                                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-blue-600 shadow-sm">
                                                                <CalendarDays className="h-4 w-4" />
                                                            </span>
                                                            <span className="min-w-0">
                                                                <span className="block text-sm font-bold text-gray-900">
                                                                    {group.label}
                                                                </span>
                                                                <span className="block text-xs text-gray-500">
                                                                    {group.orders.length} {group.orders.length === 1 ? "order" : "orders"} on this day
                                                                </span>
                                                            </span>
                                                        </span>
                                                        <span className="flex shrink-0 items-center gap-4">
                                                            <span className="hidden text-sm font-semibold text-gray-900 sm:inline">
                                                                ${group.total.toFixed(2)}
                                                            </span>
                                                            <ChevronDown
                                                                className={`h-5 w-5 text-gray-500 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                                                            />
                                                        </span>
                                                    </button>
                                                </td>
                                            </tr>
                                            {isExpanded && group.orders.map((order) => (
                                                <tr
                                                    key={order._id}
                                                    onClick={() => handleRowNavigation(order._id)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === "Enter" || e.key === " ") {
                                                            e.preventDefault();
                                                            handleRowNavigation(order._id);
                                                        }
                                                    }}
                                                    tabIndex={0}
                                                    className="cursor-pointer hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
                                                >
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className="inline-flex items-center gap-2 text-sm font-mono text-gray-900">
                                                            {order.paymentStatus === "Paid" &&
                                                                normalizeOrderStatus(order.orderStatus) === "Delivered" &&
                                                                order.deliveryProof?.imageUrl && (
                                                                    <span
                                                                        className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-green-100 text-green-700"
                                                                        title="Payment paid, delivery completed, and proof uploaded"
                                                                        aria-label="Completed order"
                                                                    >
                                                                        <CheckCircle className="h-3.5 w-3.5" />
                                                                    </span>
                                                                )}
                                                            <span>#{order._id.slice(-8)}</span>
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        {order.user ? (
                                                            <>
                                                                <div className="text-sm text-gray-900">
                                                                    {order.user.name || "Customer"}
                                                                </div>
                                                                <div className="text-sm text-gray-500">
                                                                    {order.user.email || "Email unavailable"}
                                                                </div>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <div className="text-sm font-semibold text-gray-700">
                                                                    Deleted Customer
                                                                </div>
                                                                <span className="mt-1 inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-bold text-gray-500">
                                                                    Account deleted
                                                                </span>
                                                            </>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {new Date(order.createdAt).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                                                        ${order.totalPrice?.toFixed(2) || "0.00"}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span
                                                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getPaymentColor(
                                                                getDisplayPaymentStatus(order)
                                                            )}`}
                                                        >
                                                            {getDisplayPaymentStatus(order)}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span
                                                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                                                                order.orderStatus
                                                            )}`}
                                                            style={getStatusStyle(order.orderStatus)}
                                                        >
                                                            {getStatusLabel(order.orderStatus)}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                        <div className="flex items-center space-x-2">
                                                            {isSeller &&
                                                                normalizeOrderStatus(order.orderStatus) === "Pending" &&
                                                                (order.receiptSent?.sentAt ? (
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleConfirmOrder(order._id);
                                                                        }}
                                                                        disabled={confirmingOrderId === order._id}
                                                                        className="inline-flex items-center gap-1 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
                                                                        title="Confirm Order"
                                                                    >
                                                                        {confirmingOrderId === order._id ? "Confirming..." : "Confirm"}
                                                                    </button>
                                                                ) : (
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleSendReceipt(order);
                                                                        }}
                                                                        disabled={sendingReceiptOrderId === order._id}
                                                                        className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                                                                        title="Print receipt before confirming"
                                                                    >
                                                                        <Printer className="h-4 w-4" />
                                                                        {sendingReceiptOrderId === order._id ? "Printing..." : "Print Receipt"}
                                                                    </button>
                                                                ))}
                                                            {isDelivery ? (
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleRowNavigation(order._id);
                                                                    }}
                                                                    className="text-blue-600 hover:text-blue-900 p-1 hover:bg-blue-50 rounded"
                                                                    title="View Details"
                                                                >
                                                                    View Details
                                                                </button>
                                                            ) : adminUser?.role === "admin" && canAdminCancelOrder(order) ? (
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleCancelOrder(order);
                                                                    }}
                                                                    className="inline-flex items-center rounded-lg bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700 hover:bg-red-100 hover:text-red-900"
                                                                    title="Cancel unpaid order"
                                                                >
                                                                    Cancel order
                                                                </button>
                                                            ) : null}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </Fragment>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
    );
};

export default AdminOrders;
