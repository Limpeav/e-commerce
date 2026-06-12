import { useState } from "react";
import { adminService } from "../../../services/adminService";
import { useNavigate } from "react-router-dom";
import {
  PRODUCT_CATEGORY_OPTIONS,
} from "../../../constants/productCategories";
import AlertMessage from "../../../components/ui/AlertMessage";
import { useLanguage } from "../../../context/useLanguage";
import {
  buildProductRequestData,
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
  FileSpreadsheet,
  Sparkles,
  CalendarDays,
  X,
} from "lucide-react";

const emptyProductForm = {
  title: "",
  price: "",
  discountPrice: "",
  category: "",
  image: null,
  imageUrl: "",
  description: "",
  stock: "",
  isNewArrival: false,
  expiryDate: "",
};

const AddProduct = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [form, setForm] = useState(emptyProductForm);

  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [backgroundRemoving, setBackgroundRemoving] = useState(false);
  const [backgroundRemovalMessage, setBackgroundRemovalMessage] = useState(null);
  const [csvFile, setCsvFile] = useState(null);
  const [csvLoading, setCsvLoading] = useState(false);
  const [formMessage, setFormMessage] = useState(null);

  const handleChange = (e) => {
    const { name, value, checked, type } = e.target;
    setFormMessage(null);

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
    if (name === 'price' || name === 'discountPrice' || name === 'stock') {
      // Allow empty string or valid number (including decimals)
      if (value === '' || /^\d*\.?\d*$/.test(value)) {
        setForm((currentForm) => ({ ...currentForm, [name]: value }));
      }
    } else {
      setForm((currentForm) => ({ ...currentForm, [name]: value }));
    }
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFormMessage(null);
    setBackgroundRemovalMessage(null);
    setForm((currentForm) => ({
      ...currentForm,
      image: file,
      imageUrl: "",
    }));

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);

    const uploadData = new FormData();
    uploadData.append("image", file);
    uploadData.append("removeBackground", "true");

    try {
      setBackgroundRemoving(true);
      const response = await adminService.uploadProductImage(uploadData);
      const processedImageUrl = response.data?.imageUrl;

      if (!processedImageUrl) {
        throw new Error("The processed image URL was not returned");
      }

      setForm((currentForm) => ({
        ...currentForm,
        image: null,
        imageUrl: processedImageUrl,
      }));
      setImagePreview(processedImageUrl);
      setBackgroundRemovalMessage({
        type: "success",
        text: "AI removed the background automatically.",
      });
    } catch (error) {
      setBackgroundRemovalMessage({
        type: "warning",
        text:
          error.response?.data?.message ||
          error.message ||
          "Background removal failed. The original image will be used.",
      });
    } finally {
      setBackgroundRemoving(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (backgroundRemoving) return;

    setLoading(true);
    setFormMessage(null);

    try {
      await adminService.createProduct(
        buildProductRequestData(form, { includeImage: true })
      );
      setForm(emptyProductForm);
      setImagePreview(null);
      setBackgroundRemovalMessage(null);
      setFormMessage({
        type: "success",
        title: t("product.addedTitle"),
        text: t("product.addedSuccess"),
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setFormMessage({
        type: "error",
        title: t("product.addFailedTitle"),
        text: err.response?.data?.message || err.message || t("product.addFailed"),
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setLoading(false);
    }
  };

  const handleCsvFileChange = (e) => {
    setCsvFile(e.target.files?.[0] || null);
  };

  const handleCsvImport = async () => {
    if (!csvFile) {
      alert("Please choose a CSV file first");
      return;
    }

    const formData = new FormData();
    formData.append("file", csvFile);

    try {
      setCsvLoading(true);
      const response = await adminService.importProductsCsv(formData);
      alert(response.data?.message || "Products imported successfully");
      navigate("/admin/products");
    } catch (err) {
      const message =
        err.response?.data?.errors?.join("\n") ||
        err.response?.data?.message ||
        err.message ||
        "Failed to import CSV";
      alert(message);
    } finally {
      setCsvLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center space-x-4">
            <button
              className="p-3 hover:bg-gray-100 rounded-xl transition-all duration-200 group"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="w-5 h-5 text-gray-600 group-hover:text-gray-900" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-[var(--color-text-main)]">
                Add New Product
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Fill in the details to add a new product to your inventory
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {formMessage && (
          <div className="mb-6">
            <AlertMessage
              type={formMessage.type}
              title={formMessage.title}
              message={formMessage.text}
              onClose={() => setFormMessage(null)}
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
                  <button
                    type="button"
                    onClick={() => {
                      setImagePreview(null);
                      setForm((currentForm) => ({
                        ...currentForm,
                        image: null,
                        imageUrl: "",
                      }));
                      setBackgroundRemovalMessage(null);
                    }}
                    className="absolute top-3 right-3 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-all duration-200 shadow-lg hover:bg-red-700 hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    Remove
                  </button>
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
              {backgroundRemoving && (
                <div className="mt-4 flex items-center gap-2 rounded-xl bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700">
                  <Sparkles className="h-4 w-4 animate-pulse" />
                  Removing image background with AI...
                </div>
              )}
              {!backgroundRemoving && backgroundRemovalMessage && (
                <div
                  className={`mt-4 rounded-xl px-4 py-3 text-sm font-semibold ${
                    backgroundRemovalMessage.type === "success"
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-amber-50 text-amber-800"
                  }`}
                >
                  {backgroundRemovalMessage.text}
                </div>
              )}
            </div>
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

              {/* Stock */}
              <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Stock Quantity *
                  </label>
                <div className="relative">
                  <Boxes className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    name="stock"
                    type="number"
                    placeholder="0"
                    value={form.stock}
                    onChange={handleChange}
                    className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white font-medium text-gray-900 placeholder:text-gray-400"
                    required
                  />
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
                    <span className="text-xs text-gray-500 ml-2">(Optional)</span>
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
                    Description *
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
                    required
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
                onClick={() => navigate(-1)}
                className="px-8 py-4 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 font-semibold hover:border-gray-400"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || backgroundRemoving}
                className="flex items-center space-x-3 rounded-xl bg-[var(--color-primary)] px-8 py-4 text-white transition-all duration-200 font-semibold shadow-lg hover:bg-[var(--color-primary-dark)] hover:shadow-xl transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:bg-[var(--color-primary-light)]"
              >
                {loading || backgroundRemoving ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>{backgroundRemoving ? "Processing image..." : "Adding..."}</span>
                  </>
                ) : (
                  <>
                    <Package className="w-5 h-5" />
                    <span>Add Product</span>
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

export default AddProduct;
