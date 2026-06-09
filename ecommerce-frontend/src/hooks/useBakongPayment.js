import { useCallback, useEffect, useState } from "react";
import { PaymentController } from "../controllers/paymentController";
import { useCart } from "../context/useCart";

export const useBakongPayment = (orderId, navigate) => {
  const { refreshCart } = useCart();
  const [order, setOrder] = useState(null);
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState("pending");
  const [selectedCurrency, setSelectedCurrency] = useState("USD");

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

      setOrder(result.data.order);
      setPayment(result.data.payment);
      setSelectedCurrency(result.data.payment.currency || currency);
      setLoading(false);
      setRefreshing(false);
    },
    [orderId]
  );

  useEffect(() => {
    fetchOrderAndGenerateQR();
  }, [fetchOrderAndGenerateQR]);

  useEffect(() => {
    if (!payment?._id || paymentStatus !== "pending") {
      return undefined;
    }

    const interval = window.setInterval(async () => {
      const result = await PaymentController.refreshStatus(payment._id);

      if (!result.success) {
        return;
      }

      const nextPayment = result.data;
      const nextStatus = PaymentController.deriveStatus(nextPayment);

      setPayment(nextPayment);
      setPaymentStatus(nextStatus);

      if (nextStatus === "completed") {
        window.setTimeout(() => navigate(`/customer/orders/${orderId}`), 3000);
      }
    }, 5000);

    return () => window.clearInterval(interval);
  }, [payment?._id, paymentStatus, orderId, navigate]);

  useEffect(() => {
    if (!payment?.khqrData?.expiresAt) {
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
  }, [payment?.khqrData?.expiresAt]);

  const handleCancel = async () => {
    setCancelling(true);

    if (payment?._id && paymentStatus === "pending") {
      const result = await PaymentController.cancel(payment._id);

      if (!result.success) {
        setError(result.error);
        setCancelling(false);
        return;
      }
    }

    await refreshCart();
    navigate("/customer/checkout", { replace: true });
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
