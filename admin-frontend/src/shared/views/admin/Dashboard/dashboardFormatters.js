import { config } from "../../../config";

export const DASHBOARD_PERIODS = [
  { value: "7", label: "Last 7 days" },
  { value: "30", label: "Last 30 days" },
  { value: "90", label: "Last 90 days" },
  { value: "all", label: "All time" },
  { value: "custom", label: "Custom" },
];

const DASHBOARD_DEFAULT_RANGE_DAYS = 30;
const DATE_INPUT_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const padDatePart = (value) => String(value).padStart(2, "0");

export const formatDateInputValue = (date) => {
  const dateValue = date instanceof Date ? date : new Date(date);

  if (Number.isNaN(dateValue.getTime())) return "";

  return `${dateValue.getFullYear()}-${padDatePart(dateValue.getMonth() + 1)}-${padDatePart(dateValue.getDate())}`;
};

export const parseDateInputValue = (value) => {
  if (!DATE_INPUT_PATTERN.test(String(value || ""))) return null;

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
};

export const formatDateDisplayValue = (value) => {
  const date = parseDateInputValue(value);

  if (!date) return "Select date";

  return `${padDatePart(date.getDate())}/${padDatePart(date.getMonth() + 1)}/${date.getFullYear()}`;
};

export const getDefaultDashboardDateRange = () => {
  const endDate = new Date();
  const startDate = new Date(endDate);
  startDate.setDate(endDate.getDate() - (DASHBOARD_DEFAULT_RANGE_DAYS - 1));

  return {
    startDate: formatDateInputValue(startDate),
    endDate: formatDateInputValue(endDate),
  };
};

export const formatDashboardDateRangeLabel = (dateRange = {}) => {
  const startDate = parseDateInputValue(dateRange.startDate);
  const endDate = parseDateInputValue(dateRange.endDate);

  if (startDate && endDate) {
    if (formatDateInputValue(startDate) === formatDateInputValue(endDate)) {
      return formatDateDisplayValue(dateRange.startDate);
    }

    return `${formatDateDisplayValue(dateRange.startDate)} - ${formatDateDisplayValue(dateRange.endDate)}`;
  }

  if (startDate) return `From ${formatDateDisplayValue(dateRange.startDate)}`;
  if (endDate) return `Through ${formatDateDisplayValue(dateRange.endDate)}`;
  return "All time";
};

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

export const exportDashboardSummary = ({ analytics, period, periodLabel }) => {
  const rangeLabel =
    periodLabel ||
    DASHBOARD_PERIODS.find((item) => item.value === period)?.label ||
    "Custom date range";
  const rows = [
    ["Metric", "Value"],
    ["Period", rangeLabel],
    ["Net revenue", analytics.revenue.toFixed(2)],
    ["Net revenue KHR", Math.round(analytics.revenue * config.USD_TO_KHR_RATE)],
    ["Orders", analytics.currentOrders.length],
    ["Average order value", analytics.aov.toFixed(2)],
    ["Units sold", analytics.units],
    ["Paid order rate", `${analytics.paidRate.toFixed(1)}%`],
    ["Repeat customer rate", `${analytics.repeatRate.toFixed(1)}%`],
    ["Product issues", analytics.productIssues.length],
    ["Average product rating", analytics.reviewHealth.averageRating.toFixed(1)],
    ["Average sentiment score", analytics.reviewHealth.averageSentimentScore.toFixed(2)],
    ["Total product reviews", analytics.reviewHealth.totalReviews],
    ["Positive sentiment rate", `${analytics.reviewHealth.positiveSentimentRate.toFixed(1)}%`],
    ["Negative sentiment rate", `${analytics.reviewHealth.negativeSentimentRate.toFixed(1)}%`],
    ["Negative sentiment reviews", analytics.reviewHealth.sentimentCounts.Negative],
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
