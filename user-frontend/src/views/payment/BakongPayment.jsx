import { useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useBakongPayment } from "../../hooks/useBakongPayment";
import { useLanguage } from "../../context/useLanguage";
import { useDarkMode } from "../../hooks";
import { useToast } from "../../context/useToast";

const KHQR_EXPIRY_SECONDS = 5 * 60;

// ─── Icons ───────────────────────────────────────────────────────────────────
const CheckCircleIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);
const XCircleIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
    <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
  </svg>
);
const ClockIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
  </svg>
);
const RefreshIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
  </svg>
);
const ArrowLeftIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
  </svg>
);
const ShieldIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);
const PhoneIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
    <rect x="5" y="2" width="14" height="20" rx="2" />
    <line x1="12" y1="18" x2="12.01" y2="18" />
  </svg>
);
const DownloadIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
    <path d="M12 3v12" />
    <path d="m7 10 5 5 5-5" />
    <path d="M5 21h14" />
  </svg>
);

export default function BakongPayment() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [isDark] = useDarkMode();
  const { success, error: toastError } = useToast();
  const successAlertShownRef = useRef(false);
  const {
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
  } = useBakongPayment(orderId, navigate);

  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("bakong-payment-screen-mode", {
        detail: { standalone: true },
      })
    );

    return () => {
      window.dispatchEvent(
        new CustomEvent("bakong-payment-screen-mode", {
          detail: { standalone: false },
        })
      );
    };
  }, []);

  useEffect(() => {
    if (
      paymentStatus !== "completed"
      || successAlertShownRef.current
    ) {
      return;
    }

    successAlertShownRef.current = true;
    success(
      t("bakongPayment.paymentSuccessful"),
      t("bakongPayment.paymentConfirmed")
    );
  }, [paymentStatus, success, t]);

  // ── Time colour helper ────────────────────────────────────────────────────
  const getTimerColour = () => {
    if (!timeLeft) return "var(--color-primary)";
    const [m] = timeLeft.split(":").map(Number);
    if (m < 2) return "#ef4444";
    if (m < 4) return "#f59e0b";
    return "var(--color-primary)";
  };

  const handleSaveQr = async () => {
    if (!payment?.khqrData?.qrCode) {
      return;
    }

    const fileName = `cherish-khqr-${orderId.slice(-8).toUpperCase()}.png`;

    try {
      const response = await fetch(payment.khqrData.qrCode);
      const qrBlob = await response.blob();
      const qrUrl = URL.createObjectURL(qrBlob);
      const qrImage = new Image();

      await new Promise((resolve, reject) => {
        qrImage.onload = resolve;
        qrImage.onerror = reject;
        qrImage.src = qrUrl;
      });

      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      const width = 900;
      const height = 1200;
      const radius = 70;
      const headerHeight = 220;

      canvas.width = width;
      canvas.height = height;

      context.save();
      context.beginPath();
      context.roundRect(4, 4, width - 8, height - 8, radius);
      context.clip();
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, width, height);

      context.fillStyle = "#e9232e";
      context.fillRect(0, 0, width, headerHeight);

      context.fillStyle = "#ffffff";
      context.font = "900 96px Lato, Arial, sans-serif";
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillText("KHQR", width / 2, headerHeight / 2 + 5);

      context.fillStyle = "#171717";
      context.font = "900 52px Lato, Arial, sans-serif";
      context.fillText(
        String(payment.khqrData.merchantName || "CHERISH BABY STORE").toUpperCase(),
        width / 2,
        325,
        width - 100
      );

      context.imageSmoothingEnabled = false;
      context.drawImage(qrImage, 130, 420, 640, 640);

      context.restore();
      context.beginPath();
      context.roundRect(4, 4, width - 8, height - 8, radius);
      context.strokeStyle = "#d2d2d2";
      context.lineWidth = 8;
      context.stroke();

      URL.revokeObjectURL(qrUrl);

      const blob = await new Promise((resolve, reject) => {
        canvas.toBlob(
          (generatedBlob) =>
            generatedBlob ? resolve(generatedBlob) : reject(new Error("QR export failed")),
          "image/png"
        );
      });
      const file = new File([blob], fileName, { type: "image/png" });
      const isMobileDevice =
        navigator.maxTouchPoints > 0 &&
        window.matchMedia("(pointer: coarse)").matches;

      if (
        isMobileDevice
        &&
        navigator.share
        && navigator.canShare?.({ files: [file] })
      ) {
        await navigator.share({
          files: [file],
          title: t("bakongPayment.shareQrTitle"),
          text: t("bakongPayment.shareQrText"),
        });
        return;
      }

      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(downloadUrl);
      success(
        t("bakongPayment.qrSavedTitle"),
        t("bakongPayment.qrSavedMessage")
      );
    } catch (saveError) {
      if (saveError?.name === "AbortError") {
        return;
      }

      toastError(
        t("bakongPayment.qrSaveFailedTitle"),
        t("bakongPayment.qrSaveFailedMessage")
      );
    }
  };

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="h-[100dvh] overflow-hidden bg-bg-base flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
            <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          </div>
          <p className="text-text-muted font-semibold">{t("bakongPayment.generatingSecureQr")}</p>
        </div>
      </div>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="h-[100dvh] overflow-hidden bg-bg-base flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-xl p-10 text-center animate-scale-in border border-stone-100">
          <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-5 text-red-500">
            <XCircleIcon />
          </div>
          <h2 className="text-2xl font-bold text-text-main mb-2">{t("bakongPayment.paymentError")}</h2>
          <p className="text-text-muted mb-8 text-sm leading-relaxed">{error}</p>
          <div className="flex gap-3">
            <button
              onClick={() => fetchOrderAndGenerateQR(false, selectedCurrency)}
              className="flex-1 py-3.5 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary-dark transition-all shadow-lg shadow-primary/20 active:scale-95"
            >
              {t("bakongPayment.tryAgain")}
            </button>
            <button
              onClick={() => navigate(`/customer/orders/${orderId}`)}
              className="flex-1 py-3.5 bg-stone-100 text-text-muted rounded-xl font-bold text-sm hover:bg-stone-200 transition-all active:scale-95"
            >
              {t("bakongPayment.backToOrder")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Payment Completed ─────────────────────────────────────────────────────
  if (paymentStatus === "completed") {
    return (
      <div className="h-[100dvh] overflow-hidden bg-bg-base flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-xl p-10 text-center animate-scale-in border border-stone-100">
          <div className="relative w-24 h-24 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full bg-green-100 animate-ping opacity-60" style={{ animationDuration: "1.5s" }} />
            <div className="relative w-24 h-24 bg-green-50 rounded-full border-2 border-green-200 flex items-center justify-center text-green-500 p-5">
              <CheckCircleIcon />
            </div>
          </div>
          <h2 className="text-3xl font-black text-text-main mb-2 tracking-tight">{t("bakongPayment.paymentSuccessful")}</h2>
          <p className="text-text-muted text-sm mb-6">{t("bakongPayment.paymentConfirmed")}</p>
          <div className="bg-green-50 border border-green-100 rounded-2xl px-6 py-4 inline-flex items-center gap-2 text-green-700 text-sm font-semibold">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            {t("bakongPayment.redirecting")}
          </div>
        </div>
      </div>
    );
  }

  // ── Payment Failed ────────────────────────────────────────────────────────
  if (paymentStatus === "failed") {
    return (
      <div className="h-[100dvh] overflow-hidden bg-bg-base flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-xl p-10 text-center animate-scale-in border border-stone-100">
          <div className="w-20 h-20 bg-red-50 rounded-full border-2 border-red-100 flex items-center justify-center text-red-500 mx-auto mb-6 p-5">
            <XCircleIcon />
          </div>
          <h2 className="text-2xl font-bold text-text-main mb-2">{t("bakongPayment.paymentFailed")}</h2>
          <p className="text-text-muted text-sm mb-8">{t("bakongPayment.paymentFailedMessage")}</p>
          <div className="flex gap-3">
            <button
              onClick={() => fetchOrderAndGenerateQR(true, selectedCurrency)}
              className="flex-1 py-3.5 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary-dark transition-all shadow-lg shadow-primary/20 active:scale-95"
            >
              {t("bakongPayment.tryAgain")}
            </button>
            <button
              onClick={() => navigate(`/customer/orders/${orderId}`)}
              className="flex-1 py-3.5 bg-stone-100 text-text-muted rounded-xl font-bold text-sm hover:bg-stone-200 transition-all active:scale-95"
            >
              {t("bakongPayment.backToOrder")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── QR Expired ─────────────────────────────────────────────────────────────
  if (paymentStatus === "expired") {
    return (
      <div className="h-[100dvh] overflow-hidden bg-bg-base flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-xl p-10 text-center animate-scale-in border border-stone-100">
          <div className="w-20 h-20 bg-amber-50 rounded-full border-2 border-amber-100 flex items-center justify-center text-amber-500 mx-auto mb-6 p-5">
            <ClockIcon />
          </div>
          <h2 className="text-2xl font-bold text-text-main mb-2">{t("bakongPayment.qrExpired")}</h2>
          <p className="text-text-muted text-sm mb-8">{t("bakongPayment.qrExpiredMessage")}</p>
          <div className="flex gap-3">
            <button
              onClick={() => fetchOrderAndGenerateQR(true, selectedCurrency)}
              disabled={refreshing}
              className="flex-1 py-3.5 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary-dark transition-all shadow-lg shadow-primary/20 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {refreshing ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />{t("bakongPayment.generating")}</>
              ) : (
                <><RefreshIcon />{t("bakongPayment.newQrCode")}</>
              )}
            </button>
            <button
              onClick={handleCancel}
              disabled={cancelling}
              className="flex-1 py-3.5 bg-stone-100 text-text-muted rounded-xl font-bold text-sm hover:bg-stone-200 transition-all active:scale-95"
            >
              {t("bakongPayment.backToCheckout")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Main Payment Page ─────────────────────────────────────────────────────
  const exchangeRate = 4100;
  const amountUSD = order ? Number(order.totalPrice).toFixed(2) : "—";
  const amountKHR = order ? Math.round(order.totalPrice * exchangeRate).toLocaleString() : "—";
  const primaryAmount =
    payment?.currency === "KHR"
      ? `៛${Number(payment.amount).toLocaleString()}`
      : `$${Number(payment?.amount || 0).toFixed(2)}`;
  const convertedAmount =
    payment?.currency === "KHR"
      ? `≈ $${amountUSD} USD`
      : `≈ ៛${amountKHR} KHR`;

  const timerProgress = (() => {
    if (!timeLeft || timeLeft === "00:00") return 0;
    const [minutes, seconds] = timeLeft.split(":").map(Number);
    return Math.max(
      0,
      Math.min(100, ((minutes * 60 + seconds) / KHQR_EXPIRY_SECONDS) * 100)
    );
  })();
  const pageSurface = isDark ? "bg-[#070b09]" : "bg-[#f7f3ee]";
  const cardSurface = isDark
    ? "border-[#26352d] bg-[#111713] shadow-[0_28px_90px_-32px_rgba(0,0,0,0.9)]"
    : "border-stone-200 bg-white shadow-[0_24px_80px_-32px_rgba(45,49,46,0.3)]";
  const headerBorder = isDark ? "border-[#26352d]" : "border-stone-100";
  const primaryText = isDark ? "text-[#f5f8f5]" : "text-[#2d312e]";
  const secondaryText = isDark ? "text-[#aab7ae]" : "text-[#727871]";
  const qrPanelSurface = isDark
    ? "border-[#26352d] bg-[#0c120e]"
    : "border-stone-100 bg-stone-50/70";
  const contentBorder = isDark ? "border-[#2b3931]" : "border-stone-100";

  return (
    <div className={`h-[100dvh] overflow-hidden p-3 font-sans sm:p-5 lg:p-7 ${pageSurface}`}>
      <main className={`mx-auto flex h-full w-full max-w-6xl flex-col overflow-hidden rounded-[1.75rem] border sm:rounded-[2rem] ${cardSurface}`}>
        <header className={`grid min-h-[4.75rem] shrink-0 grid-cols-[2.5rem_minmax(0,1fr)_auto] items-center gap-2 border-b px-3 py-2 sm:min-h-0 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:px-6 sm:py-3 lg:px-8 ${headerBorder}`}>
          <button
            type="button"
            onClick={handleCancel}
            disabled={cancelling}
            className={`inline-flex h-10 min-w-10 items-center justify-center gap-2 rounded-xl px-2 text-sm font-bold transition-colors disabled:opacity-50 sm:min-w-0 sm:justify-start sm:px-3 ${
              isDark
                ? "text-[#aab7ae] hover:bg-[#1c2721] hover:text-white"
                : "text-[#727871] hover:bg-stone-100 hover:text-[#2d312e]"
            }`}
          >
            <ArrowLeftIcon />
            <span className="hidden sm:inline">{t("bakongPayment.back")}</span>
          </button>

          <div className="min-w-0 px-1 text-center">
            <p className="truncate text-[9px] font-black uppercase tracking-[0.12em] text-[#e1232e] sm:text-xs sm:tracking-[0.22em]">
              Bakong KHQR
            </p>
            <h1 className={`truncate text-base font-black leading-tight sm:text-xl ${primaryText}`}>
              {t("bakongPayment.scanToPay")}
            </h1>
          </div>

          <div className={`flex h-10 max-w-[7.5rem] items-center gap-1.5 rounded-xl border px-2 text-[10px] font-bold sm:max-w-none sm:gap-2 sm:px-3 sm:text-xs ${
            isDark
              ? "border-emerald-400/20 bg-[#10241a] text-[#6ee7a0]"
              : "border-green-100 bg-green-50 text-green-700"
          }`}>
            <span className="h-2 w-2 animate-pulse rounded-full bg-[#38d477]" />
            <span className="hidden max-w-[10rem] truncate sm:inline">{t("bakongPayment.waitingForPayment")}</span>
            <span className="sm:hidden">{t("bakongPayment.live")}</span>
          </div>
        </header>

        {payment && (
          <div className="grid min-h-0 flex-1 grid-rows-[minmax(0,1.12fr)_minmax(0,0.88fr)] md:grid-cols-[minmax(0,1.05fr)_minmax(20rem,0.95fr)] md:grid-rows-1">
            <section className={`flex min-h-0 items-start justify-center overflow-hidden border-b px-3 pb-5 pt-3 md:items-center md:border-b-0 md:border-r md:p-6 lg:p-8 ${qrPanelSurface}`}>
              <div className="flex h-full max-h-[34rem] w-full max-w-md flex-col items-center justify-start pt-1 md:justify-center md:pt-0">
                <div className="mb-2 flex w-full max-w-[19rem] items-center justify-between sm:mb-3">
                  <span className={`text-[10px] font-bold uppercase tracking-widest sm:text-xs ${secondaryText}`}>
                    {t("bakongPayment.expiresIn")}
                  </span>
                  <span
                    className="text-lg font-black tabular-nums sm:text-2xl"
                    style={{ color: getTimerColour() }}
                  >
                    {timeLeft ?? "—"}
                  </span>
                </div>

                <div className={`mb-3 h-1.5 w-full max-w-[19rem] overflow-hidden rounded-full ${
                  isDark ? "bg-[#2a352e]" : "bg-stone-200"
                }`}>
                  <div
                    className="h-full rounded-full transition-all duration-1000"
                    style={{
                      width: `${timerProgress}%`,
                      background:
                        timerProgress < 40
                          ? "#ef4444"
                          : timerProgress < 80
                            ? "#f59e0b"
                            : "#7A967E",
                    }}
                  />
                </div>

                <div
                  className="shrink-0 overflow-hidden rounded-2xl border border-[#d8d8d8] shadow-[0_18px_45px_-18px_rgba(0,0,0,0.55)]"
                  style={{
                    width: "min(18rem, calc(100vw - 4rem), calc(36dvh - 4.5rem))",
                    minWidth: "9.5rem",
                    backgroundColor: "#ffffff",
                  }}
                >
                  <div className="flex items-center justify-center bg-[#e1232e] py-2 text-white sm:py-2.5">
                    <span className="text-xl font-black tracking-tight sm:text-2xl">KHQR</span>
                  </div>
                  <div className="p-2.5 sm:p-3" style={{ backgroundColor: "#ffffff" }}>
                    <p
                      className="mb-1 truncate text-center text-xs font-black uppercase sm:text-sm"
                      style={{ color: "#171717" }}
                    >
                      {payment.khqrData.merchantName}
                    </p>
                    <div
                      className="mx-auto aspect-square w-full p-3 sm:p-3.5"
                      style={{ backgroundColor: "#ffffff" }}
                    >
                      <img
                        src={payment.khqrData.qrCode}
                        alt={t("bakongPayment.qrAlt")}
                        className="block h-full w-full object-contain"
                        style={{ backgroundColor: "#ffffff" }}
                      />
                    </div>
                  </div>
                </div>

                <p className={`mt-2 pb-1 text-center text-[10px] font-semibold sm:mt-3 sm:text-xs ${secondaryText}`}>
                  {t("bakongPayment.scanInstruction")}
                </p>
              </div>
            </section>

            <section className={`flex min-h-0 flex-col justify-start overflow-y-auto p-4 sm:p-5 md:p-6 lg:p-8 ${
              isDark ? "bg-[#151c17]" : "bg-white"
            }`}>
              <div className="min-h-0">
                <div className={`flex items-end justify-between gap-3 border-b pb-3 sm:pb-4 ${contentBorder}`}>
                  <div>
                    <p className={`text-[10px] font-bold uppercase tracking-widest sm:text-xs ${secondaryText}`}>
                      {t("bakongPayment.amountDue")}
                    </p>
                    <p className="text-3xl font-black tracking-tight text-primary sm:text-4xl lg:text-5xl">
                      {primaryAmount}
                    </p>
                  </div>
                  <p className={`pb-1 text-right text-[10px] font-semibold sm:text-xs ${secondaryText}`}>
                    {convertedAmount}
                  </p>
                </div>

                <div className="py-3 sm:py-4">
                  <p className={`mb-2 text-[10px] font-bold uppercase tracking-widest sm:text-xs ${secondaryText}`}>
                    {t("bakongPayment.currency")}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: "USD", label: t("bakongPayment.usd"), symbol: "$" },
                      { value: "KHR", label: t("bakongPayment.khr"), symbol: "៛" },
                    ].map((currency) => (
                      <button
                        key={currency.value}
                        type="button"
                        onClick={() => handleCurrencyChange(currency.value)}
                        disabled={refreshing || cancelling}
                        className={`flex min-h-11 items-center gap-2 rounded-xl border px-3 text-left transition-all disabled:opacity-60 sm:min-h-12 sm:px-4 ${
                          selectedCurrency === currency.value
                            ? isDark
                              ? "border-[#42d77d] bg-[#123322] text-[#69e89a] shadow-[inset_0_0_0_1px_rgba(66,215,125,0.12)]"
                              : "border-primary bg-primary/10 text-primary"
                            : isDark
                              ? "border-[#334139] bg-[#202923] text-[#aab7ae] hover:border-[#52675b]"
                              : "border-stone-200 bg-stone-50 text-text-muted hover:border-primary/40"
                        }`}
                      >
                        <span className="text-lg font-black">{currency.symbol}</span>
                        <span className="text-xs font-bold sm:text-sm">{currency.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className={`hidden space-y-2 border-t pt-4 min-[700px]:block md:block ${contentBorder}`}>
                  {[
                    [t("bakongPayment.merchant"), payment.khqrData.merchantName],
                    [t("bakongPayment.order"), `#${orderId.slice(-8).toUpperCase()}`],
                    [t("bakongPayment.status"), t("bakongPayment.checkingAutomatically")],
                  ].map(([label, value]) => (
                    <div key={label} className="flex items-center justify-between gap-4 text-xs">
                      <span className={`font-bold uppercase tracking-wide ${secondaryText}`}>{label}</span>
                      <span className={`max-w-[65%] truncate text-right font-bold ${primaryText}`}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="shrink-0 pt-3 sm:pt-4 md:mt-auto">
                {payment.khqrData.deepLink && (
                  <a
                    href={payment.khqrData.deepLink}
                    className={`mb-2 flex min-h-11 items-center justify-center gap-2 rounded-xl border px-3 text-xs font-bold transition-colors sm:min-h-12 sm:text-sm md:hidden ${
                      isDark
                        ? "border-blue-400/30 bg-blue-500/15 text-blue-200 hover:bg-blue-500/25"
                        : "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
                    }`}
                  >
                    <PhoneIcon />
                    {t("bakongPayment.payWithBankingApp")}
                  </a>
                )}

                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  <button
                    type="button"
                    onClick={handleSaveQr}
                    className={`flex min-h-11 items-center justify-center gap-2 rounded-xl border px-3 text-xs font-bold transition-colors active:scale-[0.99] sm:min-h-12 sm:text-sm ${
                      isDark
                        ? "border-emerald-400/30 bg-emerald-500/15 text-emerald-200 hover:bg-emerald-500/25"
                        : "border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                    }`}
                  >
                    <DownloadIcon />
                    {t("bakongPayment.saveQr")}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancel}
                    disabled={cancelling}
                    className={`group flex min-h-11 items-center justify-center rounded-xl border px-3 text-xs font-bold shadow-sm transition-all duration-200 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-red-400/40 active:translate-y-0 active:scale-[0.99] disabled:pointer-events-none disabled:opacity-60 sm:min-h-12 sm:text-sm ${
                      isDark
                        ? "border-[#733d32] bg-[#3a211d] text-[#ffb5a5] hover:border-[#a64a3d] hover:bg-[#582b25] hover:text-[#ffd3ca] hover:shadow-[0_16px_34px_-18px_rgba(255,91,73,0.75)]"
                        : "border-red-100 bg-red-50 text-red-600 hover:border-red-200 hover:bg-red-600 hover:text-white hover:shadow-[0_16px_34px_-18px_rgba(220,38,38,0.85)]"
                    }`}
                  >
                    <span className="transition-transform duration-200 group-hover:scale-[1.02]">
                      {cancelling ? t("bakongPayment.cancelling") : t("bakongPayment.cancelPayment")}
                    </span>
                  </button>
                </div>

                <p className={`mt-3 flex items-center justify-center gap-1.5 text-[9px] font-semibold sm:text-[10px] [@media(max-height:700px)]:hidden ${secondaryText}`}>
                  <ShieldIcon />
                  {t("bakongPayment.securityNote")}
                </p>
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
