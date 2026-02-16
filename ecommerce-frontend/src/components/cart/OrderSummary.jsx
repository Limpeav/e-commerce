import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CreditCard } from 'lucide-react';

const OrderSummary = ({ total, itemCount }) => {
  const tax = total * 0.08;
  const finalTotal = total * 1.08;

  return (
    <div className="bg-white rounded-xl border border-primary/15 p-6 sticky top-28">
      <h3 className="text-xl font-semibold mb-6 text-text-main">
        Order Summary
      </h3>

      <div className="space-y-3 mb-6">
        <div className="flex justify-between text-text-muted text-sm">
          <span>Subtotal</span>
          <span className="text-text-main font-semibold">${total.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-text-muted text-sm">
          <span>Items</span>
          <span className="text-text-main font-semibold">{itemCount}</span>
        </div>
        <div className="flex justify-between text-text-muted text-sm">
          <span>Shipping</span>
          <span className="text-secondary font-semibold">Free</span>
        </div>
        <div className="flex justify-between text-text-muted text-sm">
          <span>Tax (8.0%)</span>
          <span className="text-text-main font-semibold">${tax.toFixed(2)}</span>
        </div>

        <div className="h-px bg-primary/10 my-5"></div>

        <div className="flex justify-between items-center">
          <span className="text-text-main font-semibold">Total</span>
          <span className="text-2xl font-bold text-text-main">${finalTotal.toFixed(2)}</span>
        </div>
      </div>

      <Link
        to="/checkout"
        className="w-full bg-primary text-text-main py-3 rounded-lg font-semibold text-sm hover:bg-primary-hover transition-colors flex items-center justify-center gap-2"
      >
        Proceed to Checkout
        <ArrowRight className="w-5 h-5" />
      </Link>

      <p className="mt-4 text-xs text-center text-text-muted flex items-center justify-center gap-2">
        <CreditCard className="w-4 h-4" />
        Secure Payment
      </p>
    </div>
  );
};

export default OrderSummary;
