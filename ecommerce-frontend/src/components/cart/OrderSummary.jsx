import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CreditCard } from 'lucide-react';

const OrderSummary = ({ total, itemCount }) => {
  const tax = total * 0.08;
  const finalTotal = total * 1.08;

  return (
    <div className="bg-white rounded-[2rem] shadow-lg border border-stone-100 p-8 sticky top-32">
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

        <div className="h-px bg-stone-100 my-6"></div>

        <div className="flex justify-between items-end">
          <div className="flex flex-col">
            <span className="text-stone-400 font-medium text-xs mb-1">Total</span>
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

      <p className="mt-6 text-xs text-center font-medium text-stone-400 flex items-center justify-center gap-2">
        <CreditCard className="w-4 h-4" />
        Secure Payment
      </p>
    </div>
  );
};

export default OrderSummary;
