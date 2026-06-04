import SEO from "../../components/seo/SEO";
import { useCart } from "../../context/useCart";
import EmptyCart from "./EmptyCart";

// Components
import CartHeader from "../../components/cart/CartHeader";
import CartItem from "../../components/cart/CartItem";
import OrderSummary from "../../components/cart/OrderSummary";
import { useDarkMode } from "../../hooks";
import { getCartItemKey } from "../../utils/productOptions";

export default function Cart() {
  const { cart, removeFromCart, updateQuantity } = useCart();
  const [isDark] = useDarkMode();



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
    <div className={`min-h-screen py-6 sm:py-12 pt-20 sm:pt-24 md:pt-32 pb-20 md:pb-12 font-sans transition-colors duration-300 ${isDark ? "bg-slate-950" : "bg-bg-base"}`}>
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6">
        {/* Header */}
        <CartHeader itemCount={itemCount} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {validCartItems.map((item) => (
              <CartItem
                key={getCartItemKey(item)}
                item={item}
                onRemove={removeFromCart}
                onUpdateQuantity={updateQuantity}
                getEffectivePrice={getEffectivePrice}
              />
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <OrderSummary total={total} itemCount={itemCount} />
          </div>
        </div>
      </div>
    </div>
  );
}
