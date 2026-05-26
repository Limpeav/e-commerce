import { CheckCircle } from "lucide-react";

const CheckoutSuccess = ({ isDark, orderId, onViewOrderDetails, onContinueShopping }) => (
  <div className={`min-h-screen flex items-center justify-center px-6 font-sans transition-colors duration-300 ${isDark ? "bg-slate-950" : "bg-bg-base"}`}>
    <div className={`max-w-2xl w-full rounded-[3rem] p-12 text-center border relative overflow-hidden transition-colors duration-300 ${isDark ? "bg-slate-900 border-slate-800 shadow-[0_32px_80px_-36px_rgba(2,6,23,0.95)]" : "bg-white border-stone-100 shadow-xl"}`}>
      <div className="pointer-events-none absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32"></div>

      <div className="mb-10 relative z-10">
        <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner border ${isDark ? "bg-slate-800 border-slate-700" : "bg-stone-50 border-stone-100"}`}>
          <CheckCircle className="w-10 h-10 text-green-500" />
        </div>
        <h1 className="text-4xl font-bold text-text-main mb-3 font-display tracking-tight">
          Order Placed Successfully!
        </h1>
        <p className={`font-medium text-lg max-w-md mx-auto ${isDark ? "text-slate-400" : "text-text-muted"}`}>
          Thank you for your order. We are preparing your items for shipment.
        </p>
      </div>

      <div className={`relative z-10 rounded-2xl p-6 mb-8 border inline-block w-full max-w-sm ${isDark ? "bg-slate-800 border-slate-700" : "bg-stone-50 border-stone-100"}`}>
        <p className={`text-xs font-bold uppercase tracking-wider mb-2 ${isDark ? "text-slate-400" : "text-text-muted"}`}>Order ID</p>
        <p className="text-2xl font-bold text-text-main font-mono tracking-tight">
          #{orderId?.slice(-8).toUpperCase()}
        </p>
      </div>

      <div className="relative z-10 flex flex-col sm:flex-row gap-4 justify-center">
        <button
          onClick={onViewOrderDetails}
          type="button"
          className={`px-8 py-4 rounded-xl transition-all font-bold text-sm shadow-xl shadow-primary/10 hover:-translate-y-1 active:scale-95 ${
            isDark
              ? "bg-primary text-slate-950 hover:bg-primary-light"
              : "bg-text-main text-white hover:bg-primary"
          }`}
        >
          View Order Details
        </button>
        <button
          onClick={onContinueShopping}
          type="button"
          className={`px-8 py-4 border rounded-xl transition-all font-bold text-sm hover:border-primary hover:text-primary active:scale-95 ${isDark ? "bg-slate-900 text-slate-400 border-slate-700 hover:bg-slate-800" : "bg-white text-text-muted border-stone-200 hover:shadow-lg"}`}
        >
          Continue Shopping
        </button>
      </div>
    </div>
  </div>
);

export default CheckoutSuccess;
