import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
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
  Building
} from "lucide-react";
import axios from "axios";
import GoogleMapPicker from "../../components/GoogleMapPicker";
import { API_BASE_URL, getUserToken, withAuthHeaders } from "../../services/http";

const API_URL = API_BASE_URL;
const PAYMENT_METHOD_OPTIONS = [
  {
    value: "BAKONG_KHQR",
    label: "BAKONG KHQR",
    description: "Scan KHQR with Bakong or partner banking apps",
  },
  {
    value: "Cash on Delivery",
    label: "Cash on Delivery",
    description: "Available in Phnom Penh only",
  },
  {
    value: "Bank Transfer",
    label: "Bank Transfer",
    description: "Transfer manually and confirm payment later",
  },
];

const DELIVERY_OPTIONS = [
  { value: "J&T Express", label: "J&T Express" },
  { value: "Vireak Buntham Express", label: "Vireak Buntham Express" },
];

const Checkout = () => {
  const navigate = useNavigate();
  const { cart, clearCart } = useCart();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [shippingLoading, setShippingLoading] = useState(false);
  const [error, setError] = useState("");
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderId, setOrderId] = useState(null);
  const [shippingPrice, setShippingPrice] = useState(0);
  const [addresses, setAddresses] = useState([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [shippingCarrier, setShippingCarrier] = useState("J&T Express");

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
  const totalQuantity = validCartItems.reduce(
    (sum, item) => sum + Number(item.quantity || 0),
    0
  );
  const taxPrice = subtotal * 0.08; // 8% tax
  const totalPrice = subtotal + shippingPrice + taxPrice;

  // Form state
  const [shippingAddress, setShippingAddress] = useState({
    fullName: user?.name || "",
    address: "",
    city: "",
    postalCode: "",
    country: "Cambodia",
    phone: user?.phone || "",
    latitude: null,
    longitude: null,
  });

  const [paymentMethod, setPaymentMethod] = useState("Cash on Delivery");
  const isPhnomPenh = shippingAddress.city.trim().toLowerCase().includes("phnom penh");

  useEffect(() => {
    if (!isPhnomPenh && paymentMethod === "Cash on Delivery") {
      setPaymentMethod("BAKONG_KHQR");
    }
  }, [isPhnomPenh, paymentMethod]);

  useEffect(() => {
    // Redirect if cart is empty
    if (validCartItems.length === 0 && !orderPlaced) {
      navigate("/cart");
    }
  }, [validCartItems.length, navigate, orderPlaced]);

  useEffect(() => {
    let isCancelled = false;

    const fetchAddresses = async () => {
      const token = getUserToken();
      if (!token || !user) {
        return;
      }

      try {
        setLoadingAddresses(true);
        const response = await axios.get(`${API_URL}/users/addresses`, {
          headers: withAuthHeaders(token),
        });

        if (isCancelled) {
          return;
        }

        const list = Array.isArray(response.data) ? response.data : [];
        setAddresses(list);

        const defaultAddress = list.find((address) => address.isDefault) || list[0];
        if (defaultAddress) {
          setSelectedAddressId(defaultAddress._id);
          setShippingAddress((prev) => ({
            ...prev,
            fullName: defaultAddress.fullName || prev.fullName || "",
            address: [defaultAddress.addressLine1, defaultAddress.addressLine2]
              .filter(Boolean)
              .join(", "),
            city: defaultAddress.city || "",
            postalCode: defaultAddress.postalCode || "",
            country: defaultAddress.country || "Cambodia",
            phone: defaultAddress.phone || prev.phone || "",
            latitude: Number.isFinite(Number(defaultAddress.latitude))
              ? Number(defaultAddress.latitude)
              : null,
            longitude: Number.isFinite(Number(defaultAddress.longitude))
              ? Number(defaultAddress.longitude)
              : null,
          }));
        }
      } catch {
        if (!isCancelled) {
          setAddresses([]);
        }
      } finally {
        if (!isCancelled) {
          setLoadingAddresses(false);
        }
      }
    };

    fetchAddresses();
    return () => {
      isCancelled = true;
    };
  }, [user]);

  useEffect(() => {
    let isCancelled = false;

    const fetchShippingQuote = async () => {
      if (!shippingAddress.city || validCartItems.length === 0) {
        setShippingPrice(0);
        setShippingLoading(false);
        return;
      }

      const token = getUserToken();
      if (!token) {
        setShippingPrice(0);
        setShippingLoading(false);
        return;
      }

      try {
        setShippingLoading(true);

        const response = await axios.get(`${API_URL}/orders/shipping-fee`, {
          params: {
            city: shippingAddress.city,
            country: shippingAddress.country || "Cambodia",
            itemCount: validCartItems.length,
            totalQuantity,
            itemsPrice: subtotal,
          },
          headers: withAuthHeaders(token),
        });

        if (!isCancelled) {
          setShippingPrice(Number(response.data?.shippingPrice || 0));
        }
      } catch {
        if (!isCancelled) {
          setShippingPrice(0);
        }
      } finally {
        if (!isCancelled) {
          setShippingLoading(false);
        }
      }
    };

    fetchShippingQuote();

    return () => {
      isCancelled = true;
    };
  }, [shippingAddress.city, shippingAddress.country, validCartItems.length, totalQuantity, subtotal]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setShippingAddress((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError("");
  };

  const handleLocationSelect = (location) => {
    setShippingAddress((prev) => ({
      ...prev,
      latitude: location.lat,
      longitude: location.lng,
    }));
  };

  const applySavedAddress = (addressId) => {
    setSelectedAddressId(addressId);
    const selectedAddress = addresses.find((address) => address._id === addressId);
    if (!selectedAddress) {
      return;
    }

    setShippingAddress((prev) => ({
      ...prev,
      fullName: selectedAddress.fullName || prev.fullName || "",
      address: [selectedAddress.addressLine1, selectedAddress.addressLine2]
        .filter(Boolean)
        .join(", "),
      city: selectedAddress.city || "",
      postalCode: selectedAddress.postalCode || "",
      country: selectedAddress.country || "Cambodia",
      phone: selectedAddress.phone || prev.phone || "",
      latitude: Number.isFinite(Number(selectedAddress.latitude))
        ? Number(selectedAddress.latitude)
        : null,
      longitude: Number.isFinite(Number(selectedAddress.longitude))
        ? Number(selectedAddress.longitude)
        : null,
    }));
  };

  const getAuthToken = () => {
    return getUserToken();
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
      setError("Please fill in all shipping address fields");
      setLoading(false);
      return;
    }

    if (validCartItems.length === 0) {
      setError("Your cart is empty");
      setLoading(false);
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
          shippingAddress,
          paymentMethod,
          shippingCarrier,
        },
        {
          headers: {
            ...withAuthHeaders(token),
            "Content-Type": "application/json",
          },
        }
      );

      // Clear cart after successful order
      await clearCart();

      // Set order placed state
      setOrderId(response.data._id);

      // Redirect to BAKONG payment if BAKONG KHQR is selected
      if (paymentMethod === "BAKONG_KHQR") {
        navigate(`/payment/bakong/${response.data._id}`);
      } else {
        setOrderPlaced(true);
      }
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || "Failed to place order"
      );
    } finally {
      setLoading(false);
    }
  };

  // Order success view
  if (orderPlaced) {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center px-4 py-10 font-sans">
        <div className="max-w-xl w-full bg-white rounded-xl border border-primary/15 p-8 text-center shadow-sm">
          <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-green-50 border border-green-100 flex items-center justify-center">
            <CheckCircle className="w-7 h-7 text-green-600" />
          </div>
          <h1 className="text-2xl md:text-3xl font-semibold text-text-main mb-2">Order placed successfully</h1>
          <p className="text-text-muted text-sm md:text-base mb-6">
            Thank you. Your order is confirmed and will be processed shortly.
          </p>

          <div className="rounded-lg border border-primary/15 bg-blue-soft/40 p-4 mb-6">
            <p className="text-xs text-text-muted mb-1">Order ID</p>
            <p className="text-lg font-semibold text-text-main font-mono">#{orderId?.slice(-8).toUpperCase()}</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => navigate(`/orders/${orderId}`)}
              className="px-6 py-3 bg-primary text-text-main rounded-lg hover:bg-primary-hover transition-colors font-semibold text-sm"
            >
              View Order Details
            </button>
            <button
              onClick={() => navigate("/")}
              className="px-6 py-3 bg-white text-text-main border border-primary/20 rounded-lg hover:border-primary hover:text-primary transition-colors font-semibold text-sm"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-base py-8 pt-24 px-4 md:px-6 font-sans">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <button
            onClick={() => navigate("/cart")}
            className="inline-flex items-center gap-2 text-text-muted hover:text-primary font-semibold text-sm mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Cart
          </button>
          <div className="flex items-center gap-2 text-xs text-text-muted mb-2">
            <span>Cart</span>
            <span>•</span>
            <span className="text-primary font-semibold">Checkout</span>
            <span>•</span>
            <span>Confirmation</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-semibold text-text-main">Checkout</h1>
        </div>

        <form onSubmit={handlePlaceOrder}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            <div className="lg:col-span-2 space-y-5">
              <div className="bg-white rounded-xl border border-primary/15 p-5 md:p-6">
                <h2 className="text-lg font-semibold text-text-main mb-5 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary" />
                  Shipping Address
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-text-muted mb-1">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                      <input
                        type="text"
                        name="fullName"
                        value={shippingAddress.fullName}
                        onChange={handleInputChange}
                        required
                        placeholder="John Doe"
                        className="w-full pl-11 pr-4 py-3 bg-white border border-primary/20 rounded-lg focus:outline-none focus:border-primary text-text-main"
                      />
                    </div>
                  </div>

                  {addresses.length > 0 && (
                    <div>
                      <label className="block text-xs font-semibold text-text-muted mb-1">
                        Saved Addresses
                      </label>
                      <select
                        value={selectedAddressId}
                        onChange={(event) => applySavedAddress(event.target.value)}
                        className="w-full px-4 py-3 bg-white border border-primary/20 rounded-lg focus:outline-none focus:border-primary text-text-main"
                      >
                        <option value="">Choose an address</option>
                        {addresses.map((address) => (
                          <option key={address._id} value={address._id}>
                            {address.label || "Address"} - {address.addressLine1}, {address.city}
                          </option>
                        ))}
                      </select>
                      <p className="text-[11px] text-text-muted mt-1.5">
                        {loadingAddresses
                          ? "Loading saved addresses..."
                          : "Selecting a saved address will prefill delivery details."}
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-text-muted mb-1">
                      Address
                    </label>
                    <div className="relative">
                      <Building className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                      <input
                        type="text"
                        name="address"
                        value={shippingAddress.address}
                        onChange={handleInputChange}
                        required
                        placeholder="123 Street Name"
                        className="w-full pl-11 pr-4 py-3 bg-white border border-primary/20 rounded-lg focus:outline-none focus:border-primary text-text-main"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-text-muted mb-1">
                        City
                      </label>
                      <input
                        type="text"
                        name="city"
                        value={shippingAddress.city}
                        onChange={handleInputChange}
                        required
                        placeholder="Phnom Penh"
                        className="w-full px-4 py-3 bg-white border border-primary/20 rounded-lg focus:outline-none focus:border-primary text-text-main"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-text-muted mb-1">
                        Phone Number
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                        <input
                          type="tel"
                          name="phone"
                          value={shippingAddress.phone}
                          onChange={handleInputChange}
                          required
                          placeholder="+1 (555) 000-0000"
                          className="w-full pl-11 pr-4 py-3 bg-white border border-primary/20 rounded-lg focus:outline-none focus:border-primary text-text-main"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-text-muted mb-1">
                      Country
                    </label>
                    <input
                      type="text"
                      name="country"
                      value={shippingAddress.country}
                      onChange={handleInputChange}
                      required
                      placeholder="Cambodia"
                      className="w-full px-4 py-3 bg-white border border-primary/20 rounded-lg focus:outline-none focus:border-primary text-text-main"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-text-muted mb-1">
                      Postal Code
                    </label>
                    <input
                      type="text"
                      name="postalCode"
                      value={shippingAddress.postalCode}
                      onChange={handleInputChange}
                      placeholder="12000"
                      className="w-full px-4 py-3 bg-white border border-primary/20 rounded-lg focus:outline-none focus:border-primary text-text-main"
                    />
                  </div>

                  <div className="pt-4 border-t border-primary/10">
                    <div className="flex items-center justify-between mb-4">
                      <label className="text-xs font-semibold text-text-muted flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        Pin Location
                      </label>
                      {shippingAddress.latitude && shippingAddress.longitude && (
                        <span className="text-[11px] text-green-700 font-semibold flex items-center gap-1.5 bg-green-50 px-2.5 py-1 rounded-full border border-green-100">
                          <CheckCircle className="w-3 h-3" />
                          Location Selected
                        </span>
                      )}
                    </div>
                    <div className="rounded-lg overflow-hidden border border-primary/15">
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
                        address={`${shippingAddress.address}, ${shippingAddress.city}, ${shippingAddress.country}`}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-primary/15 p-5 md:p-6">
                <h2 className="text-lg font-semibold text-text-main mb-4 flex items-center gap-2">
                  <Package className="w-5 h-5 text-primary" />
                  Delivery Option
                </h2>
                <div className="space-y-2 mb-6">
                  {DELIVERY_OPTIONS.map((option) => (
                    <label
                      key={option.value}
                      className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                        shippingCarrier === option.value
                          ? "border-primary bg-primary/5"
                          : "border-primary/20 hover:border-primary/40"
                      }`}
                    >
                      <input
                        type="radio"
                        name="shippingCarrier"
                        value={option.value}
                        checked={shippingCarrier === option.value}
                        onChange={(e) => setShippingCarrier(e.target.value)}
                        className="mt-0.5 accent-primary"
                      />
                      <div className="text-sm font-semibold text-text-main">{option.label}</div>
                    </label>
                  ))}
                </div>

                <h2 className="text-lg font-semibold text-text-main mb-4 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-primary" />
                  Payment Method
                </h2>

                <div className="space-y-2">
                  {PAYMENT_METHOD_OPTIONS.filter(
                    (option) => option.value !== "Cash on Delivery" || isPhnomPenh
                  ).map((option) => (
                    <label
                      key={option.value}
                      className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                        paymentMethod === option.value
                          ? "border-primary bg-primary/5"
                          : "border-primary/20 hover:border-primary/40"
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={option.value}
                        checked={paymentMethod === option.value}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="mt-0.5 accent-primary"
                      />
                      <div>
                        <p className="font-semibold text-sm text-text-main">{option.label}</p>
                        <p className="text-xs text-text-muted mt-0.5">{option.description}</p>
                      </div>
                    </label>
                  ))}
                  {!isPhnomPenh && (
                    <p className="text-xs text-text-muted">
                      Cash on Delivery is available only in Phnom Penh.
                    </p>
                  )}
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-100 rounded-lg p-3 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  <p className="text-red-700 font-medium text-sm">{error}</p>
                </div>
              )}
            </div>

            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl border border-primary/15 p-5 md:p-6 sticky top-28">
                <h2 className="text-lg font-semibold text-text-main mb-4 flex items-center gap-2">
                  <Package className="w-5 h-5 text-primary" />
                  Order Summary
                </h2>

                <div className="space-y-3 mb-5 max-h-72 overflow-y-auto pr-1">
                  {validCartItems.map((item) => (
                    <div
                      key={item._id || item.product._id}
                      className="flex items-center gap-3 p-2.5 bg-blue-soft/30 rounded-lg border border-primary/10"
                    >
                      <div className="w-12 h-12 bg-white rounded-md flex items-center justify-center flex-shrink-0 p-1 border border-primary/10">
                        <img
                          src={item.product.image}
                          alt={item.product.title || item.product.name}
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-text-main text-sm truncate">
                          {item.product.title || item.product.name}
                        </p>
                        <span className="text-[11px] text-text-muted">Qty: {item.quantity}</span>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-text-main text-sm">
                          ${(getEffectivePrice(item.product) * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-2.5 mb-6 border-t border-primary/10 pt-4">
                  <div className="flex justify-between text-text-muted text-sm">
                    <span>Subtotal</span>
                    <span className="text-text-main font-semibold">${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-text-muted text-sm">
                    <span>Shipping</span>
                    <span className="text-green-600 font-semibold">
                      {shippingLoading && shippingAddress.city
                        ? "Calculating..."
                        : shippingPrice === 0
                          ? "Free"
                          : `$${shippingPrice.toFixed(2)}`}
                    </span>
                  </div>
                  <div className="flex justify-between text-text-muted text-sm">
                    <span>Tax (8%)</span>
                    <span className="text-text-main font-semibold">${taxPrice.toFixed(2)}</span>
                  </div>

                  <div className="h-px bg-primary/10 my-4"></div>

                  <div className="flex justify-between items-center">
                    <span className="text-text-main font-semibold">Total</span>
                    <span className="text-2xl font-bold text-text-main">${totalPrice.toFixed(2)}</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || validCartItems.length === 0}
                  className="w-full py-3 bg-primary text-text-main font-semibold rounded-lg hover:bg-primary-hover transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  {loading ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      Place Order
                    </>
                  )}
                </button>

                <p className="mt-4 text-xs text-center text-text-muted flex items-center justify-center gap-1.5">
                  <Lock className="w-3 h-3" />
                  Secure Payment
                </p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Checkout;
