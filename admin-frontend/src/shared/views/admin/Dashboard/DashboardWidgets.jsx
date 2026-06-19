import { useState } from "react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { formatMoney } from "./dashboardFormatters";

const ChangeBadge = ({ value }) => {
  const positive = value >= 0;
  const Icon = positive ? ArrowUpRight : ArrowDownRight;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-bold ${
        positive
          ? "bg-[#edf5ee] text-[#527258]"
          : "bg-[#fff0eb] text-[#a45f4d]"
      }`}
    >
      <Icon className="h-3.5 w-3.5" />
      {Math.abs(value).toFixed(1)}%
    </span>
  );
};

export const MetricCard = ({
  title,
  value,
  change,
  note,
  icon,
  tone = "sage",
}) => {
  const MetricIcon = icon;
  const tones = {
    sage: "bg-[#edf4ee] text-[#66806b]",
    peach: "bg-[#fbefea] text-[#b17b62]",
    gold: "bg-[#f7f1e5] text-[#9a7a3c]",
    blue: "bg-[#ebf1f4] text-[#668698]",
  };

  return (
    <article className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-5 shadow-[0_8px_30px_rgba(61,66,62,0.05)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-[var(--color-text-muted)]">{title}</p>
          <p className="mt-2 text-3xl font-black tracking-tight text-[var(--color-text-main)]">
            {value}
          </p>
        </div>
        <div className={`rounded-xl p-2.5 ${tones[tone]}`}>
          <MetricIcon className="h-5 w-5" />
        </div>
      </div>
      <div className="mt-4 flex items-center gap-2">
        {change === null ? null : <ChangeBadge value={change} />}
        <span className="text-xs font-semibold text-[var(--color-text-muted)]">
          {note}
        </span>
      </div>
    </article>
  );
};

export const RevenueChart = ({ data }) => {
  const [hoveredPointIndex, setHoveredPointIndex] = useState(null);
  const width = 720;
  const height = 245;
  const padding = { top: 20, right: 18, bottom: 34, left: 52 };
  const maxValue = Math.max(...data.map((item) => item.revenue), 1);
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;
  const points = data.map((item, index) => ({
    ...item,
    x:
      padding.left +
      (data.length === 1
        ? innerWidth / 2
        : (index / (data.length - 1)) * innerWidth),
    y: padding.top + innerHeight - (item.revenue / maxValue) * innerHeight,
  }));
  const line = points.map((point) => `${point.x},${point.y}`).join(" ");
  const area = points.length
    ? `${padding.left},${padding.top + innerHeight} ${line} ${
        padding.left + innerWidth
      },${padding.top + innerHeight}`
    : "";
  const gridValues = [0, 0.25, 0.5, 0.75, 1];
  const labelStep = Math.max(1, Math.ceil(data.length / 7));
  const hoveredPoint =
    hoveredPointIndex === null ? null : points[hoveredPointIndex];
  const tooltipWidth = 132;
  const tooltipHeight = 48;
  const tooltipX = hoveredPoint
    ? Math.min(
        width - tooltipWidth - 4,
        Math.max(4, hoveredPoint.x - tooltipWidth / 2)
      )
    : 0;
  const tooltipY = hoveredPoint
    ? Math.max(4, hoveredPoint.y - tooltipHeight - 12)
    : 0;

  if (!data.length) {
    return (
      <div className="flex h-[245px] items-center justify-center text-sm font-semibold text-[var(--color-text-muted)]">
        No sales in this period
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-[245px] min-w-[640px] w-full"
        role="img"
        aria-label="Revenue trend chart"
      >
        <defs>
          <linearGradient id="revenueArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7A967E" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#7A967E" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {gridValues.map((ratio) => {
          const y = padding.top + innerHeight - ratio * innerHeight;
          return (
            <g key={ratio}>
              <line
                x1={padding.left}
                x2={padding.left + innerWidth}
                y1={y}
                y2={y}
                stroke="#EAE3DB"
                strokeDasharray="4 5"
              />
              <text
                x={padding.left - 9}
                y={y + 4}
                textAnchor="end"
                fontSize="11"
                fill="#8A8F89"
              >
                {formatMoney(maxValue * ratio, true)}
              </text>
            </g>
          );
        })}
        <polygon points={area} fill="url(#revenueArea)" />
        <polyline
          points={line}
          fill="none"
          stroke="#6F8C74"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {points.map((point, index) => {
          const isHovered = hoveredPointIndex === index;
          return (
            <g
              key={point.key}
              onPointerEnter={() => setHoveredPointIndex(index)}
              onPointerMove={() => setHoveredPointIndex(index)}
              onPointerLeave={() => setHoveredPointIndex(null)}
              className="cursor-crosshair"
            >
              <circle
                cx={point.x}
                cy={point.y}
                r="14"
                fill="transparent"
                aria-label={`${point.label}: ${formatMoney(point.revenue)}`}
              />
              <circle
                cx={point.x}
                cy={point.y}
                r={isHovered ? "6" : "4"}
                fill="#fff"
                stroke="#6F8C74"
                strokeWidth="2.5"
                pointerEvents="none"
              />
              {index % labelStep === 0 || index === points.length - 1 ? (
                <text
                  x={point.x}
                  y={height - 9}
                  textAnchor="middle"
                  fontSize="11"
                  fill="#727871"
                >
                  {point.label}
                </text>
              ) : null}
            </g>
          );
        })}
        {hoveredPoint ? (
          <g pointerEvents="none">
            <line
              x1={hoveredPoint.x}
              x2={hoveredPoint.x}
              y1={hoveredPoint.y + 7}
              y2={padding.top + innerHeight}
              stroke="#6F8C74"
              strokeDasharray="3 4"
              strokeOpacity="0.55"
            />
            <rect
              x={tooltipX}
              y={tooltipY}
              width={tooltipWidth}
              height={tooltipHeight}
              rx="9"
              fill="#27312A"
            />
            <text
              x={tooltipX + tooltipWidth / 2}
              y={tooltipY + 18}
              textAnchor="middle"
              fontSize="11"
              fontWeight="700"
              fill="#DCE7DE"
            >
              {hoveredPoint.label}
            </text>
            <text
              x={tooltipX + tooltipWidth / 2}
              y={tooltipY + 36}
              textAnchor="middle"
              fontSize="14"
              fontWeight="800"
              fill="#FFFFFF"
            >
              {formatMoney(hoveredPoint.revenue)}
            </text>
          </g>
        ) : null}
      </svg>
    </div>
  );
};

export const EmptyState = ({ children }) => (
  <div className="flex min-h-44 items-center justify-center rounded-xl bg-[var(--color-surface-soft)]/60 px-6 text-center text-sm font-semibold text-[var(--color-text-muted)]">
    {children}
  </div>
);
