import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    ArrowRight,
    CheckCircle,
    Clock,
    ReceiptText,
    Search,
    WalletCards,
} from "lucide-react";
import { adminService } from "../../../services/adminService";
import Loading from "../../../components/common/Loading";
import Price from "../../../components/common/Price";
import {
    getPortalCashReportPath,
    getPortalOrderDetailsPath,
    getPortalPaymentQueuePath,
    getStoredAdminUser,
} from "../../../utils/adminSession";

const getTodayDate = () => new Date().toISOString().slice(0, 10);

const formatUSD = (amount) =>
    new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
    }).format(Number(amount || 0));
const formatCurrency = formatUSD;

const SellerDashboard = () => {
    const navigate = useNavigate();
    const adminUser = getStoredAdminUser();
    const [orders, setOrders] = useState([]);
    const [cashReport, setCashReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let isMounted = true;

        const loadDashboard = async () => {
            try {
                setLoading(true);
                setError("");
                const [ordersResponse, cashResponse] = await Promise.all([
                    adminService.getOrders(),
                    adminService.getDailyCashReport(getTodayDate()),
                ]);

                if (isMounted) {
                    setOrders(ordersResponse.data || []);
                    setCashReport(cashResponse.data);
                }
            } catch (err) {
                if (isMounted) {
                    setError(err.response?.data?.message || "Failed to load seller dashboard");
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        loadDashboard();

        return () => {
            isMounted = false;
        };
    }, []);

    const pendingCashOrders = useMemo(() => {
        return orders
            .filter(
                (order) =>
                    order.paymentMethod === "Cash on Delivery" &&
                    order.paymentStatus !== "Paid" &&
                    !["Delivered", "Cancelled"].includes(order.orderStatus)
            )
            .slice(0, 5);
    }, [orders]);

    const paidTodayCount = cashReport?.summary?.orderCount || 0;
    const totalCashToday = cashReport?.summary?.totalCash || 0;
    const unpaidCashCount = pendingCashOrders.length;
    const pendingTotal = pendingCashOrders.reduce(
        (total, order) => total + Number(order.totalPrice || 0),
        0
    );

    if (loading) {
        return <Loading message="Loading seller dashboard..." />;
    }

    const statCards = [
        {
            label: "Cash Today",
            value: <Price amount={totalCashToday} />,
            hint: `${paidTodayCount} paid order${paidTodayCount === 1 ? "" : "s"}`,
            icon: WalletCards,
            tone: "text-green-700",
            bg: "bg-green-50",
        },
        {
            label: "Payment Queue",
            value: unpaidCashCount,
            hint: `${formatCurrency(pendingTotal)} pending`,
            icon: Clock,
            tone: "text-amber-700",
            bg: "bg-amber-50",
        },
        {
            label: "Paid Today",
            value: paidTodayCount,
            hint: "cash on delivery",
            icon: CheckCircle,
            tone: "text-blue-700",
            bg: "bg-blue-50",
        },
    ];

    return (
        <div className="min-h-screen bg-gray-50 p-4 pt-20 sm:p-6 lg:p-8">
            <div className="mx-auto max-w-7xl">
                <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <p className="text-sm font-bold uppercase tracking-wide text-[var(--color-primary)]">
                            Seller
                        </p>
                        <h1 className="mt-1 text-3xl font-black text-gray-950">Cashier Dashboard</h1>
                        <p className="mt-2 text-sm font-medium text-gray-500">
                            Track cash collection, payment queue, and daily reporting.
                        </p>
                    </div>
                    <div className="flex flex-col gap-3 sm:flex-row">
                        <button
                            type="button"
                            onClick={() => navigate(getPortalPaymentQueuePath(adminUser))}
                            className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 text-sm font-black text-white hover:bg-[var(--color-primary-dark)]"
                        >
                            <Search className="h-4 w-4" />
                            Open Queue
                        </button>
                        <button
                            type="button"
                            onClick={() => navigate(getPortalCashReportPath(adminUser))}
                            className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 text-sm font-black text-gray-700 hover:bg-gray-50"
                        >
                            <ReceiptText className="h-4 w-4" />
                            Cash Report
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                        {error}
                    </div>
                )}

                <div className="mb-6 grid gap-4 md:grid-cols-3">
                    {statCards.map((card) => {
                        const Icon = card.icon;

                        return (
                            <div key={card.label} className="rounded-lg border border-gray-100 bg-white p-5 shadow-sm">
                                <div className="flex items-center justify-between gap-4">
                                    <div>
                                        <p className="text-xs font-black uppercase tracking-wide text-gray-500">
                                            {card.label}
                                        </p>
                                        <p className={`mt-2 text-3xl font-black ${card.tone}`}>{card.value}</p>
                                        <p className="mt-1 text-xs font-bold text-gray-500">{card.hint}</p>
                                    </div>
                                    <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${card.bg}`}>
                                        <Icon className={`h-6 w-6 ${card.tone}`} />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <section className="overflow-hidden rounded-lg border border-gray-100 bg-white shadow-sm">
                    <div className="flex items-center justify-between gap-4 border-b border-gray-100 px-5 py-4">
                        <div>
                            <h2 className="text-lg font-black text-gray-950">Needs Payment</h2>
                            <p className="mt-1 text-sm font-medium text-gray-500">
                                Cash orders waiting for payment confirmation.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => navigate(getPortalPaymentQueuePath(adminUser))}
                            className="inline-flex items-center gap-2 text-sm font-black text-[var(--color-primary)]"
                        >
                            View all
                            <ArrowRight className="h-4 w-4" />
                        </button>
                    </div>

                    {pendingCashOrders.length === 0 ? (
                        <div className="px-5 py-14 text-center">
                            <CheckCircle className="mx-auto h-10 w-10 text-green-500" />
                            <p className="mt-3 font-black text-gray-950">No pending cash payments</p>
                            <p className="mt-1 text-sm font-medium text-gray-500">
                                The payment queue is clear.
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {pendingCashOrders.map((order) => (
                                <button
                                    key={order._id}
                                    type="button"
                                    onClick={() => navigate(getPortalOrderDetailsPath(order._id, adminUser))}
                                    className="flex w-full flex-col gap-3 px-5 py-4 text-left hover:bg-gray-50 sm:flex-row sm:items-center sm:justify-between"
                                >
                                    <div>
                                        <p className="font-black text-gray-950">
                                            #{order._id.slice(-8)} · {order.shippingAddress?.fullName || order.user?.name || "Customer"}
                                        </p>
                                        <p className="mt-1 text-sm font-semibold text-gray-500">
                                            {order.shippingAddress?.phone || "No phone"} · {order.orderStatus}
                                        </p>
                                    </div>
                                    <div className="text-left sm:text-right">
                                        <Price amount={order.totalPrice} className="font-black text-gray-950" usdClassName="text-gray-950" />
                                        <p className="mt-1 text-xs font-black uppercase text-amber-700">
                                            {order.paymentStatus}
                                        </p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
};

export default SellerDashboard;
