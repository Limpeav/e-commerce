import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
    ArrowLeft,
    Camera,
    Package,
    User,
    MapPin,
    CreditCard,
    Calendar,
    DollarSign,
    Truck,
    CheckCircle,
    ExternalLink,
    Image as ImageIcon,
    Navigation,
    Phone,
    Printer,
} from "lucide-react";
import { AdminController } from "../../../controllers/adminController";
import Loading from "../../../components/common/Loading";
import { createReceiptImageBlob } from "../../../utils/orderReceiptImage";
import { getPortalOrdersPath, getStoredAdminUser } from "../../../utils/adminSession";
import { joinOrderRoom, subscribeRealtimeEvent } from "../../../services/realtime";

const OrderDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [updating, setUpdating] = useState(false);
    const [uploadingProof, setUploadingProof] = useState(false);
    const [sendingReceipt, setSendingReceipt] = useState(false);
    const [receiptNotice, setReceiptNotice] = useState("");
    const receiptNoticeTimeoutRef = useRef(null);
    const adminUser = getStoredAdminUser();
    const isDelivery = adminUser?.role === "delivery";
    const isSeller = adminUser?.role === "seller";
    const ordersPath = getPortalOrdersPath(adminUser);
    const shouldReturnToDeliveryHistory = isDelivery && location.state?.fromDeliveryOrders;
    const returnTo =
        typeof location.state?.returnTo === "string" &&
        (location.state.returnTo === "/admin" ||
            location.state.returnTo.startsWith(ordersPath))
            ? location.state.returnTo
            : ordersPath;

    const cacheDeliveryOrder = useCallback((updatedOrder) => {
        if (!isDelivery || !updatedOrder?._id) {
            return;
        }

        try {
            const cacheKey = "adminDeliveryOrdersCache";
            const cachedOrders = JSON.parse(sessionStorage.getItem(cacheKey) || "[]");
            if (!Array.isArray(cachedOrders)) {
                return;
            }

            sessionStorage.setItem(
                cacheKey,
                JSON.stringify(
                    cachedOrders.map((cachedOrder) =>
                        cachedOrder._id === updatedOrder._id
                            ? {
                                ...cachedOrder,
                                ...updatedOrder,
                                user: updatedOrder.user || cachedOrder.user,
                            }
                            : cachedOrder
                    )
                )
            );
        } catch {
            // Cache is only a convenience for smoother back navigation.
        }
    }, [isDelivery]);

    const fetchOrderDetails = useCallback(async ({ silent = false } = {}) => {
        if (!silent) {
            setLoading(true);
        }
        const result = await AdminController.getOrderById(id);

        if (result.success) {
            setOrder(result.data);
            cacheDeliveryOrder(result.data);
            setError(null);
        } else {
            setError(result.error || "Failed to fetch order details");
        }

        if (!silent) {
            setLoading(false);
        }
    }, [cacheDeliveryOrder, id]);

    useEffect(() => {
        fetchOrderDetails();
    }, [fetchOrderDetails]);

    useEffect(() => {
        return () => {
            if (receiptNoticeTimeoutRef.current) {
                window.clearTimeout(receiptNoticeTimeoutRef.current);
            }
        };
    }, []);

    useEffect(() => {
        const patchCurrentOrder = (payload = {}) => {
            if (payload.orderId && payload.orderId !== id) {
                return;
            }

            if (!payload.orderId) {
                fetchOrderDetails({ silent: true });
                return;
            }

            setOrder((currentOrder) => {
                if (!currentOrder) {
                    return currentOrder;
                }

                const updatedOrder = {
                    ...currentOrder,
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
                };

                cacheDeliveryOrder(updatedOrder);
                return updatedOrder;
            });
        };

        const leaveOrderRoom = joinOrderRoom(id);
        const unsubscribeUpdated = subscribeRealtimeEvent("order:updated", patchCurrentOrder);
        const unsubscribeCreated = subscribeRealtimeEvent("order:created", patchCurrentOrder);

        return () => {
            leaveOrderRoom();
            unsubscribeUpdated();
            unsubscribeCreated();
        };
    }, [cacheDeliveryOrder, fetchOrderDetails, id]);

    const handleBackToOrders = () => {
        if (shouldReturnToDeliveryHistory) {
            navigate(-1);
            return;
        }

        navigate(returnTo);
    };

    const handleStatusUpdate = async (newStatus) => {
        setUpdating(true);
        const result = await AdminController.updateOrderStatus(id, newStatus);

        if (!result.success) {
            alert(result.error || "Failed to update order status");
            setUpdating(false);
            return;
        }

        setOrder((currentOrder) => {
            const updatedOrder = {
                ...currentOrder,
                ...result.data,
                user: result.data?.user || currentOrder?.user,
                orderStatus: result.data?.orderStatus || newStatus,
            };
            cacheDeliveryOrder(updatedOrder);
            return updatedOrder;
        });
        setUpdating(false);
    };

    const handlePaymentStatusUpdate = async (newPaymentStatus) => {
        if (
            isDelivery &&
            (newPaymentStatus !== "Paid" || order.paymentMethod !== "Cash on Delivery")
        ) {
            alert("Delivery accounts can only mark cash on delivery orders as paid.");
            return;
        }

        if (!window.confirm(`Are you sure you want to mark this order as ${newPaymentStatus}?`)) {
            return;
        }

        setUpdating(true);
        const result = await AdminController.updatePaymentStatus(id, newPaymentStatus);

        if (!result.success) {
            alert(result.error || "Failed to update payment status");
            setUpdating(false);
            return;
        }

        await fetchOrderDetails();
        window.dispatchEvent(new Event("admin-orders-updated"));
        setUpdating(false);
    };

    const handleDeliveryProofCapture = async (event) => {
        const proofPhoto = event.target.files?.[0];
        event.target.value = "";

        if (!proofPhoto) {
            return;
        }

        setUploadingProof(true);
        const result = await AdminController.uploadDeliveryProof(id, proofPhoto);

        if (!result.success) {
            alert(result.error || "Failed to upload delivery proof photo");
            setUploadingProof(false);
            return;
        }

        setOrder(result.data);
        cacheDeliveryOrder(result.data);
        window.dispatchEvent(new Event("admin-orders-updated"));
        setUploadingProof(false);
    };

    const getPaymentStatusColor = (status) => {
        const colors = {
            Pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
            Paid: "bg-green-100 text-green-800 border-green-300",
            Failed: "bg-red-100 text-red-800 border-red-300",
            Refunded: "bg-orange-100 text-orange-800 border-orange-300",
            Cancelled: "bg-orange-50 text-orange-800 border-orange-200",
        };
        return colors[status] || "bg-gray-100 text-gray-800 border-gray-300";
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

    const getStatusColor = (status) => {
        const normalizedStatus = normalizeOrderStatus(status);

        const colors = {
            Pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
            Processing: "bg-blue-100 text-blue-800 border-blue-300",
            Delivered: "bg-green-100 text-green-800 border-green-300",
            Cancelled: "",
        };
        return colors[normalizedStatus] || "bg-gray-100 text-gray-800 border-gray-300";
    };

    const getStatusStyle = (status) => {
        const normalizedStatus = normalizeOrderStatus(status);

        if (normalizedStatus === "Cancelled") {
            return {
                backgroundColor: "#F6D2C0",
                color: "#9A3412",
                borderColor: "#E9A47E",
            };
        }

        return undefined;
    };

    const getOrderStatusLabel = (status) => {
        const normalizedStatus = normalizeOrderStatus(status);

        return normalizedStatus;
    };

    const getDisplayPaymentStatus = (currentOrder) =>
        normalizeOrderStatus(currentOrder?.orderStatus) === "Cancelled"
            ? "Cancelled"
            : currentOrder?.paymentStatus || "Pending";

    const formatCurrency = (amount) => `$${Number(amount || 0).toFixed(2)}`;

    const getDeliveryFee = (currentOrder) => {
        const storedFee = Number(currentOrder?.shippingPrice || 0);
        return storedFee > 0 ? storedFee : 2;
    };

    const formatAddress = (shippingAddress = {}) =>
        [
            shippingAddress.street,
            shippingAddress.address,
            shippingAddress.city,
            shippingAddress.postalCode,
            shippingAddress.country,
        ]
            .filter(Boolean)
            .join(", ") || "N/A";

    const formatPhoneNumber = (phone) => {
        if (!phone) return "N/A";

        const digits = String(phone).replace(/\D/g, "");
        const localDigits = digits.startsWith("855") ? `0${digits.slice(3)}` : digits;

        if (localDigits.length <= 3) return localDigits;
        if (localDigits.length <= 6) {
            return `${localDigits.slice(0, 3)} ${localDigits.slice(3)}`;
        }

        return `${localDigits.slice(0, 3)} ${localDigits.slice(3, 6)} ${localDigits.slice(6)}`;
    };

    if (loading) {
        return <Loading message="Loading order details..." />;
    }

    if (error || !order) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
                    <p className="text-red-800">{error || "Order not found"}</p>
                    <button
                        onClick={handleBackToOrders}
                        className="mt-4 text-blue-600 hover:text-blue-800"
                    >
                        ← Back to Orders
                    </button>
                </div>
            </div>
        );
    }

    const subtotal = order.orderItems.reduce(
        (acc, item) => acc + Number(item.price || 0) * Number(item.quantity || 0),
        0
    );
    const deliveryFee = getDeliveryFee(order);
    const taxPrice = Number(order.taxPrice || 0);
    const displayedTotal = subtotal + taxPrice + deliveryFee;
    const customerName = order.shippingAddress?.fullName || order.user?.name || "N/A";
    const customerPhone = formatPhoneNumber(order.shippingAddress?.phone);
    const fullAddress = formatAddress(order.shippingAddress);
    const displayOrderId = order._id.slice(-8);
    const currentOrderStatus = normalizeOrderStatus(order.orderStatus);
    const currentProgressStatus = currentOrderStatus;
    const canManageOrderStatus = adminUser?.role === "admin" || isDelivery;
    const orderProgressStatuses = isDelivery
        ? ["Delivered"]
        : ["Pending", "Processing", "Delivered"];
    const availableOrderActionStatuses = isDelivery
        ? [{ label: "Delivered", value: "Delivered" }]
        : [
            { label: "Pending", value: "Pending" },
            { label: "Processing", value: "Processing" },
            { label: "Delivered", value: "Delivered" },
        ];
    const paymentStatuses = isDelivery ? ["Paid"] : ["Pending", "Paid"];
    const deliveryLatitude = order.shippingAddress?.latitude;
    const deliveryLongitude = order.shippingAddress?.longitude;
    const mapUrl =
        deliveryLatitude && deliveryLongitude
            ? `https://www.google.com/maps/search/?api=1&query=${deliveryLatitude},${deliveryLongitude}`
            : "";
    const phoneHref = order.shippingAddress?.phone
        ? `tel:${String(order.shippingAddress.phone).replace(/\s/g, "")}`
        : "";
    const summaryRows = [
        ["Order ID", `#${displayOrderId}`],
        ["Customer Name", customerName],
        ["Phone Number", customerPhone],
        ["Payment Method", order.paymentMethod || "N/A"],
        ["Address", fullAddress],
        ["Subtotal", formatCurrency(subtotal)],
        ["Delivery Fee", formatCurrency(deliveryFee)],
        ["Tax", formatCurrency(taxPrice)],
        ["Total", formatCurrency(displayedTotal)],
    ];

    const handleOpenGoogleMaps = () => {
        if (!mapUrl) return;
        window.open(mapUrl, "_blank");
    };

    const handleSendReceiptToTelegram = async () => {
        setSendingReceipt(true);

        try {
            const receiptImage = await createReceiptImageBlob({
                displayOrderId,
                customerName,
                customerPhone,
                paymentMethod: order.paymentMethod,
                fullAddress,
                subtotal,
                deliveryFee,
                taxPrice,
                displayedTotal,
                formatCurrency,
            });
            const result = await AdminController.sendOrderReceiptToTelegram(id, receiptImage);

            if (!result.success) {
                alert(result.error || "Failed to send receipt to Telegram");
                return;
            }

            if (result.data?.order) {
                setOrder(result.data.order);
            } else {
                await fetchOrderDetails();
            }
            window.dispatchEvent(new Event("admin-orders-updated"));
            setReceiptNotice("Receipt photo sent to Telegram.");
            if (receiptNoticeTimeoutRef.current) {
                window.clearTimeout(receiptNoticeTimeoutRef.current);
            }
            receiptNoticeTimeoutRef.current = window.setTimeout(() => {
                setReceiptNotice("");
                receiptNoticeTimeoutRef.current = null;
            }, 3500);
        } catch (sendError) {
            alert(sendError.message || "Failed to send receipt to Telegram");
        } finally {
            setSendingReceipt(false);
        }
    };

    const renderOrderStatusSection = () => (
        <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-5 shadow-sm">
            <h2 className="mb-4 flex items-center text-lg font-semibold text-[var(--color-text-main)]">
                <Truck className="mr-2 h-5 w-5 text-[var(--color-primary)]" />
                Update Order Status
            </h2>
            <div
                className={`mb-5 grid gap-2 ${
                    orderProgressStatuses.length === 2
                        ? "grid-cols-2"
                        : orderProgressStatuses.length === 5
                            ? "grid-cols-5"
                            : "grid-cols-4"
                }`}
            >
                {orderProgressStatuses.map((status, index) => {
                    const isActive = currentProgressStatus === status;
                    const isPast =
                        orderProgressStatuses.indexOf(currentProgressStatus) >= index &&
                        currentOrderStatus !== "Cancelled";

                    return (
                        <div key={status} className="min-w-0">
                            <div
                                className={`h-2 rounded-full ${isActive || isPast ? "bg-[var(--color-primary)]" : "bg-[var(--color-surface-soft)]"}`}
                            />
                            <p className="mt-2 truncate text-center text-[11px] font-bold text-[var(--color-text-muted)]">
                                {status}
                            </p>
                        </div>
                    );
                })}
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
                {availableOrderActionStatuses.map(
                    ({ label, value }) => {
                        const isCurrent = currentOrderStatus === value;

                        return (
                        <button
                            key={label}
                            onClick={() => handleStatusUpdate(value)}
                            disabled={updating || isCurrent}
                            aria-label={
                                isCurrent
                                    ? `Current order status: ${label}`
                                    : `Mark order as ${label}`
                            }
                            title={
                                isCurrent
                                    ? `Current order status: ${label}`
                                    : `Mark as ${label}`
                            }
                            className={`inline-flex h-11 w-full items-center justify-center rounded-lg px-4 font-bold transition-colors ${isCurrent
                                ? "cursor-not-allowed bg-[var(--color-surface-soft)] text-[var(--color-text-muted)]"
                                : "bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-dark)]"
                                }`}
                        >
                            {isCurrent ? (
                                <span className="flex items-center justify-center">
                                    <CheckCircle className="w-5 h-5 mr-2" aria-hidden="true" />
                                    {label}
                                </span>
                            ) : (
                                `Mark as ${label}`
                            )}
                        </button>
                        );
                    }
                )}
            </div>
        </section>
    );

    const renderSellerConfirmationSection = () => {
        if (!isSeller || currentOrderStatus !== "Pending") {
            return null;
        }

        const receiptWasSent = Boolean(order.receiptSent?.sentAt);
        const isWaitingForBakongPayment =
            order.paymentMethod === "BAKONG_KHQR" && order.paymentStatus !== "Paid";

        return (
            <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-5 shadow-sm">
                <h2 className="mb-2 flex items-center text-lg font-semibold text-[var(--color-text-main)]">
                    <CheckCircle className="mr-2 h-5 w-5 text-[var(--color-primary)]" />
                    Confirm Order
                </h2>
                <p className="mb-4 text-sm font-medium text-[var(--color-text-muted)]">
                    {isWaitingForBakongPayment
                        ? "Waiting for the customer's BAKONG payment to be verified."
                        : receiptWasSent
                        ? "The receipt was sent. Confirm this order to hand it to delivery."
                        : "Print and send the receipt before confirming this order."}
                </p>
                {isWaitingForBakongPayment ? (
                    <button
                        type="button"
                        disabled
                        className="inline-flex h-11 w-full cursor-not-allowed items-center justify-center rounded-lg bg-[var(--color-surface-soft)] px-4 font-bold text-[var(--color-text-muted)]"
                    >
                        Waiting for Payment
                    </button>
                ) : receiptWasSent ? (
                    <button
                        type="button"
                        onClick={() => handleStatusUpdate("Processing")}
                        disabled={updating}
                        className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-green-600 px-4 font-bold text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {updating ? "Confirming..." : "Confirm Order"}
                    </button>
                ) : (
                    <button
                        type="button"
                        onClick={handleSendReceiptToTelegram}
                        disabled={sendingReceipt}
                        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 font-bold text-white transition-colors hover:bg-[var(--color-primary-dark)] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        <Printer className="h-4 w-4" />
                        {sendingReceipt ? "Sending..." : "Print Receipt"}
                    </button>
                )}
            </section>
        );
    };

    return (
        <div className={`min-h-screen bg-[var(--color-bg-base)] ${isDelivery ? "pb-24 lg:pb-0" : ""}`}>
            {receiptNotice && (
                <div className="fixed left-4 right-4 top-5 z-50 mx-auto max-w-xl rounded-2xl bg-gray-950 px-6 py-5 text-center text-base font-black leading-6 text-white shadow-2xl sm:right-6 sm:left-auto sm:text-lg">
                    {receiptNotice}
                </div>
            )}
            {/* Header */}
            <div className={`border-b border-[var(--color-border)] bg-[var(--color-bg-card)] ${
                isDelivery ? "sticky top-0 z-30 shadow-sm" : ""
            }`}>
                <div className={`mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 ${
                    isDelivery ? "py-3" : "pb-5 pt-20 lg:pt-5"
                }`}>
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex items-start gap-4">
                            <button
                                onClick={handleBackToOrders}
                                className="mt-1 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface-soft)] hover:text-[var(--color-text-main)]"
                                aria-label="Back to orders"
                            >
                                <ArrowLeft className="h-5 w-5" />
                            </button>
                            <div>
                                <h1 className="text-2xl font-black leading-tight text-[var(--color-text-main)] sm:text-4xl">
                                    Order #{displayOrderId}
                                </h1>
                                {isDelivery && (
                                    <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                                        {customerName} · {formatCurrency(displayedTotal)}
                                    </p>
                                )}
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 lg:justify-end">
                            <div
                                className={`rounded-lg border px-4 py-2 ${getPaymentStatusColor(getDisplayPaymentStatus(order))}`}
                            >
                                <span className="text-sm font-bold">Payment: {getDisplayPaymentStatus(order)}</span>
                            </div>
                            <div
                                className={`rounded-lg border px-4 py-2 ${getStatusColor(order.orderStatus)}`}
                                style={getStatusStyle(order.orderStatus)}
                            >
                                <span className="text-sm font-bold">Order: {getOrderStatusLabel(order.orderStatus)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
                {isDelivery && (
                    <section className="mb-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-4 shadow-sm xl:hidden">
                        <div className="mb-4 flex items-start gap-3">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)] text-lg font-black text-white">
                                {(customerName || "N").charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                                <p className="truncate text-lg font-black text-[var(--color-text-main)]">{customerName}</p>
                                <p className="text-sm font-semibold text-[var(--color-text-muted)]">{customerPhone}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            {mapUrl ? (
                                <button
                                    type="button"
                                    onClick={handleOpenGoogleMaps}
                                    className="inline-flex h-[52px] items-center justify-center gap-2 rounded-xl bg-blue-600 px-3 text-sm font-black text-white"
                                >
                                    <Navigation className="h-5 w-5" />
                                    View Map
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    disabled
                                    className="inline-flex h-[52px] items-center justify-center gap-2 rounded-xl bg-gray-100 px-3 text-sm font-black text-gray-400"
                                >
                                    <Navigation className="h-5 w-5" />
                                    View Map
                                </button>
                            )}
                            {phoneHref ? (
                                <a
                                    href={phoneHref}
                                    className="inline-flex h-[52px] items-center justify-center gap-2 rounded-xl bg-gray-950 px-3 text-sm font-black text-white"
                                >
                                    <Phone className="h-5 w-5" />
                                    Call
                                </a>
                            ) : (
                                <button
                                    type="button"
                                    disabled
                                    className="inline-flex h-[52px] items-center justify-center gap-2 rounded-xl bg-gray-100 px-3 text-sm font-black text-gray-400"
                                >
                                    <Phone className="h-5 w-5" />
                                    Call
                                </button>
                            )}
                        </div>

                        <div className="mt-3 rounded-xl bg-[var(--color-surface-soft)] p-3 text-sm font-semibold text-[var(--color-text-muted)]">
                            <p className="line-clamp-2">{fullAddress}</p>
                        </div>
                    </section>
                )}

                <div className={`${isDelivery ? "mx-auto max-w-2xl" : "grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_420px]"}`}>
                    {/* Left Column - Order Items & Details */}
                    <div className={`${isDelivery ? "space-y-4" : "space-y-6"}`}>
                        {!isDelivery && (
                            <section className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] shadow-sm">
                                <div className="flex items-center justify-between gap-4 border-b border-[var(--color-border)] px-5 py-4">
                                    <h2 className="flex items-center text-lg font-semibold text-[var(--color-text-main)]">
                                        <Package className="mr-2 h-5 w-5 text-[var(--color-primary)]" />
                                        Order Items
                                    </h2>
                                    <span className="rounded-md bg-[var(--color-surface-soft)] px-2.5 py-1 text-sm font-bold text-[var(--color-text-muted)]">
                                        {order.orderItems.length} item{order.orderItems.length === 1 ? "" : "s"}
                                    </span>
                                </div>
                                <div className="divide-y divide-[var(--color-border)]">
                                    {order.orderItems.map((item, index) => (
                                        <div
                                            key={index}
                                            className="grid grid-cols-[72px_minmax(0,1fr)] gap-4 p-5 sm:grid-cols-[88px_minmax(0,1fr)_120px]"
                                        >
                                            <img
                                                src={item.image}
                                                alt={item.name}
                                                className="h-[72px] w-[72px] rounded-lg border border-[var(--color-border)] object-cover sm:h-[88px] sm:w-[88px]"
                                            />
                                            <div className="min-w-0 self-center">
                                                <h3 className="font-bold leading-snug text-[var(--color-text-main)]">{item.name}</h3>
                                                <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                                                    Quantity {item.quantity} · {formatCurrency(item.price)} each
                                                    {item.size ? ` · Size ${item.size}` : ""}
                                                </p>
                                            </div>
                                            <div className="col-span-2 flex items-center justify-between rounded-lg bg-[var(--color-surface-soft)] px-4 py-3 sm:col-span-1 sm:block sm:self-center sm:bg-transparent sm:px-0 sm:py-0 sm:text-right">
                                                <p className="text-sm font-medium text-[var(--color-text-muted)] sm:hidden">Line total</p>
                                                <p className="font-bold text-[var(--color-text-main)]">
                                                    {formatCurrency(item.price * item.quantity)}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {!isDelivery && (
                            <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-5 shadow-sm">
                                <h2 className="mb-4 flex items-center text-lg font-semibold text-[var(--color-text-main)]">
                                    <MapPin className="mr-2 h-5 w-5 text-[var(--color-primary)]" />
                                    Shipping Address
                                </h2>
                                <div className="grid gap-4 text-[var(--color-text-muted)] md:grid-cols-[minmax(0,1fr)_auto]">
                                    <div className="space-y-1 leading-7">
                                        <p className="font-bold text-[var(--color-text-main)]">{order.shippingAddress.fullName}</p>
                                        {order.shippingAddress.street && <p>{order.shippingAddress.street}</p>}
                                        {order.shippingAddress.address && <p>{order.shippingAddress.address}</p>}
                                        {order.shippingAddress.city && <p>{order.shippingAddress.city}</p>}
                                        {order.shippingAddress.postalCode && (
                                            <p>{order.shippingAddress.postalCode}</p>
                                        )}
                                        {order.shippingAddress.country && (
                                            <p>{order.shippingAddress.country}</p>
                                        )}
                                        <p className="pt-2">
                                            <span className="font-bold text-[var(--color-text-main)]">Phone:</span>{" "}
                                            {customerPhone}
                                        </p>
                                    </div>

                                    {/* Google Maps Link */}
                                    {mapUrl && (
                                        <a
                                            href={mapUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-soft)] px-4 text-sm font-bold text-[var(--color-primary-dark)] transition-colors hover:border-[var(--color-primary)] hover:bg-[var(--color-bg-card)]"
                                        >
                                            <Navigation className="w-4 h-4" />
                                            View Map
                                            <ExternalLink className="w-4 h-4" />
                                        </a>
                                    )}
                                </div>
                            </section>
                        )}

                        {!isDelivery && (
                            <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-5 shadow-sm">
                                <h2 className="mb-4 flex items-center text-lg font-semibold text-[var(--color-text-main)]">
                                    <CreditCard className="mr-2 h-5 w-5 text-[var(--color-primary)]" />
                                    Payment Information
                                </h2>
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <div className="rounded-lg bg-[var(--color-surface-soft)] p-4">
                                        <p className="text-xs font-bold uppercase tracking-wide text-[var(--color-text-muted)]">Method</p>
                                        <p className="mt-1 font-bold text-[var(--color-text-main)]">{order.paymentMethod || "N/A"}</p>
                                    </div>
                                    <div className="rounded-lg bg-[var(--color-surface-soft)] p-4">
                                        <p className="text-xs font-bold uppercase tracking-wide text-[var(--color-text-muted)]">Status</p>
                                        <span
                                            className={`mt-2 inline-flex rounded-md border px-2.5 py-1 text-sm font-bold ${getPaymentStatusColor(getDisplayPaymentStatus(order))}`}
                                        >
                                            {getDisplayPaymentStatus(order)}
                                        </span>
                                    </div>
                                    {order.isPaid && (
                                        <div className="rounded-lg bg-[var(--color-surface-soft)] p-4 sm:col-span-2">
                                            <p className="text-xs font-bold uppercase tracking-wide text-[var(--color-text-muted)]">Paid At</p>
                                            <p className="mt-1 font-bold text-[var(--color-text-main)]">
                                                {new Date(order.paidAt).toLocaleString()}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </section>
                        )}

                        {!isDelivery && (
                            <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-5 shadow-sm">
                                <div className="mb-5 flex items-center justify-between gap-3">
                                    <h2 className="flex items-center text-lg font-semibold text-[var(--color-text-main)]">
                                        <DollarSign className="mr-2 h-5 w-5 text-[var(--color-primary)]" />
                                        Order Summary
                                    </h2>
                                    <button
                                        type="button"
                                        onClick={handleSendReceiptToTelegram}
                                        disabled={sendingReceipt}
                                        className="inline-flex h-10 items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)] px-3 text-sm font-bold text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface-soft)] hover:text-[var(--color-text-main)] disabled:cursor-not-allowed disabled:opacity-60"
                                        title="Send receipt photo to Telegram"
                                    >
                                        <Printer className="h-4 w-4" />
                                        {sendingReceipt ? "Sending..." : "Print"}
                                    </button>
                                </div>
                                <div className="space-y-3 text-sm text-[var(--color-text-muted)]">
                                    {summaryRows.slice(0, 5).map(([label, value]) => (
                                        <div key={label} className="grid grid-cols-[130px_minmax(0,1fr)] gap-4">
                                            <span>{label}</span>
                                            <span className="text-right font-bold text-[var(--color-text-main)]">{value}</span>
                                        </div>
                                    ))}
                                    <div className="mt-4 space-y-3 border-t border-[var(--color-border)] pt-4">
                                        <div className="flex justify-between gap-4">
                                            <span>Subtotal:</span>
                                            <span className="font-bold text-[var(--color-text-main)]">{formatCurrency(subtotal)}</span>
                                        </div>
                                        <div className="flex justify-between gap-4">
                                            <span>Delivery Fee:</span>
                                            <span className="font-bold text-[var(--color-text-main)]">{formatCurrency(deliveryFee)}</span>
                                        </div>
                                        <div className="flex justify-between gap-4">
                                            <span>Tax:</span>
                                            <span className="font-bold text-[var(--color-text-main)]">{formatCurrency(taxPrice)}</span>
                                        </div>
                                        <div className="mt-4 flex justify-between gap-4 rounded-lg bg-[var(--color-surface-soft)] p-4 text-lg font-bold text-[var(--color-text-main)]">
                                            <span>Total:</span>
                                            <span>{formatCurrency(displayedTotal)}</span>
                                        </div>
                                    </div>
                                </div>
                            </section>
                        )}
                    </div>

                    {/* Right Column - Summary & Actions */}
                    <aside className={`${isDelivery ? "space-y-4 xl:order-2" : "space-y-6"} xl:sticky xl:top-6 xl:self-start`}>
                        {!isDelivery && (
                            <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-5 shadow-sm">
                                <h2 className="mb-4 flex items-center text-lg font-semibold text-[var(--color-text-main)]">
                                    <User className="mr-2 h-5 w-5 text-[var(--color-primary)]" />
                                    Customer
                                </h2>
                                <div className="flex items-center gap-3">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-primary)] text-lg font-bold text-white">
                                        {(customerName || "N").charAt(0).toUpperCase()}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="truncate font-bold text-[var(--color-text-main)]">{order.user?.name || customerName}</p>
                                        <p className="truncate text-sm text-[var(--color-text-muted)]">{order.user?.email || "N/A"}</p>
                                    </div>
                                </div>
                            </section>
                        )}

                        {/* Update Order Status */}
                        {canManageOrderStatus && !isDelivery && renderOrderStatusSection()}
                        {renderSellerConfirmationSection()}

                        {/* Update Payment Status */}
                        {(adminUser?.role === "admin" ||
                            order.paymentMethod === "Cash on Delivery") && (
                        <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-5 shadow-sm">
                            <h2 className="mb-4 flex items-center text-lg font-semibold text-[var(--color-text-main)]">
                                <CreditCard className="mr-2 h-5 w-5 text-[var(--color-primary)]" />
                                {isDelivery ? "Collect Cash Payment" : "Update Payment Status"}
                            </h2>
                            <div className="grid gap-2">
                                {paymentStatuses.map(
                                    (paymentStatus) => (
                                        <button
                                            key={paymentStatus}
                                            onClick={() => handlePaymentStatusUpdate(paymentStatus)}
                                            disabled={updating || order.paymentStatus === paymentStatus}
                                            aria-label={
                                                order.paymentStatus === paymentStatus
                                                    ? `Current payment status: ${paymentStatus}`
                                                    : `Mark payment as ${paymentStatus}`
                                            }
                                            title={
                                                order.paymentStatus === paymentStatus
                                                    ? `Current payment status: ${paymentStatus}`
                                                    : `Mark as ${paymentStatus}`
                                            }
                                                className={`inline-flex h-11 w-full items-center justify-center rounded-lg px-4 font-bold transition-colors ${order.paymentStatus === paymentStatus
                                                        ? "cursor-not-allowed bg-[var(--color-surface-soft)] text-[var(--color-text-muted)]"
                                                        : paymentStatus === "Paid"
                                                            ? "bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-dark)]"
                                                            : paymentStatus === "Failed"
                                                                ? "bg-[var(--color-secondary)] text-white hover:opacity-90"
                                                                : "bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-dark)]"
                                                    }`}
                                            >
                                            {order.paymentStatus === paymentStatus ? (
                                                <span className="flex items-center justify-center">
                                                    <CheckCircle className="w-5 h-5 mr-2" aria-hidden="true" />
                                                    {paymentStatus}
                                                </span>
                                            ) : (
                                                `Mark as ${paymentStatus}`
                                            )}
                                        </button>
                                    )
                                )}
                            </div>
                        </section>
                        )}

                        {isDelivery && (
                            <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-5 shadow-sm">
                                <h2 className="mb-4 flex items-center text-lg font-semibold text-[var(--color-text-main)]">
                                    <CreditCard className="mr-2 h-5 w-5 text-[var(--color-primary)]" />
                                    Payment Information
                                </h2>
                                <div className="grid gap-3">
                                    <div className="rounded-lg bg-[var(--color-surface-soft)] p-4">
                                        <p className="text-xs font-bold uppercase tracking-wide text-[var(--color-text-muted)]">Method</p>
                                        <p className="mt-1 font-bold text-[var(--color-text-main)]">{order.paymentMethod || "N/A"}</p>
                                    </div>
                                    <div className="rounded-lg bg-[var(--color-surface-soft)] p-4">
                                        <p className="text-xs font-bold uppercase tracking-wide text-[var(--color-text-muted)]">Status</p>
                                        <span
                                            className={`mt-2 inline-flex rounded-md border px-2.5 py-1 text-sm font-bold ${getPaymentStatusColor(getDisplayPaymentStatus(order))}`}
                                        >
                                            {getDisplayPaymentStatus(order)}
                                        </span>
                                    </div>
                                    {order.isPaid && (
                                        <div className="rounded-lg bg-[var(--color-surface-soft)] p-4">
                                            <p className="text-xs font-bold uppercase tracking-wide text-[var(--color-text-muted)]">Paid At</p>
                                            <p className="mt-1 font-bold text-[var(--color-text-main)]">
                                                {new Date(order.paidAt).toLocaleString()}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </section>
                        )}

                        {/* Delivery Proof */}
                        <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-5 shadow-sm">
                            <h2 className="mb-4 flex items-center text-lg font-semibold text-[var(--color-text-main)]">
                                <Camera className="mr-2 h-5 w-5 text-[var(--color-primary)]" />
                                Delivery Proof
                            </h2>
                            {order.deliveryProof?.imageUrl ? (
                                <div className="space-y-3">
                                    <a
                                        href={order.deliveryProof.imageUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="block overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-soft)]"
                                    >
                                        <img
                                            src={order.deliveryProof.imageUrl}
                                            alt={`Delivery proof for order #${displayOrderId}`}
                                            className="h-56 w-full object-cover"
                                        />
                                    </a>
                                    {order.deliveryProof.uploadedAt && (
                                        <p className="text-sm font-medium text-[var(--color-text-muted)]">
                                            Uploaded {new Date(order.deliveryProof.uploadedAt).toLocaleString()}
                                        </p>
                                    )}
                                </div>
                            ) : (
                                <div className="rounded-lg border border-dashed border-[var(--color-border)] bg-[var(--color-surface-soft)] p-5 text-center">
                                    <ImageIcon className="mx-auto mb-2 h-8 w-8 text-[var(--color-text-muted)]" />
                                    <p className="text-sm font-medium text-[var(--color-text-muted)]">
                                        No delivery proof photo uploaded yet.
                                    </p>
                                </div>
                            )}

                            {isDelivery && (
                                <label className={`mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg px-4 font-bold transition-colors ${
                                    uploadingProof
                                        ? "cursor-wait bg-[var(--color-surface-soft)] text-[var(--color-text-muted)]"
                                        : "cursor-pointer bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-dark)]"
                                }`}>
                                    <Camera className="h-5 w-5" />
                                    {uploadingProof ? "Uploading..." : order.deliveryProof?.imageUrl ? "Retake Photo" : "Take a Photo"}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        capture="environment"
                                        className="sr-only"
                                        disabled={uploadingProof}
                                        onChange={handleDeliveryProofCapture}
                                    />
                                </label>
                            )}
                        </section>

                        {canManageOrderStatus && isDelivery && renderOrderStatusSection()}

                        {/* Timeline */}
                        {order.isDelivered && (
                            <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-5 shadow-sm">
                                <h2 className="mb-4 flex items-center text-lg font-semibold text-[var(--color-text-main)]">
                                    <Calendar className="mr-2 h-5 w-5 text-[var(--color-primary)]" />
                                    Timeline
                                </h2>
                                <div className="space-y-3 text-sm">
                                    <div className="flex items-center text-[var(--color-text-muted)]">
                                        <div className="mr-3 h-2 w-2 rounded-full bg-[var(--color-primary)]"></div>
                                        <div>
                                            <p className="font-bold text-[var(--color-text-main)]">Order Delivered</p>
                                            <p>
                                                {new Date(order.deliveredAt).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                    {order.isPaid && (
                                        <div className="flex items-center text-[var(--color-text-muted)]">
                                            <div className="mr-3 h-2 w-2 rounded-full bg-[var(--color-primary-light)]"></div>
                                            <div>
                                                <p className="font-bold text-[var(--color-text-main)]">Payment Received</p>
                                                <p>
                                                    {new Date(order.paidAt).toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                    <div className="flex items-center text-[var(--color-text-muted)]">
                                        <div className="mr-3 h-2 w-2 rounded-full bg-[var(--color-surface-soft)]"></div>
                                        <div>
                                            <p className="font-bold text-[var(--color-text-main)]">Order Placed</p>
                                            <p>
                                                {new Date(order.createdAt).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </section>
                        )}
                    </aside>
                </div>
            </div>

            {isDelivery && (
                <div className="fixed inset-x-0 bottom-0 z-30 border-t border-gray-200 bg-white/95 px-3 py-3 shadow-[0_-12px_30px_rgba(15,23,42,0.12)] backdrop-blur lg:hidden">
                    <div className="mx-auto grid max-w-3xl grid-cols-3 gap-2">
                        {mapUrl ? (
                            <button
                                type="button"
                                onClick={handleOpenGoogleMaps}
                                className="inline-flex h-[54px] flex-col items-center justify-center gap-1 rounded-xl bg-blue-600 text-xs font-black text-white"
                            >
                                <Navigation className="h-5 w-5" />
                                View Map
                            </button>
                        ) : (
                            <button
                                type="button"
                                disabled
                                className="inline-flex h-[54px] flex-col items-center justify-center gap-1 rounded-xl bg-gray-100 text-xs font-black text-gray-400"
                            >
                                <Navigation className="h-5 w-5" />
                                View Map
                            </button>
                        )}
                        <label className={`inline-flex h-[54px] flex-col items-center justify-center gap-1 rounded-xl text-xs font-black ${
                            uploadingProof
                                ? "bg-gray-100 text-gray-400"
                                : "bg-gray-950 text-white"
                        }`}>
                            <Camera className="h-5 w-5" />
                            Photo
                            <input
                                type="file"
                                accept="image/*"
                                capture="environment"
                                className="sr-only"
                                disabled={uploadingProof}
                                onChange={handleDeliveryProofCapture}
                            />
                        </label>
                        <button
                            type="button"
                            onClick={() => handleStatusUpdate("Delivered")}
                            disabled={updating || currentOrderStatus === "Delivered"}
                            className={`inline-flex h-[54px] flex-col items-center justify-center gap-1 rounded-xl text-xs font-black ${
                                currentOrderStatus === "Delivered"
                                    ? "bg-green-100 text-green-700"
                                    : "bg-green-600 text-white"
                            }`}
                        >
                            <CheckCircle className="h-5 w-5" />
                            Done
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OrderDetails;
