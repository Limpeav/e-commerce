import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { generateBakongQR, getPaymentStatus } from "../services/paymentService";
import { getOrderById } from "../services/orderService";

export default function BakongPayment() {
    const { orderId } = useParams();
    const navigate = useNavigate();

    const [order, setOrder] = useState(null);
    const [payment, setPayment] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [timeLeft, setTimeLeft] = useState(null);
    const [paymentStatus, setPaymentStatus] = useState("pending");

    useEffect(() => {
        fetchOrderAndGenerateQR();
    }, [orderId]);

    // Poll payment status
    useEffect(() => {
        if (payment && paymentStatus === "pending") {
            const interval = setInterval(async () => {
                try {
                    const updatedPayment = await getPaymentStatus(payment._id);
                    setPayment(updatedPayment);

                    if (updatedPayment.status === "Completed") {
                        setPaymentStatus("completed");
                        clearInterval(interval);
                        setTimeout(() => {
                            navigate(`/orders/${orderId}`);
                        }, 3000);
                    } else if (updatedPayment.status === "Failed") {
                        setPaymentStatus("failed");
                        clearInterval(interval);
                    } else if (updatedPayment.status === "Expired") {
                        setPaymentStatus("expired");
                        clearInterval(interval);
                    }
                } catch (err) {
                    console.error("Error checking payment status:", err);
                }
            }, 5000); // Check every 5 seconds

            return () => clearInterval(interval);
        }
    }, [payment, paymentStatus, orderId, navigate]);

    // Countdown timer
    useEffect(() => {
        if (payment?.khqrData?.expiresAt) {
            const interval = setInterval(() => {
                const now = new Date();
                const expires = new Date(payment.khqrData.expiresAt);
                const diff = expires - now;

                if (diff <= 0) {
                    setTimeLeft("Expired");
                    setPaymentStatus("expired");
                    clearInterval(interval);
                } else {
                    const minutes = Math.floor(diff / 60000);
                    const seconds = Math.floor((diff % 60000) / 1000);
                    setTimeLeft(`${minutes}:${seconds.toString().padStart(2, "0")}`);
                }
            }, 1000);

            return () => clearInterval(interval);
        }
    }, [payment]);

    const fetchOrderAndGenerateQR = async () => {
        try {
            setLoading(true);
            setError(null);

            // Fetch order details
            const orderData = await getOrderById(orderId);
            setOrder(orderData);

            // Generate BAKONG QR code
            const paymentData = await generateBakongQR(orderId);
            setPayment(paymentData);
        } catch (err) {
            setError(err.response?.data?.message || "Failed to generate payment QR code");
        } finally {
            setLoading(false);
        }
    };

    const handleCancelPayment = () => {
        navigate(`/orders/${orderId}`);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-4 text-gray-600">Generating payment QR code...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
                    <div className="text-red-500 text-5xl mb-4">⚠️</div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">Payment Error</h2>
                    <p className="text-gray-600 mb-6">{error}</p>
                    <button
                        onClick={() => navigate(`/orders/${orderId}`)}
                        className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary-dark transition"
                    >
                        Back to Order
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4">
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">BAKONG Payment</h1>
                    <p className="text-gray-600">Scan the QR code below to complete your payment</p>
                </div>

                {/* Payment Status */}
                {paymentStatus === "completed" && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
                        <div className="flex items-center">
                            <span className="text-4xl mr-4">✅</span>
                            <div>
                                <h3 className="text-lg font-bold text-green-800">Payment Successful!</h3>
                                <p className="text-green-700">Redirecting to your order...</p>
                            </div>
                        </div>
                    </div>
                )}

                {paymentStatus === "failed" && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
                        <div className="flex items-center">
                            <span className="text-4xl mr-4">❌</span>
                            <div>
                                <h3 className="text-lg font-bold text-red-800">Payment Failed</h3>
                                <p className="text-red-700">Please try again or contact support</p>
                            </div>
                        </div>
                    </div>
                )}

                {paymentStatus === "expired" && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
                        <div className="flex items-center">
                            <span className="text-4xl mr-4">⏰</span>
                            <div>
                                <h3 className="text-lg font-bold text-yellow-800">QR Code Expired</h3>
                                <p className="text-yellow-700">Please generate a new QR code</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* QR Code Section */}
                {paymentStatus === "pending" && payment && (
                    <div className="bg-white rounded-lg shadow-md p-8">
                        {/* Timer */}
                        {timeLeft && timeLeft !== "Expired" && (
                            <div className="text-center mb-6">
                                <p className="text-sm text-gray-600 mb-2">QR Code expires in:</p>
                                <p className="text-3xl font-bold text-primary">{timeLeft}</p>
                            </div>
                        )}

                        {/* QR Code */}
                        <div className="flex justify-center mb-6">
                            <div className="bg-white p-4 rounded-lg border-4 border-primary shadow-lg">
                                <img
                                    src={payment.khqrData.qrCode}
                                    alt="BAKONG QR Code"
                                    className="w-64 h-64"
                                />
                            </div>
                        </div>

                        {/* Payment Instructions */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                            <h3 className="font-bold text-blue-900 mb-3 text-lg">How to Pay:</h3>
                            <ol className="list-decimal list-inside space-y-2 text-blue-800">
                                <li>Open your BAKONG app or any bank app that supports KHQR</li>
                                <li>Select "Scan QR" or "KHQR Payment"</li>
                                <li>Scan the QR code above</li>
                                <li>Verify the amount and merchant details</li>
                                <li>Confirm the payment</li>
                            </ol>
                        </div>

                        {/* Payment Details */}
                        <div className="border-t border-gray-200 pt-6">
                            <h3 className="font-bold text-gray-800 mb-4">Payment Details</h3>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Merchant:</span>
                                    <span className="font-semibold">{payment.khqrData.merchantName}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Amount:</span>
                                    <span className="font-bold text-lg text-primary">
                                        ${payment.amount.toFixed(2)}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Transaction ID:</span>
                                    <span className="font-mono text-xs">{payment.khqrData.transactionId}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Order ID:</span>
                                    <span className="font-mono text-xs">
                                        {order?._id.slice(-8).toUpperCase()}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-4 mt-6">
                            <button
                                onClick={fetchOrderAndGenerateQR}
                                className="flex-1 bg-primary text-white py-3 rounded-lg font-semibold hover:bg-primary-dark transition"
                            >
                                Refresh QR Code
                            </button>
                            <button
                                onClick={handleCancelPayment}
                                className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition"
                            >
                                Cancel
                            </button>
                        </div>

                        {/* Checking Status */}
                        <div className="text-center mt-6">
                            <div className="inline-flex items-center text-sm text-gray-600">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                                Checking payment status...
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
