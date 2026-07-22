import { useState } from "react";
import { AlertTriangle, Lock, ShoppingCart, X } from "lucide-react";
import { useLanguage } from "../../context/useLanguage";
import { useToast } from "../../context/useToast";
import { useDarkMode } from "../../hooks";
import {
  getAvailableStock,
  getAvailableStockForSize,
  getProductColors,
  getProductSizes,
  isClothingProduct,
  productHasColorOptions,
} from "../../utils/productOptions";

const COLOR_SWATCHES = {
  beige: "#d6c6a8",
  black: "#111827",
  blue: "#2563eb",
  brown: "#92400e",
  burgundy: "#7f1d1d",
  charcoal: "#374151",
  cream: "#f5f5dc",
  gold: "#d97706",
  gray: "#6b7280",
  green: "#16a34a",
  grey: "#6b7280",
  ivory: "#fffff0",
  khaki: "#c3b091",
  navy: "#1e3a8a",
  oak: "#c48a4a",
  orange: "#f97316",
  pink: "#ec4899",
  purple: "#9333ea",
  red: "#dc2626",
  sage: "#8fa98f",
  silver: "#c0c0c0",
  tan: "#d2b48c",
  walnut: "#7b4f2f",
  white: "#ffffff",
  wood: "#b7793f",
  yellow: "#eab308",
};

const COLOR_PHRASE_SWATCHES = [
  ["soft white", "#f8f5ef"],
  ["warm white", "#f7f0df"],
  ["natural oak", "#c48a4a"],
  ["light oak", "#d7ad75"],
  ["dark oak", "#8b5a2b"],
  ["sage green", "#8fa98f"],
  ["forest green", "#166534"],
  ["sky blue", "#38bdf8"],
  ["baby blue", "#93c5fd"],
  ["royal blue", "#1d4ed8"],
  ["hot pink", "#ec4899"],
  ["rose pink", "#f9a8d4"],
];

const getColorSwatch = (color = "") => {
  const normalizedColor = String(color).trim().toLowerCase();
  if (!normalizedColor) return "#e5e7eb";

  if (/^#(?:[0-9a-f]{3}){1,2}$/i.test(normalizedColor)) {
    return normalizedColor;
  }

  const phraseMatch = COLOR_PHRASE_SWATCHES.find(([phrase]) =>
    normalizedColor.includes(phrase)
  );
  if (phraseMatch) return phraseMatch[1];

  const wordMatch = normalizedColor
    .split(/[^a-z0-9#]+/)
    .find((word) => COLOR_SWATCHES[word]);

  return wordMatch ? COLOR_SWATCHES[wordMatch] : "#e5e7eb";
};

const ProductPurchaseActions = ({
  product,
  quantity,
  setQuantity,
  onAddToCart,
  onLoginRequired,
  user,
  selectedSize: controlledSelectedSize,
  onSizeChange,
  selectedColor: controlledSelectedColor,
  onColorChange,
  showVariantOptions = true,
  showCheckoutControls = true,
}) => {
  const [isDark] = useDarkMode();
  const { t } = useLanguage();
  const { info } = useToast();
  const sizeOptions = getProductSizes(product);
  const colorOptions = getProductColors(product);
  const needsSize = isClothingProduct(product);
  const needsColor = productHasColorOptions(product);
  const [internalSelectedSize, setInternalSelectedSize] = useState("");
  const [internalSelectedColor, setInternalSelectedColor] = useState("");
  const [stockLimitDialog, setStockLimitDialog] = useState(null);
  const selectedSize = controlledSelectedSize ?? internalSelectedSize;
  const selectedColor = controlledSelectedColor ?? internalSelectedColor;
  const setSelectedSize = (size) => {
    setInternalSelectedSize(size);
    onSizeChange?.(size);
  };
  const setSelectedColor = (color) => {
    setInternalSelectedColor(color);
    onColorChange?.(color);
  };
  const getSelectedAvailableStock = () => {
    return getAvailableStock(product, needsSize ? selectedSize : "", selectedColor);
  };

  const clampQuantityToStock = (availableStock) => {
    if (!Number.isFinite(availableStock)) return;

    setQuantity((currentQuantity) =>
      Math.max(1, Math.min(Number(currentQuantity || 1), availableStock || 1))
    );
  };

  const handleSelectSize = (size, availableForSize) => {
    setSelectedSize(size);
    clampQuantityToStock(availableForSize);
  };

  const handleSelectColor = (color, availableForColor) => {
    setSelectedColor(color);
    clampQuantityToStock(availableForColor);
  };

  const handleIncreaseQuantity = () => {
    const requestedQuantity = Number(quantity || 1) + 1;
    const availableStock = getSelectedAvailableStock();

    if (Number.isFinite(availableStock) && requestedQuantity > availableStock) {
      setStockLimitDialog({
        available: availableStock,
        requested: requestedQuantity,
      });
      return;
    }

    setQuantity(requestedQuantity);
  };

  const shouldShowSizeOptions = showVariantOptions && needsSize;
  const shouldShowColorOptions = showVariantOptions && needsColor;

  if (!showCheckoutControls && !shouldShowSizeOptions && !shouldShowColorOptions) {
    return null;
  }

  return (
    <div className="space-y-3 pt-1 sm:pt-2">
      {stockLimitDialog && (
        <div className="fixed inset-0 z-[180] flex items-center justify-center px-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
            onClick={() => setStockLimitDialog(null)}
            aria-label="Close stock limit message"
          />
          <div
            role="dialog"
            aria-modal="true"
            className={`relative w-full max-w-md rounded-[1.5rem] border p-6 text-center shadow-2xl ${
              isDark
                ? "border-slate-700 bg-slate-950 text-slate-50"
                : "border-stone-200 bg-white text-stone-950"
            }`}
          >
            <button
              type="button"
              onClick={() => setStockLimitDialog(null)}
              className={`absolute right-4 top-4 rounded-full p-2 transition-colors ${
                isDark
                  ? "text-slate-400 hover:bg-slate-800 hover:text-white"
                  : "text-stone-500 hover:bg-stone-100 hover:text-stone-900"
              }`}
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-300">
              <AlertTriangle className="h-7 w-7" />
            </div>
            <h3 className="mt-4 font-display text-xl font-black text-text-main">
              {t("product.stockLimitReached")}
            </h3>
            <p className="mt-2 text-sm font-semibold leading-6 text-text-muted">
              {t("cart.stockLimitMessage", {
                available: stockLimitDialog.available,
                requested: stockLimitDialog.requested,
              })}
            </p>
            <button
              type="button"
              onClick={() => setStockLimitDialog(null)}
              className="mt-6 w-full rounded-2xl bg-primary px-5 py-3 text-sm font-black uppercase tracking-[0.16em] text-white shadow-lg shadow-primary/20 transition-colors hover:bg-primary-dark"
            >
              {t("product.ok")}
            </button>
          </div>
        </div>
      )}

      {shouldShowSizeOptions && (
        <div className="space-y-2">
          <label className={`block pl-1 text-[11px] font-black uppercase tracking-[0.2em] ${isDark ? "text-slate-100" : "text-stone-900"}`}>
            {t("product.size")}
          </label>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
            {sizeOptions.map((size) => {
              const isSelected = selectedSize === size;
              const availableForSize = getAvailableStockForSize(product, size, selectedColor);
              const isUnavailable = availableForSize <= 0;

              return (
                <button
                  key={size}
                  type="button"
                  onClick={() => {
                    if (!isUnavailable) handleSelectSize(size, availableForSize);
                  }}
                  disabled={isUnavailable}
                  className={`flex min-h-14 flex-col items-center justify-center rounded-xl border px-2 py-1.5 text-sm font-black transition-all active:scale-95 ${
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
                    title={isUnavailable ? t("product.outOfStock") : t("product.availableCount", { count: availableForSize })}
                  >
                  <span className="leading-none">{size}</span>
                  <span
                    className={`mt-1 text-[10px] font-extrabold leading-none ${
                      isSelected
                        ? "text-white/85"
                        : isUnavailable
                          ? isDark
                            ? "text-slate-600"
                            : "text-stone-400"
                          : "text-text-muted"
                    }`}
                  >
                    {isUnavailable ? t("product.out") : t("product.qtyCount", { count: availableForSize })}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {shouldShowColorOptions && (
        <div className="space-y-2">
          <label className={`block pl-1 text-[11px] font-black uppercase tracking-[0.2em] ${isDark ? "text-slate-100" : "text-stone-900"}`}>
            {t("product.color")}
          </label>
          <div className="flex flex-wrap gap-2">
            {colorOptions.map((color) => {
              const isSelected = selectedColor === color;
              const availableForColor =
                getAvailableStock(product, needsSize ? selectedSize : "", color);
              const isUnavailable = needsSize
                ? selectedSize && availableForColor <= 0
                : availableForColor <= 0;

              return (
                <button
                  key={color}
                  type="button"
                  onClick={() => {
                    if (!isUnavailable) handleSelectColor(color, availableForColor);
                  }}
                  disabled={isUnavailable}
                  className={`flex min-h-12 items-center gap-2 rounded-xl border px-3 py-1.5 text-sm font-black transition-all active:scale-95 ${
                    isSelected
                      ? "border-[#DBDBDB] bg-[#DBDBDB] text-stone-900 shadow-md"
                      : isUnavailable
                        ? isDark
                          ? "cursor-not-allowed border-slate-800 bg-slate-950 text-slate-600 line-through"
                          : "cursor-not-allowed border-stone-200 bg-stone-100 text-stone-400 line-through"
                      : isDark
                        ? "border-slate-700 bg-slate-900 text-slate-200 hover:border-primary"
                        : "border-stone-200 bg-white text-stone-700 hover:border-primary"
                  }`}
                  aria-pressed={isSelected}
                  title={isUnavailable ? t("product.outOfStock") : t("product.availableCount", { count: availableForColor })}
                >
                  <span
                    className="h-5 w-5 rounded-full border border-black/10 shadow-inner"
                    style={{ backgroundColor: getColorSwatch(color) }}
                    aria-hidden="true"
                  />
                  <span className="flex flex-col items-start leading-none">
                    <span>{color}</span>
                    {!needsSize && (
                      <span
                        className={`mt-1 text-[10px] font-extrabold uppercase tracking-wide ${
                          isSelected
                            ? "text-stone-700"
                            : isUnavailable
                              ? isDark
                                ? "text-slate-600"
                                : "text-stone-400"
                              : "text-text-muted"
                        }`}
                      >
                        {isUnavailable ? t("product.out") : t("product.qtyCount", { count: availableForColor })}
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {showCheckoutControls && (
        <>
          <label className={`block pl-1 text-[11px] font-black uppercase tracking-[0.2em] ${isDark ? "text-slate-100" : "text-stone-900"}`}>
            {t("product.quantity")}
          </label>
          <div className="flex w-full flex-col items-stretch gap-3 sm:flex-row xl:flex-col">
            <div className={`flex shrink-0 items-center justify-between gap-0.5 rounded-[1.15rem] border-2 p-1.5 shadow-sm sm:gap-3 xl:w-full ${isDark ? "border-slate-700 bg-slate-900" : "border-stone-100 bg-white"}`}>
              <button
                type="button"
                onClick={() => setQuantity((currentQuantity) => Math.max(1, currentQuantity - 1))}
                className={`flex h-10 w-9 items-center justify-center rounded-xl border text-xl font-black transition-all active:scale-95 sm:w-10 ${isDark ? "border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700" : "border-stone-100 bg-stone-50 text-stone-600 hover:bg-stone-100 hover:shadow-sm"}`}
                aria-label={t("product.decreaseQuantity")}
              >
                −
              </button>
              <span className={`w-7 text-center font-display text-lg font-black sm:w-14 sm:text-2xl ${isDark ? "text-white" : "text-stone-900"}`}>
                {quantity}
              </span>
              <button
                type="button"
                onClick={handleIncreaseQuantity}
                className={`flex h-10 w-9 items-center justify-center rounded-xl border text-xl font-black transition-all active:scale-95 sm:w-10 ${isDark ? "border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700" : "border-stone-100 bg-stone-50 text-stone-600 hover:bg-stone-100 hover:shadow-sm"}`}
                aria-label={t("product.increaseQuantity")}
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

                if (needsColor && !selectedColor) {
                  info(t("product.chooseColor"), t("product.chooseColorMessage"));
                  return;
                }

                onAddToCart({ size: selectedSize, color: selectedColor });
              }}
              className={`group relative flex min-h-14 min-w-0 flex-1 items-center justify-center gap-2 overflow-hidden rounded-[1.15rem] border-2 px-2 py-3 text-xs font-bold transition-all duration-300 active:scale-95 sm:gap-3 sm:px-4 sm:text-base ${
                user
                  ? needsSize && !selectedSize
                    ? isDark
                      ? "cursor-pointer border-slate-700 bg-slate-800 text-slate-300 hover:border-primary"
                      : "cursor-pointer border-stone-200 bg-stone-100 text-stone-600 hover:border-primary"
                    : needsColor && !selectedColor
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
                  <span className="truncate tracking-wide">{t("product.addToCart")}</span>
                </>
              ) : (
                <>
                  <Lock className="h-5 w-5 shrink-0 sm:h-6 sm:w-6" strokeWidth={2.5} />
                  <span className="truncate tracking-wide">{t("product.loginToBuy")}</span>
                </>
              )}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default ProductPurchaseActions;
