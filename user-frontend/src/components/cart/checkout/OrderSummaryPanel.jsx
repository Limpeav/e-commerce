import { Loader, Lock, Package } from "lucide-react";
import { getEffectiveCartProductPrice } from "../../../utils/checkout";
import Price from "../../shared/Price";
import { useLanguage } from "../../../context/useLanguage";
import { getLocalizedProductText } from "../../../utils/productLocalization";
import { getProductImageForColor } from "../../../utils/productOptions";

const OrderSummaryPanel = ({ isDark, cartItems, totals, loading, paymentMethod }) => {
  const { language, t } = useLanguage();

  return (
  <div className="lg:col-span-1">
    <div className={`rounded-[2.5rem] border p-8 md:p-10 sticky top-32 transition-colors duration-300 ${isDark ? "bg-slate-900 border-slate-800 shadow-[0_24px_60px_-28px_rgba(2,6,23,0.9)]" : "bg-white border-stone-100 shadow-xl shadow-primary/5"}`}>
      <h2 className="text-xl font-bold text-text-main mb-8 flex items-center gap-4 font-display">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-primary border ${isDark ? "bg-slate-800 border-slate-700" : "bg-stone-50 border-stone-100"}`}>
          <Package className="w-5 h-5" />
        </div>
        Order Summary
      </h2>

      <div className="space-y-4 mb-8 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
        {cartItems.map((item) => {
          const localizedProduct = getLocalizedProductText(item.product, language);

          return (
          <div
            key={`${item.product._id}:${item.size || "standard"}:${item.color || "default"}`}
            className={`flex items-center gap-4 p-3 rounded-2xl border group ${isDark ? "bg-slate-800 border-slate-700" : "bg-stone-50 border-stone-100"}`}
          >
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 p-1.5 border ${isDark ? "bg-slate-900 border-slate-700" : "bg-white border-stone-100"}`}>
              <img
                src={getProductImageForColor(item.product, item.color)}
                alt={localizedProduct.title}
                loading="lazy"
                decoding="async"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p data-no-static-translation className="font-bold text-text-main text-sm truncate">
                {localizedProduct.title}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? "text-slate-400" : "text-text-muted"}`}>
                  Qty: {item.quantity}
                </span>
                {item.size && (
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? "text-slate-400" : "text-text-muted"}`}>
                    Size: {item.size}
                  </span>
                )}
                {item.color && (
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? "text-slate-400" : "text-text-muted"}`}>
                    Color: {item.color}
                  </span>
                )}
              </div>
            </div>
            <div className="text-right">
              <Price
                amount={getEffectiveCartProductPrice(item.product) * item.quantity}
                className="font-bold text-text-main text-sm"
                usdClassName="text-text-main"
              />
            </div>
          </div>
          );
        })}
      </div>

      <div className={`space-y-3 mb-8 border-t pt-6 ${isDark ? "border-slate-800" : "border-stone-100"}`}>
        <div className={`flex justify-between text-sm font-medium ${isDark ? "text-slate-400" : "text-text-muted"}`}>
          <span>Subtotal</span>
          <Price amount={totals.subtotal} className="text-text-main font-bold" usdClassName="text-text-main" />
        </div>
        <div className={`flex justify-between text-sm font-medium ${isDark ? "text-slate-400" : "text-text-muted"}`}>
          <span>Shipping</span>
          <span className="text-green-600 font-bold">
            {totals.shippingPrice === 0 ? "Free" : <Price amount={totals.shippingPrice} usdClassName="text-green-600" />}
          </span>
        </div>
        <div className={`flex justify-between text-sm font-medium ${isDark ? "text-slate-400" : "text-text-muted"}`}>
          <span>Tax (8%)</span>
          <Price amount={totals.taxPrice} className="text-text-main font-bold" usdClassName="text-text-main" />
        </div>

        <div className={`h-px my-4 ${isDark ? "bg-slate-800" : "bg-stone-100"}`}></div>

        <div className="flex justify-between items-end">
          <span className="text-text-main font-bold text-lg">Total</span>
          <Price amount={totals.totalPrice} className="text-3xl font-black font-display tracking-tight text-primary" usdClassName="text-primary" />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading || cartItems.length === 0}
        className={`w-full py-4 font-bold rounded-xl shadow-lg shadow-green-700/15 hover:shadow-green-700/25 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed text-sm active:scale-95 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
          isDark
            ? "bg-green-500 text-slate-950 hover:bg-green-400 focus:ring-offset-slate-900"
            : "bg-green-600 text-white hover:bg-green-700 focus:ring-offset-white"
        }`}
      >
        {loading ? (
          <>
            <Loader className="w-5 h-5 animate-spin" />
            {paymentMethod === "BAKONG_KHQR"
              ? t("checkout.generatingQr")
              : t("checkout.processing")}
          </>
        ) : (
          <>
            <Lock className="w-4 h-4" />
            {paymentMethod === "BAKONG_KHQR"
              ? t("checkout.placeOrderGenerateQr")
              : t("checkout.placeOrder")}
          </>
        )}
      </button>

      <p className={`mt-6 text-xs text-center font-medium flex items-center justify-center gap-1.5 ${isDark ? "text-slate-500" : "text-stone-400"}`}>
        <Lock className="w-3 h-3" />
        Secure Payment
      </p>
    </div>
  </div>
  );
};

export default OrderSummaryPanel;
