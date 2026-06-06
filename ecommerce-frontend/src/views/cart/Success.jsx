import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AlertTriangle, CheckCircle } from "lucide-react";
import { useDarkMode } from "../../hooks";
import { useLanguage } from "../../context/useLanguage";

export default function OrderSuccess() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [isDark] = useDarkMode();
  const stateOrderId = location.state?.orderId;
  const queryOrderId = new URLSearchParams(location.search).get("orderId");
  const storedOrderId =
    typeof window !== "undefined" ? localStorage.getItem("latestOrderId") : null;
  const orderId = stateOrderId || queryOrderId || storedOrderId;

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, []);

  const viewOrderDetails = () => {
    if (orderId) {
      navigate(`/customer/orders/${orderId}`);
      return;
    }

    navigate("/customer/orders");
  };

  return (
    <div
      className={`flex min-h-[100dvh] items-center justify-center px-4 py-24 font-sans transition-colors duration-300 sm:px-6 ${
        isDark ? "bg-slate-950" : "bg-bg-base"
      }`}
    >
      <div
        className={`relative w-full max-w-2xl overflow-hidden rounded-3xl border p-5 text-center transition-colors duration-300 sm:rounded-[3rem] sm:p-10 md:p-12 ${
          isDark
            ? "bg-slate-900 border-slate-800 shadow-[0_32px_80px_-36px_rgba(2,6,23,0.95)]"
            : "bg-white border-stone-100 shadow-xl"
        }`}
      >
        <div className="pointer-events-none absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32" />

        <div className="relative z-10 mb-6 sm:mb-10">
          <div
            className={`mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border shadow-inner sm:mb-6 sm:h-20 sm:w-20 ${
              isDark
                ? "bg-slate-800 border-slate-700"
                : "bg-stone-50 border-stone-100"
            }`}
          >
            <CheckCircle className="h-8 w-8 text-green-500 sm:h-10 sm:w-10" />
          </div>
          <h1 className="mb-3 text-2xl font-bold leading-tight text-text-main font-display tracking-tight sm:text-4xl">
            {t("checkout.orderSuccessTitle")}
          </h1>
          <p
            className={`mx-auto max-w-md text-sm font-medium leading-relaxed sm:text-lg ${
              isDark ? "text-slate-400" : "text-text-muted"
            }`}
          >
            {t("checkout.orderSuccessMessage")}
          </p>
        </div>

        <div
          className={`relative z-10 mb-4 inline-block w-full max-w-sm rounded-2xl border p-4 sm:p-6 ${
            isDark
              ? "bg-slate-800 border-slate-700"
              : "bg-stone-50 border-stone-100"
          }`}
        >
          <p
            className={`text-xs font-bold uppercase tracking-wider mb-2 ${
              isDark ? "text-slate-400" : "text-text-muted"
            }`}
          >
            {t("checkout.orderId")}
          </p>
          <p className="break-words font-mono text-xl font-bold tracking-tight text-text-main sm:text-2xl">
            {orderId ? `#${orderId.slice(-8).toUpperCase()}` : t("checkout.orderCreated")}
          </p>
        </div>

        <div
          className={`relative z-10 mx-auto mb-6 flex w-full max-w-sm items-start gap-3 rounded-2xl border p-4 text-left sm:mb-8 ${
            isDark
              ? "border-amber-500/30 bg-amber-500/10 text-amber-100"
              : "border-amber-200 bg-amber-50 text-amber-900"
          }`}
        >
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
          <div>
            <p className="text-sm font-black">{t("checkout.cancelNoticeTitle")}</p>
            <p className={`mt-1 text-xs font-semibold leading-relaxed ${isDark ? "text-amber-100/80" : "text-amber-800"}`}>
              {t("checkout.cancelNoticeMessage")}
            </p>
          </div>
        </div>

        <div className="relative z-10 mx-auto grid w-full max-w-md grid-cols-2 gap-2 sm:gap-4">
          <button
            onClick={viewOrderDetails}
            type="button"
            className={`min-h-12 w-full rounded-xl px-3 py-3 text-xs font-bold leading-tight shadow-xl shadow-primary/10 transition-all hover:-translate-y-1 active:scale-95 sm:px-6 sm:py-4 sm:text-sm ${
              isDark
                ? "bg-green-600 text-white hover:bg-green-500"
                : "bg-green-600 text-white hover:bg-green-700"
            }`}
          >
            {t("checkout.viewOrderDetails")}
          </button>
          <button
            onClick={() => navigate("/customer")}
            type="button"
            className={`min-h-12 w-full rounded-xl border px-3 py-3 text-xs font-bold leading-tight transition-all hover:border-primary hover:text-primary active:scale-95 sm:px-6 sm:py-4 sm:text-sm ${
              isDark
                ? "bg-slate-900 text-slate-400 border-slate-700 hover:bg-slate-800"
                : "bg-white text-text-muted border-stone-200 hover:shadow-lg"
            }`}
          >
            {t("checkout.continueShopping")}
          </button>
        </div>
      </div>
    </div>
  );
}
