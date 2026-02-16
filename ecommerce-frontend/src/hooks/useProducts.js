import { useState, useEffect, useMemo } from 'react';
import { ProductController } from '../controllers/productController';

export const useProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
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
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  return { products, loading, error, setProducts };
};

export const useProductFilters = (products) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedBrand, setSelectedBrand] = useState("All");
  const [selectedType, setSelectedType] = useState("All");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sortBy, setSortBy] = useState("latest");

  const categories = useMemo(() => {
    const allCategories = products.map(p => p.category).filter(Boolean);
    return ["All", ...new Set(allCategories)];
  }, [products]);

  const brands = useMemo(() => {
    const allBrands = products
      .map((product) => product.brand)
      .filter((brand) => typeof brand === "string" && brand.trim() !== "");
    return ["All", ...new Set(allBrands)];
  }, [products]);

  const types = useMemo(() => {
    const allTypes = products
      .map((product) => product.type)
      .filter((type) => typeof type === "string" && type.trim() !== "");
    return ["All", ...new Set(allTypes)];
  }, [products]);

  const filteredProducts = useMemo(() => {
    let result = [...products];

    if (selectedCategory !== "All") {
      result = result.filter(p => p.category === selectedCategory);
    }

    if (selectedBrand !== "All") {
      result = result.filter((product) => product.brand === selectedBrand);
    }

    if (selectedType !== "All") {
      result = result.filter((product) => product.type === selectedType);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(p =>
        (p.name || p.title).toLowerCase().includes(query) ||
        (p.description && p.description.toLowerCase().includes(query)) ||
        (p.brand && p.brand.toLowerCase().includes(query)) ||
        (p.type && p.type.toLowerCase().includes(query))
      );
    }

    if (minPrice !== "") {
      const value = Number(minPrice);
      if (Number.isFinite(value)) {
        result = result.filter((product) => Number(product.price) >= value);
      }
    }

    if (maxPrice !== "") {
      const value = Number(maxPrice);
      if (Number.isFinite(value)) {
        result = result.filter((product) => Number(product.price) <= value);
      }
    }

    if (inStockOnly) {
      result = result.filter((product) => Number(product.stock || 0) > 0);
    }

    if (sortBy === "price-asc") {
      result.sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
    } else if (sortBy === "price-desc") {
      result.sort((a, b) => Number(b.price || 0) - Number(a.price || 0));
    } else if (sortBy === "rating") {
      result.sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0));
    } else if (sortBy === "name") {
      result.sort((a, b) => (a.title || a.name || "").localeCompare(b.title || b.name || ""));
    } else if (sortBy === "stock-desc") {
      result.sort((a, b) => Number(b.stock || 0) - Number(a.stock || 0));
    } else {
      result.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    }

    return result;
  }, [
    products,
    selectedCategory,
    selectedBrand,
    selectedType,
    searchQuery,
    minPrice,
    maxPrice,
    inStockOnly,
    sortBy,
  ]);

  const resetFilters = () => {
    setSearchQuery("");
    setSelectedCategory("All");
    setSelectedBrand("All");
    setSelectedType("All");
    setMinPrice("");
    setMaxPrice("");
    setInStockOnly(false);
    setSortBy("latest");
  };

  return {
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    selectedBrand,
    setSelectedBrand,
    selectedType,
    setSelectedType,
    minPrice,
    setMinPrice,
    maxPrice,
    setMaxPrice,
    inStockOnly,
    setInStockOnly,
    sortBy,
    setSortBy,
    categories,
    brands,
    types,
    resetFilters,
    filteredProducts
  };
};
