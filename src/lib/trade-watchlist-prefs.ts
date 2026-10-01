/**
 * Watchlist pin + custom order preferences (localStorage).
 */
const PINS_KEY = "hram_watchlist_pins_v1";
const ORDER_KEY = "hram_watchlist_order_v1";
const EVENT = "hram-watchlist-prefs-updated";

function safeParseArr(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v.map(String) : [];
  } catch {
    return [];
  }
}

function emit(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(EVENT));
}

export function getPinnedSymbols(): string[] {
  if (typeof window === "undefined") return [];
  return safeParseArr(localStorage.getItem(PINS_KEY)).map((s) => s.toUpperCase());
}

export function isPinned(symbol: string): boolean {
  return getPinnedSymbols().includes(symbol.toUpperCase());
}

export function togglePin(symbol: string): boolean {
  if (typeof window === "undefined") return false;
  const up = symbol.toUpperCase();
  const pins = getPinnedSymbols();
  const next = pins.includes(up) ? pins.filter((s) => s !== up) : [up, ...pins];
  localStorage.setItem(PINS_KEY, JSON.stringify(next.slice(0, 50)));
  emit();
  return next.includes(up);
}

export function getWatchOrder(): string[] {
  if (typeof window === "undefined") return [];
  return safeParseArr(localStorage.getItem(ORDER_KEY)).map((s) => s.toUpperCase());
}

/** Persist full ordered symbol list (drag reorder). */
export function setWatchOrder(symbols: string[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(
    ORDER_KEY,
    JSON.stringify(symbols.map((s) => s.toUpperCase()).slice(0, 200)),
  );
  emit();
}

/** Move symbol from index to index within current visible list, then merge into saved order. */
export function reorderSymbols(
  visible: string[],
  fromIndex: number,
  toIndex: number,
): string[] {
  if (
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= visible.length ||
    toIndex >= visible.length ||
    fromIndex === toIndex
  ) {
    return visible;
  }
  const next = [...visible];
  const [item] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, item);
  const saved = getWatchOrder();
  const merged = [...next];
  for (const s of saved) {
    if (!merged.includes(s)) merged.push(s);
  }
  setWatchOrder(merged);
  return next;
}

export function applyWatchOrder<T extends { symbol: string }>(items: T[]): T[] {
  const order = getWatchOrder();
  const pins = getPinnedSymbols();
  if (order.length === 0 && pins.length === 0) return items;
  const rank = new Map<string, number>();
  order.forEach((s, i) => rank.set(s, i));
  return [...items].sort((a, b) => {
    const ap = pins.includes(a.symbol.toUpperCase()) ? 0 : 1;
    const bp = pins.includes(b.symbol.toUpperCase()) ? 0 : 1;
    if (ap !== bp) return ap - bp;
    const ar = rank.has(a.symbol.toUpperCase())
      ? (rank.get(a.symbol.toUpperCase()) as number)
      : 9999;
    const br = rank.has(b.symbol.toUpperCase())
      ? (rank.get(b.symbol.toUpperCase()) as number)
      : 9999;
    if (ar !== br) return ar - br;
    return 0;
  });
}

export function subscribeWatchPrefs(cb: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = () => cb();
  window.addEventListener(EVENT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}

/** Market (watchlist) panel open/collapsed preference */
const MARKET_OPEN_KEY = "hram_market_open_v1";
const MARKET_EVENT = "hram-market-open-updated";

/** Default collapsed so chart gets near-fullscreen. */
export function getMarketOpen(): boolean {
  if (typeof window === "undefined") return false;
  const raw = localStorage.getItem(MARKET_OPEN_KEY);
  if (raw === null) return false;
  return raw === "1" || raw === "true";
}

export function setMarketOpen(open: boolean): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(MARKET_OPEN_KEY, open ? "1" : "0");
  window.dispatchEvent(new CustomEvent(MARKET_EVENT));
}

export function subscribeMarketOpen(cb: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = () => cb();
  window.addEventListener(MARKET_EVENT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(MARKET_EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}
