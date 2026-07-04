import { useState, useEffect, useMemo, useCallback, useDeferredValue } from 'react';
import { ProductController } from '../controllers/productController';
import {
  PRODUCT_CATEGORY_ALIASES,
  PRODUCT_CATEGORY_OPTIONS_WITH_ALL,
  isRemovedProductCategory,
  normalizeProductCategory,
} from "../constants/productCategories";
import {
  subscribeRealtimeDomains,
  subscribeRealtimeEvent,
} from "../services/realtime";

let cachedProducts = [];
let productsRequest = null;

const loadProducts = async () => {
  if (!productsRequest) {
    productsRequest = ProductController.getProducts({ limit: "200" }).finally(() => {
      productsRequest = null;
    });
  }

  return productsRequest;
};

export const useProducts = (language = "en", user = null) => {
  const [products, setProducts] = useState(() => cachedProducts);
  const [recommendedProducts, setRecommendedProducts] = useState([]);
  const [recommendationSource, setRecommendationSource] = useState("none");
  const [loading, setLoading] = useState(() => cachedProducts.length === 0);
  const [error, setError] = useState("");
  const [translatingMissingKhmer, setTranslatingMissingKhmer] = useState(false);
  const userId = user?._id || user?.id || "";

  const fetchProducts = useCallback(async ({ silent = false } = {}) => {
      try {
        if (!silent) setLoading(true);
        const result = await loadProducts();
        if (result.success) {
          cachedProducts = result.data?.products || result.data || [];
          setProducts(cachedProducts);
          setError("");
        } else if (!silent || cachedProducts.length === 0) {
          setError(result.error || "Failed to fetch products");
        }
      } catch (err) {
        if (!silent || cachedProducts.length === 0) {
          setError("An error occurred while fetching products");
        }
        console.error("Error fetching products:", err);
      } finally {
        if (!silent) setLoading(false);
      }
  }, []);

  const fetchRecommendations = useCallback(async () => {
    if (!userId) {
      setRecommendedProducts([]);
      setRecommendationSource("none");
      return;
    }

    try {
      const result = await ProductController.getPersonalizedRecommendations();
      if (result.success) {
        setRecommendedProducts(result.data?.products || []);
        setRecommendationSource(result.data?.source || "none");
      } else {
        setRecommendedProducts([]);
        setRecommendationSource("none");
      }
    } catch (err) {
      setRecommendedProducts([]);
      setRecommendationSource("none");
      console.error("Error fetching personalized recommendations:", err);
    }
  }, [userId]);

  useEffect(() => {
    fetchProducts({ silent: cachedProducts.length > 0 });
    const unsubscribeProducts = subscribeRealtimeDomains(
      ["products", "reviews"],
      () => fetchProducts({ silent: true })
    );
    const unsubscribeLanguage = subscribeRealtimeEvent(
      "language:changed",
      () => fetchProducts({ silent: true })
    );

    return () => {
      unsubscribeProducts();
      unsubscribeLanguage();
    };
  }, [fetchProducts]);

  useEffect(() => {
    fetchRecommendations();

    if (!userId) return undefined;

    const unsubscribeProducts = subscribeRealtimeDomains(
      ["products", "orders"],
      () => fetchRecommendations()
    );

    return () => {
      unsubscribeProducts();
    };
  }, [fetchRecommendations, userId]);

  useEffect(() => {
    const hasMissingKhmerProducts =
      products.length > 0 &&
      products.some(
        (product) =>
          (product.title && !product.titleKm) ||
          (product.description && !product.descriptionKm)
      );

    if (language !== "kh" || !hasMissingKhmerProducts || translatingMissingKhmer) {
      return;
    }

    setTranslatingMissingKhmer(true);
    const timeout = window.setTimeout(async () => {
      try {
        const result = await ProductController.translateMissingProductsToKhmer();
        if (result.success) {
          cachedProducts = result.data || [];
          setProducts(cachedProducts);
        }
      } finally {
        setTranslatingMissingKhmer(false);
      }
    }, 500);

    return () => window.clearTimeout(timeout);
  }, [language, products, translatingMissingKhmer]);

  return {
    products,
    recommendedProducts,
    recommendationSource,
    loading,
    error,
    setProducts,
    refetch: fetchProducts,
  };
};

export const usePaginatedProducts = (initialParams = {}) => {
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [params, setParams] = useState(initialParams);

  const fetchProducts = useCallback(async (overrideParams) => {
    setLoading(true);
    const merged = { ...params, ...overrideParams };
    const result = await ProductController.getProducts(merged);

    if (result.success) {
      const { products: data, page: p, totalPages: tp, total: t } = result.data;
      setProducts(data);
      setPage(p || 1);
      setTotalPages(tp || 1);
      setTotal(t || 0);
      setError("");
    } else {
      setError(result.error || "Failed to fetch products");
    }

    setLoading(false);
  }, [params]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const updateParams = useCallback((newParams) => {
    setParams((prev) => {
      const next = { ...prev, ...newParams };
      if (JSON.stringify(next) !== JSON.stringify(prev)) {
        return next;
      }
      return prev;
    });
  }, []);

  const goToPage = useCallback((p) => {
    updateParams({ page: String(p) });
  }, [updateParams]);

  return {
    products,
    page,
    totalPages,
    total,
    loading,
    error,
    params,
    setParams: updateParams,
    goToPage,
    refetch: fetchProducts,
  };
};

export const useProductFilters = (products) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const deferredSearchQuery = useDeferredValue(searchQuery);

  const categories = useMemo(() => {
    const productCategories = [
      ...new Set(
        products
          .map((p) => normalizeProductCategory(p.category))
          .filter((category) => category && !isRemovedProductCategory(category))
      ),
    ];
    const remainingCategories = productCategories.filter(
      (category) => !PRODUCT_CATEGORY_OPTIONS_WITH_ALL.includes(category)
    );
    return [...PRODUCT_CATEGORY_OPTIONS_WITH_ALL, ...remainingCategories];
  }, [products]);

  const filteredProducts = useMemo(() => {
    let result = products;

    if (selectedCategory !== "All") {
      const acceptedCategories =
        PRODUCT_CATEGORY_ALIASES[selectedCategory] || [selectedCategory];
      result = result.filter((p) =>
        acceptedCategories.includes(normalizeProductCategory(p.category))
      );
    }

    if (deferredSearchQuery) {
      const query = deferredSearchQuery.toLowerCase();
      result = result.filter(p =>
        String(p.name || p.title || "").toLowerCase().includes(query) ||
        (p.description && p.description.toLowerCase().includes(query))
      );
    }

    return result;
  }, [products, selectedCategory, deferredSearchQuery]);

  return {
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    categories,
    filteredProducts
  };
};
