import React from 'react';

const CartHeader = ({ itemCount }) => {
  return (
    <div className="mb-12">
      <h2 className="text-4xl font-bold text-text-main mb-3 tracking-tight">
        Shopping Cart
      </h2>
      <div className="flex items-center gap-3">
        <span className="text-text-muted font-medium text-lg">
          You have <span className="text-secondary font-bold">{itemCount}</span> {itemCount === 1 ? "item" : "items"}
        </span>
        <div className="h-1 w-1 bg-stone-300 rounded-full"></div>
        <span className="text-primary font-bold text-xs uppercase tracking-wide">Secure Checkout</span>
      </div>
    </div>
  );
};

export default CartHeader;
