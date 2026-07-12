import { Link } from "react-router-dom";
import {
  ChevronDown,
  Eye,
  Filter,
  Loader2,
  LogOut,
  MapPin,
  Navigation,
  Package,
  Phone,
  Search,
  User,
} from "lucide-react";
import OrdersList from "../Orders/List";

const DeliveryDashboardView = ({ dashboard }) => {
  const {
    deliveryStats,
    expandedOrderDates,
    filteredOrders,
    formatCurrency,
    formatDeliveryAddress,
    formatPhoneNumber,
    getDisplayPaymentStatus,
    getMapUrl,
    getPaymentColor,
    getStatusColor,
    getStatusLabel,
    getStatusStyle,
    groupedOrders,
    handleDeliveryLogout,
    handleOpenGoogleMaps,
    handleRowNavigation,
    deliveryBusyLabel,
    deliveryMapOrderId,
    deliveryNavigatingOrderId,
    normalizeOrderStatus,
    receiptNotice,
    searchTerm,
    searchSuggestions,
    setSearchTerm,
    setStatusFilter,
    statusFilter,
    toggleOrderDate,
  } = dashboard;

  return (
    <div className="min-h-screen bg-gray-50 px-4 pb-24 pt-20 sm:px-6 lg:px-8 lg:pt-8">
      {deliveryBusyLabel && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-gray-950/35 px-6 backdrop-blur-[2px]">
          <div className="flex min-h-28 w-full max-w-xs flex-col items-center justify-center gap-3 rounded-2xl bg-white p-6 text-center shadow-2xl">
            <Loader2 className="h-8 w-8 animate-spin text-blue-700" />
            <p className="text-sm font-black text-gray-950">{deliveryBusyLabel}</p>
          </div>
        </div>
      )}

      {receiptNotice && (
        <div className="fixed left-4 right-4 top-5 z-50 mx-auto max-w-xl rounded-2xl bg-gray-950 px-6 py-5 text-center text-base font-black leading-6 text-white shadow-2xl sm:left-auto sm:right-6 sm:text-lg">
          {receiptNotice}
        </div>
      )}

      <div className="mx-auto max-w-3xl">
        <header className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-blue-700">Delivery</p>
            <h1 className="text-2xl font-black text-gray-950">
              Today&apos;s Runs
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/delivery/account"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 text-sm font-black text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
            >
              <User className="h-4 w-4" />
              Account
            </Link>
            <button
              type="button"
              onClick={handleDeliveryLogout}
              disabled={Boolean(deliveryBusyLabel)}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 text-sm font-black text-red-600 shadow-sm transition-colors hover:bg-red-50 disabled:cursor-wait disabled:opacity-70"
            >
              {deliveryBusyLabel === "Logging out..." ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <LogOut className="h-4 w-4" />
              )}
              {deliveryBusyLabel === "Logging out..." ? "Logging out..." : "Logout"}
            </button>
          </div>
        </header>

        <section className="mb-4 grid grid-cols-2 gap-2">
          {deliveryStats.map((stat) => (
            <div
              key={stat.label}
              className={`rounded-xl p-3 shadow-sm ${stat.className}`}
            >
              <p className="text-[11px] font-bold uppercase">{stat.label}</p>
              <p className="mt-1 truncate text-xl font-black">{stat.value}</p>
            </div>
          ))}
        </section>

        <section className="sticky top-0 z-20 -mx-4 mb-4 border-y border-gray-200 bg-gray-50/95 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-2xl sm:border">
          <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_180px]">
            <label className="relative">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                list="delivery-dashboard-search-suggestions"
                aria-label="Search deliveries"
                placeholder="Search order or customer"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="h-12 w-full rounded-xl border border-gray-200 bg-white pl-10 pr-4 text-base font-medium text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
              <datalist id="delivery-dashboard-search-suggestions">
                {(searchSuggestions || []).map((suggestion) => (
                  <option key={suggestion} value={suggestion} />
                ))}
              </datalist>
            </label>
            <label className="relative">
              <Filter className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <select
                aria-label="Filter deliveries by status"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="h-12 w-full appearance-none rounded-xl border border-gray-200 bg-white pl-10 pr-4 text-base font-bold text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              >
                <option value="All">All status</option>
                <option value="Processing">Processing</option>
                <option value="Delivered">Delivered</option>
              </select>
            </label>
          </div>
        </section>

        {filteredOrders.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-5 py-12 text-center">
            <Package className="mx-auto mb-3 h-10 w-10 text-gray-400" />
            <p className="font-bold text-gray-900">No deliveries found</p>
          </div>
        ) : (
          <div className="space-y-5">
            {groupedOrders.map((group) => {
              const isExpanded = expandedOrderDates[group.dateKey];

              return (
                <section key={group.dateKey} className="space-y-3">
                  <button
                    type="button"
                    onClick={() => toggleOrderDate(group.dateKey)}
                    className="flex w-full items-center justify-between rounded-xl bg-white px-4 py-3 text-left shadow-sm"
                    aria-expanded={isExpanded}
                  >
                    <span>
                      <span className="block text-sm font-black text-gray-950">
                        {group.label}
                      </span>
                      <span className="block text-xs font-semibold text-gray-500">
                        {group.orders.length} stop
                        {group.orders.length === 1 ? "" : "s"}
                      </span>
                    </span>
                    <ChevronDown
                      className={`h-5 w-5 text-gray-500 transition-transform ${
                        isExpanded ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {isExpanded &&
                    group.orders.map((order) => {
                      const mapUrl = getMapUrl(order.shippingAddress);
                      const phone = order.shippingAddress?.phone;
                      const status = normalizeOrderStatus(order.orderStatus);

                      return (
                        <article
                          key={order._id}
                          className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
                        >
                          <button
                            type="button"
                            onClick={() => handleRowNavigation(order._id)}
                            disabled={Boolean(deliveryBusyLabel)}
                            className="block w-full p-4 text-left disabled:cursor-wait disabled:opacity-75"
                          >
                            <div className="mb-3 flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="font-mono text-sm font-black text-gray-950">
                                  #{order._id.slice(-8)}
                                </p>
                                <p className="mt-1 truncate text-lg font-black text-gray-950">
                                  {order.shippingAddress?.fullName ||
                                    order.user?.name ||
                                    "Customer"}
                                </p>
                              </div>
                              <span
                                className={`shrink-0 rounded-full px-3 py-1 text-xs font-black ${getStatusColor(
                                  order.orderStatus
                                )}`}
                                style={getStatusStyle(order.orderStatus)}
                              >
                                {getStatusLabel(status)}
                              </span>
                            </div>

                            <div className="space-y-2 text-sm font-semibold text-gray-600">
                              <p className="flex items-start gap-2">
                                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                                <span className="line-clamp-2">
                                  {formatDeliveryAddress(order.shippingAddress)}
                                </span>
                              </p>
                              <p className="flex items-center gap-2">
                                <Phone className="h-4 w-4 text-gray-400" />
                                {formatPhoneNumber(phone)}
                              </p>
                            </div>

                            <div className="mt-4 grid grid-cols-2 gap-2">
                              <div className="rounded-xl bg-gray-50 p-3">
                                <p className="text-[11px] font-bold uppercase text-gray-500">
                                  Total
                                </p>
                                <p className="text-lg font-black text-gray-950">
                                  {formatCurrency(order.totalPrice)}
                                </p>
                              </div>
                              <div className="rounded-xl bg-gray-50 p-3">
                                <p className="text-[11px] font-bold uppercase text-gray-500">
                                  Payment
                                </p>
                                <p
                                  className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-xs font-black ${getPaymentColor(
                                    getDisplayPaymentStatus(order)
                                  )}`}
                                >
                                  {getDisplayPaymentStatus(order)}
                                </p>
                              </div>
                            </div>
                          </button>

                          <div className="grid grid-cols-2 border-t border-gray-100">
                            {mapUrl ? (
                              <button
                                type="button"
                                onClick={() =>
                                  handleOpenGoogleMaps(order.shippingAddress, order._id)
                                }
                                disabled={Boolean(deliveryBusyLabel)}
                                className="inline-flex h-14 items-center justify-center gap-2 border-r border-gray-100 text-sm font-black text-blue-700 disabled:cursor-wait disabled:opacity-70"
                              >
                                {deliveryMapOrderId === order._id ? (
                                  <Loader2 className="h-5 w-5 animate-spin" />
                                ) : (
                                  <Navigation className="h-5 w-5" />
                                )}
                                {deliveryMapOrderId === order._id ? "Opening..." : "View Map"}
                              </button>
                            ) : (
                              <div className="inline-flex h-14 items-center justify-center gap-2 border-r border-gray-100 text-sm font-black text-gray-400">
                                <Navigation className="h-5 w-5" />
                                View Map
                              </div>
                            )}
                            <button
                              type="button"
                              onClick={() => handleRowNavigation(order._id)}
                              disabled={Boolean(deliveryBusyLabel)}
                              className="inline-flex h-14 items-center justify-center gap-2 text-sm font-black text-gray-950 disabled:cursor-wait disabled:opacity-70"
                            >
                              {deliveryNavigatingOrderId === order._id ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                              ) : (
                                <Eye className="h-5 w-5" />
                              )}
                              {deliveryNavigatingOrderId === order._id ? "Opening..." : "View Details"}
                            </button>
                          </div>
                        </article>
                      );
                    })}
                </section>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

const DeliveryDashboard = () => (
  <OrdersList
    renderDelivery={(dashboard) => (
      <DeliveryDashboardView dashboard={dashboard} />
    )}
  />
);

export default DeliveryDashboard;
