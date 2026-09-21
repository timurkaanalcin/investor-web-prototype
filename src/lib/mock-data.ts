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

export type TradeInstrument = {
  symbol: string;
  name: string;
  type: "stock" | "etf";
  price: number;
  changePct: number;
  popular?: boolean;
};

export type TradePosition = {
  symbol: string;
  shares: number;
  avgCost: number;
  /** current market value in USD */
  value: number;
  plPct: number;
  plUsd: number;
};

export const USD_TRY = 34.2;

export const TRADE_INSTRUMENTS: TradeInstrument[] = [
  { symbol: "AAPL", name: "Apple Inc.", type: "stock", price: 227.52, changePct: 0.84, popular: true },
  { symbol: "MSFT", name: "Microsoft Corp.", type: "stock", price: 428.15, changePct: 0.42, popular: true },
  { symbol: "GOOGL", name: "Alphabet Inc.", type: "stock", price: 165.38, changePct: -0.31, popular: true },
  { symbol: "AMZN", name: "Amazon.com Inc.", type: "stock", price: 186.74, changePct: 1.12, popular: true },
  { symbol: "TSLA", name: "Tesla Inc.", type: "stock", price: 248.98, changePct: -1.85, popular: true },
  { symbol: "NVDA", name: "NVIDIA Corp.", type: "stock", price: 119.67, changePct: 2.14, popular: true },
  { symbol: "META", name: "Meta Platforms", type: "stock", price: 572.4, changePct: 0.56 },
  { symbol: "VOO", name: "Vanguard S&P 500 ETF", type: "etf", price: 518.22, changePct: 0.38, popular: true },
  { symbol: "QQQ", name: "Invesco QQQ Trust", type: "etf", price: 482.91, changePct: 0.71, popular: true },
  { symbol: "SPY", name: "SPDR S&P 500 ETF", type: "etf", price: 562.15, changePct: 0.35, popular: true },
  { symbol: "VTI", name: "Vanguard Total Stock", type: "etf", price: 278.44, changePct: 0.29 },
  { symbol: "BND", name: "Vanguard Total Bond", type: "etf", price: 74.12, changePct: -0.08 },
  { symbol: "ARKK", name: "ARK Innovation ETF", type: "etf", price: 48.65, changePct: 1.92 },
  { symbol: "IWM", name: "iShares Russell 2000", type: "etf", price: 221.3, changePct: -0.45 },
];

export const TRADE_WATCHLIST = ["AAPL", "NVDA", "VOO", "TSLA", "QQQ"];

export const TRADE_POSITIONS: TradePosition[] = [
  {
    symbol: "AAPL",
    shares: 12.45,
    avgCost: 198.2,
    value: 2832.62,
    plPct: 14.79,
    plUsd: 365.04,
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
    symbol: "NVDA",
    shares: 8.0,
    avgCost: 105.5,
    value: 957.36,
    plPct: 13.43,
    plUsd: 113.36,
  },
];

export const TRADE_CASH_USD = 4250.0;

export function formatUSD(n: number, digits = 2): string {
  return (
    "$" +
    n.toLocaleString("en-US", {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    })
  );
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
