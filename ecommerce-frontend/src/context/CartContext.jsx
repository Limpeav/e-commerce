import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Heart, Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useToast } from "./ToastContext";
import { CartController } from "../controllers/index.js";
import { useAuth } from "./useAuth";
import { CartContext } from "./cart-context";
import { useDarkMode } from "../hooks";
import { useLanguage } from "./useLanguage";
import { getEffectiveCartProductPrice, getValidCartItems } from "../utils/checkout";
import { getCartItemKey } from "../utils/productOptions";

const isPortalRoute = (pathname = "") =>
  pathname.startsWith("/admin") ||
  pathname.startsWith("/seller") ||
  pathname.startsWith("/delivery");

const normalizeCartSize = (size = "") => String(size || "").trim().toUpperCase();

const isSameCartItem = (item, productId, size = "") =>
  item.product?._id === productId && normalizeCartSize(item.size) === normalizeCartSize(size);

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const userToken = user?.token;
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const canUseCustomerCart = Boolean(userToken) && !isPortalRoute(pathname);
  const { success, error: toastError, info } = useToast();
  const { t } = useLanguage();

  // Load cart from backend when user logs in
  useEffect(() => {
    const loadCart = async () => {
      if (canUseCustomerCart) {
        try {
          const result = await CartController.getCart();
          setCart(result.success ? result.data || [] : []);
        } catch (error) {
          console.error("Error loading cart:", error);
          setCart([]);
        }
      } else {
        // User logged out, clear cart
        setCart([]);
      }
      setLoading(false);
    };

    loadCart();
  }, [canUseCustomerCart]);

  // Add to cart
  const addToCart = async (product, quantity = 1, options = {}) => {
    if (!canUseCustomerCart) {
      info(t("cart.loginRequiredTitle"), t("cart.loginRequiredMessage"));
      return;
    }

    try {
      const productLabel = product?.title || product?.name || "This product";
      const result = await CartController.addToCart(product, quantity, options);
      if (!result.success) {
        throw new Error(result.error);
      }

      setCart(result.data || []);
      setCartDrawerOpen(true);

      success(
        t("cart.addedTitle"),
        t("cart.addedMessage", {
          product: productLabel,
          size: options.size ? ` (${options.size})` : "",
        }),
        { onClick: () => navigate("/customer/cart") }
      );
    } catch (error) {
      console.error("Error adding to cart:", error);
      toastError(t("cart.actionFailedTitle"), error.message || t("cart.addFailedMessage"));
    }
  };

  // Update quantity
  const updateQuantity = async (productId, newQuantity, options = {}) => {
    if (!canUseCustomerCart) return;

    const previousCart = cart;
    setCart((currentCart) =>
      currentCart.map((item) =>
        isSameCartItem(item, productId, options.size)
          ? { ...item, quantity: Number(newQuantity) }
          : item
      )
    );

    try {
      const result = await CartController.updateQuantity(productId, newQuantity, options);
      if (!result.success) {
        throw new Error(result.error);
      }

      setCart(result.data || []);
    } catch (error) {
      setCart(previousCart);
      console.error("Error updating quantity:", error);
      toastError(t("cart.updateFailedTitle"), t("cart.updateFailedMessage"));
    }
  };

  // Remove from cart
  const removeFromCart = async (productId, options = {}) => {
    if (!canUseCustomerCart) return;

    try {
      const result = await CartController.removeFromCart(productId, options);
      if (!result.success) {
        throw new Error(result.error);
      }

      setCart(result.data || []);
      info(t("cart.removedTitle"), t("cart.removedMessage"));
    } catch (error) {
      console.error("Error removing item:", error);
      toastError(t("cart.removeFailedTitle"), t("cart.removeFailedMessage"));
    }
  };

  // Clear cart
  const clearCart = async () => {
    if (!canUseCustomerCart) return;

    try {
      const result = await CartController.clearCart();
      if (!result.success) {
        throw new Error(result.error);
      }

      setCart(result.data || []);
    } catch (error) {
      console.error("Error clearing cart:", error);
      toastError(t("cart.clearFailedTitle"), t("cart.clearFailedMessage"));
    }
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        loading,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        openCartDrawer: () => setCartDrawerOpen(true),
        closeCartDrawer: () => setCartDrawerOpen(false),
      }}
    >
      {children}
      <AnimatePresence>
        {cartDrawerOpen && (
          <CartPreviewDrawer
            cart={cart}
            onClose={() => setCartDrawerOpen(false)}
            onRemove={removeFromCart}
            onUpdateQuantity={updateQuantity}
          />
        )}
      </AnimatePresence>
    </CartContext.Provider>
  );
};

const CartPreviewDrawer = ({
  cart,
  onClose,
  onRemove,
  onUpdateQuantity,
}) => {
  const [isDark] = useDarkMode();
  const { t } = useLanguage();
  const [isSideDrawer, setIsSideDrawer] = useState(() =>
    typeof window === "undefined" ? true : window.matchMedia("(min-width: 640px)").matches
  );
  const validCartItems = getValidCartItems(cart);
  const subtotal = validCartItems.reduce(
    (acc, item) => acc + getEffectiveCartProductPrice(item.product) * item.quantity,
    0
  );
  const itemCount = validCartItems.reduce((acc, item) => acc + item.quantity, 0);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 640px)");
    const syncDrawerMode = () => setIsSideDrawer(mediaQuery.matches);

    syncDrawerMode();
    mediaQuery.addEventListener("change", syncDrawerMode);

    return () => mediaQuery.removeEventListener("change", syncDrawerMode);
  }, []);

  return (
    <div className="fixed inset-0 z-[160]">
      <motion.button
        type="button"
        className="absolute inset-0 bg-black/45 backdrop-blur-[1px]"
        onClick={onClose}
        aria-label={t("cart.closePreview")}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      />

      <motion.aside
        className={`absolute inset-x-0 bottom-0 flex max-h-[88dvh] w-full flex-col rounded-t-[2rem] border-t shadow-2xl transition-colors duration-300 sm:inset-x-auto sm:right-0 sm:top-0 sm:h-full sm:max-h-none sm:max-w-[28rem] sm:rounded-none sm:border-l sm:border-t-0 ${
          isDark
            ? "border-slate-800 bg-slate-950 text-slate-50"
            : "border-stone-200 bg-white text-stone-950"
        }`}
        aria-label="Cart preview"
        initial={{ opacity: 0, x: isSideDrawer ? 96 : 0, y: isSideDrawer ? 0 : 48 }}
        animate={{ opacity: 1, y: 0, x: 0 }}
        exit={{ opacity: 0, x: isSideDrawer ? 96 : 0, y: isSideDrawer ? 0 : 48 }}
        transition={{ type: "spring", stiffness: 280, damping: 30 }}
        variants={{
          open: {
            transition: {
              staggerChildren: 0.055,
              delayChildren: 0.08,
            },
          },
        }}
      >
        <header
          className={`flex h-14 shrink-0 items-center justify-between border-b px-4 sm:h-16 sm:px-5 ${
            isDark ? "border-slate-800" : "border-stone-200"
          }`}
        >
          <button
            type="button"
            onClick={onClose}
            className={`rounded-full p-2 transition-colors ${
              isDark ? "text-slate-300 hover:bg-slate-900 hover:text-white" : "text-stone-700 hover:bg-stone-100"
            }`}
            aria-label={t("cart.closePreview")}
          >
            <X className="h-6 w-6" />
          </button>

          <div className="text-center">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-primary">{t("cart.previewTitle")}</p>
            <p className="text-sm font-bold text-text-muted">{t("cart.drawerItemCount", { count: itemCount })}</p>
          </div>

          <Link
            to="/customer/wishlist"
            onClick={onClose}
            className={`rounded-full p-2 transition-colors ${
              isDark ? "text-slate-300 hover:bg-slate-900 hover:text-white" : "text-stone-700 hover:bg-stone-100"
            }`}
            aria-label={t("cart.openWishlist")}
          >
            <Heart className="h-6 w-6" />
          </Link>
        </header>

        <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-5 sm:py-5">
          {validCartItems.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <div className={`mb-5 rounded-full p-5 ${isDark ? "bg-slate-900" : "bg-stone-100"}`}>
                <ShoppingBag className="h-8 w-8 text-primary" />
              </div>
              <h2 className="font-display text-2xl font-black text-text-main">{t("cart.emptyTitle")}</h2>
              <p className="mt-2 max-w-xs text-sm font-semibold text-text-muted">
                {t("cart.drawerEmptyMessage")}
              </p>
            </div>
          ) : (
            <motion.div
              className="space-y-4 sm:space-y-5"
              variants={{
                open: {
                  transition: {
                    staggerChildren: 0.06,
                    delayChildren: 0.1,
                  },
                },
              }}
              initial="closed"
              animate="open"
            >
              {validCartItems.map((item) => {
                const price = getEffectiveCartProductPrice(item.product);
                const originalPrice = Number(item.product?.price || 0);
                const discountPrice = Number(item.product?.discountPrice || 0);
                const hasDiscount = discountPrice > 0 && discountPrice < originalPrice;
                const discountPercent = hasDiscount
                  ? Math.round(((originalPrice - discountPrice) / originalPrice) * 100)
                  : 0;
                const productId = item.product._id;

                return (
                  <motion.article
                    key={getCartItemKey(item)}
                    className="grid grid-cols-[76px_1fr_auto] gap-3 sm:grid-cols-[96px_1fr_auto] sm:gap-4"
                    variants={{
                      closed: { opacity: 0, x: 24, y: 12 },
                      open: { opacity: 1, x: 0, y: 0 },
                    }}
                    transition={{ type: "spring", stiffness: 360, damping: 28 }}
                  >
                    <Link
                      to={`/products/${productId}`}
                      onClick={onClose}
                      className={`aspect-[3/4] overflow-hidden rounded-2xl border ${
                        isDark ? "border-slate-800 bg-slate-900" : "border-stone-100 bg-stone-50"
                      }`}
                    >
                      <img
                        src={item.product.image}
                        alt={item.product.title || item.product.name || t("cart.cartProduct")}
                        className="h-full w-full object-cover"
                      />
                    </Link>

                    <div className="min-w-0">
                      <Link
                        to={`/products/${productId}`}
                        onClick={onClose}
                        className="line-clamp-2 font-display text-sm font-black leading-snug text-text-main hover:text-primary sm:text-base"
                      >
                        {item.product.title || item.product.name || "Product"}
                      </Link>
                      {item.size && (
                        <p className="mt-1 text-xs font-bold uppercase tracking-widest text-text-muted">
                          {t("cart.sizeValue", { size: item.size })}
                        </p>
                      )}

                      <div className="mt-2 inline-flex items-center rounded-xl border border-stone-200 dark:border-slate-700 sm:mt-3">
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(productId, Math.max(1, item.quantity - 1), { size: item.size })}
                          disabled={item.quantity <= 1}
                          className="flex h-8 w-8 items-center justify-center text-text-muted transition-colors hover:text-primary disabled:opacity-40 sm:h-9 sm:w-9"
                          aria-label={t("cart.decrease")}
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="min-w-8 px-2 text-center text-sm font-black text-text-main sm:min-w-9">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(productId, item.quantity + 1, { size: item.size })}
                          className="flex h-8 w-8 items-center justify-center text-text-muted transition-colors hover:text-primary sm:h-9 sm:w-9"
                          aria-label={t("cart.increase")}
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="mt-2 space-y-1 sm:mt-3">
                        {hasDiscount && (
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-bold text-text-muted line-through">
                              ${(originalPrice * item.quantity).toFixed(2)}
                            </span>
                            <span className="rounded-full bg-[#FF3B30] px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-white shadow-sm shadow-[#FF3B30]/30">
                              {t("cart.discountOff", { percent: discountPercent })}
                            </span>
                          </div>
                        )}
                        <p className="text-sm font-black text-primary">
                          ${(price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onRemove(productId, { size: item.size })}
                      className="self-start rounded-full p-1.5 text-text-muted transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 sm:p-2"
                      aria-label={t("cart.removeItem")}
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </motion.article>
                );
              })}
            </motion.div>
          )}
        </div>

        {validCartItems.length > 0 && (
          <motion.footer
            className={`shrink-0 border-t px-4 py-4 sm:px-5 sm:py-5 ${
              isDark ? "border-slate-800" : "border-stone-200"
            }`}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.16, duration: 0.24 }}
          >
            <div className="space-y-2 text-sm sm:space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-text-muted">{t("cart.subtotal")}</span>
                <span className="font-black text-text-main">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-text-muted">{t("cart.shipping")}</span>
                <span className="font-black text-text-main">{t("cart.calculatedAtCheckout")}</span>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-stone-200 pt-3 dark:border-slate-800 sm:mt-5 sm:pt-4">
              <span className="font-display text-lg font-black text-text-main">{t("cart.total")}</span>
              <span className="font-display text-xl font-black text-text-main">${subtotal.toFixed(2)}</span>
            </div>

            <Link
              to="/customer/checkout"
              onClick={onClose}
              className="mt-4 flex items-center justify-center rounded-2xl border-2 border-primary bg-primary px-5 py-3.5 text-sm font-black uppercase tracking-[0.18em] text-white shadow-lg shadow-primary/20 transition-colors hover:border-primary-dark hover:bg-primary-dark dark:border-primary-light dark:bg-primary dark:text-white dark:hover:border-primary-light dark:hover:bg-primary-light sm:mt-5 sm:py-4"
            >
              {t("cart.checkout")}
            </Link>
          </motion.footer>
        )}
      </motion.aside>
    </div>
  );
};
