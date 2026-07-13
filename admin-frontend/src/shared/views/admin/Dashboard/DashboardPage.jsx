import { useMemo } from "react";
import {
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  CreditCard,
  DollarSign,
  Download,
  MessageSquareText,
  Package,
  RefreshCw,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Star,
  ThumbsUp,
  TrendingUp,
  Users,
} from "lucide-react";
import { normalizeProductCategory } from "../../../constants/productCategories";
import {
  getAvailableStock,
  isOutOfStockProduct,
  isProductIssue,
  LOW_STOCK_THRESHOLD,
} from "../../../utils/adminProducts";
import {
  DASHBOARD_CATEGORY_COLORS as CATEGORY_COLORS,
  DASHBOARD_PERIODS as PERIODS,
  exportDashboardSummary,
  formatMoney as money,
  formatNumber as number,
  formatRiel as riel,
} from "./dashboardFormatters";
import {
  EmptyState,
  MetricCard,
  RevenueChart,
} from "./DashboardWidgets";

const startOfDay = (date) => {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
};

const getOrderDate = (order) => {
  const date = new Date(order?.createdAt || 0);
  return Number.isNaN(date.getTime()) ? null : date;
};

const getCustomerKey = (order) => {
  if (typeof order?.user === "string") return order.user;
  return order?.user?._id || order?.user?.email || order?.shippingAddress?.phone || null;
};

const getProductId = (item) =>
  typeof item?.product === "string" ? item.product : item?.product?._id;

const getReviewSentimentLabel = (review) => {
  if (["Positive", "Neutral", "Negative"].includes(review?.sentimentLabel)) {
    return review.sentimentLabel;
  }

  const rating = Number(review?.rating || 0);
  if (rating >= 4) return "Positive";
  if (rating <= 2) return "Negative";
  return "Neutral";
};

const getReviewSentimentScore = (review) => {
  const score = Number(review?.sentimentScore);
  if (Number.isFinite(score)) return score;

  const rating = Number(review?.rating || 3);
  return Math.max(-1, Math.min(1, (rating - 3) / 2));
};

const formatDayLabel = (date, dayCount) =>
  date.toLocaleDateString("en-US", {
    month: "short",
    day: dayCount <= 14 ? "numeric" : undefined,
  });

const changeFrom = (current, previous) => {
  if (!previous) return current ? 100 : 0;
  return ((current - previous) / previous) * 100;
};

const DashboardPage = ({
  adminUser,
  stats,
  orders,
  products,
  period,
  setPeriod,
  refreshing,
  loadDashboard,
  navigateFromDashboard,
}) => {

  const analytics = useMemo(() => {
    const now = new Date();
    const days = period === "all" ? null : Number(period);
    const currentStart = days
      ? startOfDay(new Date(now.getTime() - (days - 1) * 86400000))
      : null;
    const previousStart = days
      ? startOfDay(new Date(currentStart.getTime() - days * 86400000))
      : null;

    const isCurrent = (order) => {
      const date = getOrderDate(order);
      return date && (!currentStart || date >= currentStart);
    };
    const isPrevious = (order) => {
      const date = getOrderDate(order);
      return date && previousStart && date >= previousStart && date < currentStart;
    };
    const isPaid = (order) =>
      order.paymentStatus === "Paid" && order.orderStatus !== "Cancelled";

    const currentOrders = orders.filter(isCurrent);
    const previousOrders = orders.filter(isPrevious);
    const paidOrders = currentOrders.filter(isPaid);
    const previousPaidOrders = previousOrders.filter(isPaid);
    const revenue = paidOrders.reduce((sum, order) => sum + Number(order.totalPrice || 0), 0);
    const previousRevenue = previousPaidOrders.reduce(
      (sum, order) => sum + Number(order.totalPrice || 0),
      0
    );
    const units = paidOrders.reduce(
      (sum, order) =>
        sum +
        (order.orderItems || []).reduce(
          (itemSum, item) => itemSum + Number(item.quantity || 0),
          0
        ),
      0
    );
    const previousUnits = previousPaidOrders.reduce(
      (sum, order) =>
        sum +
        (order.orderItems || []).reduce(
          (itemSum, item) => itemSum + Number(item.quantity || 0),
          0
        ),
      0
    );
    const aov = paidOrders.length ? revenue / paidOrders.length : 0;
    const previousAov = previousPaidOrders.length
      ? previousRevenue / previousPaidOrders.length
      : 0;

    const dailyMap = new Map();
    if (days) {
      for (let index = 0; index < days; index += 1) {
        const date = new Date(currentStart.getTime() + index * 86400000);
        const key = date.toISOString().slice(0, 10);
        dailyMap.set(key, {
          key,
          label: formatDayLabel(date, days),
          revenue: 0,
          orders: 0,
        });
      }
      paidOrders.forEach((order) => {
        const date = getOrderDate(order);
        if (!date) return;
        const entry = dailyMap.get(date.toISOString().slice(0, 10));
        if (entry) {
          entry.revenue += Number(order.totalPrice || 0);
          entry.orders += 1;
        }
      });
    } else {
      const datedOrders = paidOrders
        .map((order) => ({ order, date: getOrderDate(order) }))
        .filter((entry) => entry.date)
        .sort((a, b) => a.date - b.date);
      const firstDate = datedOrders[0]?.date || now;
      const cursor = new Date(firstDate.getFullYear(), firstDate.getMonth(), 1);
      const finalMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      while (cursor <= finalMonth) {
        const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`;
        dailyMap.set(key, {
          key,
          label: cursor.toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
          revenue: 0,
          orders: 0,
        });
        cursor.setMonth(cursor.getMonth() + 1);
      }
      datedOrders.forEach(({ order, date }) => {
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        const entry = dailyMap.get(key);
        if (entry) {
          entry.revenue += Number(order.totalPrice || 0);
          entry.orders += 1;
        }
      });
    }

    const productMap = new Map(products.map((product) => [String(product._id), product]));
    const productSales = new Map();
    const categorySales = new Map();
    paidOrders.forEach((order) => {
      (order.orderItems || []).forEach((item) => {
        const product = productMap.get(String(getProductId(item)));
        const category = normalizeProductCategory(product?.category || "Uncategorized");
        const itemRevenue = Number(item.price || 0) * Number(item.quantity || 0);
        const itemQuantity = Number(item.quantity || 0);
        const productKey = String(getProductId(item) || item.name);
        const existingProduct = productSales.get(productKey) || {
          id: getProductId(item),
          name: item.name || product?.title || "Product",
          image: item.image || product?.image,
          quantity: 0,
          revenue: 0,
        };
        existingProduct.quantity += itemQuantity;
        existingProduct.revenue += itemRevenue;
        productSales.set(productKey, existingProduct);
        categorySales.set(category, (categorySales.get(category) || 0) + itemRevenue);
      });
    });

    const topProducts = [...productSales.values()]
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
    const categories = [...categorySales.entries()]
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
    const maxCategory = Math.max(...categories.map((category) => category.value), 1);

    const customerCounts = new Map();
    currentOrders.forEach((order) => {
      const key = getCustomerKey(order);
      if (key) customerCounts.set(key, (customerCounts.get(key) || 0) + 1);
    });
    const repeatCustomers = [...customerCounts.values()].filter((count) => count > 1).length;
    const repeatRate = customerCounts.size
      ? (repeatCustomers / customerCounts.size) * 100
      : 0;

    const productIssues = products
      .filter(isProductIssue)
      .sort((a, b) => getAvailableStock(a) - getAvailableStock(b));
    const outOfStock = products.filter(isOutOfStockProduct);
    const inventoryUnits = products.reduce(
      (sum, product) => sum + getAvailableStock(product),
      0
    );
    const inventoryValue = products.reduce(
      (sum, product) =>
        sum +
        getAvailableStock(product) *
          Number(product.discountPrice || product.price || 0),
      0
    );

    const statusData = ["Pending", "Processing", "Delivered", "Cancelled"].map(
      (status) => ({
        status,
        count: currentOrders.filter((order) =>
          status === "Processing"
            ? ["Processing", "Shipped"].includes(order.orderStatus)
            : order.orderStatus === status
        ).length,
      })
    );
    const maxStatus = Math.max(...statusData.map((item) => item.count), 1);
    const paidRate = currentOrders.length ? (paidOrders.length / currentOrders.length) * 100 : 0;
    const productReviewStats = products.map((product) => {
      const reviews = Array.isArray(product.reviews) ? product.reviews : [];
      const reviewCount = reviews.length;
      const averageRating = reviewCount
        ? reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / reviewCount
        : Number(product.rating || 0);
      const lowRatingCount = reviews.filter((review) => Number(review.rating || 0) <= 2).length;
      const negativeSentimentCount = reviews.filter(
        (review) => getReviewSentimentLabel(review) === "Negative"
      ).length;

      return {
        id: product._id,
        title: product.title || "Product",
        image: product.image,
        category: normalizeProductCategory(product.category || "Uncategorized"),
        reviewCount,
        averageRating,
        lowRatingCount,
        negativeSentimentCount,
      };
    });
    const allReviews = products.flatMap((product) =>
      (Array.isArray(product.reviews) ? product.reviews : []).map((review) => ({
        ...review,
        productId: product._id,
      }))
    );
    const totalReviews = allReviews.length;
    const averageRating = totalReviews
      ? allReviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / totalReviews
      : 0;
    const positiveReviews = allReviews.filter((review) => Number(review.rating || 0) >= 4).length;
    const lowReviews = allReviews.filter((review) => Number(review.rating || 0) <= 2).length;
    const sentimentCounts = allReviews.reduce(
      (counts, review) => {
        counts[getReviewSentimentLabel(review)] += 1;
        return counts;
      },
      { Positive: 0, Neutral: 0, Negative: 0 }
    );
    const averageSentimentScore = totalReviews
      ? allReviews.reduce((sum, review) => sum + getReviewSentimentScore(review), 0) / totalReviews
      : 0;
    const positiveReviewRate = totalReviews ? (positiveReviews / totalReviews) * 100 : 0;
    const positiveSentimentRate = totalReviews ? (sentimentCounts.Positive / totalReviews) * 100 : 0;
    const negativeSentimentRate = totalReviews ? (sentimentCounts.Negative / totalReviews) * 100 : 0;
    const ratingDistribution = [5, 4, 3, 2, 1].map((rating) => {
      const count = allReviews.filter((review) => Number(review.rating || 0) === rating).length;
      return {
        rating,
        count,
        percentage: totalReviews ? (count / totalReviews) * 100 : 0,
      };
    });
    const categoryReviewMap = new Map();
    productReviewStats.forEach((product) => {
      if (!product.reviewCount) return;
      const current = categoryReviewMap.get(product.category) || {
        total: 0,
        count: 0,
        negative: 0,
      };
      current.total += product.averageRating * product.reviewCount;
      current.count += product.reviewCount;
      current.negative += product.negativeSentimentCount;
      categoryReviewMap.set(product.category, current);
    });
    const categoryRatings = [...categoryReviewMap.entries()]
      .map(([name, values]) => ({
        name,
        reviewCount: values.count,
        averageRating: values.total / values.count,
        negative: values.negative,
        negativeRate: values.count ? (values.negative / values.count) * 100 : 0,
      }))
      .sort((a, b) => b.negativeRate - a.negativeRate || a.averageRating - b.averageRating);
    return {
      currentOrders,
      paidOrders,
      revenue,
      units,
      aov,
      paidRate,
      repeatRate,
      dailyRevenue: [...dailyMap.values()],
      topProducts,
      categories: categories.map((category) => ({
        ...category,
        percentage: (category.value / maxCategory) * 100,
      })),
      productIssues,
      outOfStock,
      inventoryUnits,
      inventoryValue,
      reviewHealth: {
        totalReviews,
        averageRating,
        positiveReviewRate,
        positiveSentimentRate,
        negativeSentimentRate,
        averageSentimentScore,
        sentimentCounts,
        lowReviews,
        unratedProducts: productReviewStats.filter((product) => product.reviewCount === 0).length,
        ratingDistribution,
        categoryRatings,
      },
      statusData: statusData.map((item) => ({
        ...item,
        percentage: (item.count / maxStatus) * 100,
      })),
      changes: {
        revenue: changeFrom(revenue, previousRevenue),
        orders: changeFrom(currentOrders.length, previousOrders.length),
        aov: changeFrom(aov, previousAov),
        units: changeFrom(units, previousUnits),
      },
    };
  }, [orders, products, period]);

  const exportSummary = () => {
    exportDashboardSummary({ analytics, period });
  };

  const attentionItems = [
    analytics.outOfStock.length
      ? {
          title: `${analytics.outOfStock.length} product${
            analytics.outOfStock.length === 1 ? "" : "s"
          } out of stock`,
          detail: "Restock now to avoid missed sales.",
          icon: AlertTriangle,
          tone: "bg-[#fff0eb] text-[#a45f4d]",
          action: () => navigateFromDashboard("/admin/products?inventory=sold-out"),
        }
      : null,
    (stats?.pendingOrders || 0) > 0
      ? {
          title: `${stats.pendingOrders} order${stats.pendingOrders === 1 ? "" : "s"} awaiting action`,
          detail: "Review and move pending orders forward.",
          icon: Clock3,
          tone: "bg-[#f7f1e5] text-[#927338]",
          action: () => navigateFromDashboard("/admin/orders?status=Pending"),
        }
      : null,
    (stats?.cashToCollect || 0) > 0
      ? {
          title: `${stats.cashToCollect} cash payment${
            stats.cashToCollect === 1 ? "" : "s"
          } to collect`,
          detail: "Track open cash-on-delivery orders.",
          icon: CreditCard,
          tone: "bg-[#ebf1f4] text-[#5f7f91]",
          action: () => navigateFromDashboard("/admin/cash-report"),
        }
      : null,
  ].filter(Boolean);

  return (
    <div className="min-h-screen bg-[var(--color-bg-base)] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="admin-stagger-container mx-auto max-w-[1500px]">
        <header className="mb-7 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-bold text-[var(--color-primary-dark)]">
              <Sparkles className="h-4 w-4" />
              Business overview
            </div>
            <h1 className="text-3xl font-black tracking-tight text-[var(--color-text-main)] sm:text-4xl">
              Good day, {stats?.admin || adminUser?.name || "Admin"}
            </h1>
            <p className="mt-2 max-w-2xl text-sm font-medium text-[var(--color-text-muted)] sm:text-base">
              Monitor sales, customers, orders, and inventory health from one place.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <label className="relative">
              <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-muted)]" />
              <select
                value={period}
                onChange={(event) => setPeriod(event.target.value)}
                className="h-11 rounded-xl border border-[var(--color-border)] bg-white pl-10 pr-9 text-sm font-bold text-[var(--color-text-main)] outline-none focus:border-[var(--color-primary)]"
              >
                {PERIODS.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              onClick={() => loadDashboard({ refresh: true })}
              disabled={refreshing}
              className="inline-flex h-11 items-center gap-2 rounded-xl border border-[var(--color-border)] bg-white px-4 text-sm font-bold text-[var(--color-text-main)] transition hover:bg-[var(--color-surface-soft)] disabled:opacity-60"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </button>
            <button
              type="button"
              onClick={exportSummary}
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-[var(--color-text-main)] px-4 text-sm font-bold text-white transition hover:opacity-90"
            >
              <Download className="h-4 w-4" />
              Export
            </button>
          </div>
        </header>

        <section className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            title="Net revenue"
            value={money(analytics.revenue)}
            secondaryValue={riel(analytics.revenue)}
            change={period === "all" ? null : analytics.changes.revenue}
            note={period === "all" ? "paid orders" : "vs previous period"}
            icon={DollarSign}
            tone="sage"
          />
          <MetricCard
            title="Orders"
            value={number(analytics.currentOrders.length)}
            change={period === "all" ? null : analytics.changes.orders}
            note={`${analytics.paidRate.toFixed(0)}% paid`}
            icon={ShoppingCart}
            tone="peach"
          />
          <MetricCard
            title="Average order value"
            value={money(analytics.aov)}
            change={period === "all" ? null : analytics.changes.aov}
            note="per paid order"
            icon={TrendingUp}
            tone="gold"
          />
          <MetricCard
            title="Units sold"
            value={number(analytics.units)}
            change={period === "all" ? null : analytics.changes.units}
            note={`${analytics.repeatRate.toFixed(0)}% repeat buyers`}
            icon={ShoppingBag}
            tone="blue"
          />
        </section>

        <section className="mb-6 grid gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(320px,0.75fr)]">
          <article className="rounded-2xl border border-[var(--color-border)] bg-white p-5 shadow-[0_8px_30px_rgba(61,66,62,0.05)] sm:p-6">
            <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-[var(--color-text-main)]">Revenue trend</h2>
                <p className="mt-1 text-sm font-medium text-[var(--color-text-muted)]">
                  Revenue from successfully paid orders
                </p>
              </div>
              <div className="rounded-xl bg-[#edf4ee] px-4 py-2 text-right">
                <p className="text-xs font-bold uppercase tracking-wide text-[#66806b]">
                  Period total
                </p>
                <p className="text-lg font-black text-[#4f6954]">{money(analytics.revenue)}</p>
                <p className="text-xs font-extrabold text-[#66806b]">{riel(analytics.revenue)}</p>
              </div>
            </div>
            <RevenueChart data={analytics.dailyRevenue} />
          </article>

          <article className="rounded-2xl border border-[var(--color-border)] bg-white p-5 shadow-[0_8px_30px_rgba(61,66,62,0.05)] sm:p-6">
            <div className="mb-5">
              <h2 className="text-xl font-bold text-[var(--color-text-main)]">Needs attention</h2>
              <p className="mt-1 text-sm font-medium text-[var(--color-text-muted)]">
                Priority tasks that can affect sales
              </p>
            </div>
            {attentionItems.length ? (
              <div className="space-y-3">
                {attentionItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      type="button"
                      key={item.title}
                      onClick={item.action}
                      className="flex w-full items-center gap-3 rounded-xl border border-[var(--color-border)] p-3.5 text-left transition hover:-translate-y-0.5 hover:shadow-md"
                    >
                      <span className={`rounded-lg p-2 ${item.tone}`}>
                        <Icon className="h-5 w-5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-black text-[var(--color-text-main)]">
                          {item.title}
                        </span>
                        <span className="mt-0.5 block text-xs font-medium text-[var(--color-text-muted)]">
                          {item.detail}
                        </span>
                      </span>
                      <ChevronRight className="h-4 w-4 shrink-0 text-[var(--color-text-muted)]" />
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="flex min-h-52 flex-col items-center justify-center text-center">
                <span className="rounded-full bg-[#edf5ee] p-3 text-[#66806b]">
                  <CheckCircle2 className="h-7 w-7" />
                </span>
                <p className="mt-3 font-black text-[var(--color-text-main)]">Everything looks healthy</p>
                <p className="mt-1 text-sm text-[var(--color-text-muted)]">No urgent actions right now.</p>
              </div>
            )}
          </article>
        </section>

        <section className="mb-6 grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
          <article className="rounded-2xl border border-[var(--color-border)] bg-white p-5 shadow-[0_8px_30px_rgba(61,66,62,0.05)] sm:p-6">
            <h2 className="text-xl font-bold text-[var(--color-text-main)]">Sales by category</h2>
            <p className="mt-1 text-sm font-medium text-[var(--color-text-muted)]">
              Categories driving paid revenue
            </p>
            {analytics.categories.length ? (
              <div className="mt-6 space-y-4">
                {analytics.categories.map((category, index) => (
                  <div key={category.name}>
                    <div className="mb-1.5 flex items-center justify-between gap-4 text-sm">
                      <span className="truncate font-bold text-[var(--color-text-main)]">
                        {category.name}
                      </span>
                      <span className="shrink-0 font-black">{money(category.value)}</span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-[var(--color-surface-soft)]">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${category.percentage}%`,
                          backgroundColor: CATEGORY_COLORS[index],
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-5">
                <EmptyState>Category sales will appear after paid orders.</EmptyState>
              </div>
            )}
          </article>

          <article className="rounded-2xl border border-[var(--color-border)] bg-white p-5 shadow-[0_8px_30px_rgba(61,66,62,0.05)] sm:p-6">
            <h2 className="text-xl font-bold text-[var(--color-text-main)]">Order progress</h2>
            <p className="mt-1 text-sm font-medium text-[var(--color-text-muted)]">
              Fulfillment status for the selected period
            </p>
            <div className="mt-6 space-y-4">
              {analytics.statusData.map((item, index) => (
                <div key={item.status} className="grid grid-cols-[86px_1fr_34px] items-center gap-3">
                  <span className="text-sm font-bold text-[var(--color-text-muted)]">{item.status}</span>
                  <div className="h-2.5 overflow-hidden rounded-full bg-[var(--color-surface-soft)]">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${item.percentage}%`,
                        backgroundColor: CATEGORY_COLORS[index],
                      }}
                    />
                  </div>
                  <span className="text-right text-sm font-black text-[var(--color-text-main)]">
                    {item.count}
                  </span>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => navigateFromDashboard("/admin/orders")}
              className="mt-6 inline-flex items-center gap-2 text-sm font-black text-[var(--color-primary-dark)]"
            >
              Manage all orders <ArrowRight className="h-4 w-4" />
            </button>
          </article>

          <article className="rounded-2xl border border-[var(--color-border)] bg-white p-5 shadow-[0_8px_30px_rgba(61,66,62,0.05)] sm:p-6 lg:col-span-2 xl:col-span-1">
            <h2 className="text-xl font-bold text-[var(--color-text-main)]">Inventory health</h2>
            <p className="mt-1 text-sm font-medium text-[var(--color-text-muted)]">
              Current stock exposure and value
            </p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-[#edf4ee] p-4">
                <Package className="h-5 w-5 text-[#66806b]" />
                <p className="mt-3 text-2xl font-black text-[#4f6954]">{number(analytics.inventoryUnits)}</p>
                <p className="mt-1 text-xs font-bold text-[#66806b]">Units in stock</p>
              </div>
              <div className="rounded-xl bg-[#f7f1e5] p-4">
                <CircleDollarSign className="h-5 w-5 text-[#96773e]" />
                <p className="mt-3 text-2xl font-black text-[#735c31]">{money(analytics.inventoryValue, true)}</p>
                <p className="mt-1 text-xs font-bold text-[#96773e]">Retail value</p>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between rounded-xl border border-[var(--color-border)] p-4">
              <div>
                <p className="text-sm font-black text-[var(--color-text-main)]">Product issues</p>
                <p className="mt-1 text-xs font-medium text-[var(--color-text-muted)]">
                  1 to {LOW_STOCK_THRESHOLD} units remaining
                </p>
              </div>
              <span className={`text-2xl font-black ${analytics.productIssues.length ? "text-[#ad6856]" : "text-[#66806b]"}`}>
                {analytics.productIssues.length}
              </span>
            </div>
            <div className="mt-3 flex items-center justify-between rounded-xl border border-[var(--color-border)] p-4">
              <div>
                <p className="text-sm font-black text-[var(--color-text-main)]">Sold out</p>
                <p className="mt-1 text-xs font-medium text-[var(--color-text-muted)]">
                  No stock remaining
                </p>
              </div>
              <span className={`text-2xl font-black ${analytics.outOfStock.length ? "text-[#ad6856]" : "text-[#66806b]"}`}>
                {analytics.outOfStock.length}
              </span>
            </div>
            <button
              type="button"
              onClick={() => navigateFromDashboard("/admin/products?inventory=issues")}
              className="mt-5 inline-flex items-center gap-2 text-sm font-black text-[var(--color-primary-dark)]"
            >
              Review inventory <ArrowRight className="h-4 w-4" />
            </button>
          </article>
        </section>

        <section className="mb-6 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <article className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white shadow-[0_8px_30px_rgba(61,66,62,0.05)]">
            <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-5 sm:px-6">
              <div>
                <h2 className="text-xl font-bold text-[var(--color-text-main)]">Top products</h2>
                <p className="mt-1 text-sm font-medium text-[var(--color-text-muted)]">
                  Ranked by paid revenue
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigateFromDashboard("/admin/products/best-sellers")}
                className="text-sm font-black text-[var(--color-primary-dark)]"
              >
                View all
              </button>
            </div>
            {analytics.topProducts.length ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[620px] text-left">
                  <thead className="bg-[var(--color-surface-soft)]/65 text-xs uppercase tracking-wide text-[var(--color-text-muted)]">
                    <tr>
                      <th className="px-6 py-3 font-black">Product</th>
                      <th className="px-4 py-3 text-right font-black">Units</th>
                      <th className="px-6 py-3 text-right font-black">Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-border)]">
                    {analytics.topProducts.map((product, index) => (
                      <tr key={`${product.id || product.name}-${index}`} className="hover:bg-[var(--color-surface-soft)]/35">
                        <td className="px-6 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[var(--color-surface-soft)]">
                              {product.image ? (
                                <img src={product.image} alt="" className="h-full w-full object-cover" />
                              ) : (
                                <Package className="h-5 w-5 text-[var(--color-text-muted)]" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-black text-[var(--color-text-main)]">
                                {product.name}
                              </p>
                              <p className="mt-0.5 text-xs font-medium text-[var(--color-text-muted)]">
                                #{index + 1} seller
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-right text-sm font-bold">
                          {number(product.quantity)}
                        </td>
                        <td className="px-6 py-3.5 text-right text-sm font-black">
                          {money(product.revenue)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-6">
                <EmptyState>Top-selling products will appear after paid orders.</EmptyState>
              </div>
            )}
          </article>

          <article className="rounded-2xl border border-[var(--color-border)] bg-white p-5 shadow-[0_8px_30px_rgba(61,66,62,0.05)] sm:p-6">
            <h2 className="text-xl font-bold text-[var(--color-text-main)]">Customer signals</h2>
            <p className="mt-1 text-sm font-medium text-[var(--color-text-muted)]">
              Indicators of loyalty and payment quality
            </p>
            <div className="mt-6 space-y-5">
              <div>
                <div className="mb-2 flex justify-between text-sm">
                  <span className="flex items-center gap-2 font-bold text-[var(--color-text-main)]">
                    <Users className="h-4 w-4 text-[var(--color-primary)]" />
                    Repeat customer rate
                  </span>
                  <span className="font-black">{analytics.repeatRate.toFixed(1)}%</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-[var(--color-surface-soft)]">
                  <div
                    className="h-full rounded-full bg-[var(--color-primary)]"
                    style={{ width: `${Math.min(analytics.repeatRate, 100)}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="mb-2 flex justify-between text-sm">
                  <span className="flex items-center gap-2 font-bold text-[var(--color-text-main)]">
                    <CreditCard className="h-4 w-4 text-[#b17b62]" />
                    Paid order rate
                  </span>
                  <span className="font-black">{analytics.paidRate.toFixed(1)}%</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-[var(--color-surface-soft)]">
                  <div
                    className="h-full rounded-full bg-[#E6BAA3]"
                    style={{ width: `${Math.min(analytics.paidRate, 100)}%` }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="rounded-xl border border-[var(--color-border)] p-4">
                  <p className="text-xs font-bold text-[var(--color-text-muted)]">Registered users</p>
                  <p className="mt-2 text-2xl font-black text-[var(--color-text-main)]">
                    {number(stats?.users)}
                  </p>
                </div>
                <div className="rounded-xl border border-[var(--color-border)] p-4">
                  <p className="text-xs font-bold text-[var(--color-text-muted)]">Catalog size</p>
                  <p className="mt-2 text-2xl font-black text-[var(--color-text-main)]">
                    {number(stats?.products)}
                  </p>
                </div>
              </div>
            </div>
          </article>
        </section>

        <section className="mb-6">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 fill-[#e2b95f] text-[#e2b95f]" />
                <h2 className="text-2xl font-bold text-[var(--color-text-main)]">Review health</h2>
              </div>
              <p className="mt-1 text-sm font-medium text-[var(--color-text-muted)]">
                Product satisfaction, rating quality, and items needing attention
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigateFromDashboard("/admin/products")}
              className="inline-flex items-center gap-2 text-sm font-black text-[var(--color-primary-dark)]"
            >
              View products <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <article className="rounded-2xl border border-[var(--color-border)] bg-white p-5 shadow-[0_8px_30px_rgba(61,66,62,0.05)]">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-[var(--color-text-muted)]">Avg sentiment score</p>
                <Star className="h-5 w-5 fill-[#e2b95f] text-[#e2b95f]" />
              </div>
              <p className="mt-3 text-3xl font-black">
                {analytics.reviewHealth.averageSentimentScore.toFixed(2)}
                <span className="text-base text-[var(--color-text-muted)]"> NLP</span>
              </p>
            </article>
            <button
              type="button"
              onClick={() => navigateFromDashboard("/admin/reviews")}
              className="rounded-2xl border border-[var(--color-border)] bg-white p-5 text-left shadow-[0_8px_30px_rgba(61,66,62,0.05)] transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-[var(--color-text-muted)]">Total reviews</p>
                <MessageSquareText className="h-5 w-5 text-[#668698]" />
              </div>
              <p className="mt-3 text-3xl font-black">{number(analytics.reviewHealth.totalReviews)}</p>
            </button>
            <button
              type="button"
              onClick={() => navigateFromDashboard("/admin/reviews/positive")}
              className="rounded-2xl border border-[var(--color-border)] bg-white p-5 text-left shadow-[0_8px_30px_rgba(61,66,62,0.05)] transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-[var(--color-text-muted)]">Positive reviews</p>
                <ThumbsUp className="h-5 w-5 text-[#66806b]" />
              </div>
              <p className="mt-3 text-3xl font-black">
                {analytics.reviewHealth.positiveSentimentRate.toFixed(0)}%
              </p>
              <p className="mt-1 text-xs font-semibold text-[var(--color-text-muted)]">AI-classified positive</p>
            </button>
            <button
              type="button"
              onClick={() => navigateFromDashboard("/admin/reviews/negative")}
              className="rounded-2xl border border-[var(--color-border)] bg-white p-5 text-left shadow-[0_8px_30px_rgba(61,66,62,0.05)] transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-[var(--color-text-muted)]">Needs attention</p>
                <AlertTriangle className="h-5 w-5 text-[#ad6856]" />
              </div>
              <p className="mt-3 text-3xl font-black text-[#ad6856]">
                {number(analytics.reviewHealth.sentimentCounts.Negative)}
              </p>
              <p className="mt-1 text-xs font-semibold text-[var(--color-text-muted)]">
                AI-classified negative
              </p>
            </button>
          </div>

          <div className="mb-6 grid gap-6 lg:grid-cols-2">
            <article className="rounded-2xl border border-[var(--color-border)] bg-white p-5 shadow-[0_8px_30px_rgba(61,66,62,0.05)] sm:p-6">
              <h3 className="text-xl font-bold text-[var(--color-text-main)]">Sentiment distribution</h3>
              <p className="mt-1 text-sm font-medium text-[var(--color-text-muted)]">
                Share of reviews by AI sentiment label
              </p>
              {analytics.reviewHealth.totalReviews ? (
                <div className="mt-6 space-y-4">
                  {["Positive", "Neutral", "Negative"].map((label) => {
                    const count = analytics.reviewHealth.sentimentCounts[label];
                    const percentage = analytics.reviewHealth.totalReviews
                      ? (count / analytics.reviewHealth.totalReviews) * 100
                      : 0;
                    const colors = {
                      Positive: "bg-[#66806b]",
                      Neutral: "bg-[#8EA7B8]",
                      Negative: "bg-[#ad6856]",
                    };

                    return (
                    <div key={label} className="grid grid-cols-[78px_1fr_48px] items-center gap-3">
                      <span className="text-sm font-black">
                        {label}
                      </span>
                      <div className="h-3 overflow-hidden rounded-full bg-[var(--color-surface-soft)]">
                        <div
                          className={`h-full rounded-full ${colors[label]}`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-right text-sm font-black">{count}</span>
                    </div>
                    );
                  })}
                </div>
              ) : (
                <div className="mt-5">
                  <EmptyState>Sentiment distribution will appear after customers submit reviews.</EmptyState>
                </div>
              )}
            </article>

            <article className="rounded-2xl border border-[var(--color-border)] bg-white p-5 shadow-[0_8px_30px_rgba(61,66,62,0.05)] sm:p-6">
              <h3 className="text-xl font-bold text-[var(--color-text-main)]">Negative sentiment by category</h3>
              <p className="mt-1 text-sm font-medium text-[var(--color-text-muted)]">
                Categories ranked by customer dissatisfaction signals
              </p>
              {analytics.reviewHealth.categoryRatings.length ? (
                <div className="mt-6 space-y-4">
                  {analytics.reviewHealth.categoryRatings.slice(0, 6).map((category) => (
                    <div key={category.name}>
                      <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
                        <span className="truncate font-bold">{category.name}</span>
                        <span className="flex shrink-0 items-center gap-1 font-black">
                          {category.negativeRate.toFixed(0)}%
                          <span className="ml-1 text-xs text-[var(--color-text-muted)]">
                            ({category.reviewCount})
                          </span>
                        </span>
                      </div>
                      <div className="h-2.5 overflow-hidden rounded-full bg-[var(--color-surface-soft)]">
                        <div
                          className="h-full rounded-full bg-[#ad6856]"
                          style={{ width: `${category.negativeRate}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-5">
                  <EmptyState>Category sentiment will appear after customers submit reviews.</EmptyState>
                </div>
              )}
            </article>
          </div>

        </section>
      </div>
    </div>
  );
};

export default DashboardPage;
