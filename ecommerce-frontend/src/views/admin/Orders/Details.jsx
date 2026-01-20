import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    ArrowLeft,
    Package,
    User,
    MapPin,
    CreditCard,
    Calendar,
    DollarSign,
    Truck,
    CheckCircle,
    ExternalLink,
} from "lucide-react";
import { adminService } from "../../../services/adminService";

const OrderDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        fetchOrderDetails();
    }, [id]);

    const fetchOrderDetails = async () => {
        try {
            setLoading(true);
            const response = await adminService.getOrderById(id);
            setOrder(response.data);
            setLoading(false);
        } catch (err) {
            setError(err.response?.data?.message || "Failed to fetch order details");
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (newStatus) => {
        try {
            setUpdating(true);
            await adminService.updateOrderStatus(id, newStatus);
            fetchOrderDetails();
            setUpdating(false);
        } catch (err) {
            alert(err.response?.data?.message || "Failed to update order status");
            setUpdating(false);
        }
    };

    const handlePaymentStatusUpdate = async (newPaymentStatus) => {
        if (!window.confirm(`Are you sure you want to mark this order as ${newPaymentStatus}?`)) {
            return;
        }
        try {
            setUpdating(true);
            await adminService.updatePaymentStatus(id, newPaymentStatus);
            fetchOrderDetails();
            setUpdating(false);
        } catch (err) {
            alert(err.response?.data?.message || "Failed to update payment status");
            setUpdating(false);
        }
    };

    const getPaymentStatusColor = (status) => {
        const colors = {
            Pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
            Paid: "bg-green-100 text-green-800 border-green-300",
            Failed: "bg-red-100 text-red-800 border-red-300",
            Refunded: "bg-orange-100 text-orange-800 border-orange-300",
        };
        return colors[status] || "bg-gray-100 text-gray-800 border-gray-300";
    };

    const getStatusColor = (status) => {
        const colors = {
            Pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
            Processing: "bg-blue-100 text-blue-800 border-blue-300",
            Shipped: "bg-purple-100 text-purple-800 border-purple-300",
            Delivered: "bg-green-100 text-green-800 border-green-300",
            Cancelled: "bg-red-100 text-red-800 border-red-300",
        };
        return colors[status] || "bg-gray-100 text-gray-800 border-gray-300";
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading order details...</p>
                </div>
            </div>
        );
    }

    if (error || !order) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
                    <p className="text-red-800">{error || "Order not found"}</p>
                    <button
                        onClick={() => navigate("/admin/orders")}
                        className="mt-4 text-blue-600 hover:text-blue-800"
                    >
                        ← Back to Orders
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => navigate("/admin/orders")}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <ArrowLeft className="w-5 h-5 text-gray-600" />
                            </button>
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">
                                    Order #{order._id.slice(-8)}
                                </h1>
                                <p className="mt-1 text-sm text-gray-500">
                                    Placed on {new Date(order.createdAt).toLocaleString()}
                                </p>
                            </div>
                        </div>
                        <div className={`px-4 py-2 rounded-lg border-2 ${getStatusColor(order.orderStatus)}`}>
                            <span className="text-sm font-semibold">{order.orderStatus}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column - Order Items & Details */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Order Items */}
                        <div className="bg-white rounded-xl shadow-sm p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                <Package className="w-5 h-5 mr-2" />
                                Order Items
                            </h2>
                            <div className="space-y-4">
                                {order.orderItems.map((item, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg"
                                    >
                                        <img
                                            src={item.image}
                                            alt={item.name}
                                            className="w-20 h-20 object-cover rounded-lg"
                                        />
                                        <div className="flex-1">
                                            <h3 className="font-medium text-gray-900">{item.name}</h3>
                                            <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-semibold text-gray-900">
                                                ${(item.price * item.quantity).toFixed(2)}
                                            </p>
                                            <p className="text-sm text-gray-500">${item.price} each</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Shipping Address */}
                        <div className="bg-white rounded-xl shadow-sm p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                <MapPin className="w-5 h-5 mr-2" />
                                Shipping Address
                            </h2>
                            <div className="text-gray-700">
                                <p className="font-medium">{order.shippingAddress.fullName}</p>
                                <p>{order.shippingAddress.address}</p>
                                <p>{order.shippingAddress.city}</p>
                                {order.shippingAddress.postalCode && (
                                    <p>{order.shippingAddress.postalCode}</p>
                                )}
                                {order.shippingAddress.country && (
                                    <p>{order.shippingAddress.country}</p>
                                )}
                                <p className="mt-2">
                                    <span className="font-medium">Phone:</span>{" "}
                                    {order.shippingAddress.phone}
                                </p>

                                {/* Google Maps Link */}
                                {order.shippingAddress.latitude && order.shippingAddress.longitude && (
                                    <a
                                        href={`https://www.google.com/maps?q=${order.shippingAddress.latitude},${order.shippingAddress.longitude}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium border border-blue-200"
                                    >
                                        <MapPin className="w-4 h-4" />
                                        View Location on Google Maps
                                        <ExternalLink className="w-4 h-4" />
                                    </a>
                                )}
                            </div>
                        </div>

                        {/* Payment Information */}
                        <div className="bg-white rounded-xl shadow-sm p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                <CreditCard className="w-5 h-5 mr-2" />
                                Payment Information
                            </h2>
                            <div className="space-y-2 text-gray-700">
                                <div className="flex justify-between">
                                    <span>Payment Method:</span>
                                    <span className="font-medium">{order.paymentMethod}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Payment Status:</span>
                                    <span
                                        className={`px-2 py-1 rounded text-sm font-semibold ${order.paymentStatus === "Paid"
                                            ? "bg-green-100 text-green-800"
                                            : order.paymentStatus === "Pending"
                                                ? "bg-yellow-100 text-yellow-800"
                                                : "bg-red-100 text-red-800"
                                            }`}
                                    >
                                        {order.paymentStatus}
                                    </span>
                                </div>
                                {order.isPaid && (
                                    <div className="flex justify-between">
                                        <span>Paid At:</span>
                                        <span className="font-medium">
                                            {new Date(order.paidAt).toLocaleString()}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Summary & Actions */}
                    <div className="space-y-6">
                        {/* Customer Info */}
                        <div className="bg-white rounded-xl shadow-sm p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                <User className="w-5 h-5 mr-2" />
                                Customer
                            </h2>
                            <div className="text-gray-700">
                                <p className="font-medium">{order.user?.name || "N/A"}</p>
                                <p className="text-sm text-gray-500">{order.user?.email || "N/A"}</p>
                            </div>
                        </div>

                        {/* Order Summary */}
                        <div className="bg-white rounded-xl shadow-sm p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                <DollarSign className="w-5 h-5 mr-2" />
                                Order Summary
                            </h2>
                            <div className="space-y-2 text-gray-700">
                                <div className="flex justify-between">
                                    <span>Subtotal:</span>
                                    <span>
                                        $
                                        {order.orderItems
                                            .reduce((acc, item) => acc + item.price * item.quantity, 0)
                                            .toFixed(2)}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Shipping:</span>
                                    <span>${order.shippingPrice.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Tax:</span>
                                    <span>${order.taxPrice.toFixed(2)}</span>
                                </div>
                                <div className="border-t pt-2 mt-2 flex justify-between text-lg font-bold">
                                    <span>Total:</span>
                                    <span>${order.totalPrice.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Update Payment Status */}
                        <div className="bg-white rounded-xl shadow-sm p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                <CreditCard className="w-5 h-5 mr-2" />
                                Update Payment Status
                            </h2>
                            <div className="mb-4">
                                <div className={`px-3 py-2 rounded-lg border-2 ${getPaymentStatusColor(order.paymentStatus)}`}>
                                    <span className="text-sm font-semibold">Current: {order.paymentStatus}</span>
                                </div>
                            </div>
                            <div className="space-y-2">
                                {["Pending", "Paid", "Failed", "Refunded"].map(
                                    (paymentStatus) => (
                                        <button
                                            key={paymentStatus}
                                            onClick={() => handlePaymentStatusUpdate(paymentStatus)}
                                            disabled={updating || order.paymentStatus === paymentStatus}
                                            className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${order.paymentStatus === paymentStatus
                                                    ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                                                    : paymentStatus === "Paid"
                                                        ? "bg-green-600 text-white hover:bg-green-700"
                                                        : paymentStatus === "Failed"
                                                            ? "bg-red-600 text-white hover:bg-red-700"
                                                            : paymentStatus === "Refunded"
                                                                ? "bg-orange-600 text-white hover:bg-orange-700"
                                                                : "bg-yellow-600 text-white hover:bg-yellow-700"
                                                }`}
                                        >
                                            {order.paymentStatus === paymentStatus ? (
                                                <span className="flex items-center justify-center">
                                                    <CheckCircle className="w-4 h-4 mr-2" />
                                                    Current Status
                                                </span>
                                            ) : (
                                                `Mark as ${paymentStatus}`
                                            )}
                                        </button>
                                    )
                                )}
                            </div>
                        </div>

                        {/* Update Order Status */}
                        <div className="bg-white rounded-xl shadow-sm p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                <Truck className="w-5 h-5 mr-2" />
                                Update Order Status
                            </h2>
                            <div className="space-y-2">
                                {["Pending", "Processing", "Shipped", "Delivered", "Cancelled"].map(
                                    (status) => (
                                        <button
                                            key={status}
                                            onClick={() => handleStatusUpdate(status)}
                                            disabled={updating || order.orderStatus === status}
                                            className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${order.orderStatus === status
                                                ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                                                : "bg-blue-600 text-white hover:bg-blue-700"
                                                }`}
                                        >
                                            {order.orderStatus === status ? (
                                                <span className="flex items-center justify-center">
                                                    <CheckCircle className="w-4 h-4 mr-2" />
                                                    Current Status
                                                </span>
                                            ) : (
                                                `Mark as ${status}`
                                            )}
                                        </button>
                                    )
                                )}
                            </div>
                        </div>

                        {/* Timeline */}
                        {order.isDelivered && (
                            <div className="bg-white rounded-xl shadow-sm p-6">
                                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                    <Calendar className="w-5 h-5 mr-2" />
                                    Timeline
                                </h2>
                                <div className="space-y-3 text-sm">
                                    <div className="flex items-center text-gray-700">
                                        <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                                        <div>
                                            <p className="font-medium">Order Delivered</p>
                                            <p className="text-gray-500">
                                                {new Date(order.deliveredAt).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                    {order.isPaid && (
                                        <div className="flex items-center text-gray-700">
                                            <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                                            <div>
                                                <p className="font-medium">Payment Received</p>
                                                <p className="text-gray-500">
                                                    {new Date(order.paidAt).toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                    <div className="flex items-center text-gray-700">
                                        <div className="w-2 h-2 bg-gray-400 rounded-full mr-3"></div>
                                        <div>
                                            <p className="font-medium">Order Placed</p>
                                            <p className="text-gray-500">
                                                {new Date(order.createdAt).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderDetails;
