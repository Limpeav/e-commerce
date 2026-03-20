import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CreditCard } from 'lucide-react';
import { useDarkMode } from '../../hooks';

const OrderSummary = ({ total, itemCount }) => {
  const [isDark] = useDarkMode();
  const tax = total * 0.08;
  const finalTotal = total * 1.08;

  return (
    <div className={`rounded-[2rem] border p-8 sticky top-32 transition-colors duration-300 ${isDark ? "bg-slate-900 border-slate-800 shadow-[0_24px_60px_-28px_rgba(2,6,23,0.9)]" : "bg-white border-stone-100 shadow-lg"}`}>
      <h3 className="text-xl font-bold mb-8 text-text-main">
        Order Summary
      </h3>

      <div className="space-y-4 mb-8">
        <div className="flex justify-between text-text-muted font-medium text-sm">
          <span>Subtotal</span>
          <span className="text-text-main font-semibold">${total.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-text-muted font-medium text-sm">
          <span>Shipping</span>
          <span className="text-secondary font-bold">Free</span>
        </div>
        <div className="flex justify-between text-text-muted font-medium text-sm">
          <span>Tax (8.0%)</span>
          <span className="text-text-main font-semibold">
            ${tax.toFixed(2)}
          </span>
        </div>

        <div className={`h-px my-6 ${isDark ? "bg-slate-800" : "bg-stone-100"}`}></div>

        <div className="flex justify-between items-end">
          <div className="flex flex-col">
            <span className={`font-medium text-xs mb-1 ${isDark ? "text-slate-500" : "text-stone-400"}`}>Total</span>
            <span className="text-3xl font-bold text-text-main">
              ${finalTotal.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      <Link
        to="/checkout"
        className="w-full bg-primary text-white py-4 rounded-xl font-bold text-sm shadow-lg hover:bg-primary-dark transform transition-all duration-300 flex items-center justify-center gap-2 active:scale-95"
      >
        Proceed to Checkout
        <ArrowRight className="w-5 h-5" />
      </Link>

      <p className={`mt-6 text-xs text-center font-medium flex items-center justify-center gap-2 ${isDark ? "text-slate-500" : "text-stone-400"}`}>
        <CreditCard className="w-4 h-4" />
        Secure Payment
      </p>
    </div>
  );
};

export default OrderSummary;
