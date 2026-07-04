import {
  createOrder,
  notifyCustomerOrderCreated,
} from "../services/orderService";
import {
  buildOrderPayload,
  getCheckoutErrorMessage,
  validateCheckout,
} from "../utils/checkout";

export class CheckoutController {
  static async placeOrder({ cartItems, shippingAddress, paymentMethod, totals, t }) {
    const validationError = validateCheckout(shippingAddress, cartItems, t);
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
      notifyCustomerOrderCreated(order);
      return { success: true, data: order };
    } catch (error) {
      return { success: false, error: getCheckoutErrorMessage(error) };
    }
  }
}
