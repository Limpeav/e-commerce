import { useEffect, useState } from "react";
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
  GENERAL_PRODUCT_DETAIL_IMAGES_KEY,
  parseProductColorList,
  PRODUCT_COLOR_OPTIONS,
  PRODUCT_DETAIL_IMAGE_SIZE_GUIDANCE,
  productSupportsExpiry,
  productSupportsGeneralDetailImages,
} from "../../../utils/productExpiry";
import {
  buildDefaultSizeStocks,
  getSizeStocksTotal,
  isSizedProduct,
  productSupportsOptionalSizeOptions,
  productSupportsColorOptions,
} from "../../../utils/productOptions";
import {
  ArrowLeft,
  Upload,
  Package,
  DollarSign,
  Tag,
  FileText,
  Boxes,
  CalendarDays,
  Plus,
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
  productDetailImages: {},
  expiryDate: "",
  sizeStocks: [],
  trackSizeInventory: false,
};

const DETAIL_IMAGE_SCROLL_THRESHOLD = 7;

const getDetailImageGridClassName = (imageCount, marginClassName = "mt-3") =>
  `${marginClassName} grid grid-cols-2 gap-2 sm:grid-cols-5 ${
    imageCount > DETAIL_IMAGE_SCROLL_THRESHOLD
      ? "max-h-72 overflow-y-auto pr-1 [scrollbar-width:thin]"
      : ""
  }`;

const AddProduct = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [form, setForm] = useState(emptyProductForm);

  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [colorImageUploading, setColorImageUploading] = useState({});
  const [detailImageUploading, setDetailImageUploading] = useState({});
  const [formMessage, setFormMessage] = useState(null);
  const [customColor, setCustomColor] = useState("");

  useEffect(() => {
    if (formMessage?.type !== "success") return undefined;

    const timer = window.setTimeout(() => {
      setFormMessage(null);
    }, 2000);

    return () => window.clearTimeout(timer);
  }, [formMessage]);

  const handleChange = (e) => {
    const { name, value, checked, type } = e.target;
    setFormMessage(null);

    if (type === "checkbox") {
      setForm((currentForm) => ({ ...currentForm, [name]: checked }));
      return;
    }

    if (name === "category") {
      setForm((currentForm) => {
        const shouldShowColorOptions = productSupportsColorOptions({ category: value });
        const shouldShowGeneralDetailImages = productSupportsGeneralDetailImages(value);
        const shouldUseOptionalSizeInventory =
          productSupportsOptionalSizeOptions({ category: value }) &&
          productSupportsOptionalSizeOptions(currentForm) &&
          currentForm.trackSizeInventory;
        const nextColors = shouldShowColorOptions
          ? parseProductColorList(currentForm.colors)
          : [];
        const currentGeneralDetailImages = Array.isArray(
          currentForm.productDetailImages?.[GENERAL_PRODUCT_DETAIL_IMAGES_KEY]
        )
          ? currentForm.productDetailImages[GENERAL_PRODUCT_DETAIL_IMAGES_KEY]
          : [];
        const nextSizeStocks =
          shouldShowColorOptions || shouldUseOptionalSizeInventory
            ? buildDefaultSizeStocks(value, currentForm.sizeStocks, nextColors)
            : [];

        return {
          ...currentForm,
          category: value,
          colors: shouldShowColorOptions ? currentForm.colors : "",
          colorImages: shouldShowColorOptions ? currentForm.colorImages : {},
          productDetailImages: shouldShowColorOptions
            ? currentForm.productDetailImages
            : shouldShowGeneralDetailImages
              ? { [GENERAL_PRODUCT_DETAIL_IMAGES_KEY]: currentGeneralDetailImages }
              : {},
          sizeStocks: nextSizeStocks,
          trackSizeInventory: shouldUseOptionalSizeInventory,
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
        const nextProductDetailImages = {};
        nextColors.forEach((color) => {
          nextColorImages[color] = currentForm.colorImages?.[color] || "";
          nextProductDetailImages[color] = Array.isArray(currentForm.productDetailImages?.[color])
            ? currentForm.productDetailImages[color]
            : [];
        });
        const nextSizeStocks = buildDefaultSizeStocks(
          currentForm.category,
          currentForm.sizeStocks,
          nextColors
        );

        return {
          ...currentForm,
          colors: value,
          colorImages: nextColorImages,
          productDetailImages: nextProductDetailImages,
          sizeStocks: nextSizeStocks,
          stock: nextSizeStocks.length > 0
            ? String(getSizeStocksTotal(nextSizeStocks))
            : currentForm.stock,
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
        trackSizeInventory: true,
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

  const handleProductDetailImageUpload = async (color, files) => {
    const selectedFiles = Array.from(files || []);
    if (selectedFiles.length === 0) return;

    setFormMessage(null);

    try {
      setDetailImageUploading((current) => ({ ...current, [color]: true }));
      const uploadedImageUrls = [];

      for (const file of selectedFiles) {
        const uploadData = new FormData();
        uploadData.append("image", file);

        const response = await ProductController.uploadImage(uploadData);
        const processedImageUrl = response.data?.imageUrl;
        if (!processedImageUrl) {
          throw new Error("The uploaded image URL was not returned");
        }
        uploadedImageUrls.push(processedImageUrl);
      }

      setForm((currentForm) => {
        const existingImages = Array.isArray(currentForm.productDetailImages?.[color])
          ? currentForm.productDetailImages[color]
          : [];

        return {
          ...currentForm,
          productDetailImages: {
            ...currentForm.productDetailImages,
            [color]: [...existingImages, ...uploadedImageUrls],
          },
        };
      });
    } catch (error) {
      setFormMessage({
        type: "error",
        title: "Detail image upload failed",
        text:
          error.response?.data?.message ||
          error.message ||
          `Could not upload detail images for ${color}.`,
      });
    } finally {
      setDetailImageUploading((current) => ({ ...current, [color]: false }));
    }
  };

  const handleRemoveProductDetailImage = (color, imageIndex) => {
    setFormMessage(null);
    setForm((currentForm) => {
      const currentImages = Array.isArray(currentForm.productDetailImages?.[color])
        ? currentForm.productDetailImages[color]
        : [];

      return {
        ...currentForm,
        productDetailImages: {
          ...currentForm.productDetailImages,
          [color]: currentImages.filter((_, index) => index !== imageIndex),
        },
      };
    });
  };

  const handleAddColor = (color) => {
    const normalizedColor = String(color || "").trim();
    if (!normalizedColor) return false;

    setFormMessage(null);
    let wasAdded = false;
    setForm((currentForm) => {
      const currentColors = parseProductColorList(currentForm.colors);
      if (currentColors.some((currentColor) => currentColor.toLowerCase() === normalizedColor.toLowerCase())) {
        return currentForm;
      }

      wasAdded = true;
      const nextSizeStocks = buildDefaultSizeStocks(
        currentForm.category,
        currentForm.sizeStocks,
        [...currentColors, normalizedColor]
      );

      return {
        ...currentForm,
        colors: formatProductColorList([...currentColors, normalizedColor]),
        sizeStocks: nextSizeStocks,
        stock: nextSizeStocks.length > 0
          ? String(getSizeStocksTotal(nextSizeStocks))
          : currentForm.stock,
        colorImages: {
          ...currentForm.colorImages,
          [normalizedColor]: currentForm.colorImages?.[normalizedColor] || "",
        },
        productDetailImages: {
          ...currentForm.productDetailImages,
          [normalizedColor]: Array.isArray(currentForm.productDetailImages?.[normalizedColor])
            ? currentForm.productDetailImages[normalizedColor]
            : [],
        },
      };
    });
    return wasAdded;
  };

  const handleAddCustomColor = () => {
    if (handleAddColor(customColor)) {
      setCustomColor("");
    }
  };

  const handleRemoveColor = (color) => {
    setFormMessage(null);
    setForm((currentForm) => {
      const nextColors = parseProductColorList(currentForm.colors).filter(
        (currentColor) => currentColor.toLowerCase() !== color.toLowerCase()
      );
      const nextColorImages = { ...currentForm.colorImages };
      const nextProductDetailImages = { ...currentForm.productDetailImages };
      delete nextColorImages[color];
      delete nextProductDetailImages[color];

      const nextSizeStocks = buildDefaultSizeStocks(
        currentForm.category,
        currentForm.sizeStocks,
        nextColors
      );

      return {
        ...currentForm,
        colors: formatProductColorList(nextColors),
        sizeStocks: nextSizeStocks,
        stock: nextSizeStocks.length > 0
          ? String(getSizeStocksTotal(nextSizeStocks))
          : currentForm.stock,
        colorImages: nextColorImages,
        productDetailImages: nextProductDetailImages,
      };
    });
  };

  const handleEnableOptionalSizeInventory = () => {
    setFormMessage(null);
    setForm((currentForm) => {
      const nextSizeStocks = buildDefaultSizeStocks(
        currentForm.category,
        currentForm.sizeStocks,
        []
      );

      return {
        ...currentForm,
        trackSizeInventory: true,
        sizeStocks: nextSizeStocks,
        stock: String(getSizeStocksTotal(nextSizeStocks)),
      };
    });
  };

  const handleDisableOptionalSizeInventory = () => {
    setFormMessage(null);
    setForm((currentForm) => ({
      ...currentForm,
      stock: String(getSizeStocksTotal(currentForm.sizeStocks)),
      sizeStocks: [],
      trackSizeInventory: false,
    }));
  };

  const colorOptions = parseProductColorList(form.colors);
  const showGeneralDetailImages =
    productSupportsGeneralDetailImages(form.category) &&
    !productSupportsColorOptions(form);
  const generalDetailImages = Array.isArray(
    form.productDetailImages?.[GENERAL_PRODUCT_DETAIL_IMAGES_KEY]
  )
    ? form.productDetailImages[GENERAL_PRODUCT_DETAIL_IMAGES_KEY]
    : [];
  const availableColorOptions = PRODUCT_COLOR_OPTIONS.filter(
    (color) => !colorOptions.some((selectedColor) => selectedColor.toLowerCase() === color.toLowerCase())
  );
  const usesOptionalSizeInventory =
    productSupportsOptionalSizeOptions(form) && form.trackSizeInventory;
  const usesSizeInventory = isSizedProduct(form) || usesOptionalSizeInventory;
  const usesColorOnlyInventory =
    productSupportsColorOptions(form) && !usesSizeInventory && colorOptions.length > 0;
  const hasSizeStockInventory =
    form.sizeStocks.length > 0 && (usesSizeInventory || usesColorOnlyInventory);
  const showOptionalSizeInventoryPrompt =
    productSupportsOptionalSizeOptions(form) && !form.trackSizeInventory;
  const showOptionalSizeInventoryRemoval =
    productSupportsOptionalSizeOptions(form) && form.trackSizeInventory;

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFormMessage(null);
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
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setFormMessage(null);

    try {
      await ProductController.create(
        buildProductRequestData(form, { includeImage: true })
      );
      setForm(emptyProductForm);
      setImagePreview(null);
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
                    className="w-full h-64 object-contain rounded-2xl border-4 border-gray-200 bg-gray-50 shadow-lg group-hover:shadow-xl transition-shadow duration-300"
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

              {!isSizedProduct(form) && !hasSizeStockInventory && (
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
                  {showOptionalSizeInventoryPrompt && (
                    <div className="mt-3 rounded-xl border border-blue-100 bg-blue-50 p-3">
                      <p className="text-xs font-semibold text-blue-900">
                        Leave this as total quantity for products without sizes.
                      </p>
                      <button
                        type="button"
                        onClick={handleEnableOptionalSizeInventory}
                        className="mt-2 inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-blue-700"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Track by diaper size
                      </button>
                    </div>
                  )}
                </div>
              )}

              {productSupportsColorOptions(form) && (
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
                    <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                      <input
                        type="text"
                        value={customColor}
                        onChange={(event) => setCustomColor(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            event.preventDefault();
                            handleAddCustomColor();
                          }
                        }}
                        placeholder="Add custom color, e.g. Natural Oak"
                        className="min-w-0 flex-1 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-bold text-gray-900 placeholder:text-gray-400 transition-all duration-200 focus:border-transparent focus:bg-white focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        type="button"
                        onClick={handleAddCustomColor}
                        disabled={!customColor.trim()}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                      >
                        <Plus className="h-4 w-4" />
                        Add
                      </button>
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
                      Select preset colors or add custom names. Customers must choose one color when colors are set.
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
                        {colorOptions.map((color) => {
                          const detailImages = Array.isArray(form.productDetailImages?.[color])
                            ? form.productDetailImages[color]
                            : [];

                          return (
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
                                      onChange={(event) => {
                                        handleColorImageUpload(color, event.target.files?.[0]);
                                        event.target.value = "";
                                      }}
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

                              {form.colorImages[color] && (
                                <div className="mt-4 rounded-lg border border-gray-100 bg-gray-50 p-3">
                                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                      <p className="text-xs font-bold text-gray-700">Product Detail Images</p>
                                      <p className="mt-1 text-xs font-medium text-gray-500">
                                        {detailImages.length} uploaded for {color}
                                      </p>
                                      <p className="mt-1 text-xs font-semibold text-blue-700">
                                        {PRODUCT_DETAIL_IMAGE_SIZE_GUIDANCE}
                                      </p>
                                    </div>
                                    <label
                                      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition-colors ${
                                        detailImageUploading[color]
                                          ? "cursor-not-allowed bg-gray-200 text-gray-500"
                                          : "cursor-pointer bg-gray-900 text-white hover:bg-gray-800"
                                      }`}
                                    >
                                      <Upload className="h-4 w-4" />
                                      <span>{detailImageUploading[color] ? "Uploading..." : "Upload Details"}</span>
                                      <input
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        disabled={Boolean(detailImageUploading[color])}
                                        onChange={(event) => {
                                          handleProductDetailImageUpload(color, event.target.files);
                                          event.target.value = "";
                                        }}
                                        className="hidden"
                                      />
                                    </label>
                                  </div>

                                  {detailImages.length > 0 && (
                                    <div className={getDetailImageGridClassName(detailImages.length)}>
                                      {detailImages.map((image, imageIndex) => (
                                        <div key={`${image}-${imageIndex}`} className="relative overflow-hidden rounded-lg border border-gray-200 bg-white">
                                          <img
                                            src={image}
                                            alt={`${color} detail ${imageIndex + 1}`}
                                            className="h-20 w-full object-cover"
                                          />
                                          <button
                                            type="button"
                                            onClick={() => handleRemoveProductDetailImage(color, imageIndex)}
                                            className="absolute right-1 top-1 rounded-md bg-white/90 p-1 text-red-600 shadow-sm hover:bg-red-50"
                                            aria-label={`Remove ${color} detail image ${imageIndex + 1}`}
                                          >
                                            <X className="h-3.5 w-3.5" />
                                          </button>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              )}

              {showGeneralDetailImages && (
                <div className="md:col-span-2 rounded-xl border border-gray-200 bg-gray-50 p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-bold text-gray-900">Product Detail Images</p>
                      <p className="mt-1 text-xs font-medium text-gray-600">
                        Upload package, ingredients, usage, size guide, or instruction images for this product.
                      </p>
                      <p className="mt-1 text-xs font-semibold text-blue-700">
                        {PRODUCT_DETAIL_IMAGE_SIZE_GUIDANCE}
                      </p>
                      <p className="mt-1 text-xs font-medium text-gray-500">
                        {generalDetailImages.length} uploaded
                      </p>
                    </div>
                    <label
                      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition-colors ${
                        detailImageUploading[GENERAL_PRODUCT_DETAIL_IMAGES_KEY]
                          ? "cursor-not-allowed bg-gray-200 text-gray-500"
                          : "cursor-pointer bg-gray-900 text-white hover:bg-gray-800"
                      }`}
                    >
                      <Upload className="h-4 w-4" />
                      <span>
                        {detailImageUploading[GENERAL_PRODUCT_DETAIL_IMAGES_KEY]
                          ? "Uploading..."
                          : "Upload Details"}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        disabled={
                          Boolean(detailImageUploading[GENERAL_PRODUCT_DETAIL_IMAGES_KEY])
                        }
                        onChange={(event) => {
                          handleProductDetailImageUpload(
                            GENERAL_PRODUCT_DETAIL_IMAGES_KEY,
                            event.target.files
                          );
                          event.target.value = "";
                        }}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {generalDetailImages.length > 0 && (
                    <div className={getDetailImageGridClassName(generalDetailImages.length, "mt-4")}>
                      {generalDetailImages.map((image, imageIndex) => (
                        <div
                          key={`${image}-${imageIndex}`}
                          className="relative overflow-hidden rounded-lg border border-gray-200 bg-white"
                        >
                          <img
                            src={image}
                            alt={`Product detail ${imageIndex + 1}`}
                            className="h-24 w-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              handleRemoveProductDetailImage(
                                GENERAL_PRODUCT_DETAIL_IMAGES_KEY,
                                imageIndex
                              )
                            }
                            className="absolute right-1 top-1 rounded-md bg-white/90 p-1 text-red-600 shadow-sm hover:bg-red-50"
                            aria-label={`Remove product detail image ${imageIndex + 1}`}
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
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

              {hasSizeStockInventory && (
                <div className="md:col-span-2 rounded-xl border border-gray-200 bg-gray-50 p-5">
                  <div className="mb-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-sm font-bold text-gray-900">
                          {usesSizeInventory
                            ? productSupportsOptionalSizeOptions(form)
                              ? "Size Inventory"
                              : "Size + Color Inventory"
                            : "Color Inventory"}
                        </p>
                        <p className="mt-1 text-xs font-medium text-gray-600">
                          {usesSizeInventory
                            ? productSupportsOptionalSizeOptions(form)
                              ? "Enter stock for each diaper size. Total stock updates automatically."
                              : "Enter stock for each size and selected color combination."
                            : "Enter stock for each selected color."}
                        </p>
                      </div>
                      {showOptionalSizeInventoryRemoval && (
                        <button
                          type="button"
                          onClick={handleDisableOptionalSizeInventory}
                          className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-3 py-2 text-xs font-bold text-gray-700 transition-colors hover:bg-white"
                        >
                          Use total quantity
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {form.sizeStocks.map((entry) => (
                      <label
                        key={`${entry.size}-${entry.color || "default"}`}
                        className="rounded-lg border border-gray-200 bg-white p-3"
                      >
                        <span className="block text-xs font-bold text-gray-600">
                          {usesSizeInventory
                            ? entry.color ? `${entry.size} / ${entry.color}` : entry.size
                            : entry.color}
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

              {hasSizeStockInventory && (
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
                disabled={loading}
                className="flex items-center space-x-3 rounded-xl bg-[var(--color-primary)] px-8 py-4 text-white transition-all duration-200 font-semibold shadow-lg hover:bg-[var(--color-primary-dark)] hover:shadow-xl transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:bg-[var(--color-primary-light)]"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Adding...</span>
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
