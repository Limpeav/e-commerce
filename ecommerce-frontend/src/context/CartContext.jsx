import { useState, useEffect } from "react";
import { useToast } from "./ToastContext";
import { CartController } from "../controllers/index.js";
import { useAuth } from "./useAuth";
import { CartContext } from "./cart-context";

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const userToken = user?.token;
  const { success, error: toastError, info } = useToast();

  // Load cart from backend when user logs in
  useEffect(() => {
    const loadCart = async () => {
      if (userToken) {
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
  }, [userToken]);

  // Add to cart
  const addToCart = async (product, quantity = 1, options = {}) => {
    if (!userToken) {
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
    if (!userToken) return;

    try {
      const result = await CartController.updateQuantity(productId, newQuantity, options);
      if (!result.success) {
        throw new Error(result.error);
      }

      setCart(result.data || []);
    } catch (error) {
      console.error("Error updating quantity:", error);
      toastError("Update Failed", "Could not update item quantity.");
    }
  };

  // Remove from cart
  const removeFromCart = async (productId, options = {}) => {
    if (!userToken) return;

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
    if (!userToken) return;

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
