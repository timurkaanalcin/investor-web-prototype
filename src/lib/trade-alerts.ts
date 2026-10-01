/**
 * LocalStorage price alerts for Trade symbol pages (client-only, static-export safe).
 */
export type PriceAlert = {
  id: string;
  symbol: string;
  /** "above" = alert when price >= target; "below" when price <= target */
  direction: "above" | "below";
  target: number;
  createdAt: string;
  note?: string;
};

const KEY = "hram_trade_alerts_v1";
const EVENT = "hram-trade-alerts-updated";

function safeParse(raw: string | null): PriceAlert[] {
  if (!raw) return [];
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? (v as PriceAlert[]) : [];
  } catch {
    return [];
  }
}

function emit(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(EVENT));
}

export function getAlerts(symbol?: string): PriceAlert[] {
  if (typeof window === "undefined") return [];
  const all = safeParse(localStorage.getItem(KEY));
  if (!symbol) return all;
  const up = symbol.toUpperCase();
  return all.filter((a) => a.symbol.toUpperCase() === up);
}

export function addAlert(input: {
  symbol: string;
  direction: "above" | "below";
  target: number;
  note?: string;
}): PriceAlert | null {
  if (typeof window === "undefined") return null;
  const target = Number(input.target);
  if (!Number.isFinite(target) || target <= 0) return null;
  const alert: PriceAlert = {
    id: `al_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    symbol: input.symbol.toUpperCase(),
    direction: input.direction,
    target,
    createdAt: new Date().toISOString(),
    note: input.note?.trim() || undefined,
  };
  const all = safeParse(localStorage.getItem(KEY));
  all.unshift(alert);
  localStorage.setItem(KEY, JSON.stringify(all.slice(0, 100)));
  emit();
  return alert;
}

export function deleteAlert(id: string): void {
  if (typeof window === "undefined") return;
  const all = safeParse(localStorage.getItem(KEY)).filter((a) => a.id !== id);
  localStorage.setItem(KEY, JSON.stringify(all));
  emit();
}

export function subscribeAlerts(cb: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = () => cb();
  window.addEventListener(EVENT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}
