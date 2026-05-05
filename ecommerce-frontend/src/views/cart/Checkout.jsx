import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../../context/useCart";
import { useAuth } from "../../context/useAuth";
import {
  ArrowLeft,
  MapPin,
  CreditCard,
  Package,
  Lock,
  CheckCircle,
  AlertCircle,
  Loader,
  User,
  Phone,
  Building,
  Baby
} from "lucide-react";
import axios from "axios";
import GoogleMapPicker from "../../components/GoogleMapPicker";
import { config } from "../../config/index.js";
import { useDarkMode } from "../../hooks";

const API_URL = config.API_BASE_URL;
const CAMBODIA_DIAL_CODE = "+855";
const ORDER_REQUEST_TIMEOUT_MS = 10000;

const displayValue = (value, fallback) => value || fallback;

const toLocalPhoneDigits = (phone = "") => {
  const digits = String(phone).replace(/\D/g, "");

  if (digits.startsWith("855")) {
    return digits.slice(3);
  }

  return digits.replace(/^0/, "");
};

const toCambodiaPhone = (phone = "") => {
  const localDigits = toLocalPhoneDigits(phone);
  return localDigits ? `${CAMBODIA_DIAL_CODE}${localDigits}` : "";
};

const Checkout = () => {
  const navigate = useNavigate();
  const { cart, clearCart } = useCart();
  const { user } = useAuth();
  const [isDark] = useDarkMode();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderId, setOrderId] = useState(null);
  const errorRef = useRef(null);

  // Filter valid cart items
  const validCartItems = cart.filter((item) => item.product);

  // Helper function to get effective price (discountPrice if available, otherwise regular price)
  const getEffectivePrice = (product) => {
    return (product.discountPrice && product.discountPrice < product.price)
      ? product.discountPrice
      : product.price;
  };

  // Calculate totals
  const subtotal = validCartItems.reduce(
    (acc, item) => acc + getEffectivePrice(item.product) * item.quantity,
    0
  );
  const shippingPrice = 2; // Fixed delivery fee
  const taxPrice = subtotal * 0.08; // 8% tax
  const totalPrice = subtotal + shippingPrice + taxPrice;

  // Form state
  const [shippingAddress, setShippingAddress] = useState({
    fullName: user?.name || "",
    address: "",
    city: "",
    phone: toLocalPhoneDigits(user?.phone || ""),
    latitude: null,
    longitude: null,
  });

  const [paymentMethod, setPaymentMethod] = useState("Cash on Delivery");

  useEffect(() => {
    // Redirect if cart is empty
    if (validCartItems.length === 0 && !orderPlaced) {
      navigate("/cart");
    }
  }, [validCartItems.length, navigate, orderPlaced]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setShippingAddress((prev) => ({
      ...prev,
      [name]: name === "phone" ? toLocalPhoneDigits(value) : value,
    }));
    setError("");
  };

  const handleLocationSelect = (location) => {
    setShippingAddress((prev) => ({
      ...prev,
      latitude: location.lat,
      longitude: location.lng,
      address: location.address || prev.address,
      city: location.city || prev.city,
    }));
    setError("");
  };

  const getAuthToken = () => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      return userData.token;
    }
    return null;
  };

  const scrollToError = () => {
    window.requestAnimationFrame(() => {
      errorRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    });
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Validate form
    if (
      !shippingAddress.fullName ||
      !shippingAddress.address ||
      !shippingAddress.city ||
      !shippingAddress.phone
    ) {
      setError("Please complete your shipping details before placing the order.");
      setLoading(false);
      scrollToError();
      return;
    }

    // Validate location is selected
    if (
      shippingAddress.latitude == null ||
      shippingAddress.longitude == null
    ) {
      setError("Please select your delivery location on the map before placing the order.");
      setLoading(false);
      scrollToError();
      return;
    }

    if (validCartItems.length === 0) {
      setError("Your cart is empty. Add an item before placing the order.");
      setLoading(false);
      scrollToError();
      return;
    }

    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error("Not authenticated");
      }

      // Prepare order items
      const orderItems = validCartItems.map((item) => ({
        product: item.product._id,
        name: item.product.title || item.product.name,
        quantity: item.quantity,
        image: item.product.image,
        price: getEffectivePrice(item.product),
      }));

      // Create order
      const response = await axios.post(
        `${API_URL}/orders`,
        {
          orderItems,
          shippingAddress: {
            ...shippingAddress,
            phone: toCambodiaPhone(shippingAddress.phone),
          },
          paymentMethod,
          taxPrice: parseFloat(taxPrice.toFixed(2)),
          shippingPrice: parseFloat(shippingPrice.toFixed(2)),
          totalPrice: parseFloat(totalPrice.toFixed(2)),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          timeout: ORDER_REQUEST_TIMEOUT_MS,
        }
      );

      // Preserve the latest order id so shared success flows can deep-link
      // back to the specific order detail page.
      setOrderId(response.data._id);
      localStorage.setItem("latestOrderId", response.data._id);

      // Redirect to BAKONG payment if BAKONG KHQR is selected
      if (paymentMethod === "BAKONG_KHQR") {
        navigate(`/payment/bakong/${response.data._id}`);
      } else {
        setOrderPlaced(true);
        window.scrollTo({ top: 0, left: 0, behavior: "auto" });
        navigate("/cart/success", {
          replace: true,
          state: { orderId: response.data._id },
        });
      }

      // Cart cleanup should not block order success UI.
      clearCart().catch((clearCartError) => {
        console.error("Cart clear failed after order:", clearCartError);
      });
    } catch (err) {
      const errorMessage =
        err.code === "ECONNABORTED"
          ? "Order request timed out. Please check the backend server and try again."
          : err.response?.data?.message ||
            (err.message === "Network Error"
              ? "Cannot reach the backend API. Check that the backend server is running and VITE_API_URL is correct."
              : err.message) ||
            "Failed to place order";

      setError(
        errorMessage
      );
      scrollToError();
    } finally {
      setLoading(false);
    }
  };

  const handleViewOrderDetails = () => {
    if (!orderId) return;

    navigate(`/orders/${orderId}`, { replace: true });
  };

  // Order success view
  if (orderPlaced) {
    return (
      <div className={`min-h-screen flex items-center justify-center px-6 font-sans transition-colors duration-300 ${isDark ? "bg-slate-950" : "bg-bg-base"}`}>
        <div className={`max-w-2xl w-full rounded-[3rem] p-12 text-center border relative overflow-hidden transition-colors duration-300 ${isDark ? "bg-slate-900 border-slate-800 shadow-[0_32px_80px_-36px_rgba(2,6,23,0.95)]" : "bg-white border-stone-100 shadow-xl"}`}>
          <div className="pointer-events-none absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32"></div>

          <div className="mb-10 relative z-10">
            <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner border ${isDark ? "bg-slate-800 border-slate-700" : "bg-stone-50 border-stone-100"}`}>
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
            <h1 className="text-4xl font-bold text-text-main mb-3 font-display tracking-tight">
              Order Placed Successfully!
            </h1>
            <p className={`font-medium text-lg max-w-md mx-auto ${isDark ? "text-slate-400" : "text-text-muted"}`}>
              Thank you for your order. We are preparing your items for shipment.
            </p>
          </div>

          <div className={`relative z-10 rounded-2xl p-6 mb-8 border inline-block w-full max-w-sm ${isDark ? "bg-slate-800 border-slate-700" : "bg-stone-50 border-stone-100"}`}>
            <p className={`text-xs font-bold uppercase tracking-wider mb-2 ${isDark ? "text-slate-400" : "text-text-muted"}`}>Order ID</p>
            <p className="text-2xl font-bold text-text-main font-mono tracking-tight">
              #{orderId?.slice(-8).toUpperCase()}
            </p>
          </div>

          <div className="relative z-10 flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleViewOrderDetails}
              type="button"
              className="px-8 py-4 bg-text-main text-white rounded-xl hover:bg-primary transition-all font-bold text-sm shadow-xl shadow-primary/10 hover:-translate-y-1 active:scale-95"
            >
              View Order Details
            </button>
            <button
              onClick={() => navigate("/")}
              type="button"
              className={`px-8 py-4 border rounded-xl transition-all font-bold text-sm hover:border-primary hover:text-primary active:scale-95 ${isDark ? "bg-slate-900 text-slate-400 border-slate-700 hover:bg-slate-800" : "bg-white text-text-muted border-stone-200 hover:shadow-lg"}`}
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen py-12 pt-32 px-6 font-sans transition-colors duration-300 ${isDark ? "bg-slate-950" : "bg-bg-base"}`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <button
            type="button"
            onClick={() => navigate("/cart")}
            className={`flex items-center gap-2 font-bold text-sm mb-8 transition-all px-5 py-2.5 rounded-full w-fit border ${isDark ? "bg-slate-900 border-slate-800 text-slate-400 hover:text-primary hover:bg-slate-800" : "bg-white border-stone-100 text-text-muted hover:text-primary hover:shadow-md"} `}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Cart
          </button>
          <div className="flex items-baseline gap-4">
            <h1 className="text-4xl md:text-5xl font-bold text-text-main font-display tracking-tight">Checkout</h1>
          </div>
        </div>

        <form onSubmit={handlePlaceOrder}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Left Column - Forms */}
            <div className="lg:col-span-2 space-y-8">
              {/* Shipping Address */}
              <div className={`rounded-[2.5rem] border p-8 md:p-10 transition-colors duration-300 ${isDark ? "bg-slate-900 border-slate-800 shadow-[0_24px_60px_-28px_rgba(2,6,23,0.9)]" : "bg-white border-stone-100 shadow-xl shadow-primary/5"}`}>
                <h2 className="text-xl font-bold text-text-main mb-8 flex items-center gap-4 font-display">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-primary border ${isDark ? "bg-slate-800 border-slate-700" : "bg-stone-50 border-stone-100"}`}>
                    <MapPin className="w-5 h-5" />
                  </div>
                  Shipping Address
                </h2>

                <div className="space-y-6">
                  <div className="group">
                    <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2 ml-1">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? "text-slate-500" : "text-stone-400"}`} />
                      <input
                        type="text"
                        name="fullName"
                        value={shippingAddress.fullName}
                        onChange={handleInputChange}
                        placeholder="Enter your full name"
                        className={`w-full pl-12 pr-6 py-3.5 border rounded-xl font-medium text-text-main min-h-[54px] ${
                          isDark
                            ? "bg-slate-800 border-slate-700 placeholder:text-slate-500"
                            : "bg-stone-50 border-stone-200 placeholder:text-stone-400"
                        }`}
                      />
                    </div>
                  </div>

                  <div className="group">
                    <div className={`pt-2 ${isDark ? "border-slate-800" : "border-stone-100"}`}>
                      <div className="flex items-center justify-between mb-4">
                        <label className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          Pin Location
                          <span className="text-red-500">*</span>
                        </label>
                        {shippingAddress.latitude && shippingAddress.longitude && (
                          <span className="text-[10px] text-green-600 font-bold flex items-center gap-1.5 bg-green-50 px-3 py-1 rounded-full border border-green-100 uppercase tracking-wide">
                            <CheckCircle className="w-3 h-3" />
                            Location Selected
                          </span>
                        )}
                      </div>
                      <div className={`rounded-2xl overflow-hidden border shadow-sm ${isDark ? "border-slate-700" : "border-stone-200"}`}>
                        <GoogleMapPicker
                          onSelectLocation={handleLocationSelect}
                          initialLocation={
                            shippingAddress.latitude && shippingAddress.longitude
                              ? {
                                lat: shippingAddress.latitude,
                                lng: shippingAddress.longitude,
                              }
                              : null
                          }
                          address={`${shippingAddress.address}, ${shippingAddress.city}`}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="group">
                    <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2 ml-1">
                      Address
                    </label>
                    <div className={`relative flex items-center w-full pl-12 pr-6 py-3.5 border rounded-xl font-medium text-text-main min-h-[54px] ${isDark ? "bg-slate-800 border-slate-700" : "bg-stone-50 border-stone-200"}`}>
                      <Building className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? "text-slate-500" : "text-stone-400"}`} />
                      <span>{displayValue(shippingAddress.address, "Select a location on the map")}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2 ml-1">
                        City / Province
                      </label>
                      <div className={`flex items-center w-full px-6 py-3.5 border rounded-xl font-medium text-text-main min-h-[54px] ${isDark ? "bg-slate-800 border-slate-700" : "bg-stone-50 border-stone-200"}`}>
                        <span>{displayValue(shippingAddress.city, "City / Province will appear here")}</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2 ml-1">
                        Phone Number
                      </label>
                      <div className="relative">
                        <Phone className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? "text-slate-500" : "text-stone-400"}`} />
                        <span className={`absolute left-12 top-1/2 -translate-y-1/2 text-sm font-bold ${isDark ? "text-slate-200" : "text-text-main"}`}>
                          {CAMBODIA_DIAL_CODE}
                        </span>
                        <input
                          type="tel"
                          name="phone"
                          value={shippingAddress.phone}
                          onChange={handleInputChange}
                          placeholder="12 345 678"
                          inputMode="numeric"
                          className={`w-full pl-28 pr-6 py-3.5 border rounded-xl font-medium text-text-main min-h-[54px] ${
                            isDark
                              ? "bg-slate-800 border-slate-700 placeholder:text-slate-500"
                              : "bg-stone-50 border-stone-200 placeholder:text-stone-400"
                          }`}
                        />
                      </div>
                    </div>
                  </div>

                </div>
              </div>

              {/* Payment Method */}
              <div className={`rounded-[2.5rem] border p-8 md:p-10 transition-colors duration-300 ${isDark ? "bg-slate-900 border-slate-800 shadow-[0_24px_60px_-28px_rgba(2,6,23,0.9)]" : "bg-white border-stone-100 shadow-xl shadow-primary/5"}`}>
                <h2 className="text-xl font-bold text-text-main mb-8 flex items-center gap-4 font-display">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-primary border ${isDark ? "bg-slate-800 border-slate-700" : "bg-stone-50 border-stone-100"}`}>
                    <CreditCard className="w-5 h-5" />
                  </div>
                  Payment Method
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {["BAKONG_KHQR", "Cash on Delivery"].map(
                    (method) => (
                      <label
                        key={method}
                        className={`flex items-center gap-4 p-5 border rounded-2xl cursor-pointer transition-all group ${paymentMethod === method
                          ? "border-primary bg-primary/5 shadow-sm"
                          : isDark
                            ? "border-slate-700 hover:border-primary/40 hover:bg-slate-800"
                            : "border-stone-200 hover:border-primary/30 hover:bg-stone-50"
                          }`}
                      >
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${paymentMethod === method ? 'border-primary bg-primary' : isDark ? 'border-slate-600' : 'border-stone-300'}`}>
                          {paymentMethod === method && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                        <input
                          type="radio"
                          name="paymentMethod"
                          value={method}
                          checked={paymentMethod === method}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                          className="hidden"
                        />
                        <span className={`font-bold text-sm ${paymentMethod === method ? 'text-primary' : isDark ? 'text-slate-400' : 'text-text-muted'}`}>{method}</span>
                      </label>
                    )
                  )}
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div
                  ref={errorRef}
                  className={`border rounded-2xl p-4 flex items-center gap-3 animate-shake ${
                    isDark ? "bg-red-500/10 border-red-500/20" : "border-red-200"
                  }`}
                  style={!isDark ? { backgroundColor: "#FDE8DD" } : undefined}
                >
                  <AlertCircle
                    className="w-5 h-5"
                    style={{ color: isDark ? "#FCA5A5" : "#B45309" }}
                  />
                  <p
                    className="font-medium text-sm"
                    style={{ color: isDark ? "#FECACA" : "#7C2D12" }}
                  >
                    {error}
                  </p>
                </div>
              )}
            </div>

            {/* Right Column - Order Summary */}
            <div className="lg:col-span-1">
              <div className={`rounded-[2.5rem] border p-8 md:p-10 sticky top-32 transition-colors duration-300 ${isDark ? "bg-slate-900 border-slate-800 shadow-[0_24px_60px_-28px_rgba(2,6,23,0.9)]" : "bg-white border-stone-100 shadow-xl shadow-primary/5"}`}>
                <h2 className="text-xl font-bold text-text-main mb-8 flex items-center gap-4 font-display">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-primary border ${isDark ? "bg-slate-800 border-slate-700" : "bg-stone-50 border-stone-100"}`}>
                    <Package className="w-5 h-5" />
                  </div>
                  Order Summary
                </h2>

                {/* Order Items */}
                <div className="space-y-4 mb-8 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                  {validCartItems.map((item) => (
                    <div
                      key={item._id || item.product._id}
                      className={`flex items-center gap-4 p-3 rounded-2xl border group ${isDark ? "bg-slate-800 border-slate-700" : "bg-stone-50 border-stone-100"}`}
                    >
                      <div className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 p-1.5 border ${isDark ? "bg-slate-900 border-slate-700" : "bg-white border-stone-100"}`}>
                        <img
                          src={item.product.image}
                          alt={item.product.title || item.product.name}
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-text-main text-sm truncate">
                          {item.product.title || item.product.name}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? "text-slate-400" : "text-text-muted"}`}>Qty: {item.quantity}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-text-main text-sm">
                          ${(getEffectivePrice(item.product) * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Price Breakdown */}
                <div className={`space-y-3 mb-8 border-t pt-6 ${isDark ? "border-slate-800" : "border-stone-100"}`}>
                  <div className={`flex justify-between text-sm font-medium ${isDark ? "text-slate-400" : "text-text-muted"}`}>
                    <span>Subtotal</span>
                    <span className="text-text-main font-bold">${subtotal.toFixed(2)}</span>
                  </div>
                  <div className={`flex justify-between text-sm font-medium ${isDark ? "text-slate-400" : "text-text-muted"}`}>
                    <span>Shipping</span>
                    <span className="text-green-600 font-bold">
                      {shippingPrice === 0 ? "Free" : `$${shippingPrice.toFixed(2)}`}
                    </span>
                  </div>
                  <div className={`flex justify-between text-sm font-medium ${isDark ? "text-slate-400" : "text-text-muted"}`}>
                    <span>Tax (8%)</span>
                    <span className="text-text-main font-bold">${taxPrice.toFixed(2)}</span>
                  </div>

                  <div className={`h-px my-4 ${isDark ? "bg-slate-800" : "bg-stone-100"}`}></div>

                  <div className="flex justify-between items-end">
                    <span className="text-text-main font-bold text-lg">Total</span>
                    <span className="text-3xl font-black font-display tracking-tight text-primary">
                      ${totalPrice.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Place Order Button */}
                <button
                  type="submit"
                  disabled={loading || validCartItems.length === 0}
                  className="w-full py-4 bg-text-main text-white font-bold rounded-xl hover:bg-primary shadow-lg hover:shadow-primary/25 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed text-sm active:scale-95"
                >
                  {loading ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      Place Order
                    </>
                  )}
                </button>

                <p className={`mt-6 text-xs text-center font-medium flex items-center justify-center gap-1.5 ${isDark ? "text-slate-500" : "text-stone-400"}`}>
                  <Lock className="w-3 h-3" />
                  Secure Payment
                </p>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* Scrollbar Styles */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: rgba(255,255,255,0.1); border-radius: 20px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: rgba(255,255,255,0.2); }
      `}</style>
    </div>
  );
};

export default Checkout;
