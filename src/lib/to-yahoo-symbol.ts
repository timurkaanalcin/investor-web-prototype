import type { TradeInstrument } from "@/lib/trade-instruments";

/** Explicit Yahoo Finance tickers for common terminal symbols. */
const YAHOO_MAP: Record<string, string> = {
  BTCUSD: "BTC-USD",
  ETHUSD: "ETH-USD",
  SOLUSD: "SOL-USD",
  XRPUSD: "XRP-USD",
  BNBUSD: "BNB-USD",
  ADAUSD: "ADA-USD",
  DOGEUSD: "DOGE-USD",
  AVAXUSD: "AVAX-USD",
  DOTUSD: "DOT-USD",
  LINKUSD: "LINK-USD",
  MATICUSD: "MATIC-USD",
  LTCUSD: "LTC-USD",
  TRXUSD: "TRX-USD",
  BCHUSD: "BCH-USD",
  XLMUSD: "XLM-USD",
  ATOMUSD: "ATOM-USD",
  UNIUSD: "UNI-USD",
  NEARUSD: "NEAR-USD",
  APTUSD: "APT-USD",
  ARBUSD: "ARB-USD",
  OPUSD: "OP-USD",
  FILUSD: "FIL-USD",
  ETCUSD: "ETC-USD",
  ICPUSD: "ICP-USD",
  SUIUSD: "SUI-USD",
  ALGOUSD: "ALGO-USD",
  EOSUSD: "EOS-USD",
  PEPEUSD: "PEPE-USD",
  SHIBUSD: "SHIB-USD",
  INJUSD: "INJ-USD",
  AAVEUSD: "AAVE-USD",
  XAUUSD: "GC=F",
  XAGUSD: "SI=F",
  USOIL: "CL=F",
  UKOIL: "BZ=F",
  NATGAS: "NG=F",
  EURUSD: "EURUSD=X",
  GBPUSD: "GBPUSD=X",
  USDJPY: "USDJPY=X",
  AUDUSD: "AUDUSD=X",
  USDCAD: "USDCAD=X",
  USDCHF: "USDCHF=X",
  NZDUSD: "NZDUSD=X",
  EURGBP: "EURGBP=X",
  EURJPY: "EURJPY=X",
  USDTRY: "TRY=X",
  EURTRY: "EURTRY=X",
  GBPTRY: "GBPTRY=X",
};

/**
 * Map a TradeInstrument to a Yahoo Finance chart ticker.
 * Used by /api/quote.php live feed so header/özet/Al/Sat match real market.
 */
export function toYahooSymbol(
  instrument: Pick<TradeInstrument, "symbol" | "exchange" | "type">
): string {
  const sym = instrument.symbol.toUpperCase();
  if (YAHOO_MAP[sym]) return YAHOO_MAP[sym];

  if (instrument.type === "crypto") {
    if (sym.endsWith("USD") && sym.length > 3) return `${sym.slice(0, -3)}-USD`;
    return `${sym}-USD`;
  }

  if (instrument.type === "fx" || instrument.exchange === "FX") {
    if (/^[A-Z]{6}$/.test(sym)) return `${sym}=X`;
    return sym;
  }

  if (instrument.exchange === "BIST") return `${sym}.IS`;
  if (instrument.exchange === "LSE") return `${sym}.L`;
  if (instrument.exchange === "XETRA") return `${sym}.DE`;
  if (instrument.exchange === "EPA") return `${sym}.PA`;
  if (instrument.exchange === "MOEX") return `${sym}.ME`;

  return sym;
}

export { YAHOO_MAP };
