import { useEffect, useRef, useState } from "react";
import { adminService } from "../../../services/adminService";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  PRODUCT_CATEGORY_OPTIONS,
  normalizeProductCategory,
} from "../../../constants/productCategories";
import AlertMessage from "../../../components/ui/AlertMessage";
import { useLanguage } from "../../../context/useLanguage";
import {
  buildProductRequestData,
  getExpiryDateInputValue,
  productSupportsExpiry,
} from "../../../utils/productExpiry";
import {
  ArrowLeft,
  Upload,
  Package,
  DollarSign,
  Tag,
  FileText,
  Boxes,
  Check,
  Sparkles,
  Save,
  Trash2,
  X,
  CalendarDays,
} from "lucide-react";
import Loading from "../../../components/common/Loading";

const parseBooleanValue = (value) =>
  value === true || value === "true" || value === "1" || value === 1;

const EditProduct = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();
  const returnTo =
    typeof location.state?.returnTo === "string" &&
    (location.state.returnTo === "/admin" ||
      location.state.returnTo.startsWith("/admin/products"))
      ? location.state.returnTo
      : "/admin/products";

  const [form, setForm] = useState({
    title: "",
    price: "",
    discountPrice: "",
    category: "",
    description: "",
    image: null,
    stock: "",
    isNewArrival: false,
    hasProductIssue: false,
    issueQuantity: "",
    expiryDate: "",
    currentImage: "",
  });

  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const issueQuantityInputRef = useRef(null);
  const availableStock = Math.max(
    0,
    Number(form.stock || 0) -
      (form.hasProductIssue ? Number(form.issueQuantity || 0) : 0)
  );

  const handleMarkProductIssue = () => {
    setSuccessMessage("");
    setErrorMessage("");
    setForm((currentForm) => ({
      ...currentForm,
      hasProductIssue: true,
      issueQuantity: currentForm.issueQuantity || "1",
    }));
    window.requestAnimationFrame(() => issueQuantityInputRef.current?.focus());
  };

  const handleRemoveProductIssue = () => {
    setSuccessMessage("");
    setErrorMessage("");
    setForm((currentForm) => ({
      ...currentForm,
      hasProductIssue: false,
      issueQuantity: "0",
    }));
  };

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setFetching(true);
        const res = await adminService.getProductById(id);
        const data = res.data;
        const hasProductIssue = parseBooleanValue(data.hasProductIssue);

        setForm({
          title: data.title || "",
          price: data.price || "",
          discountPrice: data.discountPrice || "",
          category: normalizeProductCategory(data.category),
          description: data.description || "",
          stock: data.stock || "",
          isNewArrival: parseBooleanValue(data.isNewArrival),
          hasProductIssue,
          issueQuantity: data.issueQuantity || (hasProductIssue ? "1" : ""),
          expiryDate: getExpiryDateInputValue(data.expiryDate),
          image: null,
          currentImage: data.image || "",
        });

        setImagePreview(data.image || null);
      } catch (err) {
        console.error("Error fetching product:", err);
        alert(err.response?.data?.message || err.message || "Product not found");
      } finally {
        setFetching(false);
      }
    };

    fetchProduct();
  }, [id]);

  const handleChange = (e) => {
    const { name, value, checked, type } = e.target;
    setSuccessMessage("");
    setErrorMessage("");

    if (type === "checkbox") {
      setForm((currentForm) => ({ ...currentForm, [name]: checked }));
      return;
    }

    if (name === "category") {
      setForm((currentForm) => ({
        ...currentForm,
        category: value,
        expiryDate: productSupportsExpiry(value)
          ? currentForm.expiryDate
          : "",
      }));
      return;
    }

    // For number fields, ensure we only store numeric values or empty string
    if (
      name === "price" ||
      name === "discountPrice" ||
      name === "stock" ||
      name === "issueQuantity"
    ) {
      // Allow empty string or valid number (including decimals)
      if (value === '' || /^\d*\.?\d*$/.test(value)) {
        setForm((currentForm) => ({ ...currentForm, [name]: value }));
      }
    } else {
      setForm((currentForm) => ({ ...currentForm, [name]: value }));
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setSuccessMessage("");
    setErrorMessage("");
    setForm({ ...form, image: file });

    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSuccessMessage("");
    setErrorMessage("");
    setImagePreview(form.currentImage);
    setForm({ ...form, image: null });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      const response = await adminService.updateProduct(
        id,
        buildProductRequestData(form, { includeImage: Boolean(form.image) })
      );
      const updatedProduct = response.data?.product || response.data || {};
      const updatedImage = updatedProduct.image || imagePreview || form.currentImage;

      setForm((currentForm) => ({
        ...currentForm,
        image: null,
        currentImage: updatedImage,
        expiryDate: getExpiryDateInputValue(updatedProduct.expiryDate),
        isNewArrival: parseBooleanValue(
          updatedProduct.isNewArrival ?? currentForm.isNewArrival
        ),
        hasProductIssue: parseBooleanValue(
          updatedProduct.hasProductIssue ?? currentForm.hasProductIssue
        ),
        issueQuantity:
          updatedProduct.issueQuantity ?? currentForm.issueQuantity,
      }));
      setImagePreview(updatedImage || imagePreview);
      setSuccessMessage(
        t("product.updatedSuccess") || "Product updated successfully!"
      );
      navigate(returnTo, { replace: true });
    } catch (err) {
      setErrorMessage(err.response?.data?.message || err.message || t("product.updateFailed"));
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return <Loading message="Loading product..." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center space-x-4">
            <button
              className="p-3 hover:bg-gray-100 rounded-xl transition-all duration-200 group"
              onClick={() => navigate(returnTo)}
            >
              <ArrowLeft className="w-5 h-5 text-gray-600 group-hover:text-gray-900" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-950">
                Edit Product
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Update product information and details
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {successMessage && (
          <div className="mb-6">
            <AlertMessage
              type="success"
              title={t("product.updatedTitle")}
              message={successMessage}
              onClose={() => setSuccessMessage("")}
            />
          </div>
        )}

        {errorMessage && (
          <div className="mb-6">
            <AlertMessage
              type="error"
              title={t("product.updateFailedTitle")}
              message={errorMessage}
              onClose={() => setErrorMessage("")}
            />
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Product Image Upload */}
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
            <label className="block text-lg font-bold text-gray-900 mb-6 flex items-center">
              <Upload className="w-5 h-5 mr-2 text-blue-600" />
              Product Image *
            </label>
            <div className="flex flex-col items-center">
              {imagePreview ? (
                <div className="relative w-full max-w-md group">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-64 object-cover rounded-2xl border-4 border-gray-200 shadow-lg group-hover:shadow-xl transition-shadow duration-300"
                  />
                  <div className="absolute inset-x-4 bottom-4 flex items-center justify-end gap-2 rounded-2xl border border-white/20 bg-black/65 p-3 shadow-2xl backdrop-blur-md">
                    {form.image && (
                      <button
                        type="button"
                        onClick={removeImage}
                        className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:bg-red-700"
                        title="Remove new image"
                      >
                        <X className="w-4 h-4" />
                        <span>Remove</span>
                      </button>
                    )}
                    <label className="flex cursor-pointer items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-bold text-gray-900 shadow-lg ring-1 ring-black/10 transition-all duration-200 hover:-translate-y-0.5 hover:bg-blue-50">
                      <Upload className="w-4 h-4" />
                      <span>Change</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              ) : (
                <label className="w-full max-w-md h-64 flex flex-col items-center justify-center border-3 border-dashed border-gray-300 rounded-2xl cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all duration-300 bg-gradient-to-br from-gray-50 to-white group">
                  <Upload className="w-12 h-12 text-gray-400 mb-3 group-hover:text-blue-500 transition-colors duration-200" />
                  <p className="text-sm text-gray-600 mb-1 font-medium">
                    Click to upload product image
                  </p>
                  <p className="text-xs text-gray-500">PNG, JPG up to 10MB</p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>
            {!form.image && form.currentImage && (
              <p className="text-sm text-gray-500 text-center mt-3">
                Current image will be kept if you don't upload a new one
              </p>
            )}
          </div>

          {/* Product Details */}
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <Package className="w-6 h-6 mr-2 text-blue-600" />
              Product Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Product Title */}
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Product Title *
                </label>
                <div className="relative">
                  <Package className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    name="title"
                    placeholder="Enter product title"
                    value={form.title}
                    onChange={handleChange}
                    className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white font-medium text-gray-900 placeholder:text-gray-400"
                    required
                  />
                </div>
              </div>

              {/* Price */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Price ($) *
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    name="price"
                    type="text"
                    inputMode="decimal"
                    placeholder="0.00"
                    value={form.price}
                    onChange={handleChange}
                    onBlur={(e) => {
                      // Format on blur: ensure proper decimal format
                      const value = e.target.value.trim();
                      if (value && !isNaN(value) && parseFloat(value) >= 0) {
                        setForm({ ...form, price: parseFloat(value).toFixed(2) });
                      } else if (value === '') {
                        setForm({ ...form, price: '' });
                      }
                    }}
                    className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white font-medium text-gray-900 placeholder:text-gray-400"
                    required
                  />
                </div>
              </div>

              {/* Discount Price */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Discount Price ($)
                  <span className="text-xs text-gray-500 ml-2">(Optional)</span>
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    name="discountPrice"
                    type="text"
                    inputMode="decimal"
                    placeholder="0.00"
                    value={form.discountPrice}
                    onChange={handleChange}
                    onBlur={(e) => {
                      // Format on blur: ensure proper decimal format
                      const value = e.target.value.trim();
                      if (value && !isNaN(value) && parseFloat(value) >= 0) {
                        setForm({ ...form, discountPrice: parseFloat(value).toFixed(2) });
                      } else if (value === '') {
                        setForm({ ...form, discountPrice: '' });
                      }
                    }}
                    className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white font-medium text-gray-900 placeholder:text-gray-400"
                  />
                </div>
                {form.discountPrice && form.price && parseFloat(form.discountPrice) >= parseFloat(form.price) && (
                  <p className="text-red-500 text-xs mt-1">Discount price must be less than regular price</p>
                )}
              </div>

              {/* Available Stock */}
              <div className="md:col-span-2">
                <label
                  htmlFor="product-stock-quantity"
                  className="mb-3 block text-sm font-semibold text-gray-700"
                >
                  Total Stock Quantity
                </label>
                <div className="relative">
                  <Boxes className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                  <input
                    id="product-stock-quantity"
                    name="stock"
                    type="number"
                    min="0"
                    step="1"
                    inputMode="numeric"
                    placeholder="Enter available stock"
                    value={form.stock}
                    onChange={handleChange}
                    required
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 py-4 pl-12 pr-4 font-medium text-gray-900 transition-all duration-200 placeholder:text-gray-400 focus:border-transparent focus:bg-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Inventory / Product Issues */}
              <div className="md:col-span-2">
                <div
                  className={`rounded-xl border p-5 ${
                    form.hasProductIssue
                      ? "border-orange-200 bg-orange-50/70"
                      : "border-gray-200 bg-gray-50"
                  }`}
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="text-sm font-bold text-gray-900">
                          Product Issue
                        </p>
                        <p className="mt-0.5 text-xs font-medium text-gray-600">
                          {form.hasProductIssue
                            ? "Issue is active. Set the affected quantity below."
                            : "No issue is currently recorded for this product."}
                        </p>
                      </div>
                    </div>

                    {form.hasProductIssue ? (
                      <button
                        type="button"
                        onClick={handleRemoveProductIssue}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-bold text-white shadow-md transition-all hover:bg-red-700 hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-red-200 sm:w-auto"
                      >
                        <Trash2 className="h-4 w-4" />
                        Remove Issue
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleMarkProductIssue}
                        className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-orange-700"
                      >
                        Mark Product Issue
                      </button>
                    )}
                  </div>

                  {form.hasProductIssue && (
                    <div className="mt-5 border-t border-orange-200 pt-5">
                    <label
                      htmlFor="product-issue-quantity"
                      className="mb-3 block text-sm font-semibold text-gray-700"
                    >
                      Product Issue Quantity
                    </label>
                    <div className="relative">
                      <Boxes className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                      <input
                        ref={issueQuantityInputRef}
                        id="product-issue-quantity"
                        name="issueQuantity"
                        type="number"
                        min="1"
                        max={Number(form.stock || 0)}
                        step="1"
                        inputMode="numeric"
                        placeholder="Enter affected quantity"
                        value={form.issueQuantity}
                        onChange={handleChange}
                        required
                        className="w-full rounded-xl border border-blue-200 bg-white py-4 pl-12 pr-4 font-medium text-gray-900 transition-all duration-200 placeholder:text-gray-400 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                      <p className="mt-2 text-xs font-medium text-gray-500">
                        Enter how many units cannot be sold.
                      </p>
                    </div>
                  )}

                  <div className="mt-5 grid grid-cols-3 gap-3">
                    <div className="rounded-lg border border-gray-200 bg-white p-3 text-center">
                      <p className="text-xs font-semibold text-gray-500">Total</p>
                      <p className="mt-1 text-lg font-bold text-gray-900">
                        {Number(form.stock || 0)}
                      </p>
                    </div>
                    <div className="rounded-lg border border-orange-200 bg-white p-3 text-center">
                      <p className="text-xs font-semibold text-orange-600">Issues</p>
                      <p className="mt-1 text-lg font-bold text-orange-700">
                        {form.hasProductIssue
                          ? Number(form.issueQuantity || 0)
                          : 0}
                      </p>
                    </div>
                    <div className="rounded-lg border border-green-200 bg-white p-3 text-center">
                      <p className="text-xs font-semibold text-green-600">Available</p>
                      <p className="mt-1 text-lg font-bold text-green-700">
                        {availableStock}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* New Arrival */}
              <div className="md:col-span-2">
                <label className="flex cursor-pointer items-start gap-4 rounded-xl border border-gray-200 bg-gray-50 p-4 transition-all duration-200 hover:border-blue-300 hover:bg-blue-50">
                  <span className="relative mt-1 flex h-5 w-5 shrink-0 items-center justify-center">
                    <input
                      name="isNewArrival"
                      type="checkbox"
                      checked={form.isNewArrival}
                      onChange={handleChange}
                      className="h-5 w-5 cursor-pointer rounded border-2 border-gray-300 text-blue-600 accent-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    />
                    {form.isNewArrival && (
                      <Check className="pointer-events-none absolute h-3.5 w-3.5 text-white" strokeWidth={3} />
                    )}
                  </span>
                  <span>
                    <span className="flex items-center text-sm font-semibold text-gray-800">
                      <Sparkles className="mr-2 h-4 w-4 text-blue-600" />
                      Show as New Arrival
                    </span>
                    <span className="mt-1 block text-sm text-gray-500">
                      Products marked here appear in the storefront New Arrival section.
                    </span>
                  </span>
                </label>
              </div>

              {/* Category */}
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Category *
                </label>
                <div className="relative">
                  <Tag className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <select
                    name="category"
                    value={form.category}
                    onChange={handleChange}
                    className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-gray-50 focus:bg-white transition-all duration-200 cursor-pointer font-medium text-gray-900"
                    required
                  >
                    <option value="">Select a category</option>
                    {PRODUCT_CATEGORY_OPTIONS.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Expiry Date - shown for Milk and Bath & Skin */}
              {productSupportsExpiry(form.category) && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Expiry Date
                  </label>
                  <div className="relative">
                    <CalendarDays className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                    <input
                      name="expiryDate"
                      type="date"
                      value={form.expiryDate}
                      onChange={handleChange}
                      className={`w-full pl-12 ${form.expiryDate ? 'pr-10' : 'pr-4'} py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white font-medium text-gray-900 cursor-pointer`}
                    />
                    {form.expiryDate && (
                      <button
                        type="button"
                        onClick={() => setForm((prev) => ({ ...prev, expiryDate: "" }))}
                        className="absolute right-8 top-1/2 -translate-y-1/2 z-10 p-1 rounded-lg bg-gray-50 hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors"
                        title="Clear expiry date"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Description */}
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Description
                </label>
                <div className="relative">
                  <FileText className="absolute left-4 top-4 w-5 h-5 text-gray-400" />
                  <textarea
                    name="description"
                    placeholder="Enter product description..."
                    value={form.description}
                    onChange={handleChange}
                    rows="4"
                    className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all duration-200 bg-gray-50 focus:bg-white font-medium text-gray-900 placeholder:text-gray-400"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => navigate(returnTo)}
                className="px-8 py-4 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 font-semibold hover:border-gray-400"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center space-x-3 rounded-xl bg-[var(--color-primary)] px-8 py-4 text-white transition-all duration-200 font-semibold shadow-lg hover:bg-[var(--color-primary-dark)] hover:shadow-xl transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:bg-[var(--color-primary-light)]"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Updating...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    <span>Update Product</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProduct;
