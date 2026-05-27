import React from 'react';
import { useDarkMode } from '../../hooks';
import { useLanguage } from '../../context/useLanguage';

const CartHeader = ({ itemCount }) => {
  const [isDark] = useDarkMode();
  const { t } = useLanguage();
  const itemLabel = itemCount === 1 ? t("cart.item") : t("cart.items");

  return (
    <div className="mb-8 text-center sm:mb-12 sm:text-left">
      <h2 className="mb-3 text-[clamp(2rem,9vw,2.5rem)] font-bold leading-tight tracking-tight text-text-main">
        {t("cart.shoppingCart")}
      </h2>
      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 sm:justify-start">
        <span className="text-base font-medium text-text-muted sm:text-lg">
          {t("cart.itemCount", { count: itemCount, itemLabel })}
        </span>
        <div className={`hidden h-1 w-1 rounded-full sm:block ${isDark ? "bg-slate-500" : "bg-stone-300"}`}></div>
        <span className="text-center text-xs font-bold uppercase tracking-wide text-primary sm:text-left">{t("cart.securePayment")}</span>
      </div>
    </div>
  );
};

export default CartHeader;
