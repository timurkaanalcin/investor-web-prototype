/**
 * Deterministic synthetic OHLCV / price series for static Trade charts.
 * No network — seeded from instrument symbol + last price + day change.
 */

export type ChartRange = "1G" | "1H" | "1A" | "3A" | "1Y" | "Tümü";

export const CHART_RANGES: ChartRange[] = ["1G", "1H", "1A", "3A", "1Y", "Tümü"];

export type PricePoint = {
  t: number; // unix ms
  price: number;
  label: string;
};

export type DayStats = {
  open: number;
  high: number;
  low: number;
  volume: number;
  prevClose: number;
  change: number;
  changePct: number;
};

/** Simple string hash → uint32 */
function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Mulberry32 PRNG */
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

/**
 * Generate an intraday (1G) series ending at `lastPrice`, with day change matching changePct.
 */
function generateIntraday(
  symbol: string,
  lastPrice: number,
  changePct: number,
  bars = 78 // ~5-min bars in a US session
): PricePoint[] {
  const rng = mulberry32(hashStr(symbol + ":1G"));
  const prevClose = lastPrice / (1 + changePct / 100);
  const openJitter = (rng() - 0.5) * 0.004 * prevClose;
  let price = prevClose + openJitter;

  // US market mock: 09:30 ET — use a fixed "today" noon UTC+3 equivalent for labels
  const now = Date.now();
  const sessionStart = now - bars * 5 * 60 * 1000;
  const points: PricePoint[] = [];
  const target = lastPrice;

  for (let i = 0; i < bars; i++) {
    const progress = i / (bars - 1);
    // Pull toward target path + noise
    const drift = (target - price) * (0.08 + progress * 0.12);
    const noise = (rng() - 0.5) * lastPrice * 0.0022;
    price = Math.max(0.01, price + drift + noise);
    const t = sessionStart + i * 5 * 60 * 1000;
    const d = new Date(t);
    const label = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
    points.push({ t, price: roundPrice(price), label });
  }
  // Force last bar to exact lastPrice
  points[points.length - 1].price = roundPrice(lastPrice);
  return points;
}

function generateDaily(
  symbol: string,
  lastPrice: number,
  changePct: number,
  days: number,
  rangeKey: string
): PricePoint[] {
  const rng = mulberry32(hashStr(symbol + ":" + rangeKey));
  const points: PricePoint[] = [];
  // Walk backwards from lastPrice with reverse random walk, then reverse
  const vols =
    rangeKey === "1H"
      ? 0.012
      : rangeKey === "1A"
        ? 0.018
        : rangeKey === "3A"
          ? 0.022
          : rangeKey === "1Y"
            ? 0.025
            : 0.028;

  let price = lastPrice;
  const raw: number[] = [price];
  for (let i = 1; i < days; i++) {
    const shock = (rng() - 0.48) * vols; // slight upward bias
    price = Math.max(0.01, price / (1 + shock));
    raw.push(price);
  }
  raw.reverse();
  // Nudge so day-over-day change near end roughly matches changePct
  const scale =
    lastPrice / (raw[raw.length - 1] || lastPrice);
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  for (let i = 0; i < raw.length; i++) {
    const t = now - (raw.length - 1 - i) * dayMs;
    const d = new Date(t);
    const label =
      days <= 35
        ? `${d.getDate()} ${d.toLocaleString("tr-TR", { month: "short" })}`
        : days <= 100
          ? d.toLocaleString("tr-TR", { month: "short" })
          : `${d.toLocaleString("tr-TR", { month: "short" })} ${String(d.getFullYear()).slice(2)}`;
    points.push({
      t,
      price: roundPrice(raw[i] * scale),
      label,
    });
  }
  points[points.length - 1].price = roundPrice(lastPrice);
  // Soft-align previous close of last day via changePct (cosmetic)
  void changePct;
  return points;
}

function roundPrice(n: number): number {
  if (n >= 100) return Math.round(n * 100) / 100;
  if (n >= 10) return Math.round(n * 1000) / 1000;
  return Math.round(n * 10000) / 10000;
}

export function getSeriesForRange(
  symbol: string,
  lastPrice: number,
  changePct: number,
  range: ChartRange
): PricePoint[] {
  switch (range) {
    case "1G":
      return generateIntraday(symbol, lastPrice, changePct);
    case "1H":
      return generateDaily(symbol, lastPrice, changePct, 22, "1H");
    case "1A":
      return generateDaily(symbol, lastPrice, changePct, 30, "1A");
    case "3A":
      return generateDaily(symbol, lastPrice, changePct, 66, "3A");
    case "1Y":
      return generateDaily(symbol, lastPrice, changePct, 252, "1Y");
    case "Tümü":
      return generateDaily(symbol, lastPrice, changePct, 504, "Tümü");
    default:
      return generateIntraday(symbol, lastPrice, changePct);
  }
}

/** Compact sparkline series (≈24 points) for list rows */
export function getSparkline(
  symbol: string,
  lastPrice: number,
  changePct: number
): number[] {
  const series = generateIntraday(symbol, lastPrice, changePct, 24);
  return series.map((p) => p.price);
}

export function getDayStats(
  symbol: string,
  lastPrice: number,
  changePct: number
): DayStats {
  const series = generateIntraday(symbol, lastPrice, changePct);
  const prices = series.map((p) => p.price);
  const prevClose = lastPrice / (1 + changePct / 100);
  const open = series[0]?.price ?? prevClose;
  const high = Math.max(...prices, lastPrice);
  const low = Math.min(...prices, lastPrice);
  const rng = mulberry32(hashStr(symbol + ":vol"));
  // Mock volume: stocks ~millions, ETFs vary
  const base = lastPrice > 200 ? 18e6 : lastPrice > 50 ? 42e6 : 8e6;
  const volume = Math.round(base * (0.55 + rng() * 0.9));
  const change = lastPrice - prevClose;
  return {
    open: roundPrice(open),
    high: roundPrice(high),
    low: roundPrice(low),
    volume,
    prevClose: roundPrice(prevClose),
    change: roundPrice(change),
    changePct,
  };
}

/** Mock US equity hours (ET): Mon–Fri 09:30–16:00. Uses local clock for display. */
export function getMarketStatus(now = new Date()): {
  open: boolean;
  label: string;
  clock: string;
} {
  // Convert to America/New_York-ish via fixed offset approximation for prototype:
  // Display local time (Europe/Kiev) but decide open/closed with ET weekday hours.
  // Use UTC and subtract 4h (EDT) for a stable mock.
  const etMs = now.getTime() - 4 * 60 * 60 * 1000;
  const et = new Date(etMs);
  const day = et.getUTCDay(); // 0 Sun … 6 Sat
  const mins = et.getUTCHours() * 60 + et.getUTCMinutes();
  const openMins = 9 * 60 + 30;
  const closeMins = 16 * 60;
  const weekday = day >= 1 && day <= 5;
  const open = weekday && mins >= openMins && mins < closeMins;

  const clock = now.toLocaleTimeString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (!weekday) {
    return { open: false, label: "Kapalı", clock };
  }
  if (open) {
    return { open: true, label: "Piyasa açık", clock };
  }
  if (mins < openMins) {
    return { open: false, label: "Kapalı · açılış 16:30", clock };
  }
  return { open: false, label: "Kapalı", clock };
}

export function formatVolume(n: number): string {
  if (n >= 1e9) return `${(n / 1e9).toLocaleString("tr-TR", { maximumFractionDigits: 2 })}B`;
  if (n >= 1e6) return `${(n / 1e6).toLocaleString("tr-TR", { maximumFractionDigits: 2 })}M`;
  if (n >= 1e3) return `${(n / 1e3).toLocaleString("tr-TR", { maximumFractionDigits: 1 })}K`;
  return n.toLocaleString("tr-TR");
}
