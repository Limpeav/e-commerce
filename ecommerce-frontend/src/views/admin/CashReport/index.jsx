import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    CalendarDays,
    Download,
    ReceiptText,
    Search,
    WalletCards,
} from "lucide-react";
import { adminService } from "../../../services/adminService";
import Loading from "../../../components/common/Loading";
import { getPortalOrderDetailsPath, getStoredAdminUser } from "../../../utils/adminSession";

const getTodayDate = () => new Date().toISOString().slice(0, 10);

const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
    }).format(Number(amount || 0));

const formatDateTime = (value) => {
    if (!value) return "N/A";

    return new Date(value).toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
};

const downloadBlob = (blob, fileName) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
};

const CashReport = () => {
    const navigate = useNavigate();
    const adminUser = getStoredAdminUser();
    const [selectedDate, setSelectedDate] = useState(getTodayDate());
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);
    const [error, setError] = useState("");
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        let isMounted = true;

        const loadReport = async () => {
            try {
                setLoading(true);
                setError("");
                const response = await adminService.getDailyCashReport(selectedDate);

                if (isMounted) {
                    setReport(response.data);
                }
            } catch (err) {
                if (isMounted) {
                    setError(err.response?.data?.message || "Failed to load cash report");
                    setReport(null);
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        loadReport();

        return () => {
            isMounted = false;
        };
    }, [selectedDate]);

    const filteredOrders = useMemo(() => {
        const orders = report?.orders || [];
        const query = searchTerm.trim().toLowerCase();

        if (!query) {
            return orders;
        }

        return orders.filter((order) => {
            return (
                order.shortId?.toLowerCase().includes(query) ||
                order.customerName?.toLowerCase().includes(query) ||
                order.customerPhone?.toLowerCase().includes(query)
            );
        });
    }, [report?.orders, searchTerm]);

    const handleExportCsv = async () => {
        try {
            setExporting(true);
            const response = await adminService.exportDailyCashReport(selectedDate);
            downloadBlob(response.data, `cash-report-${selectedDate}.csv`);
        } catch (err) {
            alert(err.response?.data?.message || "Failed to export cash report");
        } finally {
            setExporting(false);
        }
    };

    if (loading) {
        return <Loading message="Loading cash report..." />;
    }

    const summary = report?.summary || {};
    const statCards = [
        {
            label: "Total Cash",
            value: formatCurrency(summary.totalCash),
            tone: "text-green-700",
            bg: "bg-green-50",
        },
        {
            label: "Paid Cash Orders",
            value: summary.orderCount || 0,
            tone: "text-blue-700",
            bg: "bg-blue-50",
        },
        {
            label: "Average Order",
            value: formatCurrency(summary.averageOrderValue),
            tone: "text-indigo-700",
            bg: "bg-indigo-50",
        },
        {
            label: "Pending Cash",
            value: summary.pendingCashCount || 0,
            tone: "text-amber-700",
            bg: "bg-amber-50",
        },
    ];

    return (
        <div className="min-h-screen bg-gray-50 p-4 pt-20 sm:p-6 lg:p-8">
            <div className="mx-auto max-w-7xl">
                <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <p className="text-sm font-bold uppercase tracking-wide text-[var(--color-primary)]">
                            Cashier
                        </p>
                        <h1 className="mt-1 text-3xl font-black text-gray-950">Daily Cash Report</h1>
                        <p className="mt-2 text-sm font-medium text-gray-500">
                            Cash on delivery orders marked paid for the selected day.
                        </p>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row">
                        <label className="relative block">
                            <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={(event) => setSelectedDate(event.target.value)}
                                className="h-12 rounded-lg border border-gray-200 bg-white pl-10 pr-3 text-sm font-bold text-gray-800 shadow-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-4 focus:ring-[var(--color-primary)]/10"
                            />
                        </label>
                        <button
                            type="button"
                            onClick={handleExportCsv}
                            disabled={exporting || !report}
                            className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 text-sm font-black text-white shadow-sm transition-colors hover:bg-[var(--color-primary-dark)] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            <Download className="h-4 w-4" />
                            {exporting ? "Exporting..." : "Export CSV"}
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                        {error}
                    </div>
                )}

                <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {statCards.map((card) => (
                        <div key={card.label} className="rounded-lg border border-gray-100 bg-white p-5 shadow-sm">
                            <div className="flex items-center justify-between gap-4">
                                <div>
                                    <p className="text-xs font-black uppercase tracking-wide text-gray-500">
                                        {card.label}
                                    </p>
                                    <p className={`mt-2 text-3xl font-black ${card.tone}`}>{card.value}</p>
                                </div>
                                <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${card.bg}`}>
                                    <WalletCards className={`h-6 w-6 ${card.tone}`} />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <section className="overflow-hidden rounded-lg border border-gray-100 bg-white shadow-sm">
                    <div className="flex flex-col gap-4 border-b border-gray-100 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <h2 className="flex items-center gap-2 text-lg font-black text-gray-950">
                                <ReceiptText className="h-5 w-5 text-[var(--color-primary)]" />
                                Paid Cash Orders
                            </h2>
                            <p className="mt-1 text-sm font-medium text-gray-500">
                                {filteredOrders.length} order{filteredOrders.length === 1 ? "" : "s"} shown
                            </p>
                        </div>
                        <label className="relative block w-full lg:w-80">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                            <input
                                type="search"
                                value={searchTerm}
                                onChange={(event) => setSearchTerm(event.target.value)}
                                placeholder="Search order, name, phone"
                                className="h-11 w-full rounded-lg border border-gray-200 bg-white pl-10 pr-3 text-sm font-semibold text-gray-800 focus:border-[var(--color-primary)] focus:outline-none focus:ring-4 focus:ring-[var(--color-primary)]/10"
                            />
                        </label>
                    </div>

                    {filteredOrders.length === 0 ? (
                        <div className="px-5 py-16 text-center">
                            <ReceiptText className="mx-auto h-10 w-10 text-gray-300" />
                            <p className="mt-3 font-black text-gray-900">No paid cash orders found</p>
                            <p className="mt-1 text-sm font-medium text-gray-500">
                                Try another date or search term.
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
                                        <th className="px-5 py-3">Paid At</th>
                                        <th className="px-5 py-3">Status</th>
                                        <th className="px-5 py-3 text-right">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredOrders.map((order) => (
                                        <tr
                                            key={order.id}
                                            className="cursor-pointer hover:bg-gray-50"
                                            onClick={() => navigate(getPortalOrderDetailsPath(order.id, adminUser))}
                                        >
                                            <td className="whitespace-nowrap px-5 py-4 font-black text-gray-950">
                                                #{order.shortId}
                                            </td>
                                            <td className="px-5 py-4 font-bold text-gray-800">{order.customerName}</td>
                                            <td className="whitespace-nowrap px-5 py-4 font-semibold text-gray-600">
                                                {order.customerPhone}
                                            </td>
                                            <td className="whitespace-nowrap px-5 py-4 font-semibold text-gray-600">
                                                {formatDateTime(order.paidAt)}
                                            </td>
                                            <td className="whitespace-nowrap px-5 py-4">
                                                <span className="rounded-full bg-green-50 px-2.5 py-1 text-xs font-black text-green-700">
                                                    {order.paymentStatus}
                                                </span>
                                            </td>
                                            <td className="whitespace-nowrap px-5 py-4 text-right font-black text-gray-950">
                                                {formatCurrency(order.totalPrice)}
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

export default CashReport;
