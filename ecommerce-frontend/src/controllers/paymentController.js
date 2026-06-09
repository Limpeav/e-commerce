import {
  cancelPayment,
  generateBakongQR,
  getPaymentStatus,
} from "../services/paymentService.js";
import { getOrderById } from "../services/orderService.js";
import { PaymentModel } from "../models/paymentModel.js";

export class PaymentController {
  static async prepareBakongPayment(orderId, currency = "USD") {
    try {
      const [order, payment] = await Promise.all([
        getOrderById(orderId),
        generateBakongQR(orderId, currency),
      ]);

      return {
        success: true,
        data: {
          order,
          payment: PaymentModel.fromAPI(payment),
        },
      };
    } catch (error) {
      return {
        success: false,
        error:
          error.response?.data?.message ||
          error.message ||
          "Failed to generate payment QR code. Please try again.",
      };
    }
  }

  static async refreshStatus(paymentId) {
    try {
      const payment = await getPaymentStatus(paymentId);
      return {
        success: true,
        data: PaymentModel.fromAPI(payment),
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  static async cancel(paymentId) {
    try {
      const result = await cancelPayment(paymentId);
      return {
        success: true,
        data: {
          ...result,
          payment: PaymentModel.fromAPI(result.payment),
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  }

  static deriveStatus(payment) {
    const status = PaymentModel.getStatus(payment);

    if (status === "completed") return "completed";
    if (status === "failed") return "failed";
    if (status === "expired") return "expired";
    return "pending";
  }

  static getCountdown(expiresAt) {
    return PaymentModel.getTimeLeft(expiresAt);
  }
}
