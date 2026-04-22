import { Link, useLocation } from 'react-router-dom';
import { CheckCircle, ShoppingBag } from 'lucide-react';
import { useDarkMode } from '../../hooks';

export default function OrderSuccess() {
  const location = useLocation();
  const [isDark] = useDarkMode();
  const stateOrderId = location.state?.orderId;
  const queryOrderId = new URLSearchParams(location.search).get("orderId");
  const storedOrderId = typeof window !== "undefined"
    ? localStorage.getItem("latestOrderId")
    : null;
  const orderId = stateOrderId || queryOrderId || storedOrderId;
  const orderLink = orderId ? `/orders/${orderId}` : "/orders";
  const orderLabel = orderId ? "View Order" : "View Orders";
  const orderNumber = orderId
    ? `#${orderId.slice(-8).toUpperCase()}`
    : `#ORD-${new Date().getFullYear()}-${Math.floor(Math.random() * 9000 + 1000)}`;

  return (
    <div className={`min-h-screen flex items-center justify-center py-20 px-6 font-sans transition-colors duration-300 ${isDark ? "bg-slate-950" : "bg-bg-base"}`}>
      <div className="max-w-xl mx-auto text-center">
        <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg shadow-primary/10 border-4 ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-white"}`}>
          <CheckCircle className="w-12 h-12 text-primary" />
        </div>

        <h1 className="text-4xl font-bold text-text-main mb-3 tracking-tight">
          Order Confirmed!
        </h1>

        <p className="text-text-muted font-medium text-base mb-10">
          Thank you for your purchase.
        </p>

        <div className={`rounded-3xl border p-8 mb-10 text-left ${isDark ? "bg-slate-900 border-slate-800 shadow-[0_24px_60px_-28px_rgba(2,6,23,0.9)]" : "bg-white border-stone-100 shadow-lg"}`}>
          <div className="space-y-4">
            <div className={`flex justify-between items-center border-b pb-3 ${isDark ? "border-slate-800" : "border-stone-100"}`}>
              <span className="text-xs font-bold text-stone-500 uppercase tracking-wide">Order Number</span>
              <span className={`font-mono text-sm font-bold text-text-main px-3 py-1 rounded-lg border ${isDark ? "bg-slate-800 border-slate-700" : "bg-stone-50 border-stone-100"}`}>{orderNumber}</span>
            </div>
            <div className={`flex justify-between items-center border-b pb-3 ${isDark ? "border-slate-800" : "border-stone-100"}`}>
              <span className="text-xs font-bold text-stone-500 uppercase tracking-wide">Date</span>
              <span className="font-bold text-text-main text-sm">{new Date().toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-stone-500 uppercase tracking-wide">Estimated Delivery</span>
              <span className="font-bold text-primary text-sm bg-primary/5 px-3 py-1 rounded-full border border-primary/10">3-5 Business Days</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            to={orderLink}
            className="flex-1 bg-primary text-white px-8 py-4 rounded-xl hover:bg-primary-dark transition-all shadow-md font-bold text-sm flex items-center justify-center gap-2 active:scale-95"
          >
            <ShoppingBag className="w-4 h-4" />
            {orderLabel}
          </Link>

          <Link
            to="/"
            className={`flex-1 border px-8 py-4 rounded-xl transition-all font-bold text-sm flex items-center justify-center active:scale-95 ${isDark ? "bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800" : "bg-white text-text-muted border-stone-200 hover:bg-stone-50"}`}
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
