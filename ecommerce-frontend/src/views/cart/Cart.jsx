import { useCart } from "../../context/CartContext";
import EmptyCart from "./EmptyCart";

// Components
import CartHeader from "../../components/cart/CartHeader";
import CartItem from "../../components/cart/CartItem";
import OrderSummary from "../../components/cart/OrderSummary";

export default function Cart() {
  const { cart, removeFromCart, updateQuantity } = useCart();

  // Filter out invalid items (where product is null)
  const validCartItems = cart.filter((item) => item.product);

  // Helper function to get effective price (discountPrice if available, otherwise regular price)
  const getEffectivePrice = (product) => {
    return (product.discountPrice && product.discountPrice < product.price)
      ? product.discountPrice
      : product.price;
  };

  const total = validCartItems.reduce(
    (acc, item) => acc + getEffectivePrice(item.product) * item.quantity,
    0
  );

  const itemCount = validCartItems.reduce((acc, item) => acc + item.quantity, 0);

  // Show EmptyCart component if cart is empty
  if (validCartItems.length === 0) {
    return <EmptyCart />;
  }

  // Cart with Items
  return (
    <div className="min-h-screen bg-bg-base py-8 pt-24 font-sans">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <CartHeader itemCount={itemCount} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          <div className="lg:col-span-2 space-y-3">
            {validCartItems.map((item) => (
              <CartItem
                key={item._id || item.product._id}
                item={item}
                onRemove={removeFromCart}
                onUpdateQuantity={updateQuantity}
                getEffectivePrice={getEffectivePrice}
              />
            ))}
          </div>

          <div className="lg:col-span-1">
            <OrderSummary total={total} itemCount={itemCount} />
          </div>
        </div>
      </div>
    </div>
  );
}
