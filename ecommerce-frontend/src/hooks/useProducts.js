import { useState, useEffect, useMemo, useCallback } from 'react';
import { ProductController } from '../controllers/productController';
import {
  PRODUCT_CATEGORY_ALIASES,
  PRODUCT_CATEGORY_OPTIONS_WITH_ALL,
  isRemovedProductCategory,
  normalizeProductCategory,
} from "../constants/productCategories";
import { subscribeRealtimeDomains } from "../services/realtime";

export const useProducts = (language = "en") => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [translatingMissingKhmer, setTranslatingMissingKhmer] = useState(false);

  const fetchProducts = useCallback(async ({ silent = false } = {}) => {
      try {
        if (!silent) setLoading(true);
        const result = await ProductController.getProducts();
        if (result.success) {
          setProducts(result.data || []);
        } else {
          setError(result.error || "Failed to fetch products");
        }
      } catch (err) {
        setError("An error occurred while fetching products");
        console.error("Error fetching products:", err);
      } finally {
        if (!silent) setLoading(false);
      }
  }, []);

  useEffect(() => {
    fetchProducts();
    return subscribeRealtimeDomains(
      ["products", "reviews"],
      () => fetchProducts({ silent: true })
    );
  }, [fetchProducts]);

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
          setProducts(result.data || []);
        }
      } finally {
        setTranslatingMissingKhmer(false);
      }
    }, 500);

    return () => window.clearTimeout(timeout);
  }, [language, products, translatingMissingKhmer]);

  return { products, loading, error, setProducts };
};

export const useProductFilters = (products) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

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

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(p =>
        (p.name || p.title).toLowerCase().includes(query) ||
        (p.description && p.description.toLowerCase().includes(query))
      );
    }

    return result;
  }, [products, selectedCategory, searchQuery]);

  return {
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    categories,
    filteredProducts
  };
};
