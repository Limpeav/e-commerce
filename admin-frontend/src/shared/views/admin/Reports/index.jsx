import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
    ArrowLeft,
    TrendingUp,
    DollarSign,
    ShoppingCart,
    Package,
    Download,
    Calendar,
} from "lucide-react";
import { ReportController } from "../../../controllers";
import Loading from "../../../components/common/Loading";
import { subscribeRealtimeDomains } from "../../../services/realtime";

const Reports = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({});
    const [orders, setOrders] = useState([]);
    const [products, setProducts] = useState([]);

    const fetchData = useCallback(async ({ silent = false } = {}) => {
        try {
            if (!silent) setLoading(true);
            const reportData = await ReportController.getReportData();

            setStats(reportData.stats);
            setOrders(reportData.orders);
            setProducts(reportData.products);
            if (!silent) setLoading(false);
        } catch (err) {
            console.error("Failed to fetch data", err);
            if (!silent) setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
        return subscribeRealtimeDomains(
            ["orders", "products", "reviews", "users"],
            () => fetchData({ silent: true })
        );
    }, [fetchData]);

    const calculateMonthlyRevenue = () => {
        const monthlyData = {};
        orders
            .filter((order) => order.paymentStatus === "Paid")
            .forEach((order) => {
                const month = new Date(order.createdAt).toLocaleString("default", {
                    month: "short",
                    year: "numeric",
                });
                monthlyData[month] = (monthlyData[month] || 0) + order.totalPrice;
            });
        return monthlyData;
    };

    const getTopProducts = () => {
        const productSales = {};

        orders.forEach((order) => {
            order.orderItems.forEach((item) => {
                const productId = item.product;
                if (!productSales[productId]) {
                    productSales[productId] = {
                        name: item.name,
                        quantity: 0,
                        revenue: 0,
                    };
                }
                productSales[productId].quantity += item.quantity;
                productSales[productId].revenue += item.price * item.quantity;
            });
        });

        return Object.values(productSales)
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 5);
    };

    const getOrderStatusBreakdown = () => {
        const breakdown = {
            Pending: 0,
            Processing: 0,
            Delivered: 0,
            Cancelled: 0,
        };

        orders.forEach((order) => {
            const status = order.orderStatus === "Shipped" ? "Processing" : order.orderStatus;
            if (Object.hasOwn(breakdown, status)) {
                breakdown[status]++;
            }
        });

        return breakdown;
    };

    const exportReport = () => {
        const reportData = {
            generatedAt: new Date().toISOString(),
            summary: {
                totalRevenue: stats.revenue,
                totalOrders: stats.orders,
                totalProducts: stats.products,
                totalUsers: stats.users,
            },
            monthlyRevenue: calculateMonthlyRevenue(),
            topProducts: getTopProducts(),
            orderStatusBreakdown: getOrderStatusBreakdown(),
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
        return <Loading message="Loading reports..." />;
    }

    const monthlyRevenue = calculateMonthlyRevenue();
    const topProducts = getTopProducts();
    const statusBreakdown = getOrderStatusBreakdown();

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
                                    Comprehensive business insights and metrics
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
                                    ${stats.revenue?.toFixed(2) || "0.00"}
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
                                    $
                                    {stats.orders > 0
                                        ? (stats.revenue / stats.orders).toFixed(2)
                                        : "0.00"}
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
                                                    ${revenue.toFixed(2)}
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
                                                className={`${colors[status]} h-2 rounded-full transition-all`}
                                                style={{ width: `${percentage}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Top Products */}
                <div className="bg-white rounded-xl shadow-sm p-6">
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
                                                    ${product.revenue.toFixed(2)}
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
            </div>
        </div>
    );
};

export default Reports;
