import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import CheckoutError from "../../components/cart/checkout/CheckoutError";
import CheckoutSuccess from "../../components/cart/checkout/CheckoutSuccess";
import OrderSummaryPanel from "../../components/cart/checkout/OrderSummaryPanel";
import PaymentMethodSection from "../../components/cart/checkout/PaymentMethodSection";
import ShippingAddressSection from "../../components/cart/checkout/ShippingAddressSection";
import { useAuth } from "../../context/useAuth";
import { useCart } from "../../context/useCart";
import { CheckoutController } from "../../controllers/checkoutController";
import { useDarkMode } from "../../hooks";
import {
  calculateCheckoutTotals,
  getValidCartItems,
  toLocalPhoneDigits,
} from "../../utils/checkout";

const Checkout = () => {
  const navigate = useNavigate();
  const { cart, clearCart } = useCart();
  const { user } = useAuth();
  const [isDark] = useDarkMode();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderId, setOrderId] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("Cash on Delivery");
  const [shippingAddress, setShippingAddress] = useState({
    fullName: user?.name || "",
    address: "",
    city: "",
    phone: toLocalPhoneDigits(user?.phone || ""),
    latitude: null,
    longitude: null,
  });
  const errorRef = useRef(null);

  const validCartItems = useMemo(() => getValidCartItems(cart), [cart]);
  const totals = useMemo(
    () => calculateCheckoutTotals(validCartItems),
    [validCartItems]
  );

  useEffect(() => {
    if (validCartItems.length === 0 && !orderPlaced) {
      navigate("/customer/cart");
    }
  }, [validCartItems.length, navigate, orderPlaced]);

  const scrollToError = () => {
    window.requestAnimationFrame(() => {
      errorRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    });
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setShippingAddress((currentAddress) => ({
      ...currentAddress,
      [name]: name === "phone" ? toLocalPhoneDigits(value) : value,
    }));
    setError("");
  };

  const handleLocationSelect = (location) => {
    setShippingAddress((currentAddress) => ({
      ...currentAddress,
      latitude: location.lat,
      longitude: location.lng,
      address: location.address || currentAddress.address,
      city: location.city || currentAddress.city,
    }));
    setError("");
  };

  const handlePlaceOrder = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    const result = await CheckoutController.placeOrder({
      cartItems: validCartItems,
      shippingAddress,
      paymentMethod,
      totals,
    });

    if (!result.success) {
      setError(result.error);
      setLoading(false);
      scrollToError();
      return;
    }

    const nextOrderId = result.data._id;
    setOrderId(nextOrderId);

    if (paymentMethod === "BAKONG_KHQR") {
      navigate(`/payment/bakong/${nextOrderId}`);
    } else {
      setOrderPlaced(true);
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      navigate("/customer/cart/success", {
        replace: true,
        state: { orderId: nextOrderId },
      });
    }

    clearCart().catch((clearCartError) => {
      console.error("Cart clear failed after order:", clearCartError);
    });
    setLoading(false);
  };

  const handleViewOrderDetails = () => {
    if (orderId) {
      navigate(`/customer/orders/${orderId}`, { replace: true });
    }
  };

  if (orderPlaced) {
    return (
      <CheckoutSuccess
        isDark={isDark}
        orderId={orderId}
        onViewOrderDetails={handleViewOrderDetails}
        onContinueShopping={() => navigate("/customer")}
      />
    );
  }

  return (
    <div className={`min-h-screen py-12 pt-32 px-6 font-sans transition-colors duration-300 ${isDark ? "bg-slate-950" : "bg-bg-base"}`}>
      <div className="max-w-7xl mx-auto">
        <div className="mb-12">
          <button
            type="button"
            onClick={() => navigate("/customer/cart")}
            className={`flex items-center gap-2 font-bold text-sm mb-8 transition-all px-5 py-2.5 rounded-full w-fit border ${isDark ? "bg-slate-900 border-slate-800 text-slate-400 hover:text-primary hover:bg-slate-800" : "bg-white border-stone-100 text-text-muted hover:text-primary hover:shadow-md"} `}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Cart
          </button>
          <h1 className="text-4xl md:text-5xl font-bold text-text-main font-display tracking-tight">
            Checkout
          </h1>
        </div>

        <form onSubmit={handlePlaceOrder}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2 space-y-8">
              <ShippingAddressSection
                isDark={isDark}
                shippingAddress={shippingAddress}
                onInputChange={handleInputChange}
                onLocationSelect={handleLocationSelect}
              />

              <PaymentMethodSection
                isDark={isDark}
                paymentMethod={paymentMethod}
                onPaymentMethodChange={setPaymentMethod}
              />

              <CheckoutError error={error} errorRef={errorRef} isDark={isDark} />
            </div>

            <OrderSummaryPanel
              isDark={isDark}
              cartItems={validCartItems}
              totals={totals}
              loading={loading}
            />
          </div>
        </form>
      </div>

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
