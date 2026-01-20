import { Link } from 'react-router-dom';
import { CheckCircle, ShoppingBag } from 'lucide-react';

export default function OrderSuccess() {
  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center py-20 px-6 font-sans">
      <div className="max-w-xl mx-auto text-center">
        <div className="bg-white w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg shadow-primary/10 border-4 border-white">
          <CheckCircle className="w-12 h-12 text-primary" />
        </div>

        <h1 className="text-4xl font-bold text-text-main mb-3 tracking-tight">
          Order Confirmed!
        </h1>

        <p className="text-text-muted font-medium text-base mb-10">
          Thank you for your purchase.
        </p>

        <div className="bg-white rounded-3xl shadow-lg border border-stone-100 p-8 mb-10 text-left">
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-stone-100 pb-3">
              <span className="text-xs font-bold text-stone-500 uppercase tracking-wide">Order Number</span>
              <span className="font-mono text-sm font-bold text-text-main bg-stone-50 px-3 py-1 rounded-lg border border-stone-100">#ORD-{new Date().getFullYear()}-{Math.floor(Math.random() * 9000 + 1000)}</span>
            </div>
            <div className="flex justify-between items-center border-b border-stone-100 pb-3">
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
            to="/orders"
            className="flex-1 bg-primary text-white px-8 py-4 rounded-xl hover:bg-primary-dark transition-all shadow-md font-bold text-sm flex items-center justify-center gap-2 active:scale-95"
          >
            <ShoppingBag className="w-4 h-4" />
            View Orders
          </Link>

          <Link
            to="/"
            className="flex-1 bg-white text-text-muted border border-stone-200 px-8 py-4 rounded-xl hover:bg-stone-50 transition-all font-bold text-sm flex items-center justify-center active:scale-95"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
