import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useToast } from "./ToastContext";
import { WishlistController } from "../controllers/wishlistController.js";
import { useAuth } from "./useAuth";
import { WishlistContext } from "./wishlist-context";
import { useLanguage } from "./useLanguage";
import { getLocalizedProductText } from "../utils/productLocalization";
import { withGlobalLoading } from "../services/loadingIndicator";

const isPortalRoute = (pathname = "") =>
  pathname.startsWith("/admin") ||
  pathname.startsWith("/seller") ||
  pathname.startsWith("/delivery");

export const WishlistProvider = ({ children }) => {
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const userToken = user?.token;
  const { pathname } = useLocation();
  const canUseCustomerWishlist = Boolean(userToken) && !isPortalRoute(pathname);
  const { success, error: toastError, info } = useToast();
  const { language, t } = useLanguage();

  // Load wishlist from backend when user logs in
  useEffect(() => {
    const loadWishlist = async () => {
      if (canUseCustomerWishlist) {
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
  }, [canUseCustomerWishlist]);

  // Add to wishlist
  const addToWishlist = async (product) => {
    if (!canUseCustomerWishlist) {
      info(t("wishlistAlerts.loginRequired"), t("wishlistAlerts.loginToAdd"));
      return;
    }

    try {
      const productLabel = getLocalizedProductText(product, language).title || t("wishlistAlerts.thisProduct");
      const result = await withGlobalLoading(
        () => WishlistController.addToWishlist(product),
        "wishlist-add"
      );
      if (!result.success) {
        throw new Error(result.error);
      }

      setWishlist(result.data || []);
      success(
        t("wishlistAlerts.savedTitle"),
        t("wishlistAlerts.savedMessage", { product: productLabel })
      );
    } catch (error) {
      console.error("Error adding to wishlist:", error);
      toastError(t("wishlistAlerts.actionFailed"), t("wishlistAlerts.addFailed"));
    }
  };

  // Remove from wishlist
  const removeFromWishlist = async (productId) => {
    if (!canUseCustomerWishlist) return;

    try {
      const result = await withGlobalLoading(
        () => WishlistController.removeFromWishlist(productId),
        "wishlist-remove"
      );
      if (!result.success) {
        throw new Error(result.error);
      }

      setWishlist(result.data || []);
      info(t("wishlistAlerts.removedTitle"), t("wishlistAlerts.removedMessage"));
    } catch (error) {
      console.error("Error removing from wishlist:", error);
      toastError(t("wishlistAlerts.removeFailedTitle"), t("wishlistAlerts.removeFailed"));
    }
  };

  // Check if product is in wishlist
  const isInWishlist = (id) => {
    return WishlistController.isInWishlist(wishlist, id);
  };

  // Toggle wishlist (add if not present, remove if present)
  const toggleWishlist = async (product) => {
    if (!canUseCustomerWishlist) {
      info(t("wishlistAlerts.loginRequired"), t("wishlistAlerts.loginToManage"));
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
