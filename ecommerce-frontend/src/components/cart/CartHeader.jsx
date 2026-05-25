import React from 'react';
import { useDarkMode } from '../../hooks';
import { useLanguage } from '../../context/useLanguage';

const CartHeader = ({ itemCount }) => {
  const [isDark] = useDarkMode();
  const { t } = useLanguage();
  const itemLabel = itemCount === 1 ? t("cart.item") : t("cart.items");

  return (
    <div className="mb-12">
      <h2 className="text-4xl font-bold text-text-main mb-3 tracking-tight">
        {t("cart.shoppingCart")}
      </h2>
      <div className="flex items-center gap-3">
        <span className="text-text-muted font-medium text-lg">
          {t("cart.itemCount", { count: itemCount, itemLabel })}
        </span>
        <div className={`h-1 w-1 rounded-full ${isDark ? "bg-slate-500" : "bg-stone-300"}`}></div>
        <span className="text-primary font-bold text-xs uppercase tracking-wide">{t("cart.securePayment")}</span>
      </div>
    </div>
  );
};

export default CartHeader;
