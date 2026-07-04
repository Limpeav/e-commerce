import { config } from "../../../config";

export const DASHBOARD_PERIODS = [
  { value: "7", label: "Last 7 days" },
  { value: "30", label: "Last 30 days" },
  { value: "90", label: "Last 90 days" },
  { value: "all", label: "All time" },
];

export const DASHBOARD_CATEGORY_COLORS = [
  "#7A967E",
  "#E6BAA3",
  "#C7A76C",
  "#8EA7B8",
  "#B38A9B",
];

export const formatMoney = (value, compact = false) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: compact ? "compact" : "standard",
    maximumFractionDigits: compact ? 1 : 2,
  }).format(Number(value) || 0);

export const formatRiel = (value, compact = false) =>
  `៛${new Intl.NumberFormat("en-US", {
    notation: compact ? "compact" : "standard",
    maximumFractionDigits: 0,
  }).format((Number(value) || 0) * config.USD_TO_KHR_RATE)} KHR`;

export const formatNumber = (value) =>
  new Intl.NumberFormat("en-US").format(Number(value) || 0);

export const exportDashboardSummary = ({ analytics, period }) => {
  const rows = [
    ["Metric", "Value"],
    ["Period", DASHBOARD_PERIODS.find((item) => item.value === period)?.label],
    ["Revenue", analytics.revenue.toFixed(2)],
    ["Revenue KHR", Math.round(analytics.revenue * config.USD_TO_KHR_RATE)],
    ["Orders", analytics.currentOrders.length],
    ["Average order value", analytics.aov.toFixed(2)],
    ["Units sold", analytics.units],
    ["Paid order rate", `${analytics.paidRate.toFixed(1)}%`],
    ["Repeat customer rate", `${analytics.repeatRate.toFixed(1)}%`],
    ["Product issues", analytics.productIssues.length],
    ["Average product rating", analytics.reviewHealth.averageRating.toFixed(1)],
    ["Total product reviews", analytics.reviewHealth.totalReviews],
    ["Positive review rate", `${analytics.reviewHealth.positiveReviewRate.toFixed(1)}%`],
    ["Low-rating reviews", analytics.reviewHealth.lowReviews],
    ["Products without reviews", analytics.reviewHealth.unratedProducts],
  ];
  const csv = rows
    .map((row) =>
      row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")
    )
    .join("\n");
  const url = URL.createObjectURL(
    new Blob([csv], { type: "text/csv;charset=utf-8" })
  );
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `business-dashboard-${new Date().toISOString().slice(0, 10)}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
};
