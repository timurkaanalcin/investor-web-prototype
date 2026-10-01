"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useLiveQuotesMap } from "@/hooks/useLiveQuotesMap";
import Link from "next/link";
import {
  IconClose,
  IconGrip,
  IconMoon,
  IconSearch,
  IconStar,
  IconSun,
  IconUser,
} from "@/components/Icons";
import { Sparkline } from "@/components/TradeCharts";
import { TickerLogo } from "@/components/TickerLogos";
import { useTradeTheme } from "@/components/TradeTheme";
import {
  TRADE_CASH_USD,
  TRADE_INSTRUMENTS,
  formatMoney,
  formatPct,
  formatShares,
  formatUSD,
  getInstrument,
  positionPlUSD,
  positionValueUSD,
  type TradeCurrency,
  type TradeExchange,
  type TradeInstrument,
} from "@/lib/mock-data";
import { formatVolume, getDayStats } from "@/lib/market-series";
import {
  getOpenPositions,
  subscribePositions,
  type LedgerPosition,
} from "@/lib/trade-ledger";
import {
  applyWatchOrder,
  isPinned,
  reorderSymbols,
  subscribeWatchPrefs,
  togglePin,
} from "@/lib/trade-watchlist-prefs";

type CatKey = "all" | "hisse" | "crypto" | "fx" | "commodity";
type ExKey = "all" | "BIST" | "MOEX" | "US" | "EU" | "ETF";

const CATS: { key: CatKey; label: string }[] = [
  { key: "all", label: "Tümü" },
  { key: "hisse", label: "Hisse" },
  { key: "crypto", label: "Kripto" },
  { key: "fx", label: "Forex" },
  { key: "commodity", label: "Emtia" },
];

const EX_FILTERS: { key: ExKey; label: string }[] = [
  { key: "all", label: "Borsa" },
  { key: "BIST", label: "BIST" },
  { key: "US", label: "ABD" },
  { key: "EU", label: "AB" },
  { key: "MOEX", label: "MOEX" },
  { key: "ETF", label: "ETF" },
];

const US_EX: Set<TradeExchange> = new Set(["NASDAQ", "NYSE"]);
const EU_EX: Set<TradeExchange> = new Set(["XETRA", "LSE", "EPA"]);

function matchesCat(i: TradeInstrument, c: CatKey): boolean {
  if (c === "all") return true;
  if (c === "hisse") return i.type === "stock" || i.type === "etf";
  if (c === "crypto") return i.type === "crypto";
  if (c === "fx") return i.type === "fx";
  if (c === "commodity") return i.type === "commodity";
  return true;
}

function matchesEx(i: TradeInstrument, e: ExKey): boolean {
  if (e === "all") return true;
  if (e === "ETF") return i.type === "etf";
  if (e === "BIST") return i.exchange === "BIST";
  if (e === "MOEX") return i.exchange === "MOEX";
  if (e === "US") return US_EX.has(i.exchange);
  if (e === "EU") return EU_EX.has(i.exchange);
  return true;
}

function shortCompanyName(name: string): string {
  return name
    .replace(/\.com/gi, "")
    .replace(
      /\s+(Inc\.?|Corp\.?|Corporation|Company|Ltd\.?|Co\.?|ETF|Trust|AG|SE|plc|PLC|SA|S\.A\.)$/i,
      "",
    )
    .replace(/\s+Inc\.?$/i, "")
    .trim();
}

export function TradeWatchlistPanel({
  activeSymbol,
  showTopChrome = true,
  compact = false,
}: {
  activeSymbol?: string | null;
  showTopChrome?: boolean;
  compact?: boolean;
}) {
  const { theme, toggle } = useTradeTheme();
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<CatKey>("all");
  const [ex, setEx] = useState<ExKey>("all");
  const [positionsOpen, setPositionsOpen] = useState(false);
  const [ledgerPositions, setLedgerPositions] = useState<LedgerPosition[]>([]);
  const [prefsTick, setPrefsTick] = useState(0);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const refresh = () => setLedgerPositions(getOpenPositions());
    refresh();
    return subscribePositions(refresh);
  }, []);

  useEffect(() => subscribeWatchPrefs(() => setPrefsTick((t) => t + 1)), []);

  const filtered = useMemo(() => {
    void prefsTick;
    const q = query.trim().toLowerCase();
    const base = TRADE_INSTRUMENTS.filter((i) => {
      if (!matchesCat(i, cat)) return false;
      if (!matchesEx(i, ex)) return false;
      if (!q) return true;
      return (
        i.symbol.toLowerCase().includes(q) ||
        i.name.toLowerCase().includes(q) ||
        i.exchange.toLowerCase().includes(q) ||
        i.currency.toLowerCase().includes(q)
      );
    });
    const popular =
      !q && cat === "all" && ex === "all"
        ? base.filter((i) => i.popular)
        : base;
    return applyWatchOrder(popular.length ? popular : base);
  }, [query, cat, ex, prefsTick]);

  const liveFiltered = useLiveQuotesMap(filtered, 4000);

  const visiblePositions = useMemo(
    () =>
      ledgerPositions.filter((p) => {
        const inst = getInstrument(p.symbol);
        return !!inst && matchesCat(inst, cat) && matchesEx(inst, ex);
      }),
    [ledgerPositions, cat, ex],
  );
  const positionsValue = ledgerPositions.reduce(
    (s, p) => s + positionValueUSD(p),
    0,
  );
  const positionsPl = ledgerPositions.reduce((s, p) => s + positionPlUSD(p), 0);
  const balance = positionsValue + TRADE_CASH_USD;

  useEffect(() => {
    if (!compact) searchRef.current?.focus();
  }, [compact]);

  function onDrop(toIdx: number) {
    if (dragIdx == null || dragIdx === toIdx) {
      setDragIdx(null);
      return;
    }
    const symbols = filtered.map((i) => i.symbol);
    reorderSymbols(symbols, dragIdx, toIdx);
    setDragIdx(null);
    setPrefsTick((t) => t + 1);
  }

  return (
    <div className="trade-tv-root flex h-full min-h-0 flex-col overflow-hidden">
      <div className="shrink-0">
        <div className="tv-topbar">
          <div className="tv-search">
            <IconSearch size={15} />
            <input
              ref={searchRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Sembol ara…"
              aria-label="Sembol ara"
            />
            {query && (
              <button
                type="button"
                aria-label="Temizle"
                className="tv-icon-btn !h-6 !w-6"
                onClick={() => setQuery("")}
              >
                <IconClose size={14} />
              </button>
            )}
          </div>
          {showTopChrome && (
            <>
              <button
                type="button"
                className="tv-icon-btn"
                aria-label={theme === "dark" ? "Beyaz tema" : "Siyah tema"}
                title={theme === "dark" ? "Beyaz" : "Siyah"}
                onClick={toggle}
              >
                {theme === "dark" ? (
                  <IconSun size={16} />
                ) : (
                  <IconMoon size={16} />
                )}
              </button>
              <Link
                href="/profil"
                className="tv-icon-btn"
                aria-label="Profil"
                title="Profil"
              >
                <IconUser size={16} />
              </Link>
            </>
          )}
        </div>

        {!compact && (
          <div className="flex items-center justify-between px-3 py-1.5">
            <p className="text-[12px] font-semibold text-[var(--tv-text)]">
              İzleme listesi
            </p>
            <p className="tv-mono text-[10px] text-[var(--tv-muted)]">
              {TRADE_INSTRUMENTS.length} sembol
            </p>
          </div>
        )}

        <div className="tv-pills" role="tablist" aria-label="Kategori">
          {CATS.map((f) => (
            <button
              key={f.key}
              type="button"
              role="tab"
              aria-selected={cat === f.key}
              onClick={() => setCat(f.key)}
              className={`tv-pill trade-press${cat === f.key ? " active" : ""}`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div
          className="tv-pills !pt-0"
          role="tablist"
          aria-label="Borsa filtresi"
        >
          {EX_FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              role="tab"
              aria-selected={ex === f.key}
              onClick={() => setEx(f.key)}
              className={`tv-pill trade-press${ex === f.key ? " active" : ""}`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1 border-b border-[var(--tv-border)] px-2 py-1 text-[9px] font-semibold uppercase tracking-wide text-[var(--tv-muted)]">
          <span className="w-4" aria-hidden />
          <span className="w-7" aria-hidden />
          <span className="min-w-0 flex-1">Sembol</span>
          <span className="w-[3.2rem] text-right">Hacim</span>
          <span className="w-[4.5rem] text-right">Son / %</span>
        </div>
      </div>

      <section className="tv-watch-scroll">
        <div className="tv-section-label">
          <span>
            {query.trim() || cat !== "all" || ex !== "all"
              ? `Sonuçlar (${filtered.length})`
              : "Popüler · sürükle sırala"}
          </span>
        </div>
        <Watchlist
          items={liveFiltered}
          activeSymbol={activeSymbol}
          showSpark={false}
          dragIdx={dragIdx}
          onDragStart={setDragIdx}
          onDrop={onDrop}
          onPinToggle={(sym) => {
            togglePin(sym);
            setPrefsTick((t) => t + 1);
          }}
        />
      </section>

      <section className="tv-account-strip">
        <button
          type="button"
          onClick={() => setPositionsOpen((o) => !o)}
          className="trade-press flex w-full items-center justify-between text-left"
        >
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[var(--tv-muted)]">
              Hesap
            </p>
            <p className="tv-mono mt-0.5 text-[16px] font-bold text-[var(--tv-text)]">
              {formatUSD(balance)}
            </p>
          </div>
          <div className="text-right">
            <p
              className={`tv-mono text-[13px] font-semibold ${
                positionsPl >= 0 ? "tv-change-up" : "tv-change-down"
              }`}
            >
              {positionsPl >= 0 ? "+" : ""}
              {formatUSD(positionsPl)}
            </p>
            <p className="text-[11px] text-[var(--tv-muted)]">
              {positionsOpen ? "Pozisyonları gizle" : "Pozisyonları göster"}
            </p>
          </div>
        </button>

        {positionsOpen && (
          <div className="mt-3 max-h-[28vh] overflow-y-auto overscroll-contain rounded border border-[var(--tv-border)] bg-[var(--tv-bg)]">
            {visiblePositions.length === 0 ? (
              <p className="px-3 py-4 text-center text-[13px] text-[var(--tv-muted)]">
                {ledgerPositions.length === 0
                  ? "Henüz pozisyon yok"
                  : "Bu filtrede açık pozisyon yok"}
              </p>
            ) : (
              <ul>
                {visiblePositions.map((p) => {
                  const inst = getInstrument(p.symbol);
                  const company = inst
                    ? shortCompanyName(inst.name)
                    : p.symbol;
                  const ccy = (inst?.currency ?? "USD") as TradeCurrency;
                  const up = p.plPct >= 0;
                  const active = activeSymbol === p.symbol;
                  return (
                    <li key={p.symbol}>
                      <Link
                        href={`/trade/${p.symbol}`}
                        className={`tv-watch-row${active ? " bg-[var(--tv-hover)]" : ""}`}
                      >
                        <span className="tv-chip-logo">
                          <TickerLogo symbol={p.symbol} size={28} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-[13px] font-semibold text-[var(--tv-text)]">
                            {p.symbol}
                          </p>
                          <p className="truncate text-[11px] text-[var(--tv-muted)]">
                            {formatShares(p.shares)} hisse · {company}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="tv-mono text-[13px] font-semibold text-[var(--tv-text)]">
                            {formatMoney(p.value, ccy)}
                          </p>
                          <p
                            className={`tv-mono text-[11px] font-semibold ${
                              up ? "tv-change-up" : "tv-change-down"
                            }`}
                          >
                            {formatPct(p.plPct)}
                          </p>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
            <div className="flex items-center justify-between border-t border-[var(--tv-border)] px-3 py-2.5 text-[12px]">
              <span className="text-[var(--tv-muted)]">Nakit (USD)</span>
              <span className="tv-mono font-semibold text-[var(--tv-text)]">
                {formatUSD(TRADE_CASH_USD)}
              </span>
            </div>
          </div>
        )}

        {!compact && (
          <p className="mt-3 text-center text-[10px] text-[var(--tv-muted)]">
            Canlı Yahoo fiyat · {TRADE_INSTRUMENTS.length} enstrüman
          </p>
        )}
      </section>
    </div>
  );
}

function Watchlist({
  items,
  activeSymbol,
  showSpark,
  dragIdx,
  onDragStart,
  onDrop,
  onPinToggle,
}: {
  items: TradeInstrument[];
  activeSymbol?: string | null;
  showSpark: boolean;
  dragIdx: number | null;
  onDragStart: (i: number) => void;
  onDrop: (i: number) => void;
  onPinToggle: (symbol: string) => void;
}) {
  if (items.length === 0) {
    return (
      <p className="px-4 py-10 text-center text-[13px] text-[var(--tv-muted)]">
        Eşleşen enstrüman yok
      </p>
    );
  }

  return (
    <ul>
      {items.map((i, idx) => {
        const up = i.changePct >= 0;
        const active = activeSymbol === i.symbol;
        const pinned = isPinned(i.symbol);
        const vol = getDayStats(i.symbol, i.price, i.changePct).volume;
        return (
          <li
            key={i.symbol}
            draggable
            onDragStart={() => onDragStart(idx)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => onDrop(idx)}
            className={dragIdx === idx ? "opacity-50" : undefined}
          >
            <div
              className={`tv-watch-row group${!active ? "" : " bg-[var(--tv-hover)]"}`}
            >
              <button
                type="button"
                className="shrink-0 cursor-grab touch-none text-[var(--tv-muted)] opacity-40 hover:opacity-100 active:cursor-grabbing"
                aria-label="Sürükle"
                tabIndex={-1}
                onMouseDown={() => onDragStart(idx)}
              >
                <IconGrip size={12} />
              </button>
              <Link
                href={`/trade/${i.symbol}`}
                className="flex min-w-0 flex-1 items-center gap-1.5"
              >
                <span className="tv-chip-logo">
                  <TickerLogo symbol={i.symbol} size={28} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="text-[13px] font-semibold leading-tight text-[var(--tv-text)]">
                      {i.symbol}
                    </p>
                    <span className="tv-ex-badge">{i.exchange}</span>
                  </div>
                  <p className="truncate text-[11px] leading-tight text-[var(--tv-muted)]">
                    {i.name}
                  </p>
                </div>
                {showSpark && (
                  <Sparkline
                    symbol={i.symbol}
                    lastPrice={i.price}
                    changePct={i.changePct}
                    width={56}
                    height={24}
                    upColor="#26a69a"
                    downColor="#ef5350"
                  />
                )}
                <div className="w-[3.2rem] text-right">
                  <p className="tv-mono text-[10px] leading-tight text-[var(--tv-muted)]">
                    {formatVolume(vol)}
                  </p>
                </div>
                <div className="min-w-[4.5rem] text-right">
                  <p className="tv-mono text-[13px] font-semibold leading-tight text-[var(--tv-text)]">
                    {formatMoney(i.price, i.currency)}
                  </p>
                  <p
                    className={`tv-mono text-[11px] font-semibold leading-tight ${
                      up ? "tv-change-up" : "tv-change-down"
                    }`}
                  >
                    {formatPct(i.changePct)}
                  </p>
                </div>
              </Link>
              <button
                type="button"
                aria-label={pinned ? "Sabitlemeyi kaldır" : "Sabitle"}
                title={pinned ? "Sabitlemeyi kaldır" : "Sabitle"}
                className={`ml-0.5 shrink-0 p-0.5 ${
                  pinned
                    ? "text-[var(--tv-text)]"
                    : "text-[var(--tv-muted)] opacity-40 hover:opacity-100"
                }`}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onPinToggle(i.symbol);
                }}
              >
                <IconStar size={13} filled={pinned} />
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
