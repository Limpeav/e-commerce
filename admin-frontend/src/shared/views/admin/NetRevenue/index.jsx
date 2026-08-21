import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  CalendarDays,
  ChevronDown,
  CircleDollarSign,
  Download,
  DollarSign,
  Package,
  ShoppingBag,
  ShoppingCart,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";
import { DashboardController } from "../../../controllers";
import Loading from "../../../components/common/Loading";
import { getStoredAdminToken } from "../../../utils/adminSession";
import { normalizeProductCategory } from "../../../constants/productCategories";
import {
  DASHBOARD_PERIODS as PERIODS,
  formatDateInputValue,
  formatDateDisplayValue,
  formatMoney as money,
  formatRiel as riel,
  formatNumber as number,
  parseDateInputValue,
  getDefaultDashboardDateRange,
  formatDashboardDateRangeLabel,
} from "../Dashboard/dashboardFormatters";
import { config } from "../../../config";

// ─── Date helpers (mirrors dashboard) ────────────────────────────────────────

const startOfDay = (date) => {
  const r = new Date(date);
  r.setHours(0, 0, 0, 0);
  return r;
};

const endOfDay = (date) => {
  const r = new Date(date);
  r.setHours(23, 59, 59, 999);
  return r;
};

const addDays = (date, days) => {
  const r = new Date(date);
  r.setDate(r.getDate() + days);
  return r;
};

const getCalendarDayCount = (s, e) => {
  const su = Date.UTC(s.getFullYear(), s.getMonth(), s.getDate());
  const eu = Date.UTC(e.getFullYear(), e.getMonth(), e.getDate());
  return Math.max(1, Math.floor((eu - su) / 86400000) + 1);
};

const getDateRangeBounds = (dateRange = {}) => {
  const ps = parseDateInputValue(dateRange.startDate);
  const pe = parseDateInputValue(dateRange.endDate);
  const startDate = ps && pe && ps > pe ? pe : ps;
  const endDate = ps && pe && ps > pe ? ps : pe;
  const currentStart = startDate ? startOfDay(startDate) : null;
  const currentEnd = endDate ? endOfDay(endDate) : null;
  const dayCount =
    currentStart && currentEnd
      ? getCalendarDayCount(currentStart, currentEnd)
      : null;
  return {
    currentStart,
    currentEnd,
    dayCount,
    previousStart: dayCount ? startOfDay(addDays(currentStart, -dayCount)) : null,
    previousEnd: dayCount ? endOfDay(addDays(currentStart, -1)) : null,
    hasComparableRange: Boolean(currentStart && currentEnd),
  };
};

// ─── Order/item helpers ───────────────────────────────────────────────────────

const getOrderDate = (order) => {
  const d = new Date(order?.createdAt || 0);
  return Number.isNaN(d.getTime()) ? null : d;
};

const getProductId = (item) =>
  typeof item?.product === "string" ? item.product : item?.product?._id;

const getItemQuantity = (item) => Number(item?.quantity || 0);
const getItemRevenue = (item) => Number(item?.price || 0) * getItemQuantity(item);

const getItemCost = (item, productMap) => {
  const qty = getItemQuantity(item);
  const snap = Number(item?.costPrice);
  if (item?.costPrice !== undefined && item?.costPrice !== null && Number.isFinite(snap)) {
    return Math.max(0, snap) * qty;
  }
  const product = productMap.get(String(getProductId(item)));
  const cost = Number(product?.costPrice || 0);
  return Math.max(0, Number.isFinite(cost) ? cost : 0) * qty;
};

const getItemProfit = (item, productMap) =>
  getItemRevenue(item) - getItemCost(item, productMap);

// ─── Formatting ───────────────────────────────────────────────────────────────

const formatDayLabel = (date, dayCount) =>
  date.toLocaleDateString("en-US", {
    month: "short",
    day: dayCount <= 14 ? "numeric" : undefined,
  });

const changeFrom = (current, previous) => {
  if (!previous) return current ? 100 : 0;
  return ((current - previous) / previous) * 100;
};

const formatPercent = (v) => `${Number(v || 0).toFixed(1)}%`;

// ─── Mini components ──────────────────────────────────────────────────────────

const ChangeBadge = ({ value }) => {
  if (value === null || value === undefined) return null;
  const positive = value >= 0;
  const Icon = positive ? ArrowUpRight : ArrowDownRight;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold ${
        positive ? "bg-[#edf5ee] text-[#527258]" : "bg-[#fff0eb] text-[#a45f4d]"
      }`}
    >
      <Icon className="h-3.5 w-3.5" />
      {Math.abs(value).toFixed(1)}%
    </span>
  );
};

const KpiCard = ({ icon: Icon, tone, title, value, sub, change, note }) => {
  const tones = {
    sage: "bg-[#edf4ee] text-[#66806b]",
    peach: "bg-[#fbefea] text-[#b17b62]",
    gold: "bg-[#f7f1e5] text-[#9a7a3c]",
    blue: "bg-[#ebf1f4] text-[#668698]",
    violet: "bg-[#f2eef9] text-[#7b67a8]",
    teal: "bg-[#e6f5f3] text-[#4d8b83]",
  };

  return (
    <article className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-5 shadow-[0_8px_30px_rgba(61,66,62,0.05)]">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-bold text-[var(--color-text-muted)]">{title}</p>
          <p className="mt-2 truncate text-3xl font-black tracking-tight text-[var(--color-text-main)]">
            {value}
          </p>
          {sub && (
            <p className="mt-1 text-sm font-extrabold text-[#527258]">{sub}</p>
          )}
        </div>
        <div className={`shrink-0 rounded-xl p-2.5 ${tones[tone] || tones.sage}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <div className="mt-4 flex items-center gap-2">
        <ChangeBadge value={change} />
        {note && (
          <span className="text-xs font-semibold text-[var(--color-text-muted)]">{note}</span>
        )}
      </div>
    </article>
  );
};

// ─── Revenue Trend Chart ──────────────────────────────────────────────────────

const RevenueTrendChart = ({ data }) => {
  const [hovered, setHovered] = useState(null);

  const width = 900;
  const height = 260;
  const pad = { top: 20, right: 20, bottom: 36, left: 56 };
  const maxRev = Math.max(...data.map((d) => d.revenue), 1);
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;

  const pts = data.map((d, i) => ({
    ...d,
    x: pad.left + (data.length === 1 ? innerW / 2 : (i / (data.length - 1)) * innerW),
    y: pad.top + innerH - (d.revenue / maxRev) * innerH,
  }));

  const profitPts = data.map((d, i) => ({
    ...d,
    x: pad.left + (data.length === 1 ? innerW / 2 : (i / (data.length - 1)) * innerW),
    y: pad.top + innerH - (Math.max(0, d.profit) / maxRev) * innerH,
  }));

  const line = pts.map((p) => `${p.x},${p.y}`).join(" ");
  const profitLine = profitPts.map((p) => `${p.x},${p.y}`).join(" ");
  const area = pts.length
    ? `${pad.left},${pad.top + innerH} ${line} ${pad.left + innerW},${pad.top + innerH}`
    : "";

  const gridValues = [0, 0.25, 0.5, 0.75, 1];
  const labelStep = Math.max(1, Math.ceil(data.length / 8));
  const hovPt = hovered === null ? null : pts[hovered];
  const hovProfit = hovered === null ? null : profitPts[hovered];
  const ttW = 148;
  const ttH = 68;
  const ttX = hovPt ? Math.min(width - ttW - 4, Math.max(4, hovPt.x - ttW / 2)) : 0;
  const ttY = hovPt ? Math.max(4, hovPt.y - ttH - 14) : 0;

  if (!data.length) {
    return (
      <div className="flex h-64 items-center justify-center text-sm font-semibold text-[var(--color-text-muted)]">
        No revenue data in this period
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-64 min-w-[600px] w-full"
        role="img"
        aria-label="Net revenue trend chart"
      >
        <defs>
          <linearGradient id="nrArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7A967E" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#7A967E" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {gridValues.map((r) => {
          const y = pad.top + innerH - r * innerH;
          return (
            <g key={r}>
              <line
                x1={pad.left} x2={pad.left + innerW}
                y1={y} y2={y}
                stroke="#EAE3DB" strokeDasharray="4 5"
              />
              <text x={pad.left - 9} y={y + 4} textAnchor="end" fontSize="11" fill="#8A8F89">
                {money(maxRev * r, true)}
              </text>
            </g>
          );
        })}

        {/* Revenue area fill */}
        <polygon points={area} fill="url(#nrArea)" />

        {/* Profit line */}
        {data.some((d) => d.profit !== 0) && (
          <polyline
            points={profitLine}
            fill="none"
            stroke="#C7A76C"
            strokeWidth="2"
            strokeDasharray="5 4"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.8"
          />
        )}

        {/* Revenue line */}
        <polyline
          points={line}
          fill="none"
          stroke="#6F8C74"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Interactive data points */}
        {pts.map((p, i) => (
          <g
            key={p.key}
            onPointerEnter={() => setHovered(i)}
            onPointerMove={() => setHovered(i)}
            onPointerLeave={() => setHovered(null)}
            className="cursor-crosshair"
          >
            <circle cx={p.x} cy={p.y} r="14" fill="transparent" />
            <circle
              cx={p.x}
              cy={p.y}
              r={hovered === i ? 6 : 4}
              fill="#fff"
              stroke="#6F8C74"
              strokeWidth="2.5"
              pointerEvents="none"
            />
            {(i % labelStep === 0 || i === pts.length - 1) && (
              <text x={p.x} y={height - 10} textAnchor="middle" fontSize="11" fill="#727871">
                {p.label}
              </text>
            )}
          </g>
        ))}

        {/* Tooltip */}
        {hovPt && (
          <g pointerEvents="none">
            <line
              x1={hovPt.x} x2={hovPt.x}
              y1={hovPt.y + 7} y2={pad.top + innerH}
              stroke="#6F8C74" strokeDasharray="3 4" strokeOpacity="0.55"
            />
            <rect x={ttX} y={ttY} width={ttW} height={ttH} rx="9" fill="#27312A" />
            <text x={ttX + ttW / 2} y={ttY + 17} textAnchor="middle" fontSize="11" fontWeight="700" fill="#DCE7DE">
              {hovPt.label}
            </text>
            <text x={ttX + ttW / 2} y={ttY + 35} textAnchor="middle" fontSize="13" fontWeight="800" fill="#FFFFFF">
              {money(hovPt.revenue)}
            </text>
            {hovProfit && (
              <text x={ttX + ttW / 2} y={ttY + 55} textAnchor="middle" fontSize="11" fontWeight="600" fill="#C7A76C">
                Profit: {money(hovProfit.profit)}
              </text>
            )}
          </g>
        )}
      </svg>

      {/* Legend */}
      <div className="mt-3 flex flex-wrap items-center gap-5 px-1">
        <span className="flex items-center gap-2 text-xs font-semibold text-[var(--color-text-muted)]">
          <span className="inline-block h-0.5 w-8 rounded-full bg-[#6F8C74]" />
          Revenue
        </span>
        <span className="flex items-center gap-2 text-xs font-semibold text-[var(--color-text-muted)]">
          <span
            className="inline-block h-0.5 w-8 rounded-full bg-[#C7A76C]"
            style={{ backgroundImage: "repeating-linear-gradient(90deg,#C7A76C 0,#C7A76C 5px,transparent 5px,transparent 9px)" }}
          />
          Profit
        </span>
      </div>
    </div>
  );
};

// ─── Category Bar Chart ───────────────────────────────────────────────────────

const CategoryChart = ({ categories }) => {
  const CATEGORY_COLORS = ["#7A967E", "#E6BAA3", "#C7A76C", "#8EA7B8", "#B38A9B", "#91B3A8", "#D4A8C7"];

  if (!categories.length) {
    return (
      <div className="flex min-h-36 items-center justify-center rounded-xl bg-[var(--color-surface-soft)]/60 text-sm font-semibold text-[var(--color-text-muted)]">
        No category data
      </div>
    );
  }

  return (
    <div className="space-y-3.5">
      {categories.map((cat, i) => (
        <div key={cat.name}>
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <span className="max-w-[55%] truncate text-sm font-semibold text-[var(--color-text-main)]">
              {cat.name}
            </span>
            <span className="shrink-0 text-sm font-black text-[var(--color-text-main)]">
              {money(cat.value)}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-[var(--color-surface-soft)]">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${cat.percentage}%`,
                backgroundColor: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
              }}
            />
          </div>
          <p className="mt-1 text-right text-[11px] font-semibold text-[var(--color-text-muted)]">
            {formatPercent(cat.percentage)}% of total
          </p>
        </div>
      ))}
    </div>
  );
};

// ─── Top Products Table ───────────────────────────────────────────────────────

const TopProductsTable = ({ products }) => {
  if (!products.length) {
    return (
      <div className="flex min-h-36 items-center justify-center rounded-xl bg-[var(--color-surface-soft)]/60 text-sm font-semibold text-[var(--color-text-muted)]">
        No product sales in this period
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[600px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-[var(--color-border)]">
            {["#", "Product", "Units", "Revenue", "Profit", "Margin"].map((h) => (
              <th
                key={h}
                className={`pb-3 text-xs font-black uppercase tracking-wide text-[var(--color-text-muted)] ${
                  h === "#" || h === "Product" ? "text-left" : "text-right"
                } ${h === "Product" ? "pl-2" : h === "#" ? "" : "pr-2"}`}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--color-border)]">
          {products.map((p, i) => {
            const margin = p.revenue > 0 ? (p.profit / p.revenue) * 100 : 0;
            return (
              <tr key={p.id || p.name} className="group transition hover:bg-[var(--color-surface-soft)]/40">
                <td className="py-3.5 text-sm font-bold text-[var(--color-text-muted)]">
                  {i + 1}
                </td>
                <td className="py-3.5 pl-2">
                  <div className="flex items-center gap-3">
                    {p.image ? (
                      <img
                        src={p.image}
                        alt={p.name}
                        className="h-9 w-9 shrink-0 rounded-lg object-cover ring-1 ring-[var(--color-border)]"
                      />
                    ) : (
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--color-surface-soft)]">
                        <Package className="h-4 w-4 text-[var(--color-text-muted)]" />
                      </div>
                    )}
                    <span className="max-w-[220px] truncate font-semibold text-[var(--color-text-main)]">
                      {p.name}
                    </span>
                  </div>
                </td>
                <td className="py-3.5 pr-2 text-right font-semibold text-[var(--color-text-main)]">
                  {number(p.quantity)}
                </td>
                <td className="py-3.5 pr-2 text-right font-black text-[#4f6954]">
                  {money(p.revenue)}
                </td>
                <td className={`py-3.5 pr-2 text-right font-semibold ${p.profit >= 0 ? "text-[#527258]" : "text-[#a45f4d]"}`}>
                  {money(p.profit)}
                </td>
                <td className="py-3.5 pr-2 text-right">
                  <span
                    className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-black ${
                      margin >= 30
                        ? "bg-[#edf5ee] text-[#527258]"
                        : margin >= 10
                        ? "bg-[#f7f1e5] text-[#9a7a3c]"
                        : "bg-[#fff0eb] text-[#a45f4d]"
                    }`}
                  >
                    {formatPercent(margin)}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

// ─── Order Status Bar ─────────────────────────────────────────────────────────

const OrderStatusBar = ({ statusData, paidCount, totalCount }) => {
  const statuses = statusData.map((s) => ({
    ...s,
    color:
      s.status === "Delivered"
        ? "#7A967E"
        : s.status === "Processing"
        ? "#8EA7B8"
        : s.status === "Pending"
        ? "#C7A76C"
        : "#E6BAA3",
  }));

  const paidRate = totalCount > 0 ? (paidCount / totalCount) * 100 : 0;

  return (
    <div className="space-y-4">
      {/* Segmented bar */}
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-[var(--color-surface-soft)]">
        {statuses.map((s) => (
          <div
            key={s.status}
            style={{
              width: `${s.percentage}%`,
              backgroundColor: s.color,
              transition: "width 0.7s ease",
            }}
            title={`${s.status}: ${s.count}`}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {statuses.map((s) => (
          <div key={s.status} className="rounded-xl bg-[var(--color-surface-soft)]/60 p-3">
            <div className="mb-1.5 flex items-center gap-2">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: s.color }} />
              <span className="text-xs font-bold text-[var(--color-text-muted)]">{s.status}</span>
            </div>
            <p className="text-xl font-black text-[var(--color-text-main)]">{number(s.count)}</p>
            <p className="mt-0.5 text-xs font-semibold text-[var(--color-text-muted)]">
              {s.percentage.toFixed(1)}%
            </p>
          </div>
        ))}
      </div>

      {/* Paid rate callout */}
      <div className="flex items-center gap-3 rounded-xl border border-[var(--color-border)] bg-[#edf5ee] px-4 py-3">
        <CircleDollarSign className="h-5 w-5 shrink-0 text-[#527258]" />
        <div>
          <p className="text-sm font-black text-[#4f6954]">
            {formatPercent(paidRate)} of orders are paid
          </p>
          <p className="text-xs font-semibold text-[#66806b]">
            {number(paidCount)} paid · {number(totalCount - paidCount)} unpaid/cancelled
          </p>
        </div>
      </div>
    </div>
  );
};

// ─── CSV Export ───────────────────────────────────────────────────────────────

const exportCsv = ({ analytics, periodLabel }) => {
  const rows = [
    ["Net Revenue Report", periodLabel],
    [],
    ["Summary"],
    ["Metric", "Value (USD)", "Value (KHR)"],
    ["Net Revenue", analytics.revenue.toFixed(2), Math.round(analytics.revenue * config.USD_TO_KHR_RATE)],
    ["Gross Profit", analytics.profit.toFixed(2), Math.round(analytics.profit * config.USD_TO_KHR_RATE)],
    ["Profit Margin (%)", analytics.profitMargin.toFixed(2), ""],
    ["Paid Orders", analytics.paidOrders.length, ""],
    ["Total Orders", analytics.currentOrders.length, ""],
    ["Average Order Value", analytics.aov.toFixed(2), ""],
    ["Units Sold", analytics.units, ""],
    [],
    ["Top Products by Revenue"],
    ["Rank", "Product", "Units", "Revenue (USD)", "Profit (USD)", "Margin (%)"],
    ...analytics.topProducts.map((p, i) => {
      const margin = p.revenue > 0 ? ((p.profit / p.revenue) * 100).toFixed(1) : "0.0";
      return [i + 1, p.name, p.quantity, p.revenue.toFixed(2), p.profit.toFixed(2), margin];
    }),
    [],
    ["Revenue by Category"],
    ["Category", "Revenue (USD)", "Share (%)"],
    ...analytics.categories.map((c) => [c.name, c.value.toFixed(2), c.percentage.toFixed(1)]),
    [],
    ["Daily/Monthly Revenue"],
    ["Period", "Revenue (USD)", "Profit (USD)", "Orders"],
    ...analytics.dailyRevenue.map((d) => [d.label, d.revenue.toFixed(2), d.profit.toFixed(2), d.orders]),
  ];

  const csv = rows
    .map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(","))
    .join("\n");

  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `net-revenue-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

// ─── Analytics computation (mirrors dashboard logic) ─────────────────────────

const computeAnalytics = ({ orders, products, period, dateRange }) => {
  const now = new Date();
  const periodDays = period === "custom" || period === "all" ? null : Number(period);

  const bounds =
    period === "custom"
      ? getDateRangeBounds(dateRange)
      : {
          currentStart: periodDays ? startOfDay(addDays(now, -(periodDays - 1))) : null,
          currentEnd: periodDays ? endOfDay(now) : null,
          dayCount: periodDays,
          previousStart: periodDays
            ? startOfDay(addDays(addDays(now, -(periodDays - 1)), -periodDays))
            : null,
          previousEnd: periodDays
            ? endOfDay(addDays(addDays(now, -(periodDays - 1)), -1))
            : null,
          hasComparableRange: Boolean(periodDays),
        };

  const { currentStart, currentEnd, dayCount, previousStart, previousEnd, hasComparableRange } = bounds;
  const chartByDay = Boolean(dayCount && dayCount <= 90);

  const isCurrent = (o) => {
    const d = getOrderDate(o);
    return d && (!currentStart || d >= currentStart) && (!currentEnd || d <= currentEnd);
  };
  const isPrevious = (o) => {
    const d = getOrderDate(o);
    return d && previousStart && previousEnd && d >= previousStart && d <= previousEnd;
  };
  const isPaid = (o) => o.paymentStatus === "Paid" && o.orderStatus !== "Cancelled";

  const currentOrders = orders.filter(isCurrent);
  const previousOrders = orders.filter(isPrevious);
  const paidOrders = currentOrders.filter(isPaid);
  const previousPaidOrders = previousOrders.filter(isPaid);
  const productMap = new Map(products.map((p) => [String(p._id), p]));

  const revenue = paidOrders.reduce((s, o) => s + Number(o.totalPrice || 0), 0);
  const previousRevenue = previousPaidOrders.reduce((s, o) => s + Number(o.totalPrice || 0), 0);

  const profit = paidOrders.reduce(
    (s, o) => s + (o.orderItems || []).reduce((is, item) => is + getItemProfit(item, productMap), 0),
    0
  );
  const previousProfit = previousPaidOrders.reduce(
    (s, o) => s + (o.orderItems || []).reduce((is, item) => is + getItemProfit(item, productMap), 0),
    0
  );

  const units = paidOrders.reduce(
    (s, o) => s + (o.orderItems || []).reduce((is, item) => is + getItemQuantity(item), 0),
    0
  );
  const previousUnits = previousPaidOrders.reduce(
    (s, o) => s + (o.orderItems || []).reduce((is, item) => is + getItemQuantity(item), 0),
    0
  );

  const aov = paidOrders.length ? revenue / paidOrders.length : 0;
  const previousAov = previousPaidOrders.length ? previousRevenue / previousPaidOrders.length : 0;
  const profitMargin = revenue > 0 ? (profit / revenue) * 100 : 0;

  // Daily / monthly chart data
  const dailyMap = new Map();
  if (chartByDay) {
    for (let i = 0; i < dayCount; i++) {
      const date = addDays(currentStart, i);
      const key = formatDateInputValue(date);
      dailyMap.set(key, { key, label: formatDayLabel(date, dayCount), revenue: 0, profit: 0, orders: 0 });
    }
    paidOrders.forEach((o) => {
      const d = getOrderDate(o);
      if (!d) return;
      const entry = dailyMap.get(formatDateInputValue(d));
      if (entry) {
        entry.revenue += Number(o.totalPrice || 0);
        entry.profit += (o.orderItems || []).reduce((s, item) => s + getItemProfit(item, productMap), 0);
        entry.orders += 1;
      }
    });
  } else {
    const dated = paidOrders
      .map((o) => ({ o, date: getOrderDate(o) }))
      .filter((e) => e.date)
      .sort((a, b) => a.date - b.date);
    const finalDate = currentEnd || now;
    const firstDate = currentStart || dated[0]?.date || finalDate;
    const cursor = new Date(firstDate.getFullYear(), firstDate.getMonth(), 1);
    const finalMonth = new Date(finalDate.getFullYear(), finalDate.getMonth(), 1);
    while (cursor <= finalMonth) {
      const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`;
      dailyMap.set(key, {
        key,
        label: cursor.toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
        revenue: 0,
        profit: 0,
        orders: 0,
      });
      cursor.setMonth(cursor.getMonth() + 1);
    }
    dated.forEach(({ o, date }) => {
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const entry = dailyMap.get(key);
      if (entry) {
        entry.revenue += Number(o.totalPrice || 0);
        entry.profit += (o.orderItems || []).reduce((s, item) => s + getItemProfit(item, productMap), 0);
        entry.orders += 1;
      }
    });
  }

  // Product & category breakdown
  const productSales = new Map();
  const categorySales = new Map();
  paidOrders.forEach((o) => {
    (o.orderItems || []).forEach((item) => {
      const product = productMap.get(String(getProductId(item)));
      const cat = normalizeProductCategory(product?.category || "Uncategorized");
      const itemRevenue = getItemRevenue(item);
      const itemQty = getItemQuantity(item);
      const pKey = String(getProductId(item) || item.name);
      const existing = productSales.get(pKey) || {
        id: getProductId(item),
        name: item.name || product?.title || "Product",
        image: item.image || product?.image,
        quantity: 0,
        revenue: 0,
        profit: 0,
      };
      existing.quantity += itemQty;
      existing.revenue += itemRevenue;
      existing.profit += getItemProfit(item, productMap);
      productSales.set(pKey, existing);
      categorySales.set(cat, (categorySales.get(cat) || 0) + itemRevenue);
    });
  });

  const topProducts = [...productSales.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 10);

  const categoriesSorted = [...categorySales.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
  const maxCat = Math.max(...categoriesSorted.map((c) => c.value), 1);
  const categories = categoriesSorted.map((c) => ({ ...c, percentage: (c.value / maxCat) * 100 }));

  // Order status breakdown
  const statusData = ["Pending", "Processing", "Delivered", "Cancelled"].map((status) => ({
    status,
    count: currentOrders.filter((o) =>
      status === "Processing"
        ? ["Processing", "Shipped"].includes(o.orderStatus)
        : o.orderStatus === status
    ).length,
  }));
  const maxStatus = Math.max(...statusData.map((s) => s.count), 1);

  return {
    revenue,
    profit,
    profitMargin,
    units,
    aov,
    currentOrders,
    paidOrders,
    hasComparableRange,
    dailyRevenue: [...dailyMap.values()],
    topProducts,
    categories,
    statusData: statusData.map((s) => ({ ...s, percentage: (s.count / maxStatus) * 100 })),
    changes: {
      revenue: changeFrom(revenue, previousRevenue),
      profit: changeFrom(profit, previousProfit),
      orders: changeFrom(currentOrders.length, previousOrders.length),
      aov: changeFrom(aov, previousAov),
      units: changeFrom(units, previousUnits),
    },
  };
};

// ─── Main Page ────────────────────────────────────────────────────────────────

const DEFAULT_PERIOD = "30";
let netRevenueCache = null;

const NetRevenuePage = () => {
  const navigate = useNavigate();
  const adminToken = getStoredAdminToken();
  const cached = netRevenueCache?.token === adminToken ? netRevenueCache : null;

  const [period, setPeriod] = useState(() => cached?.period || DEFAULT_PERIOD);
  const [dateRange, setDateRange] = useState(() => cached?.dateRange || getDefaultDashboardDateRange());
  const [orders, setOrders] = useState(() => cached?.orders || []);
  const [products, setProducts] = useState(() => cached?.products || []);
  const [loading, setLoading] = useState(() => !cached);
  const [error, setError] = useState("");
  const startPickerRef = useRef(null);
  const endPickerRef = useRef(null);
  const todayInputValue = formatDateInputValue(new Date());

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [ordersRes, productsRes] = await Promise.all([
        DashboardController.getOrders(),
        DashboardController.getProducts(),
      ]);
      const nextOrders = Array.isArray(ordersRes.data) ? ordersRes.data : [];
      const nextProducts = Array.isArray(productsRes.data) ? productsRes.data : [];
      netRevenueCache = { token: adminToken, period, dateRange, orders: nextOrders, products: nextProducts };
      setOrders(nextOrders);
      setProducts(nextProducts);
    } catch {
      setError("Failed to load revenue data. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [adminToken, period, dateRange]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const analytics = useMemo(
    () => computeAnalytics({ orders, products, period, dateRange }),
    [orders, products, period, dateRange]
  );

  const periodLabel = useMemo(
    () =>
      period === "custom"
        ? formatDashboardDateRangeLabel(dateRange)
        : PERIODS.find((p) => p.value === period)?.label || "Last 30 days",
    [period, dateRange]
  );

  const handleStartDateChange = (e) => {
    const next = e.target.value;
    setDateRange((cur) => {
      if (next && cur.endDate && next > cur.endDate) return { startDate: next, endDate: next };
      return { ...cur, startDate: next };
    });
  };

  const handleEndDateChange = (e) => {
    const next = e.target.value;
    setDateRange((cur) => {
      if (next && cur.startDate && next < cur.startDate) return { startDate: next, endDate: next };
      return { ...cur, endDate: next };
    });
  };

  const openPicker = (ref) => {
    const el = ref.current;
    if (!el) return;
    if (typeof el.showPicker === "function") {
      try { el.showPicker(); return; } catch { /* fall through */ }
    }
    el.focus();
    el.click();
  };

  if (loading) return <Loading message="Loading revenue analytics..." />;

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg-base)] p-6">
        <div className="max-w-md rounded-2xl border border-[#efc7bb] bg-white p-8 text-center shadow-sm">
          <AlertTriangle className="mx-auto h-9 w-9 text-[#b56f5c]" />
          <h1 className="mt-4 text-2xl font-bold">Unable to load data</h1>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">{error}</p>
          <button
            type="button"
            onClick={loadData}
            className="mt-6 rounded-xl bg-[var(--color-primary)] px-5 py-3 font-bold text-white"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg-base)] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="admin-stagger-container mx-auto max-w-[1400px]">

        {/* ── Page header ── */}
        <header className="mb-7 flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <button
              type="button"
              onClick={() => navigate("/admin")}
              className="mb-3 inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-bold text-[var(--color-text-muted)] transition hover:bg-[var(--color-surface-soft)] hover:text-[var(--color-text-main)]"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </button>
            <div className="mb-1.5 flex items-center gap-2 text-sm font-bold text-[var(--color-primary-dark)]">
              <BarChart3 className="h-4 w-4" />
              Financial Analytics
            </div>
            <h1 className="text-3xl font-black tracking-tight text-[var(--color-text-main)] sm:text-4xl">
              Net Revenue
            </h1>
            <p className="mt-2 max-w-xl text-sm font-medium text-[var(--color-text-muted)]">
              Detailed breakdown of revenue, profit, top products, and order trends for {periodLabel}.
            </p>
          </div>

          {/* ── Controls ── */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Period select */}
            {period !== "custom" && (
              <label className="relative">
                <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-muted)]" />
                <select
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  className="h-11 appearance-none rounded-xl border border-[var(--color-border)] bg-white pl-10 pr-12 text-sm font-bold text-[var(--color-text-main)] outline-none focus:border-[var(--color-primary)]"
                  aria-label="Revenue period"
                >
                  {PERIODS.map((p) => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-main)]" />
              </label>
            )}

            {/* Custom date range */}
            {period === "custom" && (
              <>
                <div className="flex overflow-hidden rounded-xl border border-[var(--color-border)] bg-white">
                  {/* From */}
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => openPicker(startPickerRef)}
                    onKeyDown={(e) => { if (e.key === "Enter") openPicker(startPickerRef); }}
                    className="relative flex h-11 cursor-pointer items-center gap-2 px-3 transition hover:bg-[var(--color-surface-soft)]/55 focus:outline-none"
                  >
                    <input
                      ref={startPickerRef}
                      type="date"
                      value={dateRange.startDate || ""}
                      max={dateRange.endDate || todayInputValue}
                      onChange={handleStartDateChange}
                      tabIndex={-1}
                      className="pointer-events-none absolute inset-0 h-full w-full opacity-0 [color-scheme:light]"
                    />
                    <span className="text-xs font-black uppercase text-[var(--color-text-muted)]">From</span>
                    <span className="text-sm font-black tabular-nums text-[var(--color-text-main)]">
                      {formatDateDisplayValue(dateRange.startDate)}
                    </span>
                  </div>
                  <span className="w-px bg-[var(--color-border)]" />
                  {/* To */}
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => openPicker(endPickerRef)}
                    onKeyDown={(e) => { if (e.key === "Enter") openPicker(endPickerRef); }}
                    className="relative flex h-11 cursor-pointer items-center gap-2 px-3 transition hover:bg-[var(--color-surface-soft)]/55 focus:outline-none"
                  >
                    <input
                      ref={endPickerRef}
                      type="date"
                      value={dateRange.endDate || ""}
                      min={dateRange.startDate || undefined}
                      max={todayInputValue}
                      onChange={handleEndDateChange}
                      tabIndex={-1}
                      className="pointer-events-none absolute inset-0 h-full w-full opacity-0 [color-scheme:light]"
                    />
                    <span className="text-xs font-black uppercase text-[var(--color-text-muted)]">End</span>
                    <span className="text-sm font-black tabular-nums text-[var(--color-text-main)]">
                      {formatDateDisplayValue(dateRange.endDate)}
                    </span>
                  </div>
                </div>
                <label className="relative">
                  <select
                    value={period}
                    onChange={(e) => setPeriod(e.target.value)}
                    className="h-11 appearance-none rounded-xl border border-[var(--color-border)] bg-white pl-4 pr-10 text-sm font-bold text-[var(--color-text-main)] outline-none focus:border-[var(--color-primary)]"
                  >
                    {PERIODS.map((p) => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-main)]" />
                </label>
              </>
            )}

            {/* Export */}
            <button
              type="button"
              id="net-revenue-export-btn"
              onClick={() => exportCsv({ analytics, periodLabel })}
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-[var(--color-text-main)] px-4 text-sm font-bold text-white transition hover:opacity-90"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </button>
          </div>
        </header>

        {/* ── KPI Strip ── */}
        <section className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
          <KpiCard
            icon={DollarSign}
            tone="sage"
            title="Net Revenue"
            value={money(analytics.revenue)}
            sub={riel(analytics.revenue)}
            change={analytics.hasComparableRange ? analytics.changes.revenue : null}
            note={analytics.hasComparableRange ? "vs previous period" : "from paid orders"}
          />
          <KpiCard
            icon={TrendingUp}
            tone="violet"
            title="Gross Profit"
            value={money(analytics.profit)}
            change={analytics.hasComparableRange ? analytics.changes.profit : null}
            note={`${formatPercent(analytics.profitMargin)} margin`}
          />
          <KpiCard
            icon={ShoppingCart}
            tone="peach"
            title="Paid Orders"
            value={number(analytics.paidOrders.length)}
            change={analytics.hasComparableRange ? analytics.changes.orders : null}
            note={`of ${number(analytics.currentOrders.length)} total`}
          />
          <KpiCard
            icon={TrendingUp}
            tone="gold"
            title="Avg. Order Value"
            value={money(analytics.aov)}
            change={analytics.hasComparableRange ? analytics.changes.aov : null}
            note="per paid order"
          />
          <KpiCard
            icon={ShoppingBag}
            tone="blue"
            title="Units Sold"
            value={number(analytics.units)}
            change={analytics.hasComparableRange ? analytics.changes.units : null}
            note="from paid orders"
          />
          <KpiCard
            icon={CircleDollarSign}
            tone="teal"
            title="Profit Margin"
            value={formatPercent(analytics.profitMargin)}
            note={`${money(analytics.profit)} gross profit`}
          />
        </section>

        {/* ── Revenue Trend Chart ── */}
        <section className="mb-6">
          <article className="rounded-2xl border border-[var(--color-border)] bg-white p-5 shadow-[0_8px_30px_rgba(61,66,62,0.05)] sm:p-6">
            <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-[var(--color-text-main)]">Revenue &amp; Profit Trend</h2>
                <p className="mt-1 text-sm font-medium text-[var(--color-text-muted)]">
                  {analytics.dailyRevenue.length <= 90 ? "Daily" : "Monthly"} breakdown · {periodLabel}
                </p>
              </div>
              <div className="rounded-xl bg-[#edf4ee] px-4 py-2 text-right">
                <p className="text-xs font-bold uppercase tracking-wide text-[#66806b]">Period total</p>
                <p className="text-lg font-black text-[#4f6954]">{money(analytics.revenue)}</p>
                <p className="text-xs font-extrabold text-[#66806b]">{riel(analytics.revenue)}</p>
              </div>
            </div>
            <RevenueTrendChart data={analytics.dailyRevenue} />
          </article>
        </section>

        {/* ── Bottom grid: Category + Order Status ── */}
        <section className="mb-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          {/* Revenue by Category */}
          <article className="rounded-2xl border border-[var(--color-border)] bg-white p-5 shadow-[0_8px_30px_rgba(61,66,62,0.05)] sm:p-6">
            <div className="mb-5">
              <h2 className="text-xl font-bold text-[var(--color-text-main)]">Revenue by Category</h2>
              <p className="mt-1 text-sm font-medium text-[var(--color-text-muted)]">
                Top categories by revenue share
              </p>
            </div>
            <CategoryChart categories={analytics.categories} />
          </article>

          {/* Order Status */}
          <article className="rounded-2xl border border-[var(--color-border)] bg-white p-5 shadow-[0_8px_30px_rgba(61,66,62,0.05)] sm:p-6">
            <div className="mb-5">
              <h2 className="text-xl font-bold text-[var(--color-text-main)]">Order Status</h2>
              <p className="mt-1 text-sm font-medium text-[var(--color-text-muted)]">
                Distribution of orders in the selected period
              </p>
            </div>
            <OrderStatusBar
              statusData={analytics.statusData}
              paidCount={analytics.paidOrders.length}
              totalCount={analytics.currentOrders.length}
            />
          </article>
        </section>

        {/* ── Top Products Table ── */}
        <section className="mb-6">
          <article className="rounded-2xl border border-[var(--color-border)] bg-white p-5 shadow-[0_8px_30px_rgba(61,66,62,0.05)] sm:p-6">
            <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-[var(--color-text-main)]">Top Products by Revenue</h2>
                <p className="mt-1 text-sm font-medium text-[var(--color-text-muted)]">
                  Up to 10 highest-revenue products · {periodLabel}
                </p>
              </div>
              {analytics.topProducts.length > 0 && (
                <div className="rounded-xl bg-[#edf4ee] px-4 py-2 text-right">
                  <p className="text-xs font-bold uppercase tracking-wide text-[#66806b]">Total units</p>
                  <p className="text-lg font-black text-[#4f6954]">{number(analytics.units)}</p>
                </div>
              )}
            </div>
            <TopProductsTable products={analytics.topProducts} />
          </article>
        </section>

      </div>
    </div>
  );
};

export default NetRevenuePage;
