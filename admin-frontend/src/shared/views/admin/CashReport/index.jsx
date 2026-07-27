import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    BarChart3,
    CalendarDays,
    CircleDollarSign,
    Clock3,
    Download,
    ListChecks,
    ReceiptText,
    Search,
    ShoppingCart,
    TrendingUp,
} from "lucide-react";
import { CashReportController } from "../../../controllers";
import Loading from "../../../components/common/Loading";
import AdminPagination from "../../../components/admin/AdminPagination";
import { useAdminPagination } from "../../../hooks/useAdminPagination";
import { getPortalOrderDetailsPath, getStoredAdminUser } from "../../../utils/adminSession";
import {
    buildOrderSearchSuggestionValues,
    getMatchingSearchSuggestions,
} from "../../../utils/searchSuggestions";
import { subscribeRealtimeDomains } from "../../../services/realtime";

const getTodayDate = () => {
    const today = new Date();
    const timezoneOffsetMs = today.getTimezoneOffset() * 60 * 1000;

    return new Date(today.getTime() - timezoneOffsetMs).toISOString().slice(0, 10);
};

const getReportPeriod = (activeTab, viewMode) => {
    if (activeTab === "trends") return "trend";
    return viewMode;
};

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

const formatDisplayDate = (value) => {
    if (!value) return "N/A";

    return new Date(`${value}T00:00:00`).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
    });
};

const formatMonthLabel = (value) => {
    if (!value) return "Selected month";

    return new Date(`${value.slice(0, 7)}-01T00:00:00`).toLocaleDateString(undefined, {
        month: "long",
        year: "numeric",
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

const CashTrendChart = ({ data }) => {
    const [hoveredIndex, setHoveredIndex] = useState(null);
    const chartHeight = 208;
    const maxCash = Math.max(...data.map((day) => day.totalCash), 0);
    const hoveredDay = hoveredIndex === null ? null : data[hoveredIndex];

    if (!data.length) {
        return (
            <div className="flex h-72 items-center justify-center rounded-lg bg-gray-50 text-sm font-bold text-gray-500">
                No trend data available
            </div>
        );
    }

    return (
        <div className="relative mb-6 rounded-lg bg-gray-50 px-3 pb-3 pt-10 sm:px-4">
            {hoveredDay && (
                <div className="pointer-events-none absolute left-1/2 top-2 z-10 -translate-x-1/2 rounded-lg bg-gray-950 px-3 py-2 text-center text-xs font-bold text-white shadow-lg">
                    <span className="text-gray-300">{formatDisplayDate(hoveredDay.date)}</span>
                    <span className="ml-2">{formatCurrency(hoveredDay.totalCash)}</span>
                    <span className="ml-2 text-gray-300">
                        {hoveredDay.orderCount} order{hoveredDay.orderCount === 1 ? "" : "s"}
                    </span>
                </div>
            )}

            <div className="flex h-[240px] min-w-[680px] items-end gap-1.5 sm:gap-2">
                {data.map((day, index) => {
                    const barHeight =
                        maxCash > 0 && day.totalCash > 0
                            ? Math.max(8, (day.totalCash / maxCash) * chartHeight)
                            : 2;
                    const isHovered = hoveredIndex === index;

                    return (
                        <button
                            key={day.date}
                            type="button"
                            onPointerEnter={() => setHoveredIndex(index)}
                            onPointerMove={() => setHoveredIndex(index)}
                            onPointerLeave={() => setHoveredIndex(null)}
                            onFocus={() => setHoveredIndex(index)}
                            onBlur={() => setHoveredIndex(null)}
                            className="group flex min-w-0 flex-1 flex-col items-center justify-end gap-2 focus:outline-none"
                            aria-label={`${formatDisplayDate(day.date)}: ${formatCurrency(day.totalCash)}, ${day.orderCount} paid orders`}
                        >
                            <span
                                className={`w-full rounded-t-md transition-colors ${
                                    isHovered
                                        ? "bg-[var(--color-primary-dark)]"
                                        : day.totalCash > 0
                                            ? "bg-[var(--color-primary)] group-hover:bg-[var(--color-primary-dark)]"
                                            : "bg-gray-200"
                                }`}
                                style={{ height: `${barHeight}px` }}
                            />
                            <span className={`text-[10px] font-bold ${
                                isHovered ? "text-gray-950" : "text-gray-400"
                            }`}>
                                {new Date(`${day.date}T00:00:00`).getDate()}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

const CashReport = () => {
    const navigate = useNavigate();
    const adminUser = getStoredAdminUser();
    const [selectedDate, setSelectedDate] = useState(getTodayDate());
    const [viewMode, setViewMode] = useState("day");
    const [activeTab, setActiveTab] = useState("overview");
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);
    const [error, setError] = useState("");
    const [searchTerm, setSearchTerm] = useState("");

    const loadReport = useCallback(async ({ silent = false } = {}) => {
            try {
                if (!silent) setLoading(true);
                setError("");
                const response = await CashReportController.get(
                    selectedDate,
                    getReportPeriod(activeTab, viewMode)
                );

                setReport(response.data);
            } catch (err) {
                setError(err.response?.data?.message || "Failed to load cash report");
                setReport(null);
            } finally {
                if (!silent) setLoading(false);
            }
    }, [activeTab, selectedDate, viewMode]);

    useEffect(() => {
        loadReport();
        return subscribeRealtimeDomains(
            ["orders", "payments"],
            () => loadReport({ silent: true })
        );
    }, [loadReport]);

    const filteredOrders = useMemo(() => {
        const orders = report?.orders || [];
        const query = searchTerm.trim().toLowerCase().replace(/^#/, "");

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
    const searchSuggestions = useMemo(
        () =>
            getMatchingSearchSuggestions(
                buildOrderSearchSuggestionValues(report?.orders || []),
                searchTerm,
                8
            ),
        [report?.orders, searchTerm]
    );
    const cashOrderPagination = useAdminPagination({
        items: filteredOrders,
        initialPageSize: 25,
        resetKey: `${activeTab}:${selectedDate}:${viewMode}:${searchTerm}`,
    });

    const handleExportCsv = async () => {
        try {
            setExporting(true);
            const period = getReportPeriod(activeTab, viewMode);
            const response = await CashReportController.export(selectedDate, period);
            downloadBlob(response.data, `cash-report-${period}-${selectedDate}.csv`);
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
    const dailyBreakdown = report?.dailyBreakdown || [];
    const reportPeriod = getReportPeriod(activeTab, viewMode);
    const reportTitle =
        activeTab === "trends"
            ? "Cash Flow Trends"
            : viewMode === "month"
                ? "Monthly Cash Report"
                : "Daily Cash Report";
    const reportDescription =
        activeTab === "trends"
            ? "Cash flow across the last 30 days ending on the selected date."
            : viewMode === "month"
                ? `Cash on delivery orders marked paid during ${formatMonthLabel(selectedDate)}.`
                : "Cash on delivery orders marked paid for the selected day.";
    const statCards = [
        {
            label: "Total Cash",
            value: formatCurrency(summary.totalCash),
            hint: `${summary.orderCount || 0} paid order${summary.orderCount === 1 ? "" : "s"}`,
            tone: "text-green-700",
            bg: "bg-green-50",
            icon: CircleDollarSign,
        },
        {
            label: "Paid Cash Orders",
            value: summary.orderCount || 0,
            hint: reportPeriod === "trend" ? "last 30 days" : reportPeriod,
            tone: "text-blue-700",
            bg: "bg-blue-50",
            icon: ShoppingCart,
        },
        {
            label: "Average Order",
            value: formatCurrency(summary.averageOrderValue),
            hint: "per paid cash order",
            tone: "text-indigo-700",
            bg: "bg-indigo-50",
            icon: TrendingUp,
        },
        {
            label: "Pending to Collect",
            value: formatCurrency(summary.pendingCashAmount),
            hint: `${summary.pendingCashCount || 0} open order${summary.pendingCashCount === 1 ? "" : "s"}`,
            tone: "text-amber-700",
            bg: "bg-amber-50",
            icon: Clock3,
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
                        <h1 className="mt-1 text-3xl font-black text-gray-950">{reportTitle}</h1>
                        <p className="mt-2 text-sm font-medium text-gray-500">
                            {reportDescription}
                        </p>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row">
                        <div className="grid h-12 grid-cols-2 rounded-lg border border-gray-200 bg-white p-1 shadow-sm">
                            {["day", "month"].map((mode) => (
                                <button
                                    key={mode}
                                    type="button"
                                    onClick={() => {
                                        setViewMode(mode);
                                        setActiveTab("overview");
                                        setSearchTerm("");
                                    }}
                                    className={`rounded-md px-4 text-sm font-black capitalize transition-colors ${
                                        viewMode === mode && activeTab === "overview"
                                            ? "bg-[var(--color-primary)] text-white shadow-sm"
                                            : "text-gray-600 hover:bg-gray-50"
                                    }`}
                                >
                                    {mode}
                                </button>
                            ))}
                        </div>
                        <label className="relative block">
                            <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                            <input
                                type={viewMode === "month" && activeTab === "overview" ? "month" : "date"}
                                value={viewMode === "month" && activeTab === "overview" ? selectedDate.slice(0, 7) : selectedDate}
                                onChange={(event) => {
                                    const value = event.target.value;
                                    setSelectedDate(value.length === 7 ? `${value}-01` : value);
                                }}
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
                                    <p className="mt-1 text-xs font-bold capitalize text-gray-400">
                                        {card.hint}
                                    </p>
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
                    <div className="flex flex-col gap-4 border-b border-gray-100 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <div className="mb-4 inline-flex rounded-lg border border-gray-200 bg-gray-50 p-1">
                                {[
                                    { key: "overview", label: "Overview", icon: ListChecks },
                                    { key: "trends", label: "Trends", icon: BarChart3 },
                                ].map((tab) => {
                                    const Icon = tab.icon;

                                    return (
                                        <button
                                            key={tab.key}
                                            type="button"
                                            onClick={() => {
                                                setActiveTab(tab.key);
                                                setSearchTerm("");
                                            }}
                                            className={`inline-flex h-10 items-center gap-2 rounded-md px-4 text-sm font-black transition-colors ${
                                                activeTab === tab.key
                                                    ? "bg-white text-[var(--color-primary)] shadow-sm"
                                                    : "text-gray-600 hover:text-gray-950"
                                            }`}
                                        >
                                            <Icon className="h-4 w-4" />
                                            {tab.label}
                                        </button>
                                    );
                                })}
                            </div>
                            <h2 className="flex items-center gap-2 text-lg font-black text-gray-950">
                                {activeTab === "trends" ? (
                                    <BarChart3 className="h-5 w-5 text-[var(--color-primary)]" />
                                ) : (
                                    <ReceiptText className="h-5 w-5 text-[var(--color-primary)]" />
                                )}
                                {activeTab === "trends"
                                    ? "Last 30 Days"
                                    : viewMode === "month"
                                        ? "Daily Breakdown"
                                        : "Paid Cash Orders"}
                            </h2>
                            <p className="mt-1 text-sm font-medium text-gray-500">
                                {reportPeriod === "day"
                                    ? `${filteredOrders.length} order${filteredOrders.length === 1 ? "" : "s"} shown`
                                    : `${dailyBreakdown.length} day${dailyBreakdown.length === 1 ? "" : "s"} shown`}
                            </p>
                        </div>
                        {reportPeriod === "day" && (
                            <label className="relative block w-full lg:w-80">
                                <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="search"
                                    list="cash-report-search-suggestions"
                                    value={searchTerm}
                                    onChange={(event) => setSearchTerm(event.target.value)}
                                    placeholder="Search order, name, phone"
                                    className="h-11 w-full rounded-lg border border-gray-200 bg-white pl-10 pr-3 text-sm font-semibold text-gray-800 focus:border-[var(--color-primary)] focus:outline-none focus:ring-4 focus:ring-[var(--color-primary)]/10"
                                />
                                <datalist id="cash-report-search-suggestions">
                                    {searchSuggestions.map((suggestion) => (
                                        <option key={suggestion} value={suggestion} />
                                    ))}
                                </datalist>
                            </label>
                        )}
                    </div>

                    {reportPeriod !== "day" ? (
                        <div className="p-5">
                            {activeTab === "trends" && (
                                <div className="overflow-x-auto">
                                    <CashTrendChart data={dailyBreakdown} />
                                </div>
                            )}
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-100 text-sm">
                                    <thead className="bg-gray-50 text-left text-xs font-black uppercase tracking-wide text-gray-500">
                                        <tr>
                                            <th className="px-5 py-3">Date</th>
                                            <th className="px-5 py-3 text-right">Paid Orders</th>
                                            <th className="px-5 py-3 text-right">Average Order</th>
                                            <th className="px-5 py-3 text-right">Total Cash</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {dailyBreakdown.map((day) => (
                                            <tr key={day.date} className="hover:bg-gray-50">
                                                <td className="whitespace-nowrap px-5 py-4 font-black text-gray-950">
                                                    {formatDisplayDate(day.date)}
                                                </td>
                                                <td className="whitespace-nowrap px-5 py-4 text-right font-bold text-gray-700">
                                                    {day.orderCount}
                                                </td>
                                                <td className="whitespace-nowrap px-5 py-4 text-right font-bold text-gray-700">
                                                    {formatCurrency(day.averageOrderValue)}
                                                </td>
                                                <td className="whitespace-nowrap px-5 py-4 text-right font-black text-gray-950">
                                                    {formatCurrency(day.totalCash)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : filteredOrders.length === 0 ? (
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
                                    {cashOrderPagination.paginatedItems.map((order) => (
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
                            <AdminPagination
                                {...cashOrderPagination}
                                itemLabel="orders"
                            />
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
};

export default CashReport;
