import { useState } from "react";
import { ProductController } from "../../../controllers";
import { useNavigate } from "react-router-dom";
import {
  PRODUCT_CATEGORY_OPTIONS,
} from "../../../constants/productCategories";
import AlertMessage from "../../../components/ui/AlertMessage";
import { useLanguage } from "../../../context/useLanguage";
import {
  buildProductRequestData,
  formatProductColorList,
  parseProductColorList,
  PRODUCT_COLOR_OPTIONS,
  productSupportsExpiry,
} from "../../../utils/productExpiry";
import {
  buildDefaultSizeStocks,
  getSizeStocksTotal,
  isSizedProduct,
} from "../../../utils/productOptions";
import {
  ArrowLeft,
  Upload,
  Package,
  DollarSign,
  Tag,
  FileText,
  Boxes,
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
  colors: "",
  colorImages: {},
  expiryDate: "",
  sizeStocks: [],
};

const AddProduct = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [form, setForm] = useState(emptyProductForm);

  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [backgroundRemoving, setBackgroundRemoving] = useState(false);
  const [colorImageUploading, setColorImageUploading] = useState({});
  const [backgroundRemovalMessage, setBackgroundRemovalMessage] = useState(null);
  const [formMessage, setFormMessage] = useState(null);

  const handleChange = (e) => {
    const { name, value, checked, type } = e.target;
    setFormMessage(null);

    if (type === "checkbox") {
      setForm((currentForm) => ({ ...currentForm, [name]: checked }));
      return;
    }

    if (name === "category") {
      setForm((currentForm) => {
        const shouldShowColorOptions = isSizedProduct({ category: value });
        const nextColors = shouldShowColorOptions
          ? parseProductColorList(currentForm.colors)
          : [];
        const nextSizeStocks = buildDefaultSizeStocks(
          value,
          currentForm.sizeStocks,
          nextColors
        );

        return {
          ...currentForm,
          category: value,
          colors: shouldShowColorOptions ? currentForm.colors : "",
          colorImages: shouldShowColorOptions ? currentForm.colorImages : {},
          sizeStocks: nextSizeStocks,
          stock: nextSizeStocks.length > 0
            ? String(getSizeStocksTotal(nextSizeStocks))
            : currentForm.stock,
          expiryDate: productSupportsExpiry(value)
            ? currentForm.expiryDate
            : "",
        };
      });
      return;
    }

    if (name === "colors") {
      setForm((currentForm) => {
        const nextColors = parseProductColorList(value);
        const nextColorImages = {};
        nextColors.forEach((color) => {
          nextColorImages[color] = currentForm.colorImages?.[color] || "";
        });

        return {
          ...currentForm,
          colors: value,
          colorImages: nextColorImages,
        };
      });
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

  const handleSizeStockChange = (size, color, value) => {
    if (value !== "" && !/^\d+$/.test(value)) return;

    setForm((currentForm) => {
      const nextSizeStocks = currentForm.sizeStocks.map((entry) =>
        entry.size === size && String(entry.color || "") === String(color || "")
          ? { ...entry, stock: value }
          : entry
      );

      return {
        ...currentForm,
        sizeStocks: nextSizeStocks,
        stock: String(getSizeStocksTotal(nextSizeStocks)),
      };
    });
  };

  const handleColorImageChange = (color, value) => {
    setFormMessage(null);
    setForm((currentForm) => ({
      ...currentForm,
      colorImages: {
        ...currentForm.colorImages,
        [color]: value,
      },
    }));
  };

  const handleColorImageUpload = async (color, file) => {
    if (!file) return;

    setFormMessage(null);
    const uploadData = new FormData();
    uploadData.append("image", file);
    uploadData.append("removeBackground", "true");

    try {
      setColorImageUploading((current) => ({ ...current, [color]: true }));
      const response = await ProductController.uploadImage(uploadData);
      const processedImageUrl = response.data?.imageUrl;

      if (!processedImageUrl) {
        throw new Error("The uploaded image URL was not returned");
      }

      handleColorImageChange(color, processedImageUrl);
    } catch (error) {
      setFormMessage({
        type: "error",
        title: "Color image upload failed",
        text:
          error.response?.data?.message ||
          error.message ||
          `Could not upload the image for ${color}.`,
      });
    } finally {
      setColorImageUploading((current) => ({ ...current, [color]: false }));
    }
  };

  const handleRemoveColorImage = (color) => {
    handleColorImageChange(color, "");
  };

  const handleAddColor = (color) => {
    if (!color) return;

    setFormMessage(null);
    setForm((currentForm) => {
      const currentColors = parseProductColorList(currentForm.colors);
      if (currentColors.some((currentColor) => currentColor.toLowerCase() === color.toLowerCase())) {
        return currentForm;
      }

      return {
        ...currentForm,
        colors: formatProductColorList([...currentColors, color]),
        sizeStocks: buildDefaultSizeStocks(
          currentForm.category,
          currentForm.sizeStocks,
          [...currentColors, color]
        ),
        stock: isSizedProduct(currentForm)
          ? String(getSizeStocksTotal(buildDefaultSizeStocks(
              currentForm.category,
              currentForm.sizeStocks,
              [...currentColors, color]
            )))
          : currentForm.stock,
        colorImages: {
          ...currentForm.colorImages,
          [color]: currentForm.colorImages?.[color] || "",
        },
      };
    });
  };

  const handleRemoveColor = (color) => {
    setFormMessage(null);
    setForm((currentForm) => {
      const nextColors = parseProductColorList(currentForm.colors).filter(
        (currentColor) => currentColor.toLowerCase() !== color.toLowerCase()
      );
      const nextColorImages = { ...currentForm.colorImages };
      delete nextColorImages[color];

      return {
        ...currentForm,
        colors: formatProductColorList(nextColors),
        sizeStocks: buildDefaultSizeStocks(
          currentForm.category,
          currentForm.sizeStocks,
          nextColors
        ),
        stock: isSizedProduct(currentForm)
          ? String(getSizeStocksTotal(buildDefaultSizeStocks(
              currentForm.category,
              currentForm.sizeStocks,
              nextColors
            )))
          : currentForm.stock,
        colorImages: nextColorImages,
      };
    });
  };

  const colorOptions = parseProductColorList(form.colors);
  const availableColorOptions = PRODUCT_COLOR_OPTIONS.filter(
    (color) => !colorOptions.some((selectedColor) => selectedColor.toLowerCase() === color.toLowerCase())
  );

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
      const response = await ProductController.uploadImage(uploadData);
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
      await ProductController.create(
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

              {/* Category */}
              <div>
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

              {!isSizedProduct(form) && (
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
              )}

              {isSizedProduct(form) && (
                <>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Product Colors
                      <span className="text-xs text-gray-500 ml-2">(Optional)</span>
                    </label>
                    <div className="relative">
                      <Tag className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <select
                        value=""
                        onChange={(event) => {
                          handleAddColor(event.target.value);
                          event.target.value = "";
                        }}
                        className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white font-medium text-gray-900"
                      >
                        <option value="">Select a color</option>
                        {availableColorOptions.map((color) => (
                          <option key={color} value={color}>
                            {color}
                          </option>
                        ))}
                      </select>
                    </div>
                    {colorOptions.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {colorOptions.map((color) => (
                          <span
                            key={color}
                            className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-sm font-bold text-blue-700"
                          >
                            {color}
                            <button
                              type="button"
                              onClick={() => handleRemoveColor(color)}
                              className="rounded-full p-0.5 text-blue-500 hover:bg-blue-100 hover:text-blue-800"
                              aria-label={`Remove ${color}`}
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                    <p className="mt-2 text-xs font-medium text-gray-500">
                      Select one or more colors. Customers must choose one color when colors are set.
                    </p>
                  </div>

                  {colorOptions.length > 0 && (
                    <div className="md:col-span-2 rounded-xl border border-gray-200 bg-gray-50 p-5">
                      <div className="mb-4">
                        <p className="text-sm font-bold text-gray-900">Color Images</p>
                        <p className="mt-1 text-xs font-medium text-gray-600">
                          Upload an image for each color. Empty colors use the main product image.
                        </p>
                      </div>
                      <div className="space-y-3">
                        {colorOptions.map((color) => (
                          <div key={color} className="rounded-lg border border-gray-200 bg-white p-3">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                              <div>
                                <span className="block text-xs font-bold text-gray-600">{color}</span>
                                <p className="mt-1 text-xs font-medium text-gray-500">
                                  {form.colorImages[color] ? "Custom image uploaded" : "Uses main image until uploaded"}
                                </p>
                              </div>
                              <div className="flex flex-wrap items-center gap-2">
                                {form.colorImages[color] && (
                                  <img
                                    src={form.colorImages[color]}
                                    alt={`${color} preview`}
                                    className="h-12 w-12 rounded-lg border border-gray-200 object-cover"
                                  />
                                )}
                                <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-blue-700">
                                  <Upload className="h-4 w-4" />
                                  <span>{colorImageUploading[color] ? "Uploading..." : form.colorImages[color] ? "Replace" : "Upload"}</span>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    disabled={Boolean(colorImageUploading[color])}
                                    onChange={(event) => handleColorImageUpload(color, event.target.files?.[0])}
                                    className="hidden"
                                  />
                                </label>
                                {form.colorImages[color] && (
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveColorImage(color)}
                                    className="rounded-lg border border-red-200 px-4 py-2 text-sm font-bold text-red-600 transition-colors hover:bg-red-50"
                                  >
                                    Remove
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

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

              {isSizedProduct(form) && (
                <div className="md:col-span-2 rounded-xl border border-gray-200 bg-gray-50 p-5">
                  <div className="mb-4">
                    <p className="text-sm font-bold text-gray-900">Size + Color Inventory</p>
                    <p className="mt-1 text-xs font-medium text-gray-600">
                      Enter stock for each size and selected color combination.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {form.sizeStocks.map((entry) => (
                      <label
                        key={`${entry.size}-${entry.color || "default"}`}
                        className="rounded-lg border border-gray-200 bg-white p-3"
                      >
                        <span className="block text-xs font-bold text-gray-600">
                          {entry.color ? `${entry.size} / ${entry.color}` : entry.size}
                        </span>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          inputMode="numeric"
                          value={entry.stock}
                          onChange={(event) => handleSizeStockChange(entry.size, entry.color, event.target.value)}
                          className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-bold text-gray-900 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                          placeholder="0"
                        />
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {isSizedProduct(form) && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Total Stock Quantity
                  </label>
                  <div className="relative">
                    <Boxes className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      name="stock"
                      type="number"
                      placeholder="0"
                      value={form.stock}
                      onChange={handleChange}
                      readOnly
                      className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white font-medium text-gray-900 placeholder:text-gray-400"
                      required
                    />
                  </div>
                </div>
              )}
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
