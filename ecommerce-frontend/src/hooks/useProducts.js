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

  const categories = useMemo(() => {
    const allCategories = products.map(p => p.category).filter(Boolean);
    return ["All", ...new Set(allCategories)];
  }, [products]);

  const filteredProducts = useMemo(() => {
    let result = products;

    if (selectedCategory !== "All") {
      result = result.filter(p => p.category === selectedCategory);
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
