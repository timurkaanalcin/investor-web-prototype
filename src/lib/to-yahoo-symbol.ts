import type { TradeInstrument } from "@/lib/trade-instruments";

/** Explicit Yahoo Finance tickers for common terminal symbols. */
const YAHOO_MAP: Record<string, string> = {
  // Crypto (Yahoo CRYPTOCURRENCY tickers — some use numeric CoinMarketCap ids)
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
  MATICUSD: "POL28321-USD", // Polygon rebrand; MATIC-USD delisted on Yahoo
  POLUSD: "POL28321-USD",
  LTCUSD: "LTC-USD",
  TRXUSD: "TRX-USD",
  BCHUSD: "BCH-USD",
  XLMUSD: "XLM-USD",
  ATOMUSD: "ATOM-USD",
  UNIUSD: "UNI7083-USD",
  NEARUSD: "NEAR-USD",
  APTUSD: "APT21794-USD",
  ARBUSD: "ARB11841-USD",
  OPUSD: "OP-USD",
  FILUSD: "FIL-USD",
  ETCUSD: "ETC-USD",
  ICPUSD: "ICP-USD",
  SUIUSD: "SUI20947-USD",
  ALGOUSD: "ALGO-USD",
  EOSUSD: "EOS-USD",
  PEPEUSD: "PEPE24478-USD",
  SHIBUSD: "SHIB-USD",
  INJUSD: "INJ-USD",
  AAVEUSD: "AAVE-USD",
  MKRUSD: "MKR-USD",
  KASUSD: "KAS-USD",
  RUNEUSD: "RUNE-USD",
  TONUSD: "TON11419-USD",
  RENDERUSD: "RENDER-USD",
  SEIUSD: "SEI-USD",
  TIAUSD: "TIA-USD",
  HBARUSD: "HBAR-USD",
  WLDUSD: "WLD-USD",
  BONKUSD: "BONK-USD",
  WIFUSD: "WIF-USD",
  // Commodities (CME/NYMEX/CBOT/ICE futures)
  XAUUSD: "GC=F",
  XAGUSD: "SI=F",
  XPTUSD: "PL=F",
  XPDUSD: "PA=F",
  PLATINUM: "PL=F",
  PALLADIUM: "PA=F",
  USOIL: "CL=F",
  WTIUSD: "CL=F",
  UKOIL: "BZ=F",
  NATGAS: "NG=F",
  COPPER: "HG=F",
  ALUMINUM: "ALI=F",
  CORN: "ZC=F",
  WHEAT: "ZW=F",
  SOYBEAN: "ZS=F",
  COFFEE: "KC=F",
  SUGAR: "SB=F",
  COCOA: "CC=F",
  COTTON: "CT=F",
  HEATOIL: "HO=F",
  GASOLINE: "RB=F",
  RICE: "ZR=F",
  // FX
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
