import { Package, Percent, ShoppingBag, Sparkles, TrendingUp } from "lucide-react";
import { createElement } from "react";

const ProductStatCard = ({
  as: Component = "div",
  icon,
  label,
  onClick,
  value,
  caption,
  iconClassName,
  valueClassName = "text-gray-900",
}) => (
  <Component
    type={Component === "button" ? "button" : undefined}
    onClick={onClick}
    className="w-full text-left bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5"
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600">{label}</p>
        <p className={`text-3xl font-bold ${valueClassName} mt-1`}>{value}</p>
        <p className="text-xs text-gray-500 mt-2">{caption}</p>
      </div>
      <div className={iconClassName}>
        {createElement(icon, { className: "w-8 h-8" })}
      </div>
    </div>
  </Component>
);

const ProductStatsGrid = ({
  stats,
  onOpenPromotions,
  onOpenSold,
  onOpenBestSellers,
  onOpenNewArrivals,
}) => (
  <div className="grid grid-cols-1 gap-6 mb-8 md:grid-cols-2 xl:grid-cols-5">
    <ProductStatCard
      icon={Package}
      label="Total Products"
      value={stats.totalProducts}
      caption="+12% from last month"
      iconClassName="bg-blue-100 p-3 rounded-xl text-blue-600"
      valueClassName="text-green-600"
    />
    <button
      type="button"
      onClick={onOpenPromotions}
      className="text-left rounded-2xl border border-gray-100 bg-white p-6 shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:border-[#fecdd3] hover:bg-[#fff1f2] hover:shadow-xl"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">Promotion Products</p>
          <p className="text-3xl font-bold text-[#dc2626] mt-1">{stats.promotionCount}</p>
          <p className="text-xs text-[#e11d48] mt-2">Open discount products page</p>
        </div>
        <div className="bg-[#fee2e2] p-3 rounded-xl">
          <Percent className="w-8 h-8 text-[#dc2626]" />
        </div>
      </div>
    </button>
    <ProductStatCard
      as="button"
      icon={ShoppingBag}
      label="Sold"
      value={stats.totalSoldCount}
      caption="Open sold products page"
      iconClassName="bg-orange-100 p-3 rounded-xl text-[#b45309]"
      onClick={onOpenSold}
      valueClassName="text-[#b45309]"
    />
    <ProductStatCard
      as="button"
      icon={TrendingUp}
      label="Best Sellers"
      value={stats.bestSellerCount}
      caption="Open sold products page"
      iconClassName="bg-gray-100 p-3 rounded-xl text-emerald-600"
      onClick={onOpenBestSellers}
      valueClassName="text-green-600"
    />
    <ProductStatCard
      as="button"
      icon={Sparkles}
      label="New Arrivals"
      value={stats.newArrivalCount}
      caption="Open new arrivals page"
      iconClassName="bg-blue-100 p-3 rounded-xl text-blue-600"
      onClick={onOpenNewArrivals}
      valueClassName="text-green-600"
    />
  </div>
);

export default ProductStatsGrid;
