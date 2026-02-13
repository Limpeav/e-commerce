import { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { useToast } from "./ToastContext";
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
  const { success, error: toastError, info } = useToast();

  // Load wishlist from backend when user logs in
  useEffect(() => {
    const loadWishlist = async () => {
      if (user) {
        try {
          const wishlistData = await fetchWishlist();
          setWishlist(Array.isArray(wishlistData) ? wishlistData : wishlistData.products || []);
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
      info("Login Required", "Please login to add items to your wishlist");
      return;
    }

    try {
      await addItemToWishlist(product._id);

      const updatedWishlist = await fetchWishlist();
      setWishlist(updatedWishlist.products || []);
      success("Saved to Wishlist", `${product.name} has been saved.`);
    } catch (error) {
      console.error("Error adding to wishlist:", error);
      toastError("Action Failed", "Could not add item to wishlist.");
    }
  };

  // Remove from wishlist
  const removeFromWishlist = async (productId) => {
    if (!user) return;

    try {
      await removeItemFromWishlist(productId);

      const updatedWishlist = await fetchWishlist();
      setWishlist(updatedWishlist.products || []);
      info("Removed from Wishlist", "Item has been removed from your wishlist.");
    } catch (error) {
      console.error("Error removing from wishlist:", error);
      toastError("Remove Failed", "Could not remove item from wishlist.");
    }
  };

  // Check if product is in wishlist
  const isInWishlist = (id) => {
    return wishlist.some((item) => item._id === id);
  };

  // Toggle wishlist (add if not present, remove if present)
  const toggleWishlist = async (product) => {
    if (!user) {
      info("Login Required", "Please login to manage your wishlist");
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