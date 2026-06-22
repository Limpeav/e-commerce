import { useEffect } from "react";
import { AlertTriangle, CreditCard, ShieldCheck, X } from "lucide-react";
import { useLanguage } from "../../../context/useLanguage";

const PAYMENT_METHODS = ["BAKONG_KHQR", "Cash on Delivery"];

const PaymentMethodSection = ({
  isDark,
  paymentMethod,
  onPaymentMethodChange,
  showBakongWarning,
  onCloseBakongWarning,
  onConfirmBakongPayment,
}) => {
  const { t } = useLanguage();

  useEffect(() => {
    if (!showBakongWarning) return undefined;

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onCloseBakongWarning();
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onCloseBakongWarning, showBakongWarning]);

  return (
  <div className={`rounded-[2.5rem] border p-8 md:p-10 transition-colors duration-300 ${isDark ? "bg-slate-900 border-slate-800 shadow-[0_24px_60px_-28px_rgba(2,6,23,0.9)]" : "bg-white border-stone-100 shadow-xl shadow-primary/5"}`}>
    <h2 className="text-xl font-bold text-text-main mb-8 flex items-center gap-4 font-display">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-primary border ${isDark ? "bg-slate-800 border-slate-700" : "bg-stone-50 border-stone-100"}`}>
        <CreditCard className="w-5 h-5" />
      </div>
      Payment Method
    </h2>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {PAYMENT_METHODS.map((method) => (
        <label
          key={method}
          className={`flex items-center gap-4 p-5 border rounded-2xl cursor-pointer transition-all group ${paymentMethod === method
            ? "border-primary bg-primary/5 shadow-sm"
            : isDark
              ? "border-slate-700 hover:border-primary/40 hover:bg-slate-800"
              : "border-stone-200 hover:border-primary/30 hover:bg-stone-50"
            }`}
        >
          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${paymentMethod === method ? "border-primary bg-primary" : isDark ? "border-slate-600" : "border-stone-300"}`}>
            {paymentMethod === method && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
          </div>
          <input
            type="radio"
            name="paymentMethod"
            value={method}
            checked={paymentMethod === method}
            onChange={(event) => onPaymentMethodChange(event.target.value)}
            className="hidden"
          />
          <span className={`font-bold text-sm ${paymentMethod === method ? "text-primary" : isDark ? "text-slate-400" : "text-text-muted"}`}>
            {method}
          </span>
        </label>
      ))}
    </div>

    {paymentMethod === "BAKONG_KHQR" && (
      <div className={`mt-4 rounded-2xl border px-4 py-3 text-sm font-medium ${
        isDark
          ? "border-green-500/30 bg-green-500/10 text-green-300"
          : "border-green-200 bg-green-50 text-green-800"
      }`}>
        {t("checkout.bakongQrNotice")}
        <p className="mt-2 font-bold">
          {t("checkout.bakongCancellationWarning")}
        </p>
      </div>
    )}

    {showBakongWarning && (
      <div
        className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
        role="dialog"
        aria-modal="true"
        aria-labelledby="bakong-warning-title"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) {
            onCloseBakongWarning();
          }
        }}
      >
        <div className={`relative w-full max-w-md overflow-hidden rounded-[2rem] border shadow-[0_30px_90px_-24px_rgba(2,6,23,0.55)] ${
          isDark
            ? "border-slate-700 bg-slate-900"
            : "border-stone-200 bg-white"
        }`}>
          <div className="h-2 bg-gradient-to-r from-[#e1232e] via-[#ef4444] to-[#f59e0b]" />

          <button
            type="button"
            onClick={onCloseBakongWarning}
            className={`absolute right-4 top-5 flex h-10 w-10 items-center justify-center rounded-full transition-colors ${
              isDark
                ? "text-slate-400 hover:bg-slate-800 hover:text-white"
                : "text-stone-400 hover:bg-stone-100 hover:text-stone-700"
            }`}
            aria-label={t("checkout.bakongWarningClose")}
          >
            <X className="h-5 w-5" />
          </button>

          <div className="px-6 pb-6 pt-8 text-center sm:px-8 sm:pb-8">
            <div className="relative mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full border-4 border-amber-100 bg-amber-50 text-amber-600">
              <AlertTriangle className="h-9 w-9" strokeWidth={2.25} />
              <span className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border-4 border-white bg-[#e1232e] text-white">
                <ShieldCheck className="h-4 w-4" />
              </span>
            </div>

            <p className="mb-2 text-xs font-black uppercase tracking-[0.2em] text-[#e1232e]">
              Bakong KHQR
            </p>
            <h3
              id="bakong-warning-title"
              className="text-2xl font-black leading-tight text-text-main sm:text-3xl"
            >
              {t("checkout.bakongWarningTitle")}
            </h3>
            <p className="mx-auto mt-3 max-w-sm text-sm font-medium leading-6 text-text-muted sm:text-base">
              {t("checkout.bakongCancellationWarning")}
            </p>

            <div className={`mt-6 rounded-2xl border p-4 text-left ${
              isDark
                ? "border-slate-700 bg-slate-800/70"
                : "border-amber-100 bg-amber-50/70"
            }`}>
              <p className="flex items-start gap-3 text-sm font-semibold leading-6 text-text-main">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                {t("checkout.bakongWarningDetail")}
              </p>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={onCloseBakongWarning}
                className={`min-h-12 whitespace-nowrap rounded-xl border px-3 text-xs font-bold transition-all active:scale-[0.98] sm:px-5 sm:text-sm ${
                  isDark
                    ? "border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700"
                    : "border-stone-200 bg-stone-100 text-stone-700 hover:bg-stone-200"
                }`}
              >
                {t("checkout.chooseAnotherMethod")}
              </button>
              <button
                type="button"
                onClick={onConfirmBakongPayment}
                autoFocus
                className="min-h-12 rounded-xl bg-primary px-5 text-sm font-black text-white shadow-lg shadow-primary/25 transition-all hover:bg-primary-dark active:scale-[0.98]"
              >
                {t("checkout.understandContinue")}
              </button>
            </div>
          </div>
        </div>
      </div>
    )}
  </div>
  );
};

export default PaymentMethodSection;
