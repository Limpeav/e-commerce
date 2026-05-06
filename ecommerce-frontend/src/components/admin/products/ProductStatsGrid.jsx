import { Filter, Package, Sparkles, TrendingUp } from "lucide-react";
import { createElement } from "react";

const ProductStatCard = ({ icon, label, value, caption, iconClassName }) => (
  <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow duration-300">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600">{label}</p>
        <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
        <p className="text-xs text-gray-500 mt-2">{caption}</p>
      </div>
      <div className={iconClassName}>
        {createElement(icon, { className: "w-8 h-8" })}
      </div>
    </div>
  </div>
);

const ProductStatsGrid = ({ stats, showLowStockOnly, onToggleLowStock }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6 mb-8">
    <ProductStatCard
      icon={Package}
      label="Total Products"
      value={stats.totalProducts}
      caption="+12% from last month"
      iconClassName="bg-blue-100 p-3 rounded-xl text-blue-600"
    />
    <ProductStatCard
      icon={Filter}
      label="Categories"
      value={stats.categoryCount}
      caption="Active categories"
      iconClassName="bg-green-100 p-3 rounded-xl text-green-600"
    />
    <button
      type="button"
      onClick={onToggleLowStock}
      className={`text-left rounded-2xl p-6 border shadow-lg transition-all duration-300 hover:shadow-xl ${
        showLowStockOnly
          ? "bg-orange-50 border-orange-200 ring-2 ring-orange-200"
          : "bg-white border-gray-100"
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">Low Stock Alert</p>
          <p className="text-3xl font-bold text-orange-600 mt-1">{stats.lowStockCount}</p>
          <p className="text-xs text-orange-500 mt-2">
            {showLowStockOnly ? "Showing low stock products" : "Click to show low stock products"}
          </p>
        </div>
        <div className="bg-orange-100 p-3 rounded-xl">
          <Package className="w-8 h-8 text-orange-600" />
        </div>
      </div>
    </button>
    <ProductStatCard
      icon={TrendingUp}
      label="Best Sellers"
      value={stats.bestSellerCount}
      caption="Based on sold quantity"
      iconClassName="bg-emerald-100 p-3 rounded-xl text-emerald-600"
    />
    <ProductStatCard
      icon={Sparkles}
      label="New Arrivals"
      value={stats.newArrivalCount}
      caption="Set manually by admin"
      iconClassName="bg-blue-100 p-3 rounded-xl text-blue-600"
    />
  </div>
);

export default ProductStatsGrid;
