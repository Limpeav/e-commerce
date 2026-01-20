import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

// Generate BAKONG KHQR code
export const generateBakongQR = async (orderId) => {
    const token = localStorage.getItem("token");
    const response = await axios.post(
        `${API_URL}/payments/bakong/generate`,
        { orderId },
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );
    return response.data;
};

// Get payment status
export const getPaymentStatus = async (paymentId) => {
    const token = localStorage.getItem("token");
    const response = await axios.get(
        `${API_URL}/payments/${paymentId}/status`,
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );
    return response.data;
};

// Get payment by order ID
export const getPaymentByOrderId = async (orderId) => {
    const token = localStorage.getItem("token");
    const response = await axios.get(
        `${API_URL}/payments/order/${orderId}`,
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );
    return response.data;
};

// Cancel payment
export const cancelPayment = async (paymentId) => {
    const token = localStorage.getItem("token");
    const response = await axios.put(
        `${API_URL}/payments/${paymentId}/cancel`,
        {},
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );
    return response.data;
};

// Verify payment (webhook simulation - for testing)
export const verifyPayment = async (paymentData) => {
    const response = await axios.post(
        `${API_URL}/payments/bakong/verify`,
        paymentData
    );
    return response.data;
};
