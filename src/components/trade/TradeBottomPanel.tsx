"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  TRANSACTIONS,
  formatMoney,
  formatPct,
  formatShares,
  getInstrument,
  type TradeCurrency,
  type TradePosition,
  type Transaction,
} from "@/lib/mock-data";
import { getExtraTransactions } from "@/lib/storage";
import {
  closeOpenPosition,
  getOpenPositions,
  subscribePositions,
  type LedgerPosition,
} from "@/lib/trade-ledger";
import { TradeDepthTape } from "./TradeDepthTape";

type Tab = "positions" | "orders" | "history" | "depth";
type HistFilter = "all" | "buy" | "sell";

type MockOrder = {
  id: string;
  symbol: string;
  side: "buy" | "sell";
  qty: number;
  price: number;
  kind: "limit" | "tp" | "sl";
  status: "pending";
};

function mockPendingOrders(positions: TradePosition[]): MockOrder[] {
  return positions.slice(0, 3).flatMap((p, i) => {
    const inst = getInstrument(p.symbol);
    const px = inst?.price ?? p.avgCost;
    const orders: MockOrder[] = [
      {
        id: `ord_tp_${p.symbol}`,
        symbol: p.symbol,
        side: "sell",
        qty: Math.min(p.shares, Math.max(1, p.shares * 0.4)),
        price: +(px * 1.06).toFixed(2),
        kind: "tp",
        status: "pending",
      },
    ];
    if (i % 2 === 0) {
      orders.push({
        id: `ord_sl_${p.symbol}`,
        symbol: p.symbol,
        side: "sell",
        qty: Math.min(p.shares, Math.max(1, p.shares * 0.3)),
        price: +(px * 0.94).toFixed(2),
        kind: "sl",
        status: "pending",
      });
    }
    return orders;
  });
}

function mockTpSl(p: TradePosition): { tp?: number; sl?: number } {
  const inst = getInstrument(p.symbol);
  const px = inst?.price ?? p.avgCost;
  return { tp: +(px * 1.06).toFixed(2), sl: +(px * 0.94).toFixed(2) };
}

type TradeBottomPanelProps = {
  fill?: boolean;
  defaultTab?: Tab;
  className?: string;
  embedTab?: Tab;
  /** Symbol for depth/tape context (desktop symbol page) */
  depthSymbol?: string;
  depthPrice?: number;
  depthCurrency?: TradeCurrency;
};

export function TradeBottomPanel({
  fill = false,
  defaultTab = "positions",
  className = "",
  embedTab,
  depthSymbol,
  depthPrice,
  depthCurrency = "USD",
}: TradeBottomPanelProps) {
  const [tab, setTab] = useState<Tab>(embedTab ?? defaultTab);
  const [extra, setExtra] = useState<Transaction[]>([]);
  const [positions, setPositions] = useState<LedgerPosition[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [histFilter, setHistFilter] = useState<HistFilter>("all");
  const [histQuery, setHistQuery] = useState("");
  const [liveTick, setLiveTick] = useState(0);

  useEffect(() => {
    if (embedTab) setTab(embedTab);
  }, [embedTab]);

  useEffect(() => {
    const refresh = () => {
      setPositions(getOpenPositions());
      setExtra(getExtraTransactions() as Transaction[]);
    };
    refresh();
    return subscribePositions(refresh);
  }, []);

  // Soft "live" unrealized P&L refresh (marks recompute from instrument prices)
  useEffect(() => {
    const id = window.setInterval(() => {
      setPositions(getOpenPositions());
      setLiveTick((t) => t + 1);
    }, 4000);
    return () => window.clearInterval(id);
  }, []);

  const history = useMemo(() => {
    const merged = [...extra, ...TRANSACTIONS].filter(
      (t) => t.side === "buy" || t.side === "sell",
    );
    const seen = new Set<string>();
    let list = merged.filter((t) => {
      if (seen.has(t.id)) return false;
      seen.add(t.id);
      return true;
    });
    if (histFilter === "buy") list = list.filter((t) => t.side === "buy");
    if (histFilter === "sell") list = list.filter((t) => t.side === "sell");
    const q = histQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (t) =>
          (t.symbol || "").toLowerCase().includes(q) ||
          (t.title || "").toLowerCase().includes(q),
      );
    }
    return list.slice(0, 40);
  }, [extra, histFilter, histQuery]);

  const orders = useMemo(() => mockPendingOrders(positions), [positions]);

  const depthSym =
    depthSymbol ||
    positions[0]?.symbol ||
    "AAPL";
  const depthInst = getInstrument(depthSym);
  const depthPx = depthPrice ?? depthInst?.price ?? 100;
  const depthCcy: TradeCurrency = depthCurrency || depthInst?.currency || "USD";

  function flash(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  }

  function closePosition(symbol: string) {
    const result = closeOpenPosition(symbol);
    if (!result.ok) {
      flash(result.error || "Kapatılamadı");
      return;
    }
    const abs = formatMoney(Math.abs(result.plTry), "TRY");
    const label = result.plTry >= 0 ? `Kâr ${abs}` : `Zarar ${abs}`;
    flash(`${symbol} kapatıldı — ${label} bakiyeye yansıdı`);
    setPositions(getOpenPositions());
    setExtra(getExtraTransactions() as Transaction[]);
  }

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: "positions", label: "Pozisyonlar", count: positions.length },
    { key: "orders", label: "Emirler", count: orders.length },
    { key: "history", label: "Geçmiş", count: history.length },
    { key: "depth", label: "Derinlik" },
  ];

  const wrapClass = embedTab
    ? `trade-bottom-panel relative flex min-h-0 flex-1 flex-col bg-[var(--tv-bg)] ${className}`
    : fill
      ? `trade-bottom-panel relative flex min-h-[200px] flex-1 flex-col border-t border-[var(--tv-border)] bg-[var(--tv-panel)] ${className}`
      : `trade-bottom-panel relative flex h-[min(42vh,320px)] shrink-0 flex-col border-t border-[var(--tv-border)] bg-[var(--tv-panel)] md:h-[240px] ${className}`;

  void liveTick;

  return (
    <div className={wrapClass}>
      {!embedTab && (
        <div
          className="flex shrink-0 items-center gap-1 overflow-x-auto border-b border-[var(--tv-border)] px-2"
          role="tablist"
          aria-label="Pozisyon ve işlem paneli"
        >
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={tab === t.key}
              onClick={() => setTab(t.key)}
              className={`shrink-0 border-b-2 px-3 py-2 text-[12px] font-semibold transition-colors ${
                tab === t.key
                  ? "border-[var(--tv-text)] text-[var(--tv-text)]"
                  : "border-transparent text-[var(--tv-muted)] hover:text-[var(--tv-text)]"
              }`}
            >
              {t.label}
              {typeof t.count === "number" && (
                <span className="ml-1.5 text-[10px] opacity-60">{t.count}</span>
              )}
            </button>
          ))}
          <Link
            href="/islemler"
            className="ml-auto shrink-0 px-2 py-2 text-[11px] font-medium text-[var(--tv-muted)] hover:text-[var(--tv-text)]"
          >
            Tümünü gör →
          </Link>
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-auto">
        {tab === "positions" && (
          <table className="w-full min-w-[520px] md:min-w-[720px] border-collapse text-left text-[12px]">
            <thead className="sticky top-0 bg-[var(--tv-panel)] text-[10px] uppercase tracking-wide text-[var(--tv-muted)]">
              <tr>
                <th className="px-3 py-2 font-semibold">Sembol</th>
                <th className="px-3 py-2 font-semibold">Yön</th>
                <th className="px-3 py-2 font-semibold">Miktar</th>
                <th className="px-3 py-2 font-semibold">Giriş</th>
                <th className="px-3 py-2 font-semibold">Güncel</th>
                <th className="px-3 py-2 font-semibold">Gerçekleşmemiş P/L</th>
                <th className="px-3 py-2 font-semibold">TP / SL</th>
                <th className="px-3 py-2 font-semibold" />
              </tr>
            </thead>
            <tbody>
              {positions.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-3 py-8 text-center text-[var(--tv-muted)]"
                  >
                    Açık pozisyon yok
                  </td>
                </tr>
              )}
              {positions.map((p) => {
                const inst = getInstrument(p.symbol);
                const ccy = inst?.currency ?? "USD";
                const last = inst?.price ?? p.avgCost;
                const up = p.plUsd >= 0;
                const { tp, sl } = mockTpSl(p);
                return (
                  <tr
                    key={p.symbol}
                    className="border-t border-[var(--tv-border)] hover:bg-[var(--tv-hover)]"
                  >
                    <td className="px-3 py-2">
                      <Link
                        href={`/trade/${p.symbol}`}
                        className="font-semibold text-[var(--tv-text)] hover:underline"
                      >
                        {p.symbol}
                      </Link>
                      <span className="ml-1.5 text-[10px] text-[var(--tv-muted)]">
                        {inst?.exchange}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <span className="rounded bg-[#26a69a]/15 px-1.5 py-0.5 text-[10px] font-bold text-[#26a69a]">
                        Al
                      </span>
                    </td>
                    <td className="tv-mono px-3 py-2 text-[var(--tv-text)]">
                      {formatShares(p.shares)}
                    </td>
                    <td className="tv-mono px-3 py-2 text-[var(--tv-text)]">
                      {formatMoney(p.avgCost, ccy)}
                    </td>
                    <td className="tv-mono px-3 py-2 text-[var(--tv-text)]">
                      {formatMoney(last, ccy)}
                    </td>
                    <td
                      className={`tv-mono px-3 py-2 font-semibold ${
                        up ? "tv-change-up" : "tv-change-down"
                      }`}
                    >
                      {up ? "+" : ""}
                      {formatMoney(p.plUsd, ccy)}{" "}
                      <span className="opacity-80">
                        ({formatPct(p.plPct)})
                      </span>
                    </td>
                    <td className="tv-mono px-3 py-2 text-[11px] text-[var(--tv-muted)]">
                      {tp != null && (
                        <span className="text-[#26a69a]">
                          TP {formatMoney(tp, ccy)}
                        </span>
                      )}
                      {tp != null && sl != null && " · "}
                      {sl != null && (
                        <span className="text-[#ef5350]">
                          SL {formatMoney(sl, ccy)}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <button
                        type="button"
                        onClick={() => closePosition(p.symbol)}
                        className="rounded border border-[var(--tv-border)] px-2.5 py-1 text-[11px] font-semibold text-[var(--tv-text)] hover:bg-[var(--tv-hover)]"
                      >
                        Kapat
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {tab === "history" && (
          <>
            <div className="flex flex-wrap items-center gap-2 border-b border-[var(--tv-border)] px-3 py-2">
              {(
                [
                  { key: "all" as const, label: "Tümü" },
                  { key: "buy" as const, label: "Alış" },
                  { key: "sell" as const, label: "Satış" },
                ] as const
              ).map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setHistFilter(f.key)}
                  className={`rounded border px-2 py-1 text-[11px] font-semibold ${
                    histFilter === f.key
                      ? "border-[var(--tv-text)] text-[var(--tv-text)]"
                      : "border-[var(--tv-border)] text-[var(--tv-muted)]"
                  }`}
                >
                  {f.label}
                </button>
              ))}
              <input
                type="search"
                value={histQuery}
                onChange={(e) => setHistQuery(e.target.value)}
                placeholder="Sembol filtrele…"
                className="tv-input ml-auto max-w-[160px] py-1 text-[12px]"
                aria-label="Geçmiş filtre"
              />
            </div>
            <table className="w-full min-w-[520px] md:min-w-[640px] border-collapse text-left text-[12px]">
              <thead className="sticky top-0 bg-[var(--tv-panel)] text-[10px] uppercase tracking-wide text-[var(--tv-muted)]">
                <tr>
                  <th className="px-3 py-2 font-semibold">Zaman</th>
                  <th className="px-3 py-2 font-semibold">Sembol</th>
                  <th className="px-3 py-2 font-semibold">Yön</th>
                  <th className="px-3 py-2 font-semibold">Miktar</th>
                  <th className="px-3 py-2 font-semibold">Fiyat</th>
                  <th className="px-3 py-2 font-semibold">Durum</th>
                </tr>
              </thead>
              <tbody>
                {history.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-3 py-8 text-center text-[var(--tv-muted)]"
                    >
                      İşlem yok
                    </td>
                  </tr>
                )}
                {history.map((t) => {
                  const buy = t.side === "buy";
                  return (
                    <tr
                      key={t.id}
                      className="border-t border-[var(--tv-border)] hover:bg-[var(--tv-hover)]"
                    >
                      <td className="px-3 py-2 text-[var(--tv-muted)]">
                        {new Date(t.date).toLocaleString("tr-TR", {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="px-3 py-2 font-semibold text-[var(--tv-text)]">
                        {t.symbol || "—"}
                      </td>
                      <td className="px-3 py-2">
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                            buy
                              ? "bg-[#26a69a]/15 text-[#26a69a]"
                              : "bg-[#ef5350]/15 text-[#ef5350]"
                          }`}
                        >
                          {buy ? "Al" : "Sat"}
                        </span>
                      </td>
                      <td className="tv-mono px-3 py-2 text-[var(--tv-text)]">
                        {t.qty != null ? formatShares(t.qty) : "—"}
                      </td>
                      <td className="tv-mono px-3 py-2 text-[var(--tv-text)]">
                        {t.price != null
                          ? formatMoney(t.price, t.currency)
                          : formatMoney(Math.abs(t.amount), t.currency)}
                      </td>
                      <td className="px-3 py-2 text-[var(--tv-muted)]">
                        {t.status === "completed"
                          ? "Tamamlandı"
                          : t.status === "pending"
                            ? "Bekliyor"
                            : "Başarısız"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </>
        )}

        {tab === "orders" && (
          <table className="w-full min-w-[520px] md:min-w-[640px] border-collapse text-left text-[12px]">
            <thead className="sticky top-0 bg-[var(--tv-panel)] text-[10px] uppercase tracking-wide text-[var(--tv-muted)]">
              <tr>
                <th className="px-3 py-2 font-semibold">Tür</th>
                <th className="px-3 py-2 font-semibold">Sembol</th>
                <th className="px-3 py-2 font-semibold">Yön</th>
                <th className="px-3 py-2 font-semibold">Miktar</th>
                <th className="px-3 py-2 font-semibold">Fiyat</th>
                <th className="px-3 py-2 font-semibold">Durum</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-3 py-8 text-center text-[var(--tv-muted)]"
                  >
                    Bekleyen emir yok
                  </td>
                </tr>
              )}
              {orders.map((o) => {
                const inst = getInstrument(o.symbol);
                const ccy = inst?.currency ?? "USD";
                const kindLabel =
                  o.kind === "tp"
                    ? "Take profit"
                    : o.kind === "sl"
                      ? "Stop loss"
                      : "Limit";
                return (
                  <tr
                    key={o.id}
                    className="border-t border-[var(--tv-border)] hover:bg-[var(--tv-hover)]"
                  >
                    <td className="px-3 py-2 text-[var(--tv-text)]">
                      {kindLabel}
                    </td>
                    <td className="px-3 py-2 font-semibold text-[var(--tv-text)]">
                      {o.symbol}
                    </td>
                    <td className="px-3 py-2">
                      <span className="rounded bg-[#ef5350]/15 px-1.5 py-0.5 text-[10px] font-bold text-[#ef5350]">
                        Sat
                      </span>
                    </td>
                    <td className="tv-mono px-3 py-2 text-[var(--tv-text)]">
                      {formatShares(o.qty)}
                    </td>
                    <td className="tv-mono px-3 py-2 text-[var(--tv-text)]">
                      {formatMoney(o.price, ccy)}
                    </td>
                    <td className="px-3 py-2 text-[var(--tv-muted)]">
                      Bekliyor
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {tab === "depth" && (
          <TradeDepthTape
            symbol={depthSym}
            lastPrice={depthPx}
            currency={depthCcy}
          />
        )}
      </div>

      {toast && (
        <div className="pointer-events-none absolute bottom-2 left-1/2 z-30 -translate-x-1/2 rounded-full bg-[var(--tv-text)] px-3 py-1.5 text-[11px] font-medium text-[var(--tv-bg)] shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
