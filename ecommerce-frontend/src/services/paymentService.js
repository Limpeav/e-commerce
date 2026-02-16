import axios from "axios";
import { API_BASE_URL, getUserToken, withAuthHeaders } from "./http";

const API_URL = API_BASE_URL;

// Generate BAKONG KHQR code
export const generateBakongQR = async (orderId) => {
    const token = getUserToken();
    const response = await axios.post(
        `${API_URL}/payments/bakong/generate`,
        { orderId },
        {
            headers: withAuthHeaders(token),
        }
    );
    return response.data;
};

// Get payment status
export const getPaymentStatus = async (paymentId) => {
    const token = getUserToken();
    const response = await axios.get(
        `${API_URL}/payments/${paymentId}/status`,
        {
            headers: withAuthHeaders(token),
        }
    );
    return response.data;
};

// Get payment by order ID
export const getPaymentByOrderId = async (orderId) => {
    const token = getUserToken();
    const response = await axios.get(
        `${API_URL}/payments/order/${orderId}`,
        {
            headers: withAuthHeaders(token),
        }
    );
    return response.data;
};

// Cancel payment
export const cancelPayment = async (paymentId) => {
    const token = getUserToken();
    const response = await axios.put(
        `${API_URL}/payments/${paymentId}/cancel`,
        {},
        {
            headers: withAuthHeaders(token),
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
