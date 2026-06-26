import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import CheckoutSuccess from "../../components/cart/checkout/CheckoutSuccess";
import OrderSummaryPanel from "../../components/cart/checkout/OrderSummaryPanel";
import PaymentMethodSection from "../../components/cart/checkout/PaymentMethodSection";
import ShippingAddressSection from "../../components/cart/checkout/ShippingAddressSection";
import { useAuth } from "../../context/useAuth";
import { useCart } from "../../context/useCart";
import { CheckoutController } from "../../controllers/checkoutController";
import { useLanguage } from "../../context/useLanguage";
import { useDarkMode } from "../../hooks";
import {
  calculateCheckoutTotals,
  getValidCartItems,
  toLocalPhoneDigits,
} from "../../utils/checkout";

const CHECKOUT_LOCATION_STORAGE_KEY = "checkoutDeliveryLocation";

const getSavedCheckoutLocation = () => {
  try {
    const savedLocation = JSON.parse(
      sessionStorage.getItem(CHECKOUT_LOCATION_STORAGE_KEY) || "null"
    );

    if (
      Number.isFinite(savedLocation?.latitude)
      && Number.isFinite(savedLocation?.longitude)
    ) {
      return {
        street: savedLocation.street || "",
        address: savedLocation.address || "",
        city: savedLocation.city || "",
        latitude: savedLocation.latitude,
        longitude: savedLocation.longitude,
      };
    }
  } catch {
    sessionStorage.removeItem(CHECKOUT_LOCATION_STORAGE_KEY);
  }

  return null;
};

const Checkout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { cart, clearCart } = useCart();
  const { user } = useAuth();
  const [isDark] = useDarkMode();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderId, setOrderId] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState(
    location.state?.paymentMethod === "BAKONG_KHQR"
      ? "BAKONG_KHQR"
      : "Cash on Delivery"
  );
  const [showBakongWarning, setShowBakongWarning] = useState(false);
  const checkoutCompletedRef = useRef(false);
  const [shippingAddress, setShippingAddress] = useState(() => ({
    fullName: user?.name || "",
    street: "",
    address: "",
    city: "",
    phone: toLocalPhoneDigits(user?.phone || ""),
    latitude: null,
    longitude: null,
    ...getSavedCheckoutLocation(),
  }));
  const errorRef = useRef(null);

  const validCartItems = useMemo(() => getValidCartItems(cart), [cart]);
  const totals = useMemo(
    () => calculateCheckoutTotals(validCartItems),
    [validCartItems]
  );

  useEffect(() => {
    if (
      validCartItems.length === 0
      && !orderPlaced
      && !checkoutCompletedRef.current
    ) {
      navigate("/customer/cart");
    }
  }, [validCartItems.length, navigate, orderPlaced]);

  useEffect(() => {
    localStorage.removeItem(CHECKOUT_LOCATION_STORAGE_KEY);
  }, []);

  useEffect(() => {
    if (
      !Number.isFinite(shippingAddress.latitude)
      || !Number.isFinite(shippingAddress.longitude)
    ) {
      return;
    }

    sessionStorage.setItem(
      CHECKOUT_LOCATION_STORAGE_KEY,
      JSON.stringify({
        street: shippingAddress.street,
        address: shippingAddress.address,
        city: shippingAddress.city,
        latitude: shippingAddress.latitude,
        longitude: shippingAddress.longitude,
      })
    );
  }, [
    shippingAddress.street,
    shippingAddress.address,
    shippingAddress.city,
    shippingAddress.latitude,
    shippingAddress.longitude,
  ]);

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

  const getCityProvinceFromText = (value = "") => {
    const parts = String(value)
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean)
      .filter((part) => part.toLowerCase() !== "cambodia");

    if (parts.length >= 2) {
      return parts[parts.length - 1];
    }

    return parts[0] || "";
  };

  const getBestLocationText = (location = {}) =>
    [
      location.formattedAddress,
      location.address,
      location.name,
      location.description,
      location.vicinity,
    ]
      .map((value) => String(value || "").trim())
      .find(Boolean) || "";

  const getAddressPart = (components = [], ...types) =>
    components.find((component) =>
      types.some((type) => component.types?.includes(type))
    )?.long_name || "";

  const getLocationDetailsFromGeocodeResult = (result, fallbackLocation) => {
    const components = result?.address_components || [];
    const streetNumber = getAddressPart(components, "street_number");
    const route = getAddressPart(components, "route");
    const neighborhood = getAddressPart(
      components,
      "sublocality_level_1",
      "sublocality",
      "neighborhood"
    );
    const district = getAddressPart(
      components,
      "administrative_area_level_2",
      "administrative_area_level_3"
    );
    const province = getAddressPart(components, "administrative_area_level_1");
    const locality = getAddressPart(components, "locality");
    const formattedAddress = result?.formatted_address || "";
    const addressLine = [streetNumber, route].filter(Boolean).join(" ");
    const address = addressLine || neighborhood || district || formattedAddress;
    const city = [locality || district, province]
      .filter(Boolean)
      .filter((value, index, values) => values.indexOf(value) === index)
      .join(" / ");

    return {
      lat: result?.geometry?.location?.lat?.() ?? fallbackLocation.lat,
      lng: result?.geometry?.location?.lng?.() ?? fallbackLocation.lng,
      street: addressLine,
      address,
      city: city || province || locality || district || getCityProvinceFromText(formattedAddress),
      formattedAddress,
    };
  };

  const reverseGeocodeCheckoutLocation = (location) =>
    new Promise((resolve) => {
      if (!window.google?.maps?.Geocoder) {
        resolve(null);
        return;
      }

      try {
        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode(
          { location: { lat: location.lat, lng: location.lng } },
          (results, status) => {
            if (status === "OK" && results?.[0]) {
              resolve({
                ...getLocationDetailsFromGeocodeResult(results[0], location),
                lat: location.lat,
                lng: location.lng,
              });
              return;
            }
            resolve(null);
          }
        );
      } catch {
        resolve(null);
      }
    });

  const applySelectedLocation = (location) => {
    const readableAddress = getBestLocationText(location);
    const cityProvince =
      location.city ||
      location.province ||
      location.district ||
      getCityProvinceFromText(readableAddress);

    setShippingAddress((currentAddress) => ({
      ...currentAddress,
      latitude: location.lat,
      longitude: location.lng,
      street: location.street || currentAddress.street,
      address: readableAddress || currentAddress.address,
      city:
        cityProvince ||
        (readableAddress ? getCityProvinceFromText(readableAddress) : "") ||
        currentAddress.city,
    }));
    setError("");
  };

  const handleLocationSelect = async (location) => {
    if (!location?.lat || !location?.lng) {
      return;
    }

    applySelectedLocation(location);

    if (location.address && location.city) {
      return;
    }

    const resolvedLocation = await reverseGeocodeCheckoutLocation(location);
    if (resolvedLocation) {
      applySelectedLocation({
        ...resolvedLocation,
        address:
          resolvedLocation.address ||
          resolvedLocation.formattedAddress ||
          location.address,
        city:
          resolvedLocation.city ||
          location.city ||
          getCityProvinceFromText(resolvedLocation.formattedAddress),
      });
    }
  };

  const placeOrder = async () => {
    setLoading(true);
    setError("");

    const result = await CheckoutController.placeOrder({
      cartItems: validCartItems,
      shippingAddress,
      paymentMethod,
      totals,
      t,
    });

    if (!result.success) {
      setError(result.error);
      setLoading(false);
      scrollToError();
      return;
    }

    const nextOrderId = result.data._id;
    checkoutCompletedRef.current = true;
    localStorage.removeItem(CHECKOUT_LOCATION_STORAGE_KEY);
    sessionStorage.removeItem(CHECKOUT_LOCATION_STORAGE_KEY);
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

    if (paymentMethod !== "BAKONG_KHQR") {
      clearCart().catch((clearCartError) => {
        console.error("Cart clear failed after order:", clearCartError);
      });
    }
    setLoading(false);
  };

  const handlePlaceOrder = (event) => {
    event.preventDefault();

    if (paymentMethod === "BAKONG_KHQR") {
      setShowBakongWarning(true);
      return;
    }

    placeOrder();
  };

  const confirmBakongPayment = () => {
    setShowBakongWarning(false);
    placeOrder();
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
    <div className={`min-h-screen pt-24 sm:pt-28 lg:pt-32 pb-16 lg:pb-0 font-sans transition-colors duration-300 ${isDark ? "bg-slate-950" : "bg-bg-base"}`}>
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6">
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
                error={error}
                errorRef={errorRef}
              />

              <PaymentMethodSection
                isDark={isDark}
                paymentMethod={paymentMethod}
                onPaymentMethodChange={setPaymentMethod}
                showBakongWarning={showBakongWarning}
                onCloseBakongWarning={() => setShowBakongWarning(false)}
                onConfirmBakongPayment={confirmBakongPayment}
              />
            </div>

            <OrderSummaryPanel
              isDark={isDark}
              cartItems={validCartItems}
              totals={totals}
              loading={loading}
              paymentMethod={paymentMethod}
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
