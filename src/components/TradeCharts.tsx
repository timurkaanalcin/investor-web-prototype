"use client";

import { useId, useMemo, useState, type MouseEvent, type TouchEvent } from "react";
import {
  CHART_RANGES,
  type ChartRange,
  formatVolume,
  getDayStats,
  getMarketStatus,
  getOverviewBalanceSeries,
  getSeriesForRange,
  getSparkline,
} from "@/lib/market-series";
import { formatMoney, formatPct, type TradeCurrency } from "@/lib/mock-data";

const GAIN = "#1a7a4c";
const LOSS = "#c44536";
const NAVY = "#000b50";
const CHART_BLUE = "#1d6ae5";

/** Smooth cubic path through points (Betterment-like soft curve) */
function smoothPath(
  coords: { x: number; y: number }[],
  closeBottom?: { y: number }
): string {
  if (coords.length === 0) return "";
  if (coords.length === 1) return `M${coords[0].x},${coords[0].y}`;
  let d = `M${coords[0].x},${coords[0].y}`;
  for (let i = 0; i < coords.length - 1; i++) {
    const p0 = coords[i === 0 ? 0 : i - 1];
    const p1 = coords[i];
    const p2 = coords[i + 1];
    const p3 = coords[i + 2] ?? p2;
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
  }
  if (closeBottom) {
    d += ` L${coords[coords.length - 1].x},${closeBottom.y} L${coords[0].x},${closeBottom.y} Z`;
  }
  return d;
}

/** Mini sparkline for trade list rows */
export function Sparkline({
  symbol,
  lastPrice,
  changePct,
  width = 64,
  height = 28,
  upColor,
  downColor,
}: {
  symbol: string;
  lastPrice: number;
  changePct: number;
  width?: number;
  height?: number;
  upColor?: string;
  downColor?: string;
}) {
  const values = useMemo(
    () => getSparkline(symbol, lastPrice, changePct),
    [symbol, lastPrice, changePct]
  );
  const positive = changePct >= 0;
  const color = positive ? (upColor ?? GAIN) : (downColor ?? LOSS);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const pad = 2;
  const coords = values.map((v, i) => {
    const x = pad + (i / (values.length - 1)) * (width - pad * 2);
    const y = pad + (1 - (v - min) / span) * (height - pad * 2);
    return { x, y };
  });
  const line = smoothPath(coords);

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="shrink-0"
      aria-hidden
    >
      <path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth="1.75"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Full interactive area/line chart — brokerage polish */
export function StockPriceChart({
  symbol,
  lastPrice,
  changePct,
  currency = "USD",
}: {
  symbol: string;
  lastPrice: number;
  changePct: number;
  currency?: TradeCurrency;
}) {
  const [range, setRange] = useState<ChartRange>("1G");
  const [hover, setHover] = useState<number | null>(null);
  const gradId = useId().replace(/:/g, "");

  const series = useMemo(
    () => getSeriesForRange(symbol, lastPrice, changePct, range),
    [symbol, lastPrice, changePct, range]
  );

  const positive =
    series.length >= 2
      ? series[series.length - 1].price >= series[0].price
      : changePct >= 0;
  const color = positive ? GAIN : LOSS;

  const w = 360;
  const h = 220;
  const padX = 4;
  const padTop = 20;
  const padBot = 8;

  const values = series.map((p) => p.price);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || lastPrice * 0.01;

  const coords = series.map((p, i) => {
    const x = padX + (i / Math.max(1, series.length - 1)) * (w - padX * 2);
    const y = padTop + (1 - (p.price - min) / span) * (h - padTop - padBot);
    return { x, y, ...p };
  });

  const line = smoothPath(coords);
  const area = smoothPath(coords, { y: h });

  const activeIdx = hover ?? coords.length - 1;
  const active = coords[activeIdx] ?? coords[coords.length - 1];

  const rangeChange =
    series.length >= 2
      ? series[series.length - 1].price - series[0].price
      : 0;
  const rangeChangePct =
    series.length >= 2 && series[0].price
      ? (rangeChange / series[0].price) * 100
      : changePct;

  function onMove(e: MouseEvent<SVGSVGElement> | TouchEvent<SVGSVGElement>) {
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const clientX =
      "touches" in e ? e.touches[0]?.clientX ?? 0 : e.clientX;
    const x = ((clientX - rect.left) / rect.width) * w;
    let best = 0;
    let bestDist = Infinity;
    for (let i = 0; i < coords.length; i++) {
      const d = Math.abs(coords[i].x - x);
      if (d < bestDist) {
        bestDist = d;
        best = i;
      }
    }
    setHover(best);
  }

  const firstLabel = series[0]?.label ?? "";
  const lastLabel = series[series.length - 1]?.label ?? "";
  const tipX = active ? Math.min(Math.max(active.x, 48), w - 48) : 0;

  return (
    <div className="w-full">
      <div className="relative">
        <svg
          viewBox={`0 0 ${w} ${h}`}
          className="w-full touch-none select-none"
          role="img"
          aria-label={`${symbol} fiyat grafiği ${range}`}
          onMouseMove={onMove}
          onMouseLeave={() => setHover(null)}
          onTouchStart={onMove}
          onTouchMove={onMove}
          onTouchEnd={() => setHover(null)}
        >
          <defs>
            <linearGradient id={`fill-${gradId}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.28" />
              <stop offset="60%" stopColor={color} stopOpacity="0.06" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>

          <path d={area} fill={`url(#fill-${gradId})`} />
          <path
            d={line}
            fill="none"
            stroke={color}
            strokeWidth="2.25"
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {active && (
            <>
              <line
                x1={active.x}
                x2={active.x}
                y1={padTop - 4}
                y2={h - padBot}
                stroke={NAVY}
                strokeOpacity={hover !== null ? 0.18 : 0}
                strokeWidth="1"
              />
              <circle
                cx={active.x}
                cy={active.y}
                r={hover !== null ? 5 : 0}
                fill={color}
                stroke="white"
                strokeWidth="2"
              />
            </>
          )}

          {hover !== null && active && (
            <g>
              <rect
                x={tipX - 44}
                y={Math.max(2, active.y - 34)}
                width="88"
                height="22"
                rx="6"
                fill={NAVY}
                opacity="0.92"
              />
              <text
                x={tipX}
                y={Math.max(2, active.y - 34) + 15}
                textAnchor="middle"
                fill="#fff"
                fontSize="11"
                fontWeight="600"
                fontFamily="system-ui,sans-serif"
              >
                {formatMoney(active.price, currency)}
              </text>
            </g>
          )}
        </svg>

        <div className="pointer-events-none absolute left-0 right-0 top-0 flex items-baseline justify-between px-0.5">
          <p className="text-[11px] text-muted">
            {hover !== null && active
              ? active.label
              : range === "1G"
                ? "Bugün"
                : `${range} aralığı`}
          </p>
          {hover === null && (
            <p
              className={`text-[11px] font-semibold tabular-nums ${
                rangeChange >= 0 ? "text-gain" : "text-danger"
              }`}
            >
              {rangeChange >= 0 ? "+" : ""}
              {formatMoney(rangeChange, currency)} ({formatPct(rangeChangePct)})
            </p>
          )}
        </div>
      </div>

      <div className="mt-0.5 flex justify-between px-0.5 text-[11px] text-muted">
        <span>{firstLabel}</span>
        <span>{lastLabel}</span>
      </div>

      {/* Range tabs — underline active */}
      <div
        className="mt-3 flex justify-between border-b border-black/[0.06] px-0.5"
        role="tablist"
        aria-label="Grafik aralığı"
      >
        {CHART_RANGES.map((r) => (
          <button
            key={r}
            type="button"
            role="tab"
            aria-selected={range === r}
            onClick={() => {
              setRange(r);
              setHover(null);
            }}
            className={`trade-press relative shrink-0 px-1.5 pb-2.5 text-[12px] font-semibold transition-colors focus-visible:outline-none ${
              range === r ? "text-nest" : "text-muted hover:text-nest"
            }`}
          >
            {r}
            {range === r && (
              <span className="absolute inset-x-0.5 bottom-0 h-[2px] rounded-full bg-nest-blue" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

const OVERVIEW_FILL = "#B8D4F0";
const OVERVIEW_STROKE = "#1d6ae5";

/** SDI overview — powder-blue area, no range pills, date → Bugün */
export function OverviewAreaChart({
  balance,
  startBalance,
  height = 180,
}: {
  balance: number;
  startBalance?: number;
  height?: number;
}) {
  const series = useMemo(() => {
    const start = startBalance ?? balance / 1.05;
    return getOverviewBalanceSeries(balance, start, 56);
  }, [balance, startBalance]);

  const w = 360;
  const h = height;
  const padX = 2;
  const padTop = 6;
  const padBot = 2;

  const values = series.map((p) => p.price);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || balance * 0.02;

  const coords = series.map((p, i) => {
    const x = padX + (i / Math.max(1, series.length - 1)) * (w - padX * 2);
    const y = padTop + (1 - (p.price - min) / span) * (h - padTop - padBot);
    return { x, y };
  });

  const line = smoothPath(coords);
  const area = smoothPath(coords, { y: h });
  const firstLabel = series[0]?.label ?? "";
  const lastLabel = "Bugün";

  return (
    <div className="w-full">
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="w-full"
        role="img"
        aria-label="Hesap bakiyesi grafiği"
      >
        <path d={area} fill={OVERVIEW_FILL} fillOpacity="0.92" />
        <path
          d={line}
          fill="none"
          stroke={OVERVIEW_STROKE}
          strokeWidth="1.75"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
      <div className="mt-1 flex justify-between px-0.5 text-[11px] text-muted">
        <span>{firstLabel}</span>
        <span>{lastLabel}</span>
      </div>
    </div>
  );
}

export function MarketStatusPill() {
  const status = getMarketStatus();
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${
        status.open
          ? "bg-[color-mix(in_srgb,#1a7a4c_12%,white)] text-gain"
          : "bg-beige text-muted"
      }`}
    >
      <span
        className={`inline-block h-1.5 w-1.5 rounded-full ${
          status.open ? "bg-gain" : "bg-muted"
        }`}
        aria-hidden
      />
      {status.label}
    </span>
  );
}

/** Day stats — label left / value right with hairline dividers */
export function DayStatsGrid({
  symbol,
  lastPrice,
  changePct,
  currency = "USD",
}: {
  symbol: string;
  lastPrice: number;
  changePct: number;
  currency?: TradeCurrency;
}) {
  const stats = useMemo(
    () => getDayStats(symbol, lastPrice, changePct),
    [symbol, lastPrice, changePct]
  );

  const cells: { label: string; value: string }[] = [
    { label: "Açılış", value: formatMoney(stats.open, currency) },
    { label: "Yüksek", value: formatMoney(stats.high, currency) },
    { label: "Düşük", value: formatMoney(stats.low, currency) },
    { label: "Önceki kapanış", value: formatMoney(stats.prevClose, currency) },
    { label: "Hacim", value: formatVolume(stats.volume) },
  ];

  return (
    <ul className="divide-y divide-[color-mix(in_srgb,var(--muted)_28%,transparent)]">
      {cells.map((c) => (
        <li
          key={c.label}
          className="flex items-center justify-between py-[13px] text-[14px]"
        >
          <span className="text-muted">{c.label}</span>
          <span className="font-semibold tabular-nums text-nest">{c.value}</span>
        </li>
      ))}
    </ul>
  );
}

/** Large brokerage-style price header */
export function PriceHeader({
  lastPrice,
  changePct,
  currency = "USD",
}: {
  lastPrice: number;
  changePct: number;
  currency?: TradeCurrency;
}) {
  const change = lastPrice - lastPrice / (1 + changePct / 100);
  const up = changePct >= 0;
  return (
    <div>
      <p className="text-[36px] font-bold leading-none tracking-tight text-nest tabular-nums">
        {formatMoney(lastPrice, currency)}
      </p>
      <p
        className={`mt-2 text-[15px] font-semibold tabular-nums ${
          up ? "text-gain" : "text-danger"
        }`}
      >
        {up ? "+" : ""}
        {formatMoney(change, currency)}{" "}
        <span className="opacity-90">({formatPct(changePct)})</span>
        <span className="ml-1.5 text-[12px] font-medium text-muted">bugün</span>
      </p>
    </div>
  );
}

export { CHART_BLUE };
