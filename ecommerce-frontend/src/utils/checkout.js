export const CAMBODIA_DIAL_CODE = "+855";
export const ORDER_REQUEST_TIMEOUT_MS = 10000;
export const SHIPPING_PRICE = 2;
export const TAX_RATE = 0.08;

export const displayValue = (value, fallback) => value || fallback;

export const toLocalPhoneDigits = (phone = "") => {
  const digits = String(phone).replace(/\D/g, "");

  if (digits.startsWith("855")) {
    return digits.slice(3);
  }

  return digits.replace(/^0/, "");
};

export const toCambodiaPhone = (phone = "") => {
  const localDigits = toLocalPhoneDigits(phone);
  return localDigits ? `${CAMBODIA_DIAL_CODE}${localDigits}` : "";
};

export const getEffectiveCartProductPrice = (product) =>
  product?.discountPrice && product.discountPrice < product.price
    ? product.discountPrice
    : product?.price || 0;

export const getValidCartItems = (cart = []) => cart.filter((item) => item.product);

const checkoutValidationMessages = {
  incompleteShipping: "Please complete your shipping details before placing the order.",
  missingLocation: "Please select your delivery location on the map before placing the order.",
  emptyCart: "Your cart is empty. Add an item before placing the order.",
};

const getCheckoutValidationMessage = (key, t) =>
  typeof t === "function"
    ? t(`checkout.errors.${key}`)
    : checkoutValidationMessages[key];

export const calculateCheckoutTotals = (cartItems = []) => {
  const subtotal = cartItems.reduce(
    (acc, item) => acc + getEffectiveCartProductPrice(item.product) * item.quantity,
    0
  );
  const taxPrice = subtotal * TAX_RATE;
  const totalPrice = subtotal + SHIPPING_PRICE + taxPrice;

  return {
    subtotal,
    shippingPrice: SHIPPING_PRICE,
    taxPrice,
    totalPrice,
  };
};

export const validateCheckout = (shippingAddress, cartItems = [], t) => {
  if (
    !shippingAddress.fullName ||
    !shippingAddress.phone
  ) {
    return getCheckoutValidationMessage("incompleteShipping", t);
  }

  if (shippingAddress.latitude == null || shippingAddress.longitude == null) {
    return getCheckoutValidationMessage("missingLocation", t);
  }

  if (cartItems.length === 0) {
    return getCheckoutValidationMessage("emptyCart", t);
  }

  return "";
};

export const buildOrderPayload = ({
  cartItems,
  shippingAddress,
  paymentMethod,
  taxPrice,
  shippingPrice,
  totalPrice,
}) => ({
  orderItems: cartItems.map((item) => ({
    product: item.product._id,
    name: item.product.title || item.product.name,
    titleKm: item.product.titleKm || "",
    quantity: item.quantity,
    size: item.size || "",
    image: item.product.image,
    price: getEffectiveCartProductPrice(item.product),
  })),
  shippingAddress: {
    ...shippingAddress,
    phone: toCambodiaPhone(shippingAddress.phone),
  },
  paymentMethod,
  taxPrice: parseFloat(taxPrice.toFixed(2)),
  shippingPrice: parseFloat(shippingPrice.toFixed(2)),
  totalPrice: parseFloat(totalPrice.toFixed(2)),
});

export const getCheckoutErrorMessage = (error) => {
  if (error.code === "ECONNABORTED") {
    return "Order request timed out. Please check the backend server and try again.";
  }

  if (error.message === "Network Error") {
    return "Cannot reach the backend API. Check that the backend server is running and VITE_API_URL is correct.";
  }

  return error.response?.data?.message || error.message || "Failed to place order";
};
