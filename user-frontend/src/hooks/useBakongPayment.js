import { useCallback, useEffect, useRef, useState } from "react";
import { PaymentController } from "../controllers/paymentController";
import { useCart } from "../context/useCart";

export const useBakongPayment = (orderId, navigate) => {
  const { clearCart, refreshCart } = useCart();
  const clearCartRef = useRef(clearCart);
  const [order, setOrder] = useState(null);
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState("pending");
  const [selectedCurrency, setSelectedCurrency] = useState("USD");

  useEffect(() => {
    clearCartRef.current = clearCart;
  }, [clearCart]);

  const fetchOrderAndGenerateQR = useCallback(
    async (isRefresh = false, currency = "USD") => {
      isRefresh ? setRefreshing(true) : setLoading(true);
      setError(null);
      setPaymentStatus("pending");

      const result = await PaymentController.prepareBakongPayment(orderId, currency);

      if (!result.success) {
        setError(result.error);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const nextPayment = result.data.payment;

      setOrder(result.data.order);
      setPayment(nextPayment);
      setPaymentStatus(PaymentController.deriveStatus(nextPayment));
      setSelectedCurrency(nextPayment.currency || currency);
      setLoading(false);
      setRefreshing(false);
    },
    [orderId]
  );

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      fetchOrderAndGenerateQR();
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [fetchOrderAndGenerateQR]);

  useEffect(() => {
    if (
      !payment?._id
      || !["pending", "expired"].includes(paymentStatus)
    ) {
      return undefined;
    }

    const interval = window.setInterval(async () => {
      const result = await PaymentController.refreshStatus(payment._id);

      if (!result.success) {
        return;
      }

      const nextPayment = result.data;
      const nextStatus = PaymentController.deriveStatus(nextPayment);
      const qrHasExpired =
        nextStatus === "pending"
        && nextPayment?.khqrData?.expiresAt
        && new Date(nextPayment.khqrData.expiresAt).getTime() <= Date.now();

      setPayment(nextPayment);
      setPaymentStatus(qrHasExpired ? "expired" : nextStatus);

    }, 5000);

    return () => window.clearInterval(interval);
  }, [payment?._id, paymentStatus]);

  useEffect(() => {
    if (paymentStatus !== "completed") {
      return undefined;
    }

    // Cart cleanup must never block the customer from reaching the success
    // page. Keeping the timer inside this effect also makes it safe when React
    // replays effects in development Strict Mode.
    clearCartRef.current().catch((clearCartError) => {
      console.error("Cart clear failed after Bakong payment:", clearCartError);
    });

    const redirectTimer = window.setTimeout(() => {
      localStorage.setItem("latestOrderId", orderId);
      navigate("/customer/cart/success", {
        replace: true,
        state: { orderId, paymentMethod: "BAKONG_KHQR" },
      });
    }, 3000);

    return () => window.clearTimeout(redirectTimer);
  }, [navigate, orderId, paymentStatus]);

  useEffect(() => {
    if (
      paymentStatus !== "pending"
      || !payment?.khqrData?.expiresAt
    ) {
      return undefined;
    }

    const interval = window.setInterval(() => {
      const nextTimeLeft = PaymentController.getCountdown(
        payment.khqrData.expiresAt
      );

      setTimeLeft(nextTimeLeft);
      if (nextTimeLeft === "00:00") {
        setPaymentStatus("expired");
      }
    }, 1000);

    return () => window.clearInterval(interval);
  }, [payment?.khqrData?.expiresAt, paymentStatus]);

  const handleCancel = async () => {
    setCancelling(true);

    if (
      payment?._id
      && (paymentStatus === "pending" || paymentStatus === "expired")
    ) {
      const result = await PaymentController.cancel(payment._id);

      if (!result.success) {
        setError(result.error);
        setCancelling(false);
        return;
      }
    }

    await refreshCart();
    navigate("/customer/checkout", {
      replace: true,
      state: { paymentMethod: "BAKONG_KHQR" },
    });
  };

  const handleCurrencyChange = async (currency) => {
    if (currency === selectedCurrency || refreshing) {
      return;
    }

    setSelectedCurrency(currency);
    await fetchOrderAndGenerateQR(true, currency);
  };

  return {
    order,
    payment,
    loading,
    refreshing,
    cancelling,
    error,
    timeLeft,
    paymentStatus,
    selectedCurrency,
    fetchOrderAndGenerateQR,
    handleCurrencyChange,
    handleCancel,
  };
};
