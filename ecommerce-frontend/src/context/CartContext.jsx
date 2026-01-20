import { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
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
      alert("Please login to add items to cart");
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
    } catch (error) {
      console.error("Error adding to cart:", error);
      alert("Failed to add item to cart");
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
      alert("Failed to update quantity");
    }
  };

  // Remove from cart
  const removeFromCart = async (productId) => {
    if (!user) return;

    try {
      const updatedCart = await removeItemFromCart(productId);
      setCart(updatedCart.items || []);
    } catch (error) {
      console.error("Error removing item:", error);
      alert("Failed to remove item");
    }
  };

  // Clear cart
  const clearCart = async () => {
    if (!user) return;

    try {
      await clearUserCart();
      setCart([]);
    } catch (error) {
      console.error("Error clearing cart:", error);
      alert("Failed to clear cart");
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
