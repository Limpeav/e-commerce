import React from 'react';

const CartHeader = ({ itemCount }) => {
  return (
    <div className="mb-8">
      <h2 className="text-3xl md:text-4xl font-bold text-text-main mb-2 tracking-tight">
        Shopping Cart
      </h2>
      <p className="text-text-muted text-sm md:text-base">
        You have <span className="font-semibold text-text-main">{itemCount}</span> {itemCount === 1 ? "item" : "items"} in your cart.
      </p>
    </div>
  );
};

export default CartHeader;
