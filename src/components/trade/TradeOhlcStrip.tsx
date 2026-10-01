"use client";

import { useMemo } from "react";
import { formatMoney, type TradeCurrency } from "@/lib/mock-data";
import { formatVolume, getDayStats } from "@/lib/market-series";

export type LiveDayStats = {
  open: number;
  high: number;
  low: number;
  prevClose?: number;
  previousClose?: number;
  volume?: number;
};

/** Compact OHLC + 24h H/L + volume strip under symbol header (TradingView-like). */
export function TradeOhlcStrip({
  symbol,
  lastPrice,
  changePct,
  currency,
  compact = false,
  liveStats,
}: {
  symbol: string;
  lastPrice: number;
  changePct: number;
  currency: TradeCurrency;
  compact?: boolean;
  /** When set (from Yahoo), özet matches real market 1:1 instead of synthetic. */
  liveStats?: LiveDayStats | null;
}) {
  const stats = useMemo(() => {
    if (
      liveStats &&
      Number.isFinite(liveStats.open) &&
      Number.isFinite(liveStats.high) &&
      Number.isFinite(liveStats.low)
    ) {
      return {
        open: liveStats.open,
        high: liveStats.high,
        low: liveStats.low,
        prevClose: liveStats.prevClose ?? liveStats.previousClose ?? lastPrice / (1 + changePct / 100),
        volume: liveStats.volume ?? getDayStats(symbol, lastPrice, changePct).volume,
      };
    }
    return getDayStats(symbol, lastPrice, changePct);
  }, [symbol, lastPrice, changePct, liveStats]);

  const cells: { label: string; value: string; accent?: "up" | "down" }[] = [
    { label: "Açılış", value: formatMoney(stats.open, currency) },
    { label: "Yüksek", value: formatMoney(stats.high, currency), accent: "up" },
    { label: "Düşük", value: formatMoney(stats.low, currency), accent: "down" },
    { label: "Hacim", value: formatVolume(stats.volume) },
    {
      label: "Önceki",
      value: formatMoney(stats.prevClose, currency),
    },
  ];

  return (
    <div
      className={`tv-ohlc-strip ${compact ? "tv-ohlc-strip--compact" : ""}`}
      aria-label="Günlük OHLC"
    >
      {cells.map((c) => (
        <div key={c.label} className="tv-ohlc-cell">
          <span className="tv-ohlc-label">{c.label}</span>
          <span
            className={`tv-mono tv-ohlc-value ${
              c.accent === "up"
                ? "text-[#26a69a]"
                : c.accent === "down"
                  ? "text-[#ef5350]"
                  : "text-[var(--tv-text)]"
            }`}
          >
            {c.value}
          </span>
        </div>
      ))}
    </div>
  );
}
