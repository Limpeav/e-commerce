import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    CheckCircle,
    Eye,
    Search,
    WalletCards,
} from "lucide-react";
import { AdminController } from "../../../controllers/adminController";
import { OrderController } from "../../../controllers";
import Loading from "../../../components/common/Loading";
import Price from "../../../components/common/Price";
import { getPortalOrderDetailsPath, getStoredAdminUser } from "../../../utils/adminSession";
import {
    buildOrderSearchSuggestionValues,
    getMatchingSearchSuggestions,
} from "../../../utils/searchSuggestions";
import { subscribeRealtimeDomains } from "../../../services/realtime";

const formatUSD = (amount) =>
    new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
    }).format(Number(amount || 0));
const formatCurrency = formatUSD;

const PaymentQueue = () => {
    const navigate = useNavigate();
    const adminUser = getStoredAdminUser();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updatingOrderId, setUpdatingOrderId] = useState("");
    const [error, setError] = useState("");
    const [searchTerm, setSearchTerm] = useState("");

    const loadOrders = useCallback(async ({ silent = false } = {}) => {
        try {
            if (!silent) setLoading(true);
            setError("");
            const response = await OrderController.getOrders();
            setOrders(response.data || []);
        } catch (err) {
            setError(err.response?.data?.message || "Failed to load payment queue");
        } finally {
            if (!silent) setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadOrders();
        return subscribeRealtimeDomains(
            ["orders"],
            () => loadOrders({ silent: true })
        );
    }, [loadOrders]);

    const baseQueuedOrders = useMemo(
        () =>
            orders
                .filter(
                    (order) =>
                        order.paymentMethod === "Cash on Delivery" &&
                        order.paymentStatus !== "Paid" &&
                        !["Delivered", "Cancelled"].includes(order.orderStatus)
                )
                .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)),
        [orders]
    );
    const searchSuggestions = useMemo(
        () =>
            getMatchingSearchSuggestions(
                buildOrderSearchSuggestionValues(baseQueuedOrders),
                searchTerm,
                8
            ),
        [baseQueuedOrders, searchTerm]
    );
    const queuedOrders = useMemo(() => {
        const query = searchTerm.trim().toLowerCase().replace(/^#/, "");

        return baseQueuedOrders
            .filter((order) => {
                if (!query) return true;

                return (
                    order._id?.toLowerCase().includes(query) ||
                    order.shippingAddress?.fullName?.toLowerCase().includes(query) ||
                    order.shippingAddress?.phone?.toLowerCase().includes(query) ||
                    order.user?.name?.toLowerCase().includes(query) ||
                    order.user?.email?.toLowerCase().includes(query)
                );
            });
    }, [baseQueuedOrders, searchTerm]);

    const queueTotal = queuedOrders.reduce(
        (total, order) => total + Number(order.totalPrice || 0),
        0
    );

    const handleMarkPaid = async (order) => {
        if (!window.confirm(`Mark order #${order._id.slice(-8)} as paid?`)) {
            return;
        }

        setUpdatingOrderId(order._id);
        const result = await AdminController.updatePaymentStatus(order._id, "Paid");

        if (!result.success) {
            alert(result.error || "Failed to mark order as paid");
            setUpdatingOrderId("");
            return;
        }

        window.dispatchEvent(new Event("admin-orders-updated"));
        await loadOrders();
        setUpdatingOrderId("");
    };

    if (loading) {
        return <Loading message="Loading payment queue..." />;
    }

    return (
        <div className="min-h-screen bg-gray-50 p-4 pt-20 sm:p-6 lg:p-8">
            <div className="mx-auto max-w-7xl">
                <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <p className="text-sm font-bold uppercase tracking-wide text-[var(--color-primary)]">
                            Seller
                        </p>
                        <h1 className="mt-1 text-3xl font-black text-gray-950">Payment Queue</h1>
                        <p className="mt-2 text-sm font-medium text-gray-500">
                            Confirm cash on delivery payments before handoff.
                        </p>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-lg border border-amber-100 bg-amber-50 px-4 py-3">
                            <p className="text-xs font-black uppercase text-amber-700">Pending Orders</p>
                            <p className="mt-1 text-2xl font-black text-amber-900">{queuedOrders.length}</p>
                        </div>
                        <div className="rounded-lg border border-green-100 bg-green-50 px-4 py-3">
                            <p className="text-xs font-black uppercase text-green-700">Pending Cash</p>
                            <Price amount={queueTotal} className="mt-1 text-2xl font-black text-green-900" usdClassName="text-green-900" />
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                        {error}
                    </div>
                )}

                <section className="overflow-hidden rounded-lg border border-gray-100 bg-white shadow-sm">
                    <div className="flex flex-col gap-4 border-b border-gray-100 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
                        <h2 className="flex items-center gap-2 text-lg font-black text-gray-950">
                            <WalletCards className="h-5 w-5 text-[var(--color-primary)]" />
                            Cash Payment Actions
                        </h2>
                        <label className="relative block w-full lg:w-96">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                            <input
                                type="search"
                                list="payment-queue-search-suggestions"
                                value={searchTerm}
                                onChange={(event) => setSearchTerm(event.target.value)}
                                placeholder="Search order, customer, phone"
                                className="h-11 w-full rounded-lg border border-gray-200 bg-white pl-10 pr-3 text-sm font-semibold text-gray-800 focus:border-[var(--color-primary)] focus:outline-none focus:ring-4 focus:ring-[var(--color-primary)]/10"
                            />
                            <datalist id="payment-queue-search-suggestions">
                                {searchSuggestions.map((suggestion) => (
                                    <option key={suggestion} value={suggestion} />
                                ))}
                            </datalist>
                        </label>
                    </div>

                    {queuedOrders.length === 0 ? (
                        <div className="px-5 py-16 text-center">
                            <CheckCircle className="mx-auto h-10 w-10 text-green-500" />
                            <p className="mt-3 font-black text-gray-950">No cash payments waiting</p>
                            <p className="mt-1 text-sm font-medium text-gray-500">
                                Orders that need cashier confirmation will appear here.
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-100 text-sm">
                                <thead className="bg-gray-50 text-left text-xs font-black uppercase tracking-wide text-gray-500">
                                    <tr>
                                        <th className="px-5 py-3">Order</th>
                                        <th className="px-5 py-3">Customer</th>
                                        <th className="px-5 py-3">Phone</th>
                                        <th className="px-5 py-3">Order Status</th>
                                        <th className="px-5 py-3 text-right">Total</th>
                                        <th className="px-5 py-3 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {queuedOrders.map((order) => (
                                        <tr key={order._id} className="hover:bg-gray-50">
                                            <td className="whitespace-nowrap px-5 py-4 font-black text-gray-950">
                                                #{order._id.slice(-8)}
                                            </td>
                                            <td className="px-5 py-4 font-bold text-gray-800">
                                                {order.shippingAddress?.fullName || order.user?.name || "Customer"}
                                            </td>
                                            <td className="whitespace-nowrap px-5 py-4 font-semibold text-gray-600">
                                                {order.shippingAddress?.phone || "N/A"}
                                            </td>
                                            <td className="whitespace-nowrap px-5 py-4">
                                                <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-black text-blue-700">
                                                    {order.orderStatus}
                                                </span>
                                            </td>
                                            <td className="whitespace-nowrap px-5 py-4 text-right font-black text-gray-950">
                                                <Price amount={order.totalPrice} usdClassName="text-gray-950" />
                                            </td>
                                            <td className="whitespace-nowrap px-5 py-4">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => navigate(getPortalOrderDetailsPath(order._id, adminUser))}
                                                        className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-3 text-xs font-black text-gray-700 hover:bg-gray-50"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                        Open
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleMarkPaid(order)}
                                                        disabled={updatingOrderId === order._id}
                                                        className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-green-600 px-3 text-xs font-black text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
                                                    >
                                                        <CheckCircle className="h-4 w-4" />
                                                        {updatingOrderId === order._id ? "Saving..." : "Mark Paid"}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
};

export default PaymentQueue;
