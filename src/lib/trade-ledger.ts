/**
 * Client-side open-positions ledger (localStorage).
 * Seeds from TRADE_POSITIONS once; buys/sells/closes mutate ledger + TRY balance.
 */
import {
  TRADE_POSITIONS,
  convertMoney,
  formatMoney,
  getInstrument,
  type TradeCurrency,
  type TradePosition,
} from "./mock-data";
import {
  adjustBalanceDelta,
  getDisplayBalance,
  pushNotification,
} from "./money-requests";
import { appendTransaction } from "./storage";

const POSITIONS_KEY = "hram_open_positions_v1";
const SEEDED_KEY = "hram_positions_seeded_v1";
const POSITIONS_EVENT = "hram-positions-updated";

export type LedgerPosition = TradePosition & {
  /**
   * Shares whose buy cost was deducted from the TRY wallet via the ledger.
   * Seeded mock positions start at 0 — close/sell only applies realized P&L.
   * Ledger buys increase this; sells decrease it.
   */
  fundedShares?: number;
};

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function emitPositionsEvent(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(POSITIONS_EVENT));
}

function savePositions(list: LedgerPosition[]): void {
  localStorage.setItem(POSITIONS_KEY, JSON.stringify(list));
  emitPositionsEvent();
}

function refreshMark(p: LedgerPosition): LedgerPosition {
  const inst = getInstrument(p.symbol);
  const price = inst?.price ?? p.avgCost;
  const value = price * p.shares;
  const cost = p.avgCost * p.shares;
  const plUsd = value - cost;
  const plPct = cost > 0 ? (plUsd / cost) * 100 : 0;
  return {
    ...p,
    value: +value.toFixed(4),
    plUsd: +plUsd.toFixed(4),
    plPct: +plPct.toFixed(4),
    fundedShares: p.fundedShares ?? 0,
  };
}

export function ensurePositionsSeeded(): void {
  if (typeof window === "undefined") return;
  if (localStorage.getItem(SEEDED_KEY) === "1") return;
  const seeded: LedgerPosition[] = TRADE_POSITIONS.map((p) =>
    refreshMark({ ...p, fundedShares: 0 }),
  );
  localStorage.setItem(POSITIONS_KEY, JSON.stringify(seeded));
  localStorage.setItem(SEEDED_KEY, "1");
}

export function getOpenPositions(): LedgerPosition[] {
  if (typeof window === "undefined") return TRADE_POSITIONS.map((p) => ({ ...p, fundedShares: 0 }));
  ensurePositionsSeeded();
  const list = safeParse<LedgerPosition[]>(
    localStorage.getItem(POSITIONS_KEY),
    [],
  );
  if (!Array.isArray(list)) return [];
  return list.map(refreshMark);
}

export function getOpenPosition(symbol: string): LedgerPosition | undefined {
  const up = symbol.toUpperCase();
  return getOpenPositions().find((p) => p.symbol.toUpperCase() === up);
}

export function subscribePositions(cb: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  ensurePositionsSeeded();
  const handler = () => cb();
  window.addEventListener(POSITIONS_EVENT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(POSITIONS_EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}

function instrumentCurrency(symbol: string): TradeCurrency {
  return (getInstrument(symbol)?.currency ?? "USD") as TradeCurrency;
}

/** Credit wallet for a sell/close: proceeds for funded shares, P&L only for unfunded. */
function applySellBalanceDelta(
  pos: LedgerPosition,
  shares: number,
  exitPrice: number,
  currency: TradeCurrency,
): { balanceDeltaTry: number; plInstrument: number; plTry: number; proceedsTry: number } {
  const plInstrument = (exitPrice - pos.avgCost) * shares;
  const plTry = convertMoney(plInstrument, currency, "TRY");
  const proceeds = exitPrice * shares;
  const proceedsTry = convertMoney(proceeds, currency, "TRY");

  const fundedAvail = Math.max(0, pos.fundedShares ?? 0);
  const fundedPart = Math.min(shares, fundedAvail);
  const unfundedPart = shares - fundedPart;

  const fundedProceedsTry = convertMoney(exitPrice * fundedPart, currency, "TRY");
  const unfundedPlTry = convertMoney(
    (exitPrice - pos.avgCost) * unfundedPart,
    currency,
    "TRY",
  );
  const balanceDeltaTry = fundedProceedsTry + unfundedPlTry;
  adjustBalanceDelta(balanceDeltaTry);

  return { balanceDeltaTry, plInstrument, plTry, proceedsTry };
}

function plSubtitle(plTry: number): string {
  const abs = formatMoney(Math.abs(plTry), "TRY");
  return plTry >= 0 ? `Kâr ${abs}` : `Zarar ${abs}`;
}

export type CloseResult = {
  ok: boolean;
  plInstrument: number;
  plTry: number;
  currency: TradeCurrency;
  shares: number;
  exitPrice: number;
  error?: string;
};

export function closeOpenPosition(
  symbol: string,
  opts?: { exitPrice?: number },
): CloseResult {
  if (typeof window === "undefined") {
    return {
      ok: false,
      plInstrument: 0,
      plTry: 0,
      currency: "USD",
      shares: 0,
      exitPrice: 0,
      error: "Sunucu tarafında kapatılamaz",
    };
  }
  ensurePositionsSeeded();
  const list = safeParse<LedgerPosition[]>(
    localStorage.getItem(POSITIONS_KEY),
    [],
  );
  const idx = list.findIndex(
    (p) => p.symbol.toUpperCase() === symbol.toUpperCase(),
  );
  if (idx < 0) {
    return {
      ok: false,
      plInstrument: 0,
      plTry: 0,
      currency: "USD",
      shares: 0,
      exitPrice: 0,
      error: "Pozisyon bulunamadı",
    };
  }

  const pos = list[idx];
  const currency = instrumentCurrency(pos.symbol);
  const inst = getInstrument(pos.symbol);
  const exitPrice =
    opts?.exitPrice != null && Number.isFinite(opts.exitPrice)
      ? opts.exitPrice
      : (inst?.price ?? pos.avgCost);
  const shares = pos.shares;

  const { plInstrument, plTry, proceedsTry } = applySellBalanceDelta(
    pos,
    shares,
    exitPrice,
    currency,
  );

  list.splice(idx, 1);
  savePositions(list);

  appendTransaction({
    id: `tx-close-${pos.symbol}-${Date.now()}`,
    side: "sell",
    title: `${pos.symbol} pozisyon kapatıldı`,
    subtitle: plSubtitle(plTry),
    symbol: pos.symbol,
    amount: Math.abs(proceedsTry),
    currency: "TRY",
    date: new Date().toISOString().slice(0, 10),
    status: "completed",
    qty: shares,
    price: exitPrice,
  });

  pushNotification(
    "Pozisyon kapandı",
    `${pos.symbol}: ${plSubtitle(plTry)} bakiyeye yansıdı`,
  );

  return {
    ok: true,
    plInstrument,
    plTry,
    currency,
    shares,
    exitPrice,
  };
}

export type MarketOrderInput = {
  symbol: string;
  side: "buy" | "sell";
  shares: number;
  price?: number;
};

export type MarketOrderResult = {
  ok: boolean;
  error?: string;
  plTry?: number;
  costTry?: number;
  proceedsTry?: number;
};

export function executeMarketOrder(input: MarketOrderInput): MarketOrderResult {
  if (typeof window === "undefined") {
    return { ok: false, error: "Sunucu tarafında işlem yapılamaz" };
  }
  ensurePositionsSeeded();

  const symbol = input.symbol.toUpperCase();
  const shares = input.shares;
  if (!Number.isFinite(shares) || shares <= 0) {
    return { ok: false, error: "Geçersiz miktar" };
  }

  const inst = getInstrument(symbol);
  if (!inst) return { ok: false, error: "Enstrüman bulunamadı" };
  const currency = inst.currency;
  const price =
    input.price != null && Number.isFinite(input.price) && input.price > 0
      ? input.price
      : inst.price;
  if (!(price > 0)) return { ok: false, error: "Geçersiz fiyat" };

  const list = safeParse<LedgerPosition[]>(
    localStorage.getItem(POSITIONS_KEY),
    [],
  );
  const idx = list.findIndex((p) => p.symbol.toUpperCase() === symbol);

  if (input.side === "buy") {
    const cost = shares * price;
    const costTry = convertMoney(cost, currency, "TRY");
    if (costTry > getDisplayBalance() + 1e-6) {
      return { ok: false, error: "Yetersiz bakiye (TRY)" };
    }
    adjustBalanceDelta(-costTry);

    if (idx >= 0) {
      const prev = list[idx];
      const newShares = prev.shares + shares;
      const newAvg =
        newShares > 0
          ? (prev.avgCost * prev.shares + price * shares) / newShares
          : price;
      list[idx] = refreshMark({
        ...prev,
        shares: newShares,
        avgCost: +newAvg.toFixed(6),
        fundedShares: (prev.fundedShares ?? 0) + shares,
      });
    } else {
      list.push(
        refreshMark({
          symbol,
          shares,
          avgCost: price,
          value: shares * price,
          plPct: 0,
          plUsd: 0,
          fundedShares: shares,
        }),
      );
    }
    savePositions(list);

    appendTransaction({
      id: `tx-buy-${symbol}-${Date.now()}`,
      side: "buy",
      title: `${symbol} alış`,
      subtitle: `${shares.toLocaleString("tr-TR", { maximumFractionDigits: 4 })} hisse`,
      symbol,
      amount: Math.abs(costTry),
      currency: "TRY",
      date: new Date().toISOString().slice(0, 10),
      status: "completed",
      qty: shares,
      price,
    });

    pushNotification(
      "Alış gerçekleşti",
      `${symbol}: ${formatMoney(costTry, "TRY")} bakiyeden düşüldü`,
    );

    return { ok: true, costTry };
  }

  // sell
  if (idx < 0) return { ok: false, error: "Pozisyon yok" };
  const pos = list[idx];
  if (shares > pos.shares + 1e-8) {
    return { ok: false, error: "Yetersiz pozisyon" };
  }

  const { plInstrument, plTry, proceedsTry } = applySellBalanceDelta(
    pos,
    shares,
    price,
    currency,
  );
  void plInstrument;

  const remaining = pos.shares - shares;
  const fundedLeft = Math.max(0, (pos.fundedShares ?? 0) - shares);

  if (remaining <= 1e-8) {
    list.splice(idx, 1);
  } else {
    list[idx] = refreshMark({
      ...pos,
      shares: remaining,
      fundedShares: fundedLeft,
    });
  }
  savePositions(list);

  const closedAll = remaining <= 1e-8;
  appendTransaction({
    id: `tx-sell-${symbol}-${Date.now()}`,
    side: "sell",
    title: closedAll
      ? `${symbol} pozisyon kapatıldı`
      : `${symbol} satış`,
    subtitle: plSubtitle(plTry),
    symbol,
    amount: Math.abs(proceedsTry),
    currency: "TRY",
    date: new Date().toISOString().slice(0, 10),
    status: "completed",
    qty: shares,
    price,
  });

  pushNotification(
    closedAll ? "Pozisyon kapandı" : "Satış gerçekleşti",
    `${symbol}: ${plSubtitle(plTry)} bakiyeye yansıdı`,
  );

  return { ok: true, plTry, proceedsTry };
}
