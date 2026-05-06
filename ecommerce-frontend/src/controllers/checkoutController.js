import { createOrder } from "../services/orderService";
import {
  buildOrderPayload,
  getCheckoutErrorMessage,
  validateCheckout,
} from "../utils/checkout";

export class CheckoutController {
  static async placeOrder({ cartItems, shippingAddress, paymentMethod, totals }) {
    const validationError = validateCheckout(shippingAddress, cartItems);
    if (validationError) {
      return { success: false, error: validationError };
    }

    try {
      const payload = buildOrderPayload({
        cartItems,
        shippingAddress,
        paymentMethod,
        ...totals,
      });
      const order = await createOrder(payload);
      localStorage.setItem("latestOrderId", order._id);
      return { success: true, data: order };
    } catch (error) {
      return { success: false, error: getCheckoutErrorMessage(error) };
    }
  }
}
