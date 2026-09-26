import type { TradeExchange, TradeInstrument } from "@/lib/trade-instruments";

/** Known ticker → TradingView EXCHANGE:SYMBOL overrides (ETFs, aliases). */
const SYMBOL_OVERRIDES: Record<string, string> = {
  // US ETFs commonly listed on AMEX/ARCA on TradingView
  VOO: "AMEX:VOO",
  SPY: "AMEX:SPY",
  IVV: "AMEX:IVV",
  VTI: "AMEX:VTI",
  VEA: "AMEX:VEA",
  VWO: "AMEX:VWO",
  VT: "AMEX:VT",
  VXUS: "AMEX:VXUS",
  VIG: "AMEX:VIG",
  BND: "AMEX:BND",
  AGG: "AMEX:AGG",
  GLD: "AMEX:GLD",
  SLV: "AMEX:SLV",
  DIA: "AMEX:DIA",
  IWM: "AMEX:IWM",
  EEM: "AMEX:EEM",
  EFA: "AMEX:EFA",
  IEFA: "AMEX:IEFA",
  IEMG: "AMEX:IEMG",
  SCHD: "AMEX:SCHD",
  TLT: "NASDAQ:TLT",
  QQQ: "NASDAQ:QQQ",
  QYLD: "NASDAQ:QYLD",
  ARKK: "AMEX:ARKK",
  SMH: "AMEX:SMH",
  JEPI: "AMEX:JEPI",
  XLE: "AMEX:XLE",
  XLF: "AMEX:XLF",
  XLK: "AMEX:XLK",
  XLV: "AMEX:XLV",
};

/** Investor exchange → TradingView prefix */
const EXCHANGE_PREFIX: Record<TradeExchange, string> = {
  BIST: "BIST",
  MOEX: "MOEX",
  NASDAQ: "NASDAQ",
  NYSE: "NYSE",
  XETRA: "XETR",
  EPA: "EURONEXT",
  LSE: "LSE",
  OTHER: "NASDAQ",
};

/**
 * Map an Investor TradeInstrument to a TradingView Advanced Chart symbol.
 * Format: EXCHANGE:TICKER (e.g. BIST:THYAO, MOEX:SBER, NASDAQ:AAPL).
 */
export function toTradingViewSymbol(
  instrument: Pick<TradeInstrument, "symbol" | "exchange" | "type">
): string {
  const sym = instrument.symbol.toUpperCase();
  if (SYMBOL_OVERRIDES[sym]) return SYMBOL_OVERRIDES[sym];
  const prefix = EXCHANGE_PREFIX[instrument.exchange] ?? "NASDAQ";
  return `${prefix}:${sym}`;
}

export { SYMBOL_OVERRIDES, EXCHANGE_PREFIX };
