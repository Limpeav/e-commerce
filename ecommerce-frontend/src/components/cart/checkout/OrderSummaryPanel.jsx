import { Loader, Lock, Package } from "lucide-react";
import { getEffectiveCartProductPrice } from "../../../utils/checkout";

const OrderSummaryPanel = ({ isDark, cartItems, totals, loading }) => (
  <div className="lg:col-span-1">
    <div className={`rounded-[2.5rem] border p-8 md:p-10 sticky top-32 transition-colors duration-300 ${isDark ? "bg-slate-900 border-slate-800 shadow-[0_24px_60px_-28px_rgba(2,6,23,0.9)]" : "bg-white border-stone-100 shadow-xl shadow-primary/5"}`}>
      <h2 className="text-xl font-bold text-text-main mb-8 flex items-center gap-4 font-display">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-primary border ${isDark ? "bg-slate-800 border-slate-700" : "bg-stone-50 border-stone-100"}`}>
          <Package className="w-5 h-5" />
        </div>
        Order Summary
      </h2>

      <div className="space-y-4 mb-8 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
        {cartItems.map((item) => (
          <div
            key={item._id || item.product._id}
            className={`flex items-center gap-4 p-3 rounded-2xl border group ${isDark ? "bg-slate-800 border-slate-700" : "bg-stone-50 border-stone-100"}`}
          >
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 p-1.5 border ${isDark ? "bg-slate-900 border-slate-700" : "bg-white border-stone-100"}`}>
              <img
                src={item.product.image}
                alt={item.product.title || item.product.name}
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-text-main text-sm truncate">
                {item.product.title || item.product.name}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? "text-slate-400" : "text-text-muted"}`}>
                  Qty: {item.quantity}
                </span>
              </div>
            </div>
            <div className="text-right">
              <p className="font-bold text-text-main text-sm">
                ${(getEffectiveCartProductPrice(item.product) * item.quantity).toFixed(2)}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className={`space-y-3 mb-8 border-t pt-6 ${isDark ? "border-slate-800" : "border-stone-100"}`}>
        <div className={`flex justify-between text-sm font-medium ${isDark ? "text-slate-400" : "text-text-muted"}`}>
          <span>Subtotal</span>
          <span className="text-text-main font-bold">${totals.subtotal.toFixed(2)}</span>
        </div>
        <div className={`flex justify-between text-sm font-medium ${isDark ? "text-slate-400" : "text-text-muted"}`}>
          <span>Shipping</span>
          <span className="text-green-600 font-bold">
            {totals.shippingPrice === 0 ? "Free" : `$${totals.shippingPrice.toFixed(2)}`}
          </span>
        </div>
        <div className={`flex justify-between text-sm font-medium ${isDark ? "text-slate-400" : "text-text-muted"}`}>
          <span>Tax (8%)</span>
          <span className="text-text-main font-bold">${totals.taxPrice.toFixed(2)}</span>
        </div>

        <div className={`h-px my-4 ${isDark ? "bg-slate-800" : "bg-stone-100"}`}></div>

        <div className="flex justify-between items-end">
          <span className="text-text-main font-bold text-lg">Total</span>
          <span className="text-3xl font-black font-display tracking-tight text-primary">
            ${totals.totalPrice.toFixed(2)}
          </span>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading || cartItems.length === 0}
        className="w-full py-4 bg-text-main text-white font-bold rounded-xl hover:bg-primary shadow-lg hover:shadow-primary/25 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed text-sm active:scale-95"
      >
        {loading ? (
          <>
            <Loader className="w-5 h-5 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <Lock className="w-4 h-4" />
            Place Order
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

export default OrderSummaryPanel;
