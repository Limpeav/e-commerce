import { createElement, useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  Boxes,
  CalendarDays,
  CheckCircle2,
  Clock,
  DollarSign,
  Image as ImageIcon,
  Package,
  Pencil,
  ShoppingBag,
  Sparkles,
  Star,
  Tag,
  Trash2,
  TrendingUp,
} from "lucide-react";
import Loading from "../../../components/common/Loading";
import { AdminProductController } from "../../../controllers/adminProductController";
import { normalizeProductCategory } from "../../../constants/productCategories";
import {
  getAvailableStock,
  getNumericDiscount,
  getProductPaidRevenue,
  getProductSoldCount,
  isBestSellerProduct,
  isLowStockProduct,
  isOutOfStockProduct,
  isProductIssue,
} from "../../../utils/adminProducts";
import {
  formatExpiryDate,
  productSupportsExpiry,
} from "../../../utils/productExpiry";
import { subscribeRealtimeDomains } from "../../../services/realtime";

const colorSwatches = {
  black: "#111827",
  white: "#ffffff",
  gray: "#9ca3af",
  grey: "#9ca3af",
  red: "#ef4444",
  blue: "#2563eb",
  green: "#16a34a",
  yellow: "#facc15",
  pink: "#ec4899",
  purple: "#9333ea",
  orange: "#f97316",
  brown: "#92400e",
  cream: "#f5f5dc",
  navy: "#1e3a8a",
};

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number(value || 0));

const formatNumber = (value) =>
  new Intl.NumberFormat("en-US").format(Number(value || 0));

const formatDateTime = (value) => {
  if (!value) return "Not recorded";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not recorded";

  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
};

const getTotalReservedStock = (product = {}) => {
  if (Array.isArray(product.sizeStocks) && product.sizeStocks.length > 0) {
    return product.sizeStocks.reduce(
      (total, entry) => total + Number(entry?.reservedStock || 0),
      0
    );
  }

  return Number(product.reservedStock || 0);
};

const getVariantAvailableStock = (entry = {}) =>
  Math.max(0, Number(entry.stock || 0) - Number(entry.reservedStock || 0));

const getMarginDetails = (product = {}) => {
  const price = Number(product.price || 0);
  const discountPrice = getNumericDiscount(product);
  const sellPrice = discountPrice ?? price;
  const costPrice = Number(product.costPrice || 0);

  if (!Number.isFinite(costPrice) || costPrice <= 0 || sellPrice <= 0) {
    return null;
  }

  const grossProfit = sellPrice - costPrice;

  return {
    costPrice,
    grossProfit,
    marginPercent: (grossProfit / sellPrice) * 100,
  };
};

const getExpiryStatus = (product = {}) => {
  const category = normalizeProductCategory(product.category);
  if (!productSupportsExpiry(category) || !product.expiryDate) return null;

  const dateOnly = String(product.expiryDate).slice(0, 10);
  const expiryTime = new Date(`${dateOnly}T23:59:59`).getTime();
  if (!Number.isFinite(expiryTime)) return null;

  const daysRemaining = Math.ceil((expiryTime - Date.now()) / 86400000);

  if (daysRemaining < 0) {
    return {
      label: "Expired",
      className: "border-red-200 bg-red-50 text-red-700",
    };
  }

  if (daysRemaining <= 30) {
    return {
      label: `${daysRemaining} day${daysRemaining === 1 ? "" : "s"} left`,
      className: "border-amber-200 bg-amber-50 text-[#b45309]",
    };
  }

  return {
    label: "Expiry tracked",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
  };
};

const getColorSwatchStyle = (color = "") => ({
  backgroundColor: colorSwatches[String(color).trim().toLowerCase()] || "#e5e7eb",
});

const StatCard = ({ icon, label, value, detail, tone = "blue" }) => {
  const tones = {
    blue: "bg-blue-50 text-blue-700",
    emerald: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-[#b45309]",
    red: "bg-red-50 text-red-700",
    gray: "bg-gray-100 text-gray-700",
  };

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-lg">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-500">{label}</p>
          <p className="mt-1 truncate text-2xl font-black text-gray-900">{value}</p>
          {detail ? (
            <p className="mt-2 text-xs font-semibold text-gray-500">{detail}</p>
          ) : null}
        </div>
        <span className={`rounded-xl p-3 ${tones[tone] || tones.blue}`}>
          {createElement(icon, { className: "h-6 w-6" })}
        </span>
      </div>
    </div>
  );
};

const StatusBadge = ({ children, className = "border-gray-200 bg-gray-50 text-gray-700" }) => (
  <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold ${className}`}>
    {children}
  </span>
);

const InfoRow = ({ label, value }) => (
  <div className="flex flex-col gap-1 border-b border-gray-100 py-3 last:border-b-0 sm:flex-row sm:items-start sm:justify-between">
    <dt className="text-sm font-semibold text-gray-500">{label}</dt>
    <dd className="break-words text-sm font-bold text-gray-900 sm:max-w-[70%] sm:text-right">
      {value || "Not set"}
    </dd>
  </div>
);

const AdminProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const returnTo =
    typeof location.state?.returnTo === "string" &&
    location.state.returnTo.startsWith("/admin/products") &&
    !location.state.returnTo.startsWith("//")
      ? location.state.returnTo
      : "/admin/products";

  const fetchProduct = useCallback(
    async ({ silent = false } = {}) => {
      if (!silent) setLoading(true);

      const result = await AdminProductController.getProductById(id);
      if (result.success) {
        setProduct(result.data);
        setError("");
      } else {
        setError(result.error);
      }

      if (!silent) setLoading(false);
    },
    [id]
  );

  useEffect(() => {
    let isMounted = true;
    Promise.resolve().then(() => {
      if (isMounted) {
        fetchProduct();
      }
    });

    const unsubscribe = subscribeRealtimeDomains(
      ["products", "reviews"],
      () => fetchProduct({ silent: true })
    );

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [fetchProduct]);

  const handleBack = () => {
    navigate(returnTo);
  };

  const handleEdit = () => {
    navigate(`/admin/products/edit/${id}`, {
      state: {
        returnTo: `/admin/products/${id}`,
      },
    });
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this product?")) {
      return;
    }

    const result = await AdminProductController.deleteProduct(id);
    if (result.success) {
      navigate(returnTo, { replace: true });
      return;
    }

    alert(result.error);
  };

  const latestReviews = useMemo(() => {
    const reviews = Array.isArray(product?.reviews) ? product.reviews : [];

    return [...reviews]
      .sort(
        (a, b) =>
          new Date(b.updatedAt || b.createdAt || 0).getTime() -
          new Date(a.updatedAt || a.createdAt || 0).getTime()
      )
      .slice(0, 5);
  }, [product]);

  if (loading) {
    return <Loading message="Loading product details..." />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md rounded-2xl border border-red-200 bg-red-50 p-6">
          <p className="font-bold text-red-800">{error}</p>
          <button
            type="button"
            onClick={handleBack}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-red-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Products
          </button>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-lg">
          <p className="font-bold text-gray-800">Product not found</p>
        </div>
      </div>
    );
  }

  const category = normalizeProductCategory(product.category);
  const price = Number(product.price || 0);
  const discountPrice = getNumericDiscount(product);
  const sellPrice = discountPrice ?? price;
  const totalStock = Number(product.stock || 0);
  const reservedStock = getTotalReservedStock(product);
  const availableStock = getAvailableStock(product);
  const sold = getProductSoldCount(product);
  const paidRevenue = getProductPaidRevenue(product);
  const isOutOfStock = isOutOfStockProduct(product);
  const isLowStock = isLowStockProduct(product);
  const hasProductIssue = isProductIssue(product);
  const isBestSeller = isBestSellerProduct(product);
  const margin = getMarginDetails(product);
  const expiryStatus = getExpiryStatus(product);
  const colors = Array.isArray(product.colors) ? product.colors.filter(Boolean) : [];
  const sizeStocks = Array.isArray(product.sizeStocks) ? product.sizeStocks : [];
  const reviewCount = Number(product.numReviews || product.reviews?.length || 0);
  const averageRating = Number(product.rating || 0);
  const statusTone = isOutOfStock ? "red" : isLowStock ? "amber" : "emerald";

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="sticky top-0 z-30 border-b border-gray-200 bg-white/95 shadow-lg backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:border-blue-200 hover:text-blue-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Products
          </button>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleEdit}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white shadow-md transition-colors hover:bg-blue-700"
            >
              <Pencil className="h-4 w-4" />
              Edit
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white shadow-md transition-colors hover:bg-red-700"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
          </div>
        </div>
      </div>

      <div className="border-b border-gray-200 bg-white shadow-lg">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <StatusBadge className="border-blue-200 bg-blue-50 text-blue-700">
                  {category}
                </StatusBadge>
                <StatusBadge
                  className={
                    isOutOfStock
                      ? "border-red-200 bg-red-50 text-red-700"
                      : isLowStock
                        ? "border-amber-200 bg-amber-50 text-[#b45309]"
                        : "border-emerald-200 bg-emerald-50 text-emerald-700"
                  }
                >
                  {isOutOfStock ? "Sold Out" : isLowStock ? "Low Stock" : "In Stock"}
                </StatusBadge>
                {hasProductIssue ? (
                  <StatusBadge className="border-orange-200 bg-orange-50 text-[#b45309]">
                    Product Issue
                  </StatusBadge>
                ) : null}
                {discountPrice !== null ? (
                  <StatusBadge className="border-red-200 bg-red-50 text-red-700">
                    Promotion
                  </StatusBadge>
                ) : null}
                {product.isNewArrival ? (
                  <StatusBadge className="border-purple-200 bg-purple-50 text-purple-700">
                    New Arrival
                  </StatusBadge>
                ) : null}
                {isBestSeller ? (
                  <StatusBadge className="border-emerald-200 bg-emerald-50 text-emerald-700">
                    Best Seller
                  </StatusBadge>
                ) : null}
                {expiryStatus ? (
                  <StatusBadge className={expiryStatus.className}>
                    {expiryStatus.label}
                  </StatusBadge>
                ) : null}
              </div>
              <h1 className="text-3xl font-black text-gray-900">{product.title}</h1>
              <p className="mt-2 break-all text-xs font-semibold uppercase text-gray-400">
                Product ID: {product._id}
              </p>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-gray-50 px-5 py-4">
              <p className="text-sm font-semibold text-gray-500">Current Price</p>
              <div className="mt-1 flex flex-wrap items-baseline gap-2">
                <p className="text-3xl font-black text-gray-900">
                  {formatCurrency(sellPrice)}
                </p>
                {discountPrice !== null ? (
                  <>
                    <p className="text-sm font-bold text-gray-400 line-through">
                      {formatCurrency(price)}
                    </p>
                    <span className="rounded bg-red-600 px-2 py-1 text-xs font-black text-white">
                      {Math.round(((price - discountPrice) / price) * 100)}% OFF
                    </span>
                  </>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            icon={Boxes}
            label="Available Stock"
            value={formatNumber(availableStock)}
            detail={`${formatNumber(totalStock)} total, ${formatNumber(reservedStock)} reserved`}
            tone={statusTone}
          />
          <StatCard
            icon={ShoppingBag}
            label="Sold"
            value={formatNumber(sold)}
            detail={`${formatCurrency(paidRevenue)} paid revenue`}
            tone="amber"
          />
          <StatCard
            icon={Star}
            label="Reviews"
            value={`${averageRating.toFixed(1)} / 5`}
            detail={`${formatNumber(reviewCount)} review${reviewCount === 1 ? "" : "s"}`}
            tone="blue"
          />
          <StatCard
            icon={TrendingUp}
            label="Gross Margin"
            value={margin ? `${margin.marginPercent.toFixed(1)}%` : "Not set"}
            detail={margin ? `${formatCurrency(margin.grossProfit)} profit each` : "Add cost price to track margin"}
            tone={margin && margin.grossProfit < 0 ? "red" : "emerald"}
          />
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-lg">
            <div className="mb-4 flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-blue-600" />
              <h2 className="text-lg font-black text-gray-900">Image</h2>
            </div>
            <div className="flex aspect-square items-center justify-center overflow-hidden rounded-xl border border-gray-100 bg-gray-50 p-4">
              {product.image ? (
                <img
                  src={product.image}
                  alt={product.title}
                  className="h-full w-full object-contain"
                />
              ) : (
                <Package className="h-16 w-16 text-gray-300" />
              )}
            </div>
          </section>

          <div className="space-y-8">
            <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-lg">
              <div className="mb-4 flex items-center gap-2">
                <Package className="h-5 w-5 text-blue-600" />
                <h2 className="text-lg font-black text-gray-900">Product Information</h2>
              </div>
              <dl>
                <InfoRow label="Title" value={product.title} />
                <InfoRow label="Category" value={category} />
                <InfoRow label="Created" value={formatDateTime(product.createdAt)} />
                <InfoRow label="Updated" value={formatDateTime(product.updatedAt)} />
                <InfoRow
                  label="Expiry Date"
                  value={
                    productSupportsExpiry(category) && product.expiryDate
                      ? formatExpiryDate(product.expiryDate, { long: true })
                      : ""
                  }
                />
              </dl>
            </section>

            <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-lg">
              <div className="mb-4 flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-emerald-600" />
                <h2 className="text-lg font-black text-gray-900">Pricing</h2>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                  <p className="text-sm font-semibold text-gray-500">Regular Price</p>
                  <p className="mt-1 text-xl font-black text-gray-900">
                    {formatCurrency(price)}
                  </p>
                </div>
                <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                  <p className="text-sm font-semibold text-gray-500">Discount Price</p>
                  <p className="mt-1 text-xl font-black text-gray-900">
                    {discountPrice !== null ? formatCurrency(discountPrice) : "Not set"}
                  </p>
                </div>
                <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                  <p className="text-sm font-semibold text-gray-500">Cost Price</p>
                  <p className="mt-1 text-xl font-black text-gray-900">
                    {margin ? formatCurrency(margin.costPrice) : "Not set"}
                  </p>
                </div>
                <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                  <p className="text-sm font-semibold text-gray-500">Revenue</p>
                  <p className="mt-1 text-xl font-black text-gray-900">
                    {formatCurrency(paidRevenue)}
                  </p>
                </div>
              </div>
            </section>
          </div>
        </div>

        <div className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
          <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-lg">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Boxes className="h-5 w-5 text-blue-600" />
                <h2 className="text-lg font-black text-gray-900">Inventory</h2>
              </div>
              {hasProductIssue ? (
                <StatusBadge className="border-orange-200 bg-orange-50 text-[#b45309]">
                  {formatNumber(product.issueQuantity)} issue quantity
                </StatusBadge>
              ) : null}
            </div>

            {sizeStocks.length > 0 ? (
              <div className="overflow-hidden rounded-xl border border-gray-100">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-100">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-bold uppercase text-gray-500">
                          Size
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-bold uppercase text-gray-500">
                          Color
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-bold uppercase text-gray-500">
                          Stock
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-bold uppercase text-gray-500">
                          Reserved
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-bold uppercase text-gray-500">
                          Available
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {sizeStocks.map((entry, index) => (
                        <tr key={`${entry.size}-${entry.color}-${index}`}>
                          <td className="px-4 py-3 text-sm font-bold text-gray-900">
                            {entry.size || "One size"}
                          </td>
                          <td className="px-4 py-3 text-sm font-semibold text-gray-700">
                            {entry.color ? (
                              <span className="inline-flex items-center gap-2">
                                <span
                                  className="h-4 w-4 rounded-full border border-gray-200"
                                  style={getColorSwatchStyle(entry.color)}
                                />
                                {entry.color}
                              </span>
                            ) : (
                              "No color"
                            )}
                          </td>
                          <td className="px-4 py-3 text-right text-sm font-bold text-gray-900">
                            {formatNumber(entry.stock)}
                          </td>
                          <td className="px-4 py-3 text-right text-sm font-bold text-blue-700">
                            {formatNumber(entry.reservedStock)}
                          </td>
                          <td className="px-4 py-3 text-right text-sm font-bold text-emerald-700">
                            {formatNumber(getVariantAvailableStock(entry))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                  <p className="text-sm font-semibold text-gray-500">Total Stock</p>
                  <p className="mt-1 text-2xl font-black text-gray-900">
                    {formatNumber(totalStock)}
                  </p>
                </div>
                <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                  <p className="text-sm font-semibold text-gray-500">Reserved</p>
                  <p className="mt-1 text-2xl font-black text-blue-700">
                    {formatNumber(reservedStock)}
                  </p>
                </div>
                <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                  <p className="text-sm font-semibold text-gray-500">Available</p>
                  <p className="mt-1 text-2xl font-black text-emerald-700">
                    {formatNumber(availableStock)}
                  </p>
                </div>
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-lg">
            <div className="mb-4 flex items-center gap-2">
              <Tag className="h-5 w-5 text-blue-600" />
              <h2 className="text-lg font-black text-gray-900">Options</h2>
            </div>
            <div>
              <p className="text-sm font-bold text-gray-500">Colors</p>
              {colors.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {colors.map((color) => (
                    <span
                      key={color}
                      className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm font-bold text-gray-700"
                    >
                      <span
                        className="h-4 w-4 rounded-full border border-gray-200"
                        style={getColorSwatchStyle(color)}
                      />
                      {color}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-sm font-semibold text-gray-500">No color options</p>
              )}
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                <p className="flex items-center gap-2 text-sm font-semibold text-gray-500">
                  <Sparkles className="h-4 w-4 text-purple-600" />
                  New Arrival
                </p>
                <p className="mt-1 text-lg font-black text-gray-900">
                  {product.isNewArrival ? "Yes" : "No"}
                </p>
              </div>
              <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                <p className="flex items-center gap-2 text-sm font-semibold text-gray-500">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  Best Seller
                </p>
                <p className="mt-1 text-lg font-black text-gray-900">
                  {isBestSeller ? "Yes" : "No"}
                </p>
              </div>
              <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                <p className="flex items-center gap-2 text-sm font-semibold text-gray-500">
                  <AlertTriangle className="h-4 w-4 text-[#b45309]" />
                  Product Issue
                </p>
                <p className="mt-1 text-lg font-black text-gray-900">
                  {hasProductIssue ? "Yes" : "No"}
                </p>
              </div>
              <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                <p className="flex items-center gap-2 text-sm font-semibold text-gray-500">
                  <CalendarDays className="h-4 w-4 text-blue-600" />
                  Expiry Tracking
                </p>
                <p className="mt-1 text-lg font-black text-gray-900">
                  {productSupportsExpiry(category) ? "Supported" : "Not needed"}
                </p>
              </div>
            </div>
          </section>
        </div>

        <div className="mt-8 grid gap-8">
          <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 text-amber-500" />
                <h2 className="text-lg font-black text-gray-900">Recent Reviews</h2>
              </div>
              <span className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-sm font-bold text-gray-700">
                {averageRating.toFixed(1)}
              </span>
            </div>
            {latestReviews.length > 0 ? (
              <div className="space-y-3">
                {latestReviews.map((review) => (
                  <article
                    key={review._id || `${review.name}-${review.createdAt}`}
                    className="rounded-xl border border-gray-100 bg-gray-50 p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="font-bold text-gray-900">{review.name || "Customer"}</p>
                        <p className="flex items-center gap-1 text-sm font-bold text-amber-500">
                          <Star className="h-4 w-4 fill-current" />
                          {Number(review.rating || 0).toFixed(1)}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {review.sentimentLabel ? (
                          <StatusBadge className="border-blue-200 bg-blue-50 text-blue-700">
                            {review.sentimentLabel}
                          </StatusBadge>
                        ) : null}
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-gray-500">
                          <Clock className="h-3.5 w-3.5" />
                          {formatDateTime(review.createdAt)}
                        </span>
                      </div>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-gray-700">
                      {review.comment || "No comment"}
                    </p>
                  </article>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-6 text-center">
                <p className="font-bold text-gray-700">No reviews yet</p>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default AdminProductDetails;
