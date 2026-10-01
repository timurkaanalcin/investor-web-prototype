"use client";

import { useEffect, useMemo, useState } from "react";
import { formatMoney, type TradeCurrency } from "@/lib/mock-data";

type DepthLevel = { price: number; size: number; total: number };
type TapeTrade = {
  id: string;
  price: number;
  size: number;
  side: "buy" | "sell";
  time: string;
};

function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function buildDepth(mid: number, seed: number): { bids: DepthLevel[]; asks: DepthLevel[] } {
  const rng = mulberry32(seed);
  const tick = mid >= 1000 ? 0.5 : mid >= 100 ? 0.05 : mid >= 10 ? 0.01 : 0.0001;
  const bids: DepthLevel[] = [];
  const asks: DepthLevel[] = [];
  let bidTot = 0;
  let askTot = 0;
  for (let i = 1; i <= 8; i++) {
    const bSize = Math.round(10 + rng() * 220);
    const aSize = Math.round(10 + rng() * 220);
    bidTot += bSize;
    askTot += aSize;
    bids.push({
      price: +(mid - i * tick).toFixed(mid >= 10 ? 2 : 4),
      size: bSize,
      total: bidTot,
    });
    asks.push({
      price: +(mid + i * tick).toFixed(mid >= 10 ? 2 : 4),
      size: aSize,
      total: askTot,
    });
  }
  return { bids, asks };
}

function buildTape(mid: number, seed: number): TapeTrade[] {
  const rng = mulberry32(seed ^ 0xabc);
  const now = Date.now();
  const out: TapeTrade[] = [];
  for (let i = 0; i < 18; i++) {
    const side: "buy" | "sell" = rng() > 0.48 ? "buy" : "sell";
    const drift = (rng() - 0.5) * mid * 0.0012;
    const t = new Date(now - i * (800 + rng() * 4200));
    out.push({
      id: `tape_${i}_${seed}`,
      price: +(mid + drift).toFixed(mid >= 10 ? 2 : 4),
      size: Math.round(1 + rng() * 80),
      side,
      time: t.toLocaleTimeString("tr-TR", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
    });
  }
  return out;
}

/** Mock DOM (depth of market) + last trades tape for bottom panel. */
export function TradeDepthTape({
  symbol,
  lastPrice,
  currency,
}: {
  symbol: string;
  lastPrice: number;
  currency: TradeCurrency;
}) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), 2800);
    return () => window.clearInterval(id);
  }, []);

  const { bids, asks, tape, spread } = useMemo(() => {
    const seed = hashStr(symbol) + tick;
    const mid = lastPrice > 0 ? lastPrice : 1;
    const d = buildDepth(mid, seed);
    const t = buildTape(mid, seed);
    const bestBid = d.bids[0]?.price ?? mid;
    const bestAsk = d.asks[0]?.price ?? mid;
    return {
      bids: d.bids,
      asks: d.asks,
      tape: t,
      spread: +(bestAsk - bestBid).toFixed(mid >= 10 ? 2 : 4),
    };
  }, [symbol, lastPrice, tick]);

  const maxBid = Math.max(...bids.map((b) => b.size), 1);
  const maxAsk = Math.max(...asks.map((a) => a.size), 1);

  return (
    <div className="tv-depth-tape grid min-h-0 flex-1 grid-cols-1 gap-0 md:grid-cols-2">
      <div className="min-h-0 overflow-auto border-b border-[var(--tv-border)] md:border-b-0 md:border-r">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[var(--tv-border)] bg-[var(--tv-panel)] px-3 py-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--tv-muted)]">
            Derinlik (DOM)
          </span>
          <span className="tv-mono text-[10px] text-[var(--tv-muted)]">
            Spread {formatMoney(spread, currency)}
          </span>
        </div>
        <div className="grid grid-cols-2 text-[11px]">
          <div>
            <div className="flex px-2 py-1 text-[9px] font-semibold uppercase text-[var(--tv-muted)]">
              <span className="flex-1">Alış</span>
              <span className="w-14 text-right">Adet</span>
              <span className="w-16 text-right">Fiyat</span>
            </div>
            {bids.map((b) => (
              <div
                key={`b-${b.price}`}
                className="relative flex px-2 py-[3px]"
              >
                <span
                  className="pointer-events-none absolute inset-y-0 right-0 bg-[#26a69a]/12"
                  style={{ width: `${(b.size / maxBid) * 100}%` }}
                />
                <span className="relative flex-1 tv-mono text-[var(--tv-muted)]">
                  {b.total}
                </span>
                <span className="relative w-14 text-right tv-mono text-[var(--tv-text)]">
                  {b.size}
                </span>
                <span className="relative w-16 text-right tv-mono font-semibold text-[#26a69a]">
                  {formatMoney(b.price, currency)}
                </span>
              </div>
            ))}
          </div>
          <div>
            <div className="flex px-2 py-1 text-[9px] font-semibold uppercase text-[var(--tv-muted)]">
              <span className="w-16">Fiyat</span>
              <span className="w-14 text-right">Adet</span>
              <span className="flex-1 text-right">Satış</span>
            </div>
            {asks.map((a) => (
              <div
                key={`a-${a.price}`}
                className="relative flex px-2 py-[3px]"
              >
                <span
                  className="pointer-events-none absolute inset-y-0 left-0 bg-[#ef5350]/12"
                  style={{ width: `${(a.size / maxAsk) * 100}%` }}
                />
                <span className="relative w-16 tv-mono font-semibold text-[#ef5350]">
                  {formatMoney(a.price, currency)}
                </span>
                <span className="relative w-14 text-right tv-mono text-[var(--tv-text)]">
                  {a.size}
                </span>
                <span className="relative flex-1 text-right tv-mono text-[var(--tv-muted)]">
                  {a.total}
                </span>
              </div>
            ))}
          </div>
        </div>
        <p className="px-3 py-2 text-[9px] text-[var(--tv-muted)]">
          Simülasyon — gerçek emir defteri değil
        </p>
      </div>

      <div className="min-h-0 overflow-auto">
        <div className="sticky top-0 z-10 border-b border-[var(--tv-border)] bg-[var(--tv-panel)] px-3 py-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--tv-muted)]">
            Son işlemler
          </span>
        </div>
        <table className="w-full border-collapse text-left text-[11px]">
          <thead>
            <tr className="text-[9px] uppercase text-[var(--tv-muted)]">
              <th className="px-3 py-1 font-semibold">Saat</th>
              <th className="px-2 py-1 font-semibold">Fiyat</th>
              <th className="px-2 py-1 text-right font-semibold">Adet</th>
              <th className="px-3 py-1 text-right font-semibold">Yön</th>
            </tr>
          </thead>
          <tbody>
            {tape.map((t) => (
              <tr
                key={t.id}
                className="border-t border-[var(--tv-border)] hover:bg-[var(--tv-hover)]"
              >
                <td className="px-3 py-1 tv-mono text-[var(--tv-muted)]">
                  {t.time}
                </td>
                <td
                  className={`px-2 py-1 tv-mono font-semibold ${
                    t.side === "buy" ? "text-[#26a69a]" : "text-[#ef5350]"
                  }`}
                >
                  {formatMoney(t.price, currency)}
                </td>
                <td className="px-2 py-1 text-right tv-mono text-[var(--tv-text)]">
                  {t.size}
                </td>
                <td className="px-3 py-1 text-right">
                  <span
                    className={`rounded px-1.5 py-0.5 text-[9px] font-bold ${
                      t.side === "buy"
                        ? "bg-[#26a69a]/15 text-[#26a69a]"
                        : "bg-[#ef5350]/15 text-[#ef5350]"
                    }`}
                  >
                    {t.side === "buy" ? "Al" : "Sat"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
