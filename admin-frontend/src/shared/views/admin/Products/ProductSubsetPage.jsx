import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import EmptyProductsState from "../../../components/admin/products/EmptyProductsState";
import ProductCard from "../../../components/admin/products/ProductCard";
import Loading from "../../../components/common/Loading";
import { normalizeProductCategory } from "../../../constants/productCategories";
import { AdminProductController } from "../../../controllers/adminProductController";
import {
  getAvailableStock,
  getNumericDiscount,
  getProductSoldCount,
} from "../../../utils/adminProducts";

const accentStyles = {
  emerald: {
    badge: "border-emerald-200 bg-emerald-50 text-emerald-700",
    hover: "hover:border-emerald-200 hover:text-emerald-700",
    count: "border-emerald-100 bg-emerald-50 text-emerald-700",
    ring: "focus:ring-emerald-500",
  },
  purple: {
    badge: "border-purple-200 bg-purple-50 text-purple-700",
    hover: "hover:border-purple-200 hover:text-purple-700",
    count: "border-purple-100 bg-purple-50 text-purple-700",
    ring: "focus:ring-purple-500",
  },
  orange: {
    badge: "border-orange-200 bg-orange-50 text-[#b45309]",
    hover: "hover:border-orange-200 hover:text-[#b45309]",
    count: "border-orange-200 bg-orange-50 text-[#b45309]",
    ring: "focus:ring-orange-500",
  },
  red: {
    badge: "border-[#fecdd3] bg-[#fff1f2] text-[#be123c]",
    hover: "hover:border-[#fecdd3] hover:text-[#be123c]",
    count: "border-[#fecdd3] bg-[#fff1f2] text-[#be123c]",
    ring: "focus:ring-[#e11d48]",
  },
};

const ProductSubsetPage = ({
  accent = "red",
  badge,
  countLabel,
  description,
  emptyHasActiveFilters,
  filterProduct,
  getSubsetProducts,
  icon: Icon,
  layout = "grid",
  loadingMessage,
  searchPlaceholder,
  sortProducts,
  title,
}) => {
  const [products, setProducts] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();
  const styles = accentStyles[accent] || accentStyles.red;

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      const result = await AdminProductController.getProducts();

      if (result.success) {
        setProducts(result.data);
        setError("");
      } else {
        setError(result.error);
      }

      setLoading(false);
    };

    fetchProducts();
  }, []);

  const subsetProducts = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const baseProducts =
      typeof getSubsetProducts === "function"
        ? getSubsetProducts(products)
        : products.filter(filterProduct);
    const sortedProducts =
      typeof sortProducts === "function" ? sortProducts(baseProducts) : baseProducts;

    return sortedProducts.filter((product) => {
      if (!normalizedSearch) return true;

      return (
        product.title?.toLowerCase().includes(normalizedSearch) ||
        product.titleKm?.toLowerCase().includes(normalizedSearch) ||
        product.category?.toLowerCase().includes(normalizedSearch)
      );
    });
  }, [filterProduct, getSubsetProducts, products, searchTerm, sortProducts]);

  const totalCount = useMemo(
    () =>
      typeof getSubsetProducts === "function"
        ? getSubsetProducts(products).length
        : products.filter(filterProduct).length,
    [filterProduct, getSubsetProducts, products]
  );

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this product?")) {
      return;
    }

    const result = await AdminProductController.deleteProduct(id);
    if (result.success) {
      setProducts((currentProducts) =>
        currentProducts.filter((product) => product._id !== id)
      );
      return;
    }

    alert(result.error);
  };

  if (loading) {
    return <Loading message={loadingMessage} />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <p className="text-red-800">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="border-b border-gray-200 bg-white shadow-lg">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => navigate("/admin/products")}
            className={`mb-5 inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition-colors ${styles.hover}`}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Products
          </button>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className={`mb-2 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wide ${styles.badge}`}>
                <Icon className="h-4 w-4" />
                {badge}
              </div>
              <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
              <p className="mt-1 text-sm text-gray-600">{description}</p>
            </div>

            <div className={`rounded-2xl border px-5 py-3 ${styles.count}`}>
              <p className="text-xs font-semibold uppercase tracking-wide">
                {countLabel}
              </p>
              <p className="text-3xl font-black">{totalCount}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 rounded-2xl border border-gray-100 bg-white p-6 shadow-lg">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className={`w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-12 pr-4 text-gray-900 transition-all duration-200 placeholder:text-gray-400 focus:border-transparent focus:bg-white focus:ring-2 ${styles.ring}`}
            />
          </div>
        </div>

        {subsetProducts.length === 0 ? (
          <EmptyProductsState
            hasActiveFilters={emptyHasActiveFilters ?? Boolean(searchTerm)}
            onAddProduct={() => navigate("/admin/products/add")}
          />
        ) : layout === "list" ? (
          <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px] text-left">
                <thead className="border-b border-gray-200 bg-gray-50">
                  <tr className="text-xs font-bold uppercase tracking-wide text-gray-600">
                    <th className="px-6 py-4">Product</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4">Price</th>
                    <th className="px-6 py-4">Sold</th>
                    <th className="px-6 py-4">Available</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {subsetProducts.map((product) => {
                    const price = Number(product.price) || 0;
                    const discountPrice = getNumericDiscount(product);

                    return (
                      <tr
                        key={product._id}
                        className="transition-colors hover:bg-orange-50/50"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-4">
                            <img
                              src={product.image}
                              alt={product.title}
                              className="h-14 w-14 rounded-xl border border-gray-200 object-cover"
                            />
                            <div>
                              <p className="max-w-xs font-semibold text-gray-900">
                                {product.title}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {normalizeProductCategory(product.category)}
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-semibold text-gray-900">
                            ${(discountPrice ?? price).toFixed(2)}
                          </p>
                          {discountPrice !== null && (
                            <p className="text-xs text-gray-400 line-through">
                              ${price.toFixed(2)}
                            </p>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex min-w-12 justify-center rounded-full bg-orange-100 px-3 py-1 text-sm font-bold text-[#b45309]">
                            {getProductSoldCount(product)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-emerald-700">
                          {getAvailableStock(product)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {subsetProducts.map((product) => (
              <ProductCard
                key={product._id}
                product={product}
                onEdit={(id) => navigate(`/admin/products/edit/${id}`)}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductSubsetPage;
