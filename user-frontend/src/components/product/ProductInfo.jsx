import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Star, Baby, Calendar, ChevronDown } from 'lucide-react';
import { useDarkMode } from '../../hooks';
import { useLanguage } from '../../context/useLanguage';
import { getLocalizedProductText } from '../../utils/productLocalization';
import {
  formatExpiryDate,
  productSupportsExpiry,
} from '../../utils/productExpiry';
import ProductPurchaseActions from './ProductPurchaseActions';
import DualCurrencyPrice from '../common/DualCurrencyPrice';

const ProductInfo = ({
  product,
  quantity,
  setQuantity,
  onAddToCart,
  onLoginRequired,
  user,
  selectedSize,
  onSizeChange,
  selectedColor,
  onColorChange,
  showPurchaseActions = true,
  showVariantOptions = true,
  showCheckoutControls = true,
}) => {
  const [isDark] = useDarkMode();
  const { language, t } = useLanguage();
  const isKhmer = language === "kh";
  const [expandedDescriptionKey, setExpandedDescriptionKey] = useState(null);
  const localizedProduct = getLocalizedProductText(product, language);
  const descriptionKey = `${product._id}-${language}`;
  const isDescriptionExpanded = expandedDescriptionKey === descriptionKey;
  const price = Number(product.price || 0);
  const discountPrice = Number(product.discountPrice || 0);
  const hasDiscount = discountPrice > 0 && discountPrice < price;
  const discountPercent = hasDiscount ? Math.round(((price - discountPrice) / price) * 100) : 0;
  const isInStock = Number(product.stock || 0) > 0;
  const purchaseActionProps = {
    product,
    quantity,
    setQuantity,
    onAddToCart,
    onLoginRequired,
    user,
    selectedSize,
    onSizeChange,
    selectedColor,
    onColorChange,
  };

  return (
    <div className="flex flex-col justify-center space-y-4 font-sans sm:space-y-4.5">
      {/* Category & Status */}
      <div className="flex items-center gap-2.5">
        <span className={`inline-flex items-center gap-1.5 text-indigo-600 border px-3 py-1 rounded-full text-[11px] font-black tracking-[0.18em] uppercase ${isDark ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-300" : "bg-indigo-50 border-indigo-100"}`}>
          <Baby className="w-4 h-4" />
          {product.category || 'Essentials'}
        </span>
        <div className={`h-1.5 w-1.5 rounded-full ${isDark ? "bg-slate-500" : "bg-stone-300"}`}></div>
        <span
          className={`text-[11px] font-black tracking-[0.18em] uppercase px-3 py-1 rounded-full border ${
            isInStock
              ? isDark
                ? "text-primary bg-primary/10 border-primary/25"
                : "text-primary-dark bg-primary/10 border-primary/25"
              : isDark
                ? "text-rose-300 bg-rose-500/10 border-rose-500/20"
                : "text-rose-700 bg-rose-50 border-rose-200"
          }`}
        >
          {isInStock ? "In Stock" : "Out of Stock"}
        </span>
      </div>

      {/* Product Title & Rating */}
      <div className="space-y-2.5">
        <h1 data-no-static-translation className={`text-2xl sm:text-[2.2rem] ${isKhmer ? "lg:text-[2rem]" : "lg:text-[2.25rem]"} font-black leading-[1.05] font-display tracking-tight ${isDark ? "text-slate-50" : "text-stone-900"}`}>
          {localizedProduct.title}
        </h1>

        <Link
          to={`/products/${product._id}/reviews`}
          state={{ fromProductDetail: true }}
          className={`group flex w-full items-center gap-3 rounded-2xl border p-3 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-primary hover:shadow-lg hover:shadow-primary/10 active:translate-y-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:w-fit sm:min-w-[28rem] ${
            isDark
              ? "border-slate-700 bg-slate-900/80"
              : "border-stone-200 bg-white"
          }`}
          aria-label={t("product.viewCustomerReviews")}
        >
          <div className={`flex shrink-0 items-center gap-1 rounded-xl border px-2.5 py-2 transition-colors group-hover:border-primary ${
            isDark
              ? "border-amber-500/20 bg-amber-500/10"
              : "border-amber-100 bg-amber-50"
          }`}>
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${i < Math.floor(product.rating || 0)
                    ? "fill-amber-400 text-amber-400"
                    : "text-amber-200 fill-amber-50"
                    }`}
                />
              ))}
            </div>
            <span className="ml-1 text-sm font-black text-amber-600">
              {product.rating?.toFixed(1) || "0.0"}
            </span>
          </div>

          <div className="min-w-0 flex-1">
            <span className="block text-sm font-black text-text-main transition-colors group-hover:text-primary">
              {t("product.viewCustomerReviews")}
            </span>
            <span className="block text-xs font-bold text-text-muted">
              {t("product.reviewCount", { count: product.numReviews || 0 })}
            </span>
          </div>

          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary transition-all group-hover:bg-primary group-hover:text-white">
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </span>
        </Link>
      </div>

      <div className={`h-px w-full ${isDark ? "bg-slate-800" : "bg-stone-100"}`}></div>

      {/* Price */}
      <div className="flex flex-wrap items-end gap-2.5 sm:gap-3">
        {hasDiscount ? (
          <>
            <DualCurrencyPrice amount={discountPrice} className={`flex flex-wrap items-baseline gap-x-3 gap-y-1 text-3xl sm:text-4xl lg:text-[3rem] font-black font-display tracking-normal ${isDark ? "text-white" : "text-stone-900"}`} khrClassName="text-base font-bold tracking-wide text-primary sm:text-xl" separator="" />
            <span className={`mb-1 line-through text-lg font-bold decoration-2 sm:mb-1.5 sm:text-xl ${isDark ? "text-slate-500" : "text-stone-400"}`}>
              ${price.toFixed(2)}
            </span>
            <div className="mb-1.5 rounded-xl bg-[#FF3B30] px-3 py-1 text-[11px] font-black uppercase tracking-wide text-white shadow-sm shadow-[#FF3B30]/30 sm:mb-2">
              Save {discountPercent}%
            </div>
          </>
        ) : (
          <DualCurrencyPrice amount={price} className={`flex flex-wrap items-baseline gap-x-3 gap-y-1 text-3xl sm:text-4xl lg:text-[3rem] font-black font-display tracking-normal ${isDark ? "text-white" : "text-stone-900"}`} khrClassName="text-base font-bold tracking-wide text-primary sm:text-xl" separator="" />
        )}
      </div>

      {showPurchaseActions && showVariantOptions && (
        <ProductPurchaseActions
          {...purchaseActionProps}
          showSizeSelector={false}
          showCheckoutControls={false}
        />
      )}

      {/* Description */}
      <div className={`prose prose-stone max-w-none rounded-[1.2rem] border p-4 shadow-sm ${isDark ? "bg-slate-900 border-slate-800" : "bg-stone-50/50 border-stone-100"}`}>
        <h3 className={`mb-2 text-[11px] font-black uppercase tracking-[0.2em] ${isDark ? "text-slate-100" : "text-stone-900"}`}>Product Description</h3>
        <p
          id="product-description"
          data-no-static-translation
          className={`text-sm leading-relaxed font-medium sm:text-[15px] ${isDescriptionExpanded ? "" : "line-clamp-3"} ${isDark ? "text-slate-300" : "text-stone-600"}`}
        >
          {localizedProduct.description}
        </p>
        <button
          type="button"
          onClick={() => setExpandedDescriptionKey((currentKey) => currentKey === descriptionKey ? null : descriptionKey)}
          aria-expanded={isDescriptionExpanded}
          aria-controls="product-description"
          aria-label={isDescriptionExpanded ? "Collapse product description" : "Show full product description"}
          className={`mx-auto mt-2 flex h-8 w-10 items-center justify-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${isDark ? "text-slate-300 hover:bg-slate-800 hover:text-white" : "text-stone-500 hover:bg-stone-200/70 hover:text-stone-900"}`}
        >
          <ChevronDown className={`h-5 w-5 transition-transform duration-300 ${isDescriptionExpanded ? "rotate-180" : ""}`} />
        </button>
      </div>

      {/* Expiry Date - shown for Milk and Bath & Skin */}
      {productSupportsExpiry(product.category) && product.expiryDate && (
        <div className={`flex items-center gap-2 rounded-[1.2rem] border p-3 shadow-sm ${isDark ? 'bg-amber-500/10 border-amber-500/20' : 'bg-amber-50 border-amber-200'}`}>
          <Calendar className={`w-5 h-5 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
          <div>
            <span className={`text-xs font-black uppercase tracking-wider ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>
              {t("product.expiryDate")}
            </span>
            <p className={`text-sm font-bold ${isDark ? 'text-amber-300' : 'text-amber-900'}`}>
              {formatExpiryDate(product.expiryDate, { long: true })}
            </p>
          </div>
        </div>
      )}

      {showPurchaseActions && (
        <ProductPurchaseActions
          {...purchaseActionProps}
          showVariantOptions={showVariantOptions}
          showColorSelector={false}
          showCheckoutControls={showCheckoutControls}
        />
      )}
    </div>
  );
};

export default ProductInfo;
