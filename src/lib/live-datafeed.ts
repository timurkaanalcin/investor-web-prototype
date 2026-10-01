/**
 * TradingView-style custom datafeed (getBars / subscribeBars) backed by
 * HRAM Yahoo PHP proxies. Used by LiveTradingChart — not the official TV embed.
 */

export type Bar = {
  time: number; // unix seconds
  open: number;
  high: number;
  low: number;
  close: number;
};

export type QuoteTick = {
  price: number;
  ts: number;
};

type Sub = {
  symbol: string;
  yahoo: string;
  resolution: string;
  onTick: (bar: Bar) => void;
  lastBar: Bar | null;
  timer: number | null;
  quoteTimer: number | null;
};

const subs = new Map<string, Sub>();

function stepSec(resolution: string): number {
  switch (resolution) {
    case "1":
    case "1m":
      return 60;
    case "5":
    case "5m":
      return 300;
    case "15":
    case "15m":
      return 900;
    case "60":
    case "1h":
      return 3600;
    case "240":
    case "4h":
      return 14400;
    case "D":
    case "1D":
      return 86400;
    case "W":
      return 604800;
    default:
      return 300;
  }
}

export function alignBarTime(unixSec: number, resolution: string): number {
  if (resolution === "D" || resolution === "1D" || resolution === "W") return unixSec;
  const step = stepSec(resolution);
  return Math.floor(unixSec / step) * step;
}

function uid(symbol: string, resolution: string, listenerGuid: string) {
  return `${symbol}|${resolution}|${listenerGuid}`;
}

export async function getBars(
  symbol: string,
  yahoo: string,
  resolution: string
): Promise<{ bars: Bar[]; price?: number; error?: string }> {
  try {
    const qs = new URLSearchParams({
      symbol,
      yahoo,
      interval: resolution,
    });
    const res = await fetch(`/api/ohlc.php?${qs.toString()}`, { cache: "no-store" });
    if (!res.ok) return { bars: [], error: `HTTP ${res.status}` };
    const data = await res.json();
    const bars: Bar[] = (data.candles || [])
      .map((c: Bar) => ({
        time: alignBarTime(c.time, resolution),
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      }))
      .filter(
        (b: Bar) =>
          Number.isFinite(b.open) &&
          Number.isFinite(b.high) &&
          Number.isFinite(b.low) &&
          Number.isFinite(b.close)
      );
    // Dedupe aligned times
    const map = new Map<number, Bar>();
    for (const b of bars) {
      const prev = map.get(b.time);
      if (!prev) map.set(b.time, b);
      else {
        map.set(b.time, {
          time: b.time,
          open: prev.open,
          high: Math.max(prev.high, b.high),
          low: Math.min(prev.low, b.low),
          close: b.close,
        });
      }
    }
    const sorted = Array.from(map.values()).sort((a, b) => a.time - b.time);
    return {
      bars: sorted,
      price:
        typeof data.price === "number" && data.price > 0 ? data.price : undefined,
    };
  } catch (e) {
    return { bars: [], error: e instanceof Error ? e.message : "ohlc failed" };
  }
}

async function fetchQuote(symbol: string, yahoo: string): Promise<QuoteTick | null> {
  try {
    const qs = new URLSearchParams({ symbol, yahoo });
    const res = await fetch(`/api/quote.php?${qs.toString()}`, { cache: "no-store" });
    if (!res.ok) return null;
    const data = await res.json();
    const price = Number(data.price);
    if (!Number.isFinite(price) || price <= 0) return null;
    return { price, ts: Number(data.ts) || Date.now() };
  } catch {
    return null;
  }
}

function applyMid(sub: Sub, mid: number) {
  if (!Number.isFinite(mid) || mid <= 0) return;
  const nowSec = Math.floor(Date.now() / 1000);
  let t = alignBarTime(nowSec, sub.resolution);
  const prev = sub.lastBar;
  if (prev && t < prev.time) t = prev.time;

  let next: Bar;
  if (!prev || prev.time !== t) {
    const open = prev && prev.time < t ? prev.close : mid;
    next = {
      time: t,
      open,
      high: Math.max(open, mid),
      low: Math.min(open, mid),
      close: mid,
    };
  } else {
    next = {
      time: t,
      open: prev.open,
      high: Math.max(prev.high, mid),
      low: Math.min(prev.low, mid),
      close: mid,
    };
  }
  sub.lastBar = next;
  sub.onTick(next);
}

/**
 * subscribeBars — polls Yahoo quote ≤1s and emits forming-bar updates.
 * Mirrors TradingView Charting Library custom datafeed streaming contract.
 */
export function subscribeBars(
  symbol: string,
  yahoo: string,
  resolution: string,
  onTick: (bar: Bar) => void,
  listenerGuid: string,
  seedBar?: Bar | null
): void {
  const key = uid(symbol, resolution, listenerGuid);
  unsubscribeBars(listenerGuid, symbol, resolution);

  const sub: Sub = {
    symbol,
    yahoo,
    resolution,
    onTick,
    lastBar: seedBar ?? null,
    timer: null,
    quoteTimer: null,
  };
  subs.set(key, sub);

  const pullQuote = async () => {
    const q = await fetchQuote(symbol, yahoo);
    if (!q) return;
    applyMid(sub, q.price);
  };

  pullQuote();
  sub.quoteTimer = window.setInterval(pullQuote, 800);

  // Soft history refresh so new closed bars appear without full remount
  sub.timer = window.setInterval(async () => {
    const { bars, price } = await getBars(symbol, yahoo, resolution);
    if (!bars.length) return;
    const last = bars[bars.length - 1];
    const mid = price ?? sub.lastBar?.close;
    if (mid != null && mid > 0) {
      const t = alignBarTime(Math.floor(Date.now() / 1000), resolution);
      const useT = Math.max(t, last.time);
      if (useT === last.time) {
        sub.lastBar = {
          time: last.time,
          open: last.open,
          high: Math.max(last.high, mid),
          low: Math.min(last.low, mid),
          close: mid,
        };
      } else {
        sub.lastBar = {
          time: useT,
          open: last.close,
          high: Math.max(last.close, mid),
          low: Math.min(last.close, mid),
          close: mid,
        };
      }
      // Notify with forming bar only — full setData is chart owner's job on interval change
      if (sub.lastBar) sub.onTick(sub.lastBar);
    }
  }, 30000);
}

export function unsubscribeBars(
  listenerGuid: string,
  symbol?: string,
  resolution?: string
): void {
  for (const [key, sub] of Array.from(subs.entries())) {
    // key format: symbol|resolution|guid
    const parts = key.split("|");
    const guid = parts[parts.length - 1];
    if (guid !== listenerGuid) continue;
    if (symbol && parts[0] !== symbol) continue;
    if (resolution && parts[1] !== resolution) continue;
    if (sub.timer != null) window.clearInterval(sub.timer);
    if (sub.quoteTimer != null) window.clearInterval(sub.quoteTimer);
    subs.delete(key);
  }
}
