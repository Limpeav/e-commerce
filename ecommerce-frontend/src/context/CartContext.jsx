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
      const productData = {
        productId: product._id,
        quantity: quantity,
      };

      await addItemToCart(productData);

      const updatedCart = await fetchCart();
      setCart(updatedCart.items || []);

      success("Added to Cart", `${product.name} has been added to your cart.`);
    } catch (error) {
      console.error("Error adding to cart:", error);
      toastError("Action Failed", "Could not add item to cart. Please try again.");
    }
  };

  // Update quantity
  const updateQuantity = async (productId, newQuantity) => {
    if (!user) return;

    try {
      const updatedCart = await updateCartItemQuantity(productId, newQuantity);
      setCart(updatedCart.items || []);
    } catch (error) {
      console.error("Error updating quantity:", error);
      toastError("Update Failed", "Could not update item quantity.");
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
