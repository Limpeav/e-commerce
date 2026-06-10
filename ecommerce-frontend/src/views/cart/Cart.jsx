import SEO from "../../components/seo/SEO";
import { useNavigate } from "react-router-dom";
import { useCart } from "../../context/useCart";
import EmptyCart from "./EmptyCart";
import { ArrowLeft } from "lucide-react";

// Components
import CartHeader from "../../components/cart/CartHeader";
import CartItem from "../../components/cart/CartItem";
import OrderSummary from "../../components/cart/OrderSummary";
import { useDarkMode } from "../../hooks";
import { getCartItemKey } from "../../utils/productOptions";

export default function Cart() {
  const { cart, removeFromCart, updateQuantity } = useCart();
  const [isDark] = useDarkMode();
  const navigate = useNavigate();


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
    <div className={`min-h-screen pt-14 sm:pt-16 lg:pt-20 pb-16 lg:pb-0 font-sans transition-colors duration-300 ${isDark ? "bg-slate-950" : "bg-bg-base"}`}>
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6">
        {/* Back button */}
        <div className="mb-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm shadow-sm transition-all duration-300 group active:scale-95 ${
              isDark
                ? 'bg-slate-900 border-slate-700 hover:bg-slate-800'
                : 'bg-white border-stone-200 hover:shadow-md hover:border-stone-300'
            }`}
            aria-label="Go back"
          >
            <ArrowLeft className={`h-4 w-4 transition-colors stroke-[2.5] ${
              isDark ? 'text-slate-400 group-hover:text-white' : 'text-stone-500 group-hover:text-stone-800'
            }`} />
            <span className={`font-bold transition-colors ${
              isDark ? 'text-slate-300 group-hover:text-white' : 'text-stone-600 group-hover:text-stone-900'
            }`}>Back</span>
          </button>
        </div>

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
