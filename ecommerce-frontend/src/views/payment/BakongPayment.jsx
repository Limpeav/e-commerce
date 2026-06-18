import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useBakongPayment } from "../../hooks/useBakongPayment";

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
const PhoneIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <rect x="5" y="2" width="14" height="20" rx="2" ry="2" /><line x1="12" y1="18" x2="12.01" y2="18" />
  </svg>
);
const ScanIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <polyline points="4 7 4 4 7 4" /><polyline points="17 4 20 4 20 7" /><polyline points="20 17 20 20 17 20" /><polyline points="7 20 4 20 4 17" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" />
  </svg>
);
const ShieldIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

// ─── Step indicator ───────────────────────────────────────────────────────────
const Step = ({ num, label, active, done }) => (
  <div className="flex flex-col items-center gap-1.5">
    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all
      ${done ? "bg-primary text-white" : active ? "bg-primary/10 border-2 border-primary text-primary" : "bg-stone-100 text-stone-400"}`}>
      {done ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="w-4 h-4"><polyline points="20 6 9 17 4 12" /></svg> : num}
    </div>
    <span className={`text-[10px] font-bold uppercase tracking-wider ${active || done ? "text-primary" : "text-stone-400"}`}>{label}</span>
  </div>
);
const StepConnector = ({ done }) => (
  <div className={`h-0.5 flex-1 rounded-full transition-all ${done ? "bg-primary" : "bg-stone-200"}`} />
);

// ─── Pulse ring ───────────────────────────────────────────────────────────────
const PulseRing = () => (
  <div className="absolute inset-0 pointer-events-none">
    <span className="absolute inset-0 rounded-2xl animate-ping bg-primary/10" style={{ animationDuration: "2s" }} />
  </div>
);

export default function BakongPayment() {
  const { orderId } = useParams();
  const navigate = useNavigate();
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
        detail: { standalone: paymentStatus === "completed" },
      })
    );

    return () => {
      window.dispatchEvent(
        new CustomEvent("bakong-payment-screen-mode", {
          detail: { standalone: false },
        })
      );
    };
  }, [paymentStatus]);

  // ── Time colour helper ────────────────────────────────────────────────────
  const getTimerColour = () => {
    if (!timeLeft) return "text-primary";
    const [m] = timeLeft.split(":").map(Number);
    if (m < 2) return "text-red-500";
    if (m < 4) return "text-amber-500";
    return "text-primary";
  };

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
            <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          </div>
          <p className="text-text-muted font-semibold">Generating your secure QR code…</p>
        </div>
      </div>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-xl p-10 text-center animate-scale-in border border-stone-100">
          <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-5 text-red-500">
            <XCircleIcon />
          </div>
          <h2 className="text-2xl font-bold text-text-main mb-2">Payment Error</h2>
          <p className="text-text-muted mb-8 text-sm leading-relaxed">{error}</p>
          <div className="flex gap-3">
            <button
              onClick={() => fetchOrderAndGenerateQR(false, selectedCurrency)}
              className="flex-1 py-3.5 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary-dark transition-all shadow-lg shadow-primary/20 active:scale-95"
            >
              Try Again
            </button>
            <button
              onClick={() => navigate(`/customer/orders/${orderId}`)}
              className="flex-1 py-3.5 bg-stone-100 text-text-muted rounded-xl font-bold text-sm hover:bg-stone-200 transition-all active:scale-95"
            >
              Back to Order
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Payment Completed ─────────────────────────────────────────────────────
  if (paymentStatus === "completed") {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-xl p-10 text-center animate-scale-in border border-stone-100">
          <div className="relative w-24 h-24 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full bg-green-100 animate-ping opacity-60" style={{ animationDuration: "1.5s" }} />
            <div className="relative w-24 h-24 bg-green-50 rounded-full border-2 border-green-200 flex items-center justify-center text-green-500 p-5">
              <CheckCircleIcon />
            </div>
          </div>
          <h2 className="text-3xl font-black text-text-main mb-2 tracking-tight">Payment Successful!</h2>
          <p className="text-text-muted text-sm mb-6">Your payment has been confirmed. Redirecting to your order…</p>
          <div className="bg-green-50 border border-green-100 rounded-2xl px-6 py-4 inline-flex items-center gap-2 text-green-700 text-sm font-semibold">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Redirecting in a few seconds
          </div>
        </div>
      </div>
    );
  }

  // ── Payment Failed ────────────────────────────────────────────────────────
  if (paymentStatus === "failed") {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-xl p-10 text-center animate-scale-in border border-stone-100">
          <div className="w-20 h-20 bg-red-50 rounded-full border-2 border-red-100 flex items-center justify-center text-red-500 mx-auto mb-6 p-5">
            <XCircleIcon />
          </div>
          <h2 className="text-2xl font-bold text-text-main mb-2">Payment Failed</h2>
          <p className="text-text-muted text-sm mb-8">Something went wrong. Please try again or choose a different payment method.</p>
          <div className="flex gap-3">
            <button
              onClick={() => fetchOrderAndGenerateQR(true, selectedCurrency)}
              className="flex-1 py-3.5 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary-dark transition-all shadow-lg shadow-primary/20 active:scale-95"
            >
              Try Again
            </button>
            <button
              onClick={() => navigate(`/customer/orders/${orderId}`)}
              className="flex-1 py-3.5 bg-stone-100 text-text-muted rounded-xl font-bold text-sm hover:bg-stone-200 transition-all active:scale-95"
            >
              Back to Order
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── QR Expired ─────────────────────────────────────────────────────────────
  if (paymentStatus === "expired") {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-xl p-10 text-center animate-scale-in border border-stone-100">
          <div className="w-20 h-20 bg-amber-50 rounded-full border-2 border-amber-100 flex items-center justify-center text-amber-500 mx-auto mb-6 p-5">
            <ClockIcon />
          </div>
          <h2 className="text-2xl font-bold text-text-main mb-2">QR Code Expired</h2>
          <p className="text-text-muted text-sm mb-8">Your QR code has expired after 5 minutes. Generate a new one to complete your payment.</p>
          <div className="flex gap-3">
            <button
              onClick={() => fetchOrderAndGenerateQR(true, selectedCurrency)}
              disabled={refreshing}
              className="flex-1 py-3.5 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary-dark transition-all shadow-lg shadow-primary/20 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {refreshing ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Generating…</>
              ) : (
                <><RefreshIcon />New QR Code</>
              )}
            </button>
            <button
              onClick={() => navigate(`/customer/orders/${orderId}`)}
              className="flex-1 py-3.5 bg-stone-100 text-text-muted rounded-xl font-bold text-sm hover:bg-stone-200 transition-all active:scale-95"
            >
              Back to Order
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

  return (
    <div className="min-h-screen bg-bg-base py-10 pt-24 px-4 font-sans">
      <div className="max-w-xl mx-auto">

        {/* Back button */}
        <button
          onClick={handleCancel}
          disabled={cancelling}
          className="flex items-center gap-2 text-text-muted hover:text-primary font-bold text-sm mb-8 transition-all bg-white px-5 py-2.5 rounded-full shadow-sm border border-stone-100 hover:shadow-md w-fit"
        >
          <ArrowLeftIcon />
          Back to Checkout
        </button>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" stroke="#4F46E5" strokeWidth="2" className="w-4 h-4">
                <rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" />
              </svg>
            </div>
            <p className="text-xs font-bold uppercase tracking-widest text-primary">BAKONG KHQR</p>
          </div>
          <h1 className="text-4xl font-black text-text-main tracking-tight">Scan to Pay</h1>
          <p className="text-text-muted text-sm mt-1">Use any KHQR-compatible banking app to complete your payment</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-8">
          <Step num="1" label="Order" done />
          <StepConnector done />
          <Step num="2" label="Scan QR" active />
          <StepConnector done={false} />
          <Step num="3" label="Confirm" active={false} done={false} />
        </div>

        <div className="mb-6 rounded-2xl border border-stone-200 bg-white p-2 shadow-sm">
          <p className="px-3 pt-2 pb-3 text-xs font-bold uppercase tracking-widest text-text-muted">
            Choose payment currency
          </p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { value: "USD", label: "US Dollar", symbol: "$" },
              { value: "KHR", label: "Khmer Riel", symbol: "៛" },
            ].map((currency) => (
              <button
                key={currency.value}
                type="button"
                onClick={() => handleCurrencyChange(currency.value)}
                disabled={refreshing || cancelling}
                className={`rounded-xl border px-4 py-3 text-left transition-all disabled:opacity-60 ${
                  selectedCurrency === currency.value
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-stone-100 bg-stone-50 text-text-muted hover:border-primary/30"
                }`}
              >
                <span className="mr-2 text-lg font-black">{currency.symbol}</span>
                <span className="text-sm font-bold">{currency.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Main card */}
        {payment && (
          <div className="bg-white rounded-[2.5rem] shadow-xl shadow-primary/5 border border-stone-100 overflow-hidden animate-scale-in">

            {/* Timer bar */}
            <div className="px-8 pt-8 pb-0">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-widest text-text-muted">Expires In 5 Minutes</span>
                <span className={`text-2xl font-black tabular-nums ${getTimerColour()}`}>{timeLeft ?? "—"}</span>
              </div>
              {/* Progress bar */}
              {timeLeft && timeLeft !== "00:00" && (() => {
                const [m, s] = timeLeft.split(":").map(Number);
                const secondsLeft = m * 60 + s;
                const pct = Math.max(0, Math.min(100, (secondsLeft / KHQR_EXPIRY_SECONDS) * 100));
                return (
                  <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${pct}%`,
                        background: m < 2 ? "#EF4444" : m < 4 ? "#F59E0B" : "#4F46E5",
                      }}
                    />
                  </div>
                );
              })()}
            </div>

            {/* QR Code */}
            <div className="flex justify-center px-8 py-8">
              <div className="relative w-full max-w-[19rem]">
                <PulseRing />
                <div className="relative overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-lg">
                  <div className="flex items-center justify-center bg-[#e1232e] px-5 py-3 text-white">
                    <span className="text-2xl font-black tracking-tight">KHQR</span>
                  </div>
                  <div className="px-5 pb-5 pt-4">
                    <div className="mb-3 text-center">
                      <p className="truncate text-sm font-bold uppercase text-stone-900">
                        {payment.khqrData.merchantName}
                      </p>
                      <p className="text-xs font-semibold text-stone-500">
                        Scan with Bakong or any KHQR-supported app
                      </p>
                    </div>
                    <img
                      src={payment.khqrData.qrCode}
                      alt="Bakong KHQR payment code"
                      className="mx-auto aspect-square w-full max-w-64 object-contain"
                    />
                    <div className="mt-2 border-t border-stone-100 pt-3 text-center">
                      <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#e1232e]">
                        Bakong KHQR
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Amount */}
            <div className="mx-8 mb-6 bg-primary/5 rounded-2xl p-5 text-center border border-primary/10">
              <p className="text-xs font-bold uppercase tracking-widest text-primary/60 mb-0.5">Amount Due</p>
              <p className="text-4xl font-black text-primary tracking-tight">{primaryAmount}</p>
              <p className="text-xs text-text-muted mt-0.5 font-medium">{convertedAmount}</p>
            </div>

            {/* How to pay */}
            <div className="mx-8 mb-6">
              <p className="text-xs font-bold uppercase tracking-widest text-text-muted mb-3">How to Pay</p>
              <ol className="space-y-2.5">
                {[
                  { icon: <PhoneIcon />, text: "Open BAKONG or any KHQR-compatible bank app" },
                  { icon: <ScanIcon />, text: 'Tap "Scan QR" or "Pay with KHQR"' },
                  { icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><polyline points="9 11 12 14 22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>, text: "Verify the amount and confirm payment" },
                ].map((step, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-primary/8 flex items-center justify-center text-primary flex-shrink-0">{step.icon}</div>
                    <span className="text-sm text-text-muted leading-tight pt-1.5 font-medium">{step.text}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Payment details */}
            <div className="mx-8 mb-6 border-t border-stone-100 pt-5 space-y-3">
              {[
                { label: "Merchant", value: payment.khqrData.merchantName },
                { label: "Order ID", value: `#${orderId.slice(-8).toUpperCase()}`, mono: true },
                { label: "Transaction ID", value: payment.khqrData.transactionId, mono: true, small: true },
              ].map(({ label, value, mono, small }) => (
                <div key={label} className="flex items-center justify-between gap-4">
                  <span className="text-xs text-text-muted font-semibold uppercase tracking-wide">{label}</span>
                  <span className={`font-bold text-text-main ${mono ? "font-mono" : ""} ${small ? "text-xs" : "text-sm"} truncate max-w-[55%] text-right`}>{value}</span>
                </div>
              ))}
            </div>

            {/* Polling indicator */}
            <div className="mx-8 mb-6 flex items-center justify-center gap-2 text-xs text-text-muted bg-stone-50 rounded-xl py-3 border border-stone-100">
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
              <span className="font-semibold">Checking payment status automatically</span>
            </div>

            {/* Actions */}
            <div className="px-8 pb-8 flex gap-3">
              <button
                onClick={() => fetchOrderAndGenerateQR(true, selectedCurrency)}
                disabled={refreshing}
                className="flex-1 py-3.5 bg-stone-100 text-text-muted rounded-xl font-bold text-sm hover:bg-stone-200 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {refreshing ? (
                  <div className="w-4 h-4 border-2 border-stone-400/30 border-t-stone-400 rounded-full animate-spin" />
                ) : (
                  <RefreshIcon />
                )}
                Refresh QR
              </button>
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="flex-1 py-3.5 bg-red-50 text-red-500 border border-red-100 rounded-xl font-bold text-sm hover:bg-red-100 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {cancelling ? (
                  <div className="w-4 h-4 border-2 border-red-300/30 border-t-red-300 rounded-full animate-spin" />
                ) : null}
                Cancel Payment
              </button>
            </div>

            {/* Security note */}
            <div className="border-t border-stone-100 px-8 py-4 flex items-center justify-center gap-2 text-xs text-stone-400 font-medium">
              <ShieldIcon />
              Secured by NBC BAKONG · 256-bit Encryption
            </div>
          </div>
        )}

        {/* Supported banks */}
        <div className="mt-6 text-center">
          <p className="text-xs text-stone-400 font-medium">Accepted by ABA, ACLEDA, Canadia, Chip Mong, and all KHQR-enabled banks</p>
        </div>

      </div>
    </div>
  );
}
