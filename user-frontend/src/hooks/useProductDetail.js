import { useCallback, useEffect, useState } from "react";
import { ProductController } from "../controllers/productController";
import {
  subscribeRealtimeDomains,
  subscribeRealtimeEvent,
} from "../services/realtime";

export const useProductDetail = (id, user, language = "en") => {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProduct = useCallback(async ({ silent = false } = {}) => {
    try {
      if (!silent) setLoading(true);
      setError(null);
      const result = await ProductController.getProductDetail(id, user);

      if (!result.success) {
        throw new Error(result.error || "Failed to fetch product");
      }

      setProduct(result.data);
    } catch (err) {
      setError(err.message || "Failed to fetch product");
      console.error("Failed to fetch product", err);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [id, user]);

  useEffect(() => {
    if (id) {
      fetchProduct();
    }
  }, [id, fetchProduct]);

  useEffect(() => {
    if (!id) return undefined;

    const refreshProduct = (payload) => {
      if (!payload?.productId || String(payload.productId) === String(id)) {
        fetchProduct({ silent: true });
      }
    };
    const unsubscribeProducts = subscribeRealtimeDomains(
      ["products"],
      refreshProduct
    );
    const unsubscribeLanguage = subscribeRealtimeEvent(
      "language:changed",
      () => fetchProduct({ silent: true })
    );

    return () => {
      unsubscribeProducts();
      unsubscribeLanguage();
    };
  }, [fetchProduct, id]);

  useEffect(() => {
    const translateMissingKhmerText = async () => {
      const isMissingTitle = product?.title && !product.titleKm;
      const isMissingDescription = product?.description && !product.descriptionKm;

      if (
        language !== "kh" ||
        !product?._id ||
        (!isMissingTitle && !isMissingDescription)
      ) {
        return;
      }

      const result = await ProductController.translateProductToKhmer(product._id);
      if (result.success) {
        setProduct(result.data);
      }
    };

    translateMissingKhmerText();
  }, [
    language,
    product?._id,
    product?.title,
    product?.titleKm,
    product?.description,
    product?.descriptionKm,
  ]);

  return { product, loading, error, refetch: fetchProduct };
};
