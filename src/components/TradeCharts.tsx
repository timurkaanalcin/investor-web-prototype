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
import { formatPct, formatUSD } from "@/lib/mock-data";

const GAIN = "#226d78";
const LOSS = "#c44536";
const NAVY = "#000b50";

/** Mini sparkline for trade list rows */
export function Sparkline({
  symbol,
  lastPrice,
  changePct,
  width = 64,
  height = 28,
}: {
  symbol: string;
  lastPrice: number;
  changePct: number;
  width?: number;
  height?: number;
}) {
  const values = useMemo(
    () => getSparkline(symbol, lastPrice, changePct),
    [symbol, lastPrice, changePct]
  );
  const positive = changePct >= 0;
  const color = positive ? GAIN : LOSS;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const pad = 2;
  const coords = values.map((v, i) => {
    const x = pad + (i / (values.length - 1)) * (width - pad * 2);
    const y = pad + (1 - (v - min) / span) * (height - pad * 2);
    return `${x},${y}`;
  });
  const line = coords.map((c, i) => `${i === 0 ? "M" : "L"}${c}`).join(" ");

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

/** Full interactive area/line chart — Betterment-style flat chart */
export function StockPriceChart({
  symbol,
  lastPrice,
  changePct,
}: {
  symbol: string;
  lastPrice: number;
  changePct: number;
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
  const h = 240;
  const padX = 2;
  const padTop = 16;
  const padBot = 10;

  const values = series.map((p) => p.price);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || lastPrice * 0.01;

  const coords = series.map((p, i) => {
    const x = padX + (i / Math.max(1, series.length - 1)) * (w - padX * 2);
    const y = padTop + (1 - (p.price - min) / span) * (h - padTop - padBot);
    return { x, y, ...p };
  });

  const line = coords.map((c, i) => `${i === 0 ? "M" : "L"}${c.x},${c.y}`).join(" ");
  const area = `${line} L${coords[coords.length - 1]?.x ?? 0},${h} L${coords[0]?.x ?? 0},${h} Z`;

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
  const midLabel = series[Math.floor(series.length / 2)]?.label ?? "";
  const lastLabel = series[series.length - 1]?.label ?? "";

  // Tooltip position (clamp)
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
              <stop offset="0%" stopColor={color} stopOpacity="0.32" />
              <stop offset="55%" stopColor={color} stopOpacity="0.08" />
              <stop offset="100%" stopColor={color} stopOpacity="0.01" />
            </linearGradient>
          </defs>

          {[0.2, 0.4, 0.6, 0.8].map((f) => {
            const y = padTop + f * (h - padTop - padBot);
            return (
              <line
                key={f}
                x1={padX}
                x2={w - padX}
                y1={y}
                y2={y}
                stroke={NAVY}
                strokeOpacity="0.05"
                strokeWidth="1"
              />
            );
          })}

          <path d={area} fill={`url(#fill-${gradId})`} />
          <path
            d={line}
            fill="none"
            stroke={color}
            strokeWidth="2.5"
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {active && (
            <>
              <line
                x1={active.x}
                x2={active.x}
                y1={padTop}
                y2={h - padBot}
                stroke={NAVY}
                strokeOpacity={hover !== null ? 0.22 : 0}
                strokeWidth="1"
                strokeDasharray="3 3"
              />
              <circle
                cx={active.x}
                cy={active.y}
                r={hover !== null ? 5.5 : 4.5}
                fill={color}
                stroke="white"
                strokeWidth="2.25"
              />
            </>
          )}

          {/* Hover price tooltip */}
          {hover !== null && active && (
            <g>
              <rect
                x={tipX - 42}
                y={Math.max(4, active.y - 36)}
                width="84"
                height="24"
                rx="6"
                fill={NAVY}
                opacity="0.92"
              />
              <text
                x={tipX}
                y={Math.max(4, active.y - 36) + 16}
                textAnchor="middle"
                fill="#fff"
                fontSize="11"
                fontWeight="600"
                fontFamily="system-ui,sans-serif"
              >
                {formatUSD(active.price)}
              </text>
            </g>
          )}
        </svg>

        {/* Scrub readout under chart top when hovering */}
        <div className="pointer-events-none absolute left-0 right-0 top-0 flex items-baseline justify-between px-1">
          <p className="text-[11px] text-muted">
            {hover !== null && active
              ? active.label
              : range === "1G"
                ? "Bugün"
                : `${range} aralığı`}
          </p>
          {hover === null && (
            <p
              className={`text-[11px] font-semibold ${
                rangeChange >= 0 ? "text-nest-light" : "text-danger"
              }`}
            >
              {rangeChange >= 0 ? "+" : ""}
              {formatUSD(rangeChange)} ({formatPct(rangeChangePct)})
            </p>
          )}
        </div>
      </div>

      <div className="mt-1 flex justify-between px-0.5 text-[10px] text-muted">
        <span>{firstLabel}</span>
        <span>{midLabel}</span>
        <span>{lastLabel}</span>
      </div>

      {/* Range tabs — underline active (Betterment style) */}
      <div className="mt-3 flex justify-between border-b border-black/5 px-0.5">
        {CHART_RANGES.map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => {
              setRange(r);
              setHover(null);
            }}
            className={`relative shrink-0 px-1.5 pb-2.5 text-[12px] font-semibold transition-colors ${
              range === r ? "text-nest" : "text-muted hover:text-nest"
            }`}
          >
            {r}
            {range === r && (
              <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-nest-blue" />
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
    return getOverviewBalanceSeries(balance, start, 52);
  }, [balance, startBalance]);

  const w = 360;
  const h = height;
  const padX = 4;
  const padTop = 8;
  const padBot = 4;

  const values = series.map((p) => p.price);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || balance * 0.02;

  const coords = series.map((p, i) => {
    const x = padX + (i / Math.max(1, series.length - 1)) * (w - padX * 2);
    const y = padTop + (1 - (p.price - min) / span) * (h - padTop - padBot);
    return { x, y };
  });

  const line = coords.map((c, i) => `${i === 0 ? "M" : "L"}${c.x},${c.y}`).join(" ");
  const area = `${line} L${coords[coords.length - 1]?.x ?? 0},${h} L${coords[0]?.x ?? 0},${h} Z`;
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
        <path d={area} fill={OVERVIEW_FILL} fillOpacity="0.85" />
        <path
          d={line}
          fill="none"
          stroke={OVERVIEW_STROKE}
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
      <div className="mt-0.5 flex justify-between px-0.5 text-[11px] text-muted">
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
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
        status.open
          ? "bg-[color-mix(in_srgb,#226d78_14%,white)] text-nest-light"
          : "bg-beige text-muted"
      }`}
    >
      <span
        className={`inline-block h-1.5 w-1.5 rounded-full ${
          status.open ? "bg-nest-light" : "bg-muted"
        }`}
        aria-hidden
      />
      {status.label}
      <span className="font-normal opacity-70">· {status.clock}</span>
    </span>
  );
}

/** Day stats — label left / value right with hairline dividers */
export function DayStatsGrid({
  symbol,
  lastPrice,
  changePct,
}: {
  symbol: string;
  lastPrice: number;
  changePct: number;
}) {
  const stats = useMemo(
    () => getDayStats(symbol, lastPrice, changePct),
    [symbol, lastPrice, changePct]
  );

  const cells: { label: string; value: string }[] = [
    { label: "Açılış", value: formatUSD(stats.open) },
    { label: "Yüksek", value: formatUSD(stats.high) },
    { label: "Düşük", value: formatUSD(stats.low) },
    { label: "Hacim", value: formatVolume(stats.volume) },
  ];

  return (
    <ul className="divide-y divide-black/5">
      {cells.map((c) => (
        <li
          key={c.label}
          className="flex items-center justify-between py-3 text-sm"
        >
          <span className="text-muted">{c.label}</span>
          <span className="font-semibold text-nest">{c.value}</span>
        </li>
      ))}
    </ul>
  );
}

/** Large brokerage-style price header */
export function PriceHeader({
  lastPrice,
  changePct,
}: {
  lastPrice: number;
  changePct: number;
}) {
  const change = lastPrice - lastPrice / (1 + changePct / 100);
  const up = changePct >= 0;
  return (
    <div>
      <p className="text-[2rem] font-bold leading-none tracking-tight text-nest tabular-nums">
        {formatUSD(lastPrice)}
      </p>
      <p
        className={`mt-1.5 text-[15px] font-semibold tabular-nums ${
          up ? "text-nest-light" : "text-danger"
        }`}
      >
        {up ? "+" : ""}
        {formatUSD(change)}{" "}
        <span className="opacity-90">({formatPct(changePct)})</span>
        <span className="ml-1.5 text-[12px] font-medium text-muted">bugün</span>
      </p>
    </div>
  );
}
