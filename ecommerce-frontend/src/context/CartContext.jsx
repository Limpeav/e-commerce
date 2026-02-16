import { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { useToast } from "./ToastContext";
import {
  fetchCart,
  addItemToCart,
  updateCartItemQuantity,
  removeItemFromCart,
  clearUserCart,
} from "../services/cartApi";

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { success, error: toastError, info } = useToast();

  // Load cart from backend when user logs in
  useEffect(() => {
    const loadCart = async () => {
      if (user) {
        try {
          const cartData = await fetchCart();
          setCart(cartData.items || []);
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
  }, [user]);

  // Add to cart
  const addToCart = async (product, quantity = 1) => {
    if (!user) {
      info("Login Required", "Please login to add items to your cart");
      return;
    }

    try {
      const availableStock = Number(product?.stock ?? Infinity);
      const safeQuantity = Number.isFinite(availableStock)
        ? Math.min(Number(quantity || 1), Math.max(availableStock, 0))
        : Number(quantity || 1);

      if (safeQuantity < 1) {
        toastError("Out of Stock", "This product is currently out of stock.");
        return;
      }

      const productData = {
        productId: product._id,
        quantity: safeQuantity,
      };

      await addItemToCart(productData);

      const updatedCart = await fetchCart();
      setCart(updatedCart.items || []);

      success("Added to Cart", `${product.title || product.name} has been added to your cart.`);
    } catch (error) {
      console.error("Error adding to cart:", error);
      toastError(
        "Action Failed",
        error?.response?.data?.message || "Could not add item to cart. Please try again."
      );
    }
  };

  // Update quantity
  const updateQuantity = async (productId, newQuantity) => {
    if (!user) return;

    try {
      const cartItem = cart.find((item) => item.product?._id === productId);
      const availableStock = Number(cartItem?.product?.stock ?? Infinity);
      const cappedQuantity = Number.isFinite(availableStock)
        ? Math.min(newQuantity, Math.max(availableStock, 1))
        : newQuantity;

      if (Number.isFinite(availableStock) && newQuantity > availableStock) {
        info("Stock Limit", `Only ${availableStock} item(s) currently available.`);
      }

      const updatedCart = await updateCartItemQuantity(productId, cappedQuantity);
      setCart(updatedCart.items || []);
    } catch (error) {
      console.error("Error updating quantity:", error);
      toastError(
        "Update Failed",
        error?.response?.data?.message || "Could not update item quantity."
      );
    }
  };

  // Remove from cart
  const removeFromCart = async (productId) => {
    if (!user) return;

    try {
      const updatedCart = await removeItemFromCart(productId);
      setCart(updatedCart.items || []);
      info("Item Removed", "Item has been removed from your cart.");
    } catch (error) {
      console.error("Error removing item:", error);
      toastError("Remove Failed", "Could not remove item from cart.");
    }
  };

  // Clear cart
  const clearCart = async () => {
    if (!user) return;

    try {
      await clearUserCart();
      setCart([]);
      info("Cart Cleared", "All items have been removed from your cart.");
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

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
};
