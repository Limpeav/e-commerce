import { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import {
  fetchWishlist,
  addItemToWishlist,
  removeItemFromWishlist,
} from "../services/wishlistApi";

const WishlistContext = createContext();

export const WishlistProvider = ({ children }) => {
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // Load wishlist from backend when user logs in
  useEffect(() => {
    const loadWishlist = async () => {
      if (user) {
        try {
          const wishlistData = await fetchWishlist();
          setWishlist(wishlistData.products || []);
        } catch (error) {
          console.error("Error loading wishlist:", error);
          setWishlist([]);
        }
      } else {
        // User logged out, clear wishlist
        setWishlist([]);
      }
      setLoading(false);
    };

    loadWishlist();
  }, [user]);

  // Add to wishlist
  const addToWishlist = async (product) => {
    if (!user) {
      alert("Please login to add items to wishlist");
      return;
    }

    try {
      await addItemToWishlist(product._id);

      const updatedWishlist = await fetchWishlist();
      setWishlist(updatedWishlist.products || []);
    } catch (error) {
      console.error("Error adding to wishlist:", error);
      alert("Failed to add item to wishlist");
    }
  };

  // Remove from wishlist
  const removeFromWishlist = async (productId) => {
    if (!user) return;

    try {
      await removeItemFromWishlist(productId);

      const updatedWishlist = await fetchWishlist();
      setWishlist(updatedWishlist.products || []);
    } catch (error) {
      console.error("Error removing from wishlist:", error);
      alert("Failed to remove item from wishlist");
    }
  };

  // Check if product is in wishlist
  const isInWishlist = (id) => {
    return wishlist.some((item) => item._id === id);
  };

  // Toggle wishlist (add if not present, remove if present)
  const toggleWishlist = async (product) => {
    if (!user) {
      alert("Please login to manage wishlist");
      return;
    }

    if (isInWishlist(product._id)) {
      await removeFromWishlist(product._id);
    } else {
      await addToWishlist(product);
    }
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        loading,
        addToWishlist,
        removeFromWishlist,
        isInWishlist,
        toggleWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => useContext(WishlistContext);