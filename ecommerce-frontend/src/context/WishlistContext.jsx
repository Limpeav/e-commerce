import { useState, useEffect } from "react";
import { useToast } from "./ToastContext";
import { WishlistController } from "../controllers/index.js";
import { useAuth } from "./useAuth";
import { WishlistContext } from "./wishlist-context";

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
          const result = await WishlistController.getWishlist();
          setWishlist(result.success ? result.data || [] : []);
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
      const result = await WishlistController.addToWishlist(product);
      if (!result.success) {
        throw new Error(result.error);
      }

      setWishlist(result.data || []);
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
      const result = await WishlistController.removeFromWishlist(productId);
      if (!result.success) {
        throw new Error(result.error);
      }

      setWishlist(result.data || []);
      info("Removed from Wishlist", "Item has been removed from your wishlist.");
    } catch (error) {
      console.error("Error removing from wishlist:", error);
      toastError("Remove Failed", "Could not remove item from wishlist.");
    }
  };

  // Check if product is in wishlist
  const isInWishlist = (id) => {
    return WishlistController.isInWishlist(wishlist, id);
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
