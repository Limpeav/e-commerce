import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
    ArrowLeft,
    TrendingUp,
    DollarSign,
    ShoppingCart,
    Package,
    Download,
    Calendar,
    Smile,
    Meh,
    Frown,
} from "lucide-react";
import api from "../../../services/api";
import { adminService } from "../../../services/adminService";

const formatCurrency = (value = 0) => `$${Number(value || 0).toFixed(2)}`;

const calculateMonthlyRevenue = (orders = []) => {
    const monthlyData = {};

    orders
        .filter((order) => order.paymentStatus === "Paid")
        .forEach((order) => {
            const month = new Date(order.createdAt).toLocaleString("default", {
                month: "short",
                year: "numeric",
            });
            monthlyData[month] = (monthlyData[month] || 0) + Number(order.totalPrice || 0);
        });

    return monthlyData;
};

const getTopProducts = (orders = []) => {
    const productSales = {};

    orders.forEach((order) => {
        (order.orderItems || []).forEach((item) => {
            const productId = item.product;
            if (!productSales[productId]) {
                productSales[productId] = {
                    name: item.name,
                    quantity: 0,
                    revenue: 0,
                };
            }

            productSales[productId].quantity += Number(item.quantity || 0);
            productSales[productId].revenue += Number(item.price || 0) * Number(item.quantity || 0);
        });
    });

    return Object.values(productSales)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);
};

const getOrderStatusBreakdown = (orders = []) => {
    const breakdown = {
        Pending: 0,
        Processing: 0,
        Shipped: 0,
        Delivered: 0,
        Cancelled: 0,
    };

    orders.forEach((order) => {
        if (breakdown[order.orderStatus] === undefined) {
            breakdown[order.orderStatus] = 0;
        }
        breakdown[order.orderStatus] += 1;
    });

    return breakdown;
};

const Reports = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({});
    const [orders, setOrders] = useState([]);
    const [sentimentReport, setSentimentReport] = useState({
        totals: {
            reviews: 0,
            positive: 0,
            neutral: 0,
            negative: 0,
            productsWithReviews: 0,
        },
        distribution: {
            positiveRate: 0,
            neutralRate: 0,
            negativeRate: 0,
        },
        weakProducts: [],
    });
    const [feedbackTrends, setFeedbackTrends] = useState([]);
    const [inventoryReport, setInventoryReport] = useState({
        summary: {
            totalProducts: 0,
            totalStock: 0,
            outOfStockCount: 0,
            lowStockCount: 0,
            lowStockThreshold: 10,
        },
        trends: [],
        lowStockProducts: [],
        stockByCategory: [],
    });

    const fetchData = async () => {
        try {
            setLoading(true);

            const [dashboardRes, ordersRes, sentimentRes, trendsRes, inventoryRes] = await Promise.all([
                api.get("/admin/dashboard"),
                api.get("/orders"),
                api.get("/admin/reports/sentiment"),
                api.get("/admin/reports/feedback-trends"),
                adminService.getInventoryReport({ months: 6 }),
            ]);

            setStats(dashboardRes.data || {});
            setOrders(Array.isArray(ordersRes.data) ? ordersRes.data : []);
            setSentimentReport(
                sentimentRes.data || {
                    totals: {
                        reviews: 0,
                        positive: 0,
                        neutral: 0,
                        negative: 0,
                        productsWithReviews: 0,
                    },
                    distribution: {
                        positiveRate: 0,
                        neutralRate: 0,
                        negativeRate: 0,
                    },
                    weakProducts: [],
                }
            );
            setFeedbackTrends(Array.isArray(trendsRes.data?.trends) ? trendsRes.data.trends : []);
            setInventoryReport(
                inventoryRes.data || {
                    summary: {
                        totalProducts: 0,
                        totalStock: 0,
                        outOfStockCount: 0,
                        lowStockCount: 0,
                        lowStockThreshold: 10,
                    },
                    trends: [],
                    lowStockProducts: [],
                    stockByCategory: [],
                }
            );
        } catch (err) {
            console.error("Failed to fetch report data", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const monthlyRevenue = useMemo(() => calculateMonthlyRevenue(orders), [orders]);
    const topProducts = useMemo(() => getTopProducts(orders), [orders]);
    const statusBreakdown = useMemo(() => getOrderStatusBreakdown(orders), [orders]);

    const exportReport = () => {
        const reportData = {
            generatedAt: new Date().toISOString(),
            summary: {
                totalRevenue: stats.revenue,
                totalOrders: stats.orders,
                totalProducts: stats.products,
                totalUsers: stats.users,
            },
            monthlyRevenue,
            topProducts,
            orderStatusBreakdown: statusBreakdown,
            sentiment: sentimentReport,
            feedbackTrends,
            inventory: inventoryReport,
        };

        const blob = new Blob([JSON.stringify(reportData, null, 2)], {
            type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `admin-report-${new Date().toISOString().split("T")[0]}.json`;
        a.click();
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading reports...</p>
                </div>
            </div>
        );
    }

    const sentimentTotals = sentimentReport?.totals || {};
    const sentimentDistribution = sentimentReport?.distribution || {};
    const weakProducts = Array.isArray(sentimentReport?.weakProducts)
        ? sentimentReport.weakProducts
        : [];
    const inventorySummary = inventoryReport?.summary || {};
    const inventoryTrends = Array.isArray(inventoryReport?.trends)
        ? inventoryReport.trends
        : [];
    const lowStockProducts = Array.isArray(inventoryReport?.lowStockProducts)
        ? inventoryReport.lowStockProducts
        : [];
    const stockByCategory = Array.isArray(inventoryReport?.stockByCategory)
        ? inventoryReport.stockByCategory
        : [];

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => navigate("/dashboard")}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <ArrowLeft className="w-5 h-5 text-gray-600" />
                            </button>
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">
                                    Reports & Analytics
                                </h1>
                                <p className="mt-1 text-sm text-gray-500">
                                    Sales, inventory, and sentiment intelligence
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={exportReport}
                            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            <Download className="w-4 h-4" />
                            <span>Export Report</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Total Revenue</p>
                                <p className="text-3xl font-bold text-green-600">
                                    {formatCurrency(stats.revenue)}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">All time</p>
                            </div>
                            <DollarSign className="w-12 h-12 text-green-500" />
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Total Orders</p>
                                <p className="text-3xl font-bold text-blue-600">
                                    {stats.orders || 0}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                    {stats.pendingOrders || 0} pending
                                </p>
                            </div>
                            <ShoppingCart className="w-12 h-12 text-blue-500" />
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Total Products</p>
                                <p className="text-3xl font-bold text-purple-600">
                                    {stats.products || 0}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">In catalog</p>
                            </div>
                            <Package className="w-12 h-12 text-purple-500" />
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Avg Order Value</p>
                                <p className="text-3xl font-bold text-orange-600">
                                    {stats.orders > 0
                                        ? formatCurrency(stats.revenue / stats.orders)
                                        : formatCurrency(0)}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">Per order</p>
                            </div>
                            <TrendingUp className="w-12 h-12 text-orange-500" />
                        </div>
                    </div>
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    {/* Monthly Revenue */}
                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                            <Calendar className="w-5 h-5 mr-2" />
                            Monthly Revenue
                        </h2>
                        <div className="space-y-3">
                            {Object.entries(monthlyRevenue).length > 0 ? (
                                Object.entries(monthlyRevenue).map(([month, revenue]) => {
                                    const maxRevenue = Math.max(...Object.values(monthlyRevenue));
                                    const percentage = (revenue / maxRevenue) * 100;

                                    return (
                                        <div key={month}>
                                            <div className="flex justify-between mb-1">
                                                <span className="text-sm text-gray-600">{month}</span>
                                                <span className="text-sm font-semibold text-gray-900">
                                                    {formatCurrency(revenue)}
                                                </span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                <div
                                                    className="bg-blue-600 h-2 rounded-full transition-all"
                                                    style={{ width: `${percentage}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <p className="text-gray-500 text-center py-8">
                                    No revenue data available
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Order Status Breakdown */}
                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                            <ShoppingCart className="w-5 h-5 mr-2" />
                            Order Status Distribution
                        </h2>
                        <div className="space-y-4">
                            {Object.entries(statusBreakdown).map(([status, count]) => {
                                const totalOrders = Object.values(statusBreakdown).reduce(
                                    (a, b) => a + b,
                                    0
                                );
                                const percentage =
                                    totalOrders > 0 ? (count / totalOrders) * 100 : 0;
                                const colors = {
                                    Pending: "bg-yellow-500",
                                    Processing: "bg-blue-500",
                                    Shipped: "bg-purple-500",
                                    Delivered: "bg-green-500",
                                    Cancelled: "bg-red-500",
                                };

                                return (
                                    <div key={status}>
                                        <div className="flex justify-between mb-1">
                                            <span className="text-sm text-gray-600">{status}</span>
                                            <span className="text-sm font-semibold text-gray-900">
                                                {count} ({percentage.toFixed(1)}%)
                                            </span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div
                                                className={`${colors[status] || "bg-gray-400"} h-2 rounded-full transition-all`}
                                                style={{ width: `${percentage}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Sentiment Summary */}
                <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">
                        Customer Sentiment Summary
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="rounded-lg border border-green-100 bg-green-50 p-4">
                            <div className="flex items-center gap-2 text-green-700 font-semibold text-sm mb-1">
                                <Smile className="w-4 h-4" />
                                Positive
                            </div>
                            <p className="text-2xl font-bold text-green-700">
                                {sentimentTotals.positive || 0}
                            </p>
                            <p className="text-xs text-green-700/70">
                                {(Number(sentimentDistribution.positiveRate || 0) * 100).toFixed(1)}% of reviews
                            </p>
                        </div>

                        <div className="rounded-lg border border-yellow-100 bg-yellow-50 p-4">
                            <div className="flex items-center gap-2 text-yellow-700 font-semibold text-sm mb-1">
                                <Meh className="w-4 h-4" />
                                Neutral
                            </div>
                            <p className="text-2xl font-bold text-yellow-700">
                                {sentimentTotals.neutral || 0}
                            </p>
                            <p className="text-xs text-yellow-700/70">
                                {(Number(sentimentDistribution.neutralRate || 0) * 100).toFixed(1)}% of reviews
                            </p>
                        </div>

                        <div className="rounded-lg border border-red-100 bg-red-50 p-4">
                            <div className="flex items-center gap-2 text-red-700 font-semibold text-sm mb-1">
                                <Frown className="w-4 h-4" />
                                Negative
                            </div>
                            <p className="text-2xl font-bold text-red-700">
                                {sentimentTotals.negative || 0}
                            </p>
                            <p className="text-xs text-red-700/70">
                                {(Number(sentimentDistribution.negativeRate || 0) * 100).toFixed(1)}% of reviews
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                        <p>
                            <span className="font-semibold text-gray-900">Reviewed products:</span>{" "}
                            {sentimentTotals.productsWithReviews || 0}
                        </p>
                        <p>
                            <span className="font-semibold text-gray-900">Total reviews analyzed:</span>{" "}
                            {sentimentTotals.reviews || 0}
                        </p>
                    </div>
                </div>

                {/* Top Products */}
                <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <TrendingUp className="w-5 h-5 mr-2" />
                        Top Selling Products
                    </h2>
                    {topProducts.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Rank
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Product Name
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Units Sold
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Revenue
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {topProducts.map((product, index) => (
                                        <tr key={index} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-2xl font-bold text-gray-400">
                                                    #{index + 1}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-sm font-medium text-gray-900">
                                                    {product.name}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-sm text-gray-900">
                                                    {product.quantity} units
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-sm font-semibold text-green-600">
                                                    {formatCurrency(product.revenue)}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="text-gray-500 text-center py-8">
                            No sales data available
                        </p>
                    )}
                </div>

                {/* Inventory Highlights */}
                <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <Package className="w-5 h-5 mr-2" />
                        Inventory Highlights
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
                            <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">
                                Products
                            </p>
                            <p className="text-2xl font-bold text-blue-700 mt-1">
                                {inventorySummary.totalProducts || 0}
                            </p>
                        </div>
                        <div className="rounded-lg border border-green-100 bg-green-50 p-4">
                            <p className="text-xs font-semibold text-green-700 uppercase tracking-wide">
                                Units In Stock
                            </p>
                            <p className="text-2xl font-bold text-green-700 mt-1">
                                {inventorySummary.totalStock || 0}
                            </p>
                        </div>
                        <div className="rounded-lg border border-red-100 bg-red-50 p-4">
                            <p className="text-xs font-semibold text-red-700 uppercase tracking-wide">
                                Out of Stock
                            </p>
                            <p className="text-2xl font-bold text-red-700 mt-1">
                                {inventorySummary.outOfStockCount || 0}
                            </p>
                        </div>
                        <div className="rounded-lg border border-amber-100 bg-amber-50 p-4">
                            <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">
                                Low Stock
                            </p>
                            <p className="text-2xl font-bold text-amber-700 mt-1">
                                {inventorySummary.lowStockCount || 0}
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div>
                            <h3 className="text-sm font-semibold text-gray-900 mb-3">
                                Sold Units Trend (Last 6 Months)
                            </h3>
                            {inventoryTrends.length > 0 ? (
                                <div className="space-y-3">
                                    {inventoryTrends.map((trend) => {
                                        const maxUnits = Math.max(
                                            1,
                                            ...inventoryTrends.map((item) => Number(item.unitsSold || 0))
                                        );
                                        const percentage =
                                            (Number(trend.unitsSold || 0) / maxUnits) * 100;

                                        return (
                                            <div key={trend.period}>
                                                <div className="flex justify-between mb-1">
                                                    <span className="text-xs text-gray-600">{trend.period}</span>
                                                    <span className="text-xs font-semibold text-gray-900">
                                                        {Number(trend.unitsSold || 0)} units
                                                    </span>
                                                </div>
                                                <div className="h-2 rounded-full bg-gray-100">
                                                    <div
                                                        className="h-2 rounded-full bg-indigo-500"
                                                        style={{ width: `${percentage}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <p className="text-sm text-gray-500">No inventory trend data available</p>
                            )}
                        </div>

                        <div>
                            <h3 className="text-sm font-semibold text-gray-900 mb-3">
                                Stock by Category
                            </h3>
                            {stockByCategory.length > 0 ? (
                                <div className="space-y-3">
                                    {stockByCategory.map((item) => (
                                        <div
                                            key={item.category}
                                            className="rounded-lg border border-gray-100 p-3"
                                        >
                                            <div className="flex items-center justify-between">
                                                <p className="text-sm font-medium text-gray-900">{item.category}</p>
                                                <p className="text-xs text-gray-500">
                                                    {item.products} products
                                                </p>
                                            </div>
                                            <p className="text-sm text-gray-700 mt-1">
                                                Stock: <span className="font-semibold">{item.totalStock}</span>
                                            </p>
                                            <p className="text-xs text-red-600 mt-1">
                                                Out of stock: {item.outOfStock}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-gray-500">No category stock data available</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Low Stock Products */}
                <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">
                        Low Stock Products
                    </h2>

                    {lowStockProducts.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Product
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Category
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Stock
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {lowStockProducts.map((product) => (
                                        <tr key={product.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                                {product.title}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600">
                                                {product.category || "Uncategorized"}
                                            </td>
                                            <td className="px-4 py-3 text-sm font-semibold text-amber-600">
                                                {Number(product.stock || 0)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="text-gray-500 text-center py-8">
                            No low-stock products detected.
                        </p>
                    )}
                </div>

                {/* Products Needing Attention */}
                <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">
                        Products Needing Attention
                    </h2>

                    {weakProducts.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Product
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Sentiment
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Negative / Total
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Rating
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {weakProducts.map((product) => (
                                        <tr key={product.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                                                {product.title}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600">
                                                {product.sentiment?.label || "Neutral"}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-red-600 font-semibold">
                                                {product.sentiment?.negative || 0} / {product.sentiment?.total || 0}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600">
                                                {Number(product.rating || 0).toFixed(1)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="text-gray-500 text-center py-8">
                            No sentiment risk signals yet.
                        </p>
                    )}
                </div>

                {/* Feedback Trends */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">
                        Feedback Trends Over Time
                    </h2>

                    {feedbackTrends.length > 0 ? (
                        <div className="space-y-3">
                            {feedbackTrends.map((trend) => {
                                const total = Number(trend.total || 0);
                                const positive = Number(trend.positive || 0);
                                const neutral = Number(trend.neutral || 0);
                                const negative = Number(trend.negative || 0);

                                const positiveWidth = total > 0 ? (positive / total) * 100 : 0;
                                const neutralWidth = total > 0 ? (neutral / total) * 100 : 0;
                                const negativeWidth = total > 0 ? (negative / total) * 100 : 0;

                                return (
                                    <div key={trend.period} className="border border-gray-100 rounded-lg p-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <p className="text-sm font-semibold text-gray-900">{trend.period}</p>
                                            <p className="text-xs text-gray-500">{total} reviews</p>
                                        </div>

                                        <div className="w-full h-3 rounded-full bg-gray-100 overflow-hidden flex">
                                            <div
                                                className="bg-green-500"
                                                style={{ width: `${positiveWidth}%` }}
                                                title={`Positive: ${positive}`}
                                            ></div>
                                            <div
                                                className="bg-yellow-400"
                                                style={{ width: `${neutralWidth}%` }}
                                                title={`Neutral: ${neutral}`}
                                            ></div>
                                            <div
                                                className="bg-red-500"
                                                style={{ width: `${negativeWidth}%` }}
                                                title={`Negative: ${negative}`}
                                            ></div>
                                        </div>

                                        <div className="mt-2 text-xs text-gray-600 flex flex-wrap gap-4">
                                            <span>Positive: {positive}</span>
                                            <span>Neutral: {neutral}</span>
                                            <span>Negative: {negative}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <p className="text-gray-500 text-center py-8">
                            No feedback trend data available
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Reports;
