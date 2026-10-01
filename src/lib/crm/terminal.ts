/** CRM trading-desk helpers — localStorage mock, static-export safe. */
import {
  TRADE_INSTRUMENTS,
  TRADE_WATCHLIST,
  convertMoney,
  formatMoney,
  getInstrument,
  type TradeInstrument,
} from "@/lib/mock-data";
import {
  closeOpenPosition,
  ensurePositionsSeeded,
  getOpenPositions,
  subscribePositions,
  type LedgerPosition,
} from "@/lib/trade-ledger";
import { getExtraTransactions, listAuthAccounts, type StoredTx } from "@/lib/storage";
import { getCrmDesks } from "@/lib/crm/data";

export type DeskPosition = LedgerPosition & {
  accountEmail: string;
  accountName: string;
  deskId: string;
  deskName: string;
};

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/** Attribute each open ledger position to a seeded/auth account + desk (mock multi-client). */
export function getDeskPositions(): DeskPosition[] {
  ensurePositionsSeeded();
  const positions = getOpenPositions();
  const accounts = listAuthAccounts();
  const desks = getCrmDesks();
  const fallbackAccounts =
    accounts.length > 0
      ? accounts
      : [
          {
            email: "demo@ornek.com",
            name: "Demo Müşteri",
            createdAt: new Date().toISOString(),
          },
        ];

  return positions.map((p, i) => {
    const acc = fallbackAccounts[hashStr(p.symbol) % fallbackAccounts.length];
    const desk = desks[hashStr(p.symbol + String(i)) % Math.max(desks.length, 1)] || {
      id: "desk_sup",
      name: "Destek",
    };
    return {
      ...p,
      accountEmail: acc.email,
      accountName: acc.name || acc.email,
      deskId: desk.id,
      deskName: desk.name,
    };
  });
}

export function subscribeDeskPositions(cb: () => void): () => void {
  return subscribePositions(cb);
}

export function forceCloseDeskPosition(symbol: string) {
  return closeOpenPosition(symbol);
}

export function getWatchlistInstruments(): TradeInstrument[] {
  const fromWatch = TRADE_WATCHLIST.map((s) => getInstrument(s)).filter(
    (x): x is TradeInstrument => !!x,
  );
  // Keep the saved list as the first rows, but always include every asset
  // class. Previously the eight saved symbols short-circuited this merge,
  // leaving Forex/Kripto/Emtia empty in the CRM terminal.
  const popular = TRADE_INSTRUMENTS.filter((i) => i.popular).slice(0, 32);
  const byType = (t: TradeInstrument["type"], count = 18) =>
    TRADE_INSTRUMENTS.filter((i) => i.type === t).slice(0, count);
  const merged = [
    ...fromWatch,
    ...popular,
    ...byType("stock", 18),
    ...byType("etf", 8),
    ...byType("crypto"),
    ...byType("fx"),
    ...byType("commodity"),
  ];
  const seen = new Set<string>();
  return merged.filter((i) => {
    if (seen.has(i.symbol)) return false;
    seen.add(i.symbol);
    return true;
  });
}

export function getTradeBlotter(): StoredTx[] {
  return getExtraTransactions().filter(
    (t) => t.side === "buy" || t.side === "sell",
  );
}

export function positionExposureTry(p: LedgerPosition): number {
  const inst = getInstrument(p.symbol);
  const cur = inst?.currency ?? "USD";
  return convertMoney(p.value, cur, "TRY");
}

export function positionPlTry(p: LedgerPosition): number {
  const inst = getInstrument(p.symbol);
  const cur = inst?.currency ?? "USD";
  return convertMoney(p.plUsd, cur, "TRY");
}

export function summarizePositions(list: LedgerPosition[]) {
  const openCount = list.length;
  let exposureTry = 0;
  let unrealizedPlTry = 0;
  for (const p of list) {
    exposureTry += positionExposureTry(p);
    unrealizedPlTry += positionPlTry(p);
  }
  const blotter = getTradeBlotter();
  const today = new Date().toISOString().slice(0, 10);
  const dayVolume = blotter
    .filter((t) => (t.date || "").startsWith(today) || t.date === today)
    .reduce((s, t) => s + (t.amount || 0), 0);
  return { openCount, exposureTry, unrealizedPlTry, dayVolume, fills: blotter.length };
}

export function exposureBySymbol(list: LedgerPosition[]) {
  const map = new Map<
    string,
    { symbol: string; count: number; exposureTry: number; plTry: number }
  >();
  for (const p of list) {
    const prev = map.get(p.symbol) || {
      symbol: p.symbol,
      count: 0,
      exposureTry: 0,
      plTry: 0,
    };
    prev.count += 1;
    prev.exposureTry += positionExposureTry(p);
    prev.plTry += positionPlTry(p);
    map.set(p.symbol, prev);
  }
  return Array.from(map.values()).sort((a, b) => b.exposureTry - a.exposureTry);
}

export function formatTryMono(n: number, digits = 2): string {
  return (
    "₺" +
    n.toLocaleString("tr-TR", {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    })
  );
}

export function formatPx(n: number): string {
  if (!Number.isFinite(n)) return "—";
  if (Math.abs(n) >= 1000)
    return n.toLocaleString("tr-TR", { maximumFractionDigits: 2 });
  if (Math.abs(n) >= 1)
    return n.toLocaleString("tr-TR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    });
  return n.toLocaleString("tr-TR", {
    minimumFractionDigits: 4,
    maximumFractionDigits: 6,
  });
}

export { formatMoney, getInstrument };
