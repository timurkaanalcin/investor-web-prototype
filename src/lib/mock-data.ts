import type { TradeCurrency, TradeInstrument } from "./trade-instruments";
import { TRADE_INSTRUMENTS } from "./trade-instruments";

export const USER = {
  name: "Ayşe Yılmaz",
  initials: "AY",
  tier: "Standart",
};

export const TOTAL_BALANCE = 248450;
export const MONTHLY_GAIN = 3240;

export const CHART_POINTS = [
  { label: "May 1", value: 228000 },
  { label: "May 8", value: 232500 },
  { label: "May 15", value: 236000 },
  { label: "May 22", value: 241200 },
  { label: "May 29", value: 248450 },
];

export const DASHBOARD_GOALS = [
  {
    id: "emeklilik",
    title: "Emeklilik",
    icon: "umbrella",
    target: 400000,
    current: 248000,
    pct: 62,
  },
  {
    id: "acil",
    title: "Acil fon",
    icon: "shield",
    target: 100000,
    current: 40000,
    pct: 40,
  },
];

export const GOALS = [
  {
    id: "acil",
    title: "Acil fon",
    target: 50000,
    current: 20000,
    pct: 40,
    eta: "Haziran 2027",
    featured: true,
  },
  {
    id: "tatil",
    title: "Tatil",
    target: 15000,
    current: 8200,
    pct: 55,
    icon: "palm",
  },
  {
    id: "ev",
    title: "Ev peşinatı",
    target: 200000,
    current: 45000,
    pct: 23,
    icon: "home",
  },
];

export const HOLDINGS = [
  {
    id: "vti",
    name: "VTI benzeri",
    subtitle: "Global hisse",
    value: 174000,
    change: 1.24,
    icon: "globe",
  },
  {
    id: "bond",
    name: "Tahvil",
    subtitle: "Sabit getirili",
    value: 49600,
    change: -0.18,
    icon: "chart",
  },
  {
    id: "cash",
    name: "Nakit",
    subtitle: "Likit",
    value: 24850,
    change: 0.03,
    icon: "wallet",
  },
];

export const ALLOCATION = [
  { label: "Hisse ETF", pct: 70, color: "#000b50" },
  { label: "Tahvil ETF", pct: 20, color: "#1d6ae5" },
  { label: "Nakit", pct: 10, color: "#9ec9ff" },
];

export const RECOMMENDED = [
  { label: "Hisse", pct: 70, color: "#000b50" },
  { label: "Tahvil", pct: 20, color: "#1d6ae5" },
  { label: "Nakit", pct: 10, color: "#f9f0e2" },
];

export const AUTO_CONTRIBUTION = 2500;

export function formatTRY(n: number): string {
  return (
    "₺" +
    n.toLocaleString("tr-TR", {
      maximumFractionDigits: 0,
    })
  );
}

export function formatPct(n: number): string {
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toLocaleString("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}%`;
}

/* ─── Self-directed trading (mock) ─── */

export type {
  TradeCurrency,
  TradeExchange,
  TradeInstrument,
} from "./trade-instruments";
export { TRADE_INSTRUMENTS, TRADE_INSTRUMENT_COUNT } from "./trade-instruments";

export type TradePosition = {
  symbol: string;
  shares: number;
  avgCost: number;
  /** current market value in instrument currency */
  value: number;
  plPct: number;
  /** P/L in instrument currency (field name historical) */
  plUsd: number;
};

/** Mock FX: 1 USD = X quote currency */
export const USD_TRY = 34.2;
export const USD_RUB = 92.5;
export const USD_EUR = 0.92;
export const USD_GBP = 0.78;

export const FX_USD: Record<TradeCurrency, number> = {
  USD: 1,
  TRY: USD_TRY,
  RUB: USD_RUB,
  EUR: USD_EUR,
  GBP: USD_GBP,
};

export const TRADE_WATCHLIST = [
  "THYAO",
  "GARAN",
  "AAPL",
  "NVDA",
  "VOO",
  "SBER",
  "TSLA",
  "QQQ",
];

export const TRADE_POSITIONS: TradePosition[] = [
  {
    symbol: "AMZN",
    shares: 21.76,
    avgCost: 168.4,
    value: 4063.46,
    plPct: 10.95,
    plUsd: 399.06,
  },
  {
    symbol: "AAPL",
    shares: 12.45,
    avgCost: 198.2,
    value: 2832.62,
    plPct: 14.79,
    plUsd: 365.04,
  },
  {
    symbol: "NVDA",
    shares: 8.0,
    avgCost: 105.5,
    value: 957.36,
    plPct: 13.43,
    plUsd: 113.36,
  },
  {
    symbol: "VOO",
    shares: 4.2,
    avgCost: 490.1,
    value: 2176.52,
    plPct: 5.74,
    plUsd: 118.1,
  },
  {
    symbol: "THYAO",
    shares: 45.0,
    avgCost: 285.0,
    value: 14062.5,
    plPct: 9.65,
    plUsd: 1237.5,
  },
  {
    symbol: "GARAN",
    shares: 120.0,
    avgCost: 105.0,
    value: 14208.0,
    plPct: 12.76,
    plUsd: 1608.0,
  },
];

export const TRADE_CASH_USD = 4250.0;

const MONEY_LOCALE: Record<TradeCurrency, string> = {
  USD: "en-US",
  TRY: "tr-TR",
  RUB: "ru-RU",
  EUR: "de-DE",
  GBP: "en-GB",
};

const MONEY_SYMBOL: Record<TradeCurrency, string> = {
  USD: "$",
  TRY: "₺",
  RUB: "₽",
  EUR: "€",
  GBP: "£",
};

export function formatUSD(n: number, digits = 2): string {
  return formatMoney(n, "USD", digits);
}

export function formatMoney(
  n: number,
  currency: TradeCurrency = "USD",
  digits = 2
): string {
  const sym = MONEY_SYMBOL[currency] ?? "$";
  const loc = MONEY_LOCALE[currency] ?? "en-US";
  return (
    sym +
    n.toLocaleString(loc, {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    })
  );
}

/** Convert amount in `from` currency to USD */
export function toUSD(amount: number, currency: TradeCurrency): number {
  const rate = FX_USD[currency] || 1;
  return amount / rate;
}

/** Convert USD cash to instrument currency for available buying power */
export function cashInCurrency(currency: TradeCurrency): number {
  return TRADE_CASH_USD * (FX_USD[currency] || 1);
}

/** Position market value expressed in USD (for portfolio totals) */
export function positionValueUSD(p: TradePosition): number {
  const inst = getInstrument(p.symbol);
  const ccy = inst?.currency ?? "USD";
  return toUSD(p.value, ccy);
}

export function positionPlUSD(p: TradePosition): number {
  const inst = getInstrument(p.symbol);
  const ccy = inst?.currency ?? "USD";
  return toUSD(p.plUsd, ccy);
}

export function formatShares(n: number): string {
  return n.toLocaleString("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  });
}

export function getInstrument(symbol: string): TradeInstrument | undefined {
  return TRADE_INSTRUMENTS.find(
    (i) => i.symbol.toUpperCase() === symbol.toUpperCase()
  );
}

export function getPosition(symbol: string): TradePosition | undefined {
  return TRADE_POSITIONS.find(
    (p) => p.symbol.toUpperCase() === symbol.toUpperCase()
  );
}

/** Mock tax impact for a sell order (short/long-term + wash sale) */
export function estimateTaxImpact(
  symbol: string,
  sellShares: number
): {
  costBasis: number;
  proceeds: number;
  gain: number;
  estimatedTax: number;
  estimatedTaxSaved: number;
  shortTermGain: number;
  longTermGain: number;
  shortTermTax: number;
  longTermTax: number;
  washSaleRisk: boolean;
} {
  const pos = getPosition(symbol);
  const inst = getInstrument(symbol);
  const price = inst?.price ?? 100;
  const avg = pos?.avgCost ?? price * 0.9;
  const shares = Math.min(sellShares, pos?.shares ?? sellShares);
  const costBasis = avg * shares;
  const proceeds = price * shares;
  const gain = proceeds - costBasis;
  // Mock lot split: ~35% short-term, 65% long-term
  const shortTermGain = gain * 0.35;
  const longTermGain = gain * 0.65;
  const shortTermTax = Math.max(0, shortTermGain * 0.24);
  const longTermTax = Math.max(0, longTermGain * 0.15);
  const estimatedTax = shortTermTax + longTermTax;
  // "Saved" vs ordinary income rate if harvesting losses
  const estimatedTaxSaved =
    gain < 0 ? Math.abs(gain) * 0.24 : Math.max(0, shortTermGain * 0.09);
  const washSaleRisk = symbol.toUpperCase() === "NVDA" && gain < 0;
  return {
    costBasis,
    proceeds,
    gain,
    estimatedTax,
    estimatedTaxSaved,
    shortTermGain,
    longTermGain,
    shortTermTax,
    longTermTax,
    washSaleRisk,
  };
}
