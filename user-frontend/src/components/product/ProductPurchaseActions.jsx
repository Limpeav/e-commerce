import { useState } from "react";
import { Lock, ShoppingCart } from "lucide-react";
import { useLanguage } from "../../context/useLanguage";
import { useToast } from "../../context/useToast";
import { useDarkMode } from "../../hooks";
import {
  getAvailableStockForSize,
  getProductSizes,
  isClothingProduct,
} from "../../utils/productOptions";

const ProductPurchaseActions = ({
  product,
  quantity,
  setQuantity,
  onAddToCart,
  onLoginRequired,
  user,
}) => {
  const [isDark] = useDarkMode();
  const { t } = useLanguage();
  const { info } = useToast();
  const sizeOptions = getProductSizes(product);
  const needsSize = isClothingProduct(product);
  const [selectedSize, setSelectedSize] = useState("");

  return (
    <div className="space-y-3 pt-1 sm:pt-2">
      {needsSize && (
        <div className="space-y-2">
          <label className={`block pl-1 text-[11px] font-black uppercase tracking-[0.2em] ${isDark ? "text-slate-100" : "text-stone-900"}`}>
            Size
          </label>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
            {sizeOptions.map((size) => {
              const isSelected = selectedSize === size;
              const availableForSize = getAvailableStockForSize(product, size);
              const isUnavailable = availableForSize <= 0;

              return (
                <button
                  key={size}
                  type="button"
                  onClick={() => {
                    if (!isUnavailable) setSelectedSize(size);
                  }}
                  disabled={isUnavailable}
                  className={`h-11 rounded-xl border text-sm font-black transition-all active:scale-95 ${
                    isSelected
                      ? "border-primary bg-primary text-white shadow-md"
                      : isUnavailable
                        ? isDark
                          ? "cursor-not-allowed border-slate-800 bg-slate-950 text-slate-600 line-through"
                          : "cursor-not-allowed border-stone-200 bg-stone-100 text-stone-400 line-through"
                      : isDark
                        ? "border-slate-700 bg-slate-900 text-slate-200 hover:border-primary"
                        : "border-stone-200 bg-white text-stone-700 hover:border-primary"
                  }`}
                  aria-pressed={isSelected}
                  title={isUnavailable ? "Out of stock" : `${availableForSize} available`}
                >
                  {size}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <label className={`block pl-1 text-[11px] font-black uppercase tracking-[0.2em] ${isDark ? "text-slate-100" : "text-stone-900"}`}>
        Quantity
      </label>
      <div className="flex w-full items-stretch gap-2 sm:gap-4">
        <div className={`flex shrink-0 items-center justify-between gap-0.5 rounded-[1.15rem] border-2 p-1.5 shadow-sm sm:gap-3 ${isDark ? "border-slate-700 bg-slate-900" : "border-stone-100 bg-white"}`}>
          <button
            type="button"
            onClick={() => setQuantity((currentQuantity) => Math.max(1, currentQuantity - 1))}
            className={`flex h-10 w-9 items-center justify-center rounded-xl border text-xl font-black transition-all active:scale-95 sm:w-10 ${isDark ? "border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700" : "border-stone-100 bg-stone-50 text-stone-600 hover:bg-stone-100 hover:shadow-sm"}`}
            aria-label="Decrease quantity"
          >
            −
          </button>
          <span className={`w-7 text-center font-display text-lg font-black sm:w-14 sm:text-2xl ${isDark ? "text-white" : "text-stone-900"}`}>
            {quantity}
          </span>
          <button
            type="button"
            onClick={() => setQuantity((currentQuantity) => currentQuantity + 1)}
            className={`flex h-10 w-9 items-center justify-center rounded-xl border text-xl font-black transition-all active:scale-95 sm:w-10 ${isDark ? "border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700" : "border-stone-100 bg-stone-50 text-stone-600 hover:bg-stone-100 hover:shadow-sm"}`}
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>

        <button
          type="button"
          onClick={() => {
            if (!user) {
              onLoginRequired?.();
              return;
            }

            if (needsSize && !selectedSize) {
              info(t("product.selectSize"), t("product.selectSizeMessage"));
              return;
            }

            onAddToCart({ size: selectedSize });
          }}
          className={`group relative flex min-h-14 min-w-0 flex-1 items-center justify-center gap-2 overflow-hidden rounded-[1.15rem] border-2 px-2 py-3 text-xs font-bold transition-all duration-300 active:scale-95 sm:gap-3 sm:px-4 sm:text-base ${
            user
              ? needsSize && !selectedSize
                ? isDark
                  ? "cursor-pointer border-slate-700 bg-slate-800 text-slate-300 hover:border-primary"
                  : "cursor-pointer border-stone-200 bg-stone-100 text-stone-600 hover:border-primary"
                : "cursor-pointer border-primary bg-primary text-white shadow-[0_20px_44px_-18px_rgba(122,150,126,0.42)] hover:border-primary-dark hover:bg-primary-dark"
              : isDark
                ? "cursor-pointer border-primary/30 bg-primary/15 text-primary-light hover:bg-primary hover:text-slate-950"
                : "cursor-pointer border-primary/25 bg-primary/10 text-primary hover:bg-primary hover:text-white"
          }`}
        >
          {user ? (
            <>
              <ShoppingCart className="h-5 w-5 shrink-0 sm:h-6 sm:w-6" strokeWidth={2.5} />
              <span className="truncate tracking-wide">Add to Cart</span>
            </>
          ) : (
            <>
              <Lock className="h-5 w-5 shrink-0 sm:h-6 sm:w-6" strokeWidth={2.5} />
              <span className="truncate tracking-wide">Log in to Buy</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default ProductPurchaseActions;
