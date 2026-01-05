import { createContext, useContext, useState } from "react";

const WishlistContext = createContext();

export const WishlistProvider = ({ children }) => {
  const [wishlist, setWishlist] = useState([]);

  // Add to wishlist
  const addToWishlist = (product) => {
    setWishlist((prev) => {
      const existing = prev.find((item) => item._id === product._id);
      if (existing) {
        // Already in wishlist, don't add again
        return prev;
      }
      return [...prev, product];
    });
  };

  // Remove from wishlist
  const removeFromWishlist = (id) => {
    setWishlist((prev) => prev.filter((item) => item._id !== id));
  };

  // Check if product is in wishlist
  const isInWishlist = (id) => {
    return wishlist.some((item) => item._id === id);
  };

  // Toggle wishlist (add if not present, remove if present)
  const toggleWishlist = (product) => {
    if (isInWishlist(product._id)) {
      removeFromWishlist(product._id);
    } else {
      addToWishlist(product);
    }
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
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