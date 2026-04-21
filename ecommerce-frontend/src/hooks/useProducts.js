import { useState, useEffect, useMemo } from 'react';
import { ProductController } from '../controllers/productController';

const CATEGORY_ORDER = [
  "All",
  "Milk",
  "Toy",
  "Clothing",
  "Feeding & Nursing",
  "Diapering & Care",
  "Nursery & Decor",
  "Travel & Gear",
  "Bath & Skin",
  "Play & Learn",
];

const CATEGORY_ALIASES = {
  Clothing: ["Clothing", "Cloth"],
  Toy: ["Toy", "Toys"],
  Milk: ["Milk", "Formula", "Feeding & Nursing"],
  "Feeding & Nursing": ["Feeding & Nursing", "Feeding", "Nursing", "Milk"],
  "Diapering & Care": ["Diapering & Care", "Diaper", "Care"],
  "Nursery & Decor": ["Nursery & Decor", "Nursery", "Decor"],
  "Travel & Gear": ["Travel & Gear", "Travel", "Gear"],
  "Bath & Skin": ["Bath & Skin", "Bath", "Skin"],
  "Play & Learn": ["Play & Learn", "Play", "Learn", "Toy", "Toys"],
};

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
    const productCategories = [...new Set(products.map((p) => p.category).filter(Boolean))];
    const remainingCategories = productCategories.filter((category) => !CATEGORY_ORDER.includes(category));
    return [...CATEGORY_ORDER, ...remainingCategories];
  }, [products]);

  const filteredProducts = useMemo(() => {
    let result = products;

    if (selectedCategory !== "All") {
      const acceptedCategories = CATEGORY_ALIASES[selectedCategory] || [selectedCategory];
      result = result.filter((p) => acceptedCategories.includes(p.category));
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
