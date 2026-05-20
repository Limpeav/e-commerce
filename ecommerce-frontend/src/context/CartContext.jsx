import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useToast } from "./ToastContext";
import { CartController } from "../controllers/index.js";
import { useAuth } from "./useAuth";
import { CartContext } from "./cart-context";

const isPortalRoute = (pathname = "") =>
  pathname.startsWith("/admin") ||
  pathname.startsWith("/seller") ||
  pathname.startsWith("/delivery");

const normalizeCartSize = (size = "") => String(size || "").trim().toUpperCase();

const isSameCartItem = (item, productId, size = "") =>
  item.product?._id === productId && normalizeCartSize(item.size) === normalizeCartSize(size);

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const userToken = user?.token;
  const { pathname } = useLocation();
  const canUseCustomerCart = Boolean(userToken) && !isPortalRoute(pathname);
  const { success, error: toastError, info } = useToast();

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
      info("Login Required", "Please login to add items to your cart");
      return;
    }

    try {
      const productLabel = product?.title || product?.name || "This product";
      const result = await CartController.addToCart(product, quantity, options);
      if (!result.success) {
        throw new Error(result.error);
      }

      setCart(result.data || []);

      success(
        "Added to Cart",
        `${productLabel}${options.size ? ` (${options.size})` : ""} has been added to your cart.`
      );
    } catch (error) {
      console.error("Error adding to cart:", error);
      toastError("Action Failed", error.message || "Could not add item to cart. Please try again.");
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
      toastError("Update Failed", "Could not update item quantity.");
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
      info("Item Removed", "Item has been removed from your cart.");
    } catch (error) {
      console.error("Error removing item:", error);
      toastError("Remove Failed", "Could not remove item from cart.");
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
      toastError("Clear Failed", "Could not clear cart.");
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
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
