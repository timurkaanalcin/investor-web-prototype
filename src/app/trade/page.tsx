"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  IconClose,
  IconSearch,
  IconSettings,
} from "@/components/Icons";
import { Sparkline } from "@/components/TradeCharts";
import { TickerLogo } from "@/components/TickerLogos";
import {
  TRADE_CASH_USD,
  TRADE_INSTRUMENTS,
  TRADE_POSITIONS,
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

type FilterKey = "all" | "BIST" | "MOEX" | "US" | "EU" | "ETF";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "Tümü" },
  { key: "BIST", label: "BIST" },
  { key: "MOEX", label: "MOEX" },
  { key: "US", label: "ABD" },
  { key: "EU", label: "Avrupa" },
  { key: "ETF", label: "ETF" },
];

const US_EX: Set<TradeExchange> = new Set(["NASDAQ", "NYSE"]);
const EU_EX: Set<TradeExchange> = new Set(["XETRA", "LSE", "EPA"]);

function matchesFilter(i: TradeInstrument, f: FilterKey): boolean {
  if (f === "all") return true;
  if (f === "ETF") return i.type === "etf";
  if (f === "BIST") return i.exchange === "BIST";
  if (f === "MOEX") return i.exchange === "MOEX";
  if (f === "US") return US_EX.has(i.exchange) && i.type === "stock";
  if (f === "EU") return EU_EX.has(i.exchange);
  return true;
}

function shortCompanyName(name: string): string {
  return name
    .replace(/\.com/gi, "")
    .replace(
      /\s+(Inc\.?|Corp\.?|Corporation|Company|Ltd\.?|Co\.?|ETF|Trust|AG|SE|plc|PLC|SA|S\.A\.)$/i,
      ""
    )
    .replace(/\s+Inc\.?$/i, "")
    .trim();
}

export default function TradeHomePage() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");
  const [positionsOpen, setPositionsOpen] = useState(true);
  const searchRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return TRADE_INSTRUMENTS.filter((i) => {
      if (!matchesFilter(i, filter)) return false;
      if (!q) return true;
      return (
        i.symbol.toLowerCase().includes(q) ||
        i.name.toLowerCase().includes(q) ||
        i.exchange.toLowerCase().includes(q) ||
        i.currency.toLowerCase().includes(q)
      );
    });
  }, [query, filter]);

  const popular = useMemo(
    () => TRADE_INSTRUMENTS.filter((i) => i.popular),
    []
  );

  const listItems = query.trim() || filter !== "all" ? filtered : popular;

  const positionsValue = TRADE_POSITIONS.reduce(
    (s, p) => s + positionValueUSD(p),
    0
  );
  const positionsPl = TRADE_POSITIONS.reduce((s, p) => s + positionPlUSD(p), 0);
  const balance = positionsValue + TRADE_CASH_USD;

  useEffect(() => {
    searchRef.current?.focus();
  }, []);

  return (
    <div className="trade-tv-root flex min-h-[100dvh] flex-col pb-4">
      {/* Top bar — symbol search */}
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
        <Link
          href="/profil"
          className="tv-icon-btn"
          aria-label="Ayarlar"
          title="Ayarlar"
        >
          <IconSettings size={16} />
        </Link>
      </div>

      <div className="flex items-center justify-between px-3 py-2">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#787b86]">
            Investor Trade
          </p>
          <p className="text-[13px] font-semibold text-[#d1d4dc]">
            İzleme listesi
          </p>
        </div>
        <p className="tv-mono text-[11px] text-[#787b86]">
          {TRADE_INSTRUMENTS.length} sembol
        </p>
      </div>

      {/* Exchange filter pills */}
      <div className="tv-pills" role="tablist" aria-label="Borsa filtresi">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            role="tab"
            aria-selected={filter === f.key}
            onClick={() => setFilter(f.key)}
            className={`tv-pill trade-press${filter === f.key ? " active" : ""}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Column headers */}
      <div className="flex items-center gap-2 border-b border-[#2a2e39] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-[#787b86]">
        <span className="w-7" aria-hidden />
        <span className="min-w-0 flex-1">Sembol</span>
        <span className="w-14 text-center">Grafik</span>
        <span className="w-[4.75rem] text-right">Son / %</span>
      </div>

      {/* Watchlist */}
      <section className="flex-1">
        <div className="tv-section-label">
          <span>
            {query.trim() || filter !== "all"
              ? `Sonuçlar (${filtered.length})`
              : "Popüler"}
          </span>
        </div>
        <Watchlist items={listItems} />
      </section>

      {/* Account / positions strip */}
      <section className="tv-account-strip mt-auto">
        <button
          type="button"
          onClick={() => setPositionsOpen((o) => !o)}
          className="trade-press flex w-full items-center justify-between text-left"
        >
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#787b86]">
              Hesap
            </p>
            <p className="tv-mono mt-0.5 text-[16px] font-bold text-[#d1d4dc]">
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
            <p className="text-[11px] text-[#787b86]">
              {positionsOpen ? "Pozisyonları gizle" : "Pozisyonları göster"}
            </p>
          </div>
        </button>

        {positionsOpen && (
          <div className="mt-3 overflow-hidden rounded border border-[#2a2e39] bg-[#131722]">
            {TRADE_POSITIONS.length === 0 ? (
              <p className="px-3 py-4 text-center text-[13px] text-[#787b86]">
                Henüz pozisyon yok
              </p>
            ) : (
              <ul>
                {TRADE_POSITIONS.map((p) => {
                  const inst = getInstrument(p.symbol);
                  const company = inst
                    ? shortCompanyName(inst.name)
                    : p.symbol;
                  const ccy = (inst?.currency ?? "USD") as TradeCurrency;
                  const up = p.plPct >= 0;
                  return (
                    <li key={p.symbol}>
                      <Link
                        href={`/trade/${p.symbol}`}
                        className="tv-watch-row !border-[#2a2e39]/70"
                      >
                        <span className="tv-chip-logo">
                          <TickerLogo symbol={p.symbol} size={28} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-[13px] font-semibold text-[#d1d4dc]">
                            {p.symbol}
                          </p>
                          <p className="truncate text-[11px] text-[#787b86]">
                            {formatShares(p.shares)} hisse · {company}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="tv-mono text-[13px] font-semibold text-[#d1d4dc]">
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
            <div className="flex items-center justify-between border-t border-[#2a2e39] px-3 py-2.5 text-[12px]">
              <span className="text-[#787b86]">Nakit (USD)</span>
              <span className="tv-mono font-semibold text-[#d1d4dc]">
                {formatUSD(TRADE_CASH_USD)}
              </span>
            </div>
          </div>
        )}

        <p className="mt-3 text-center text-[10px] text-[#787b86]">
          Fiyat gecikmeli · simülasyon · {TRADE_INSTRUMENTS.length} enstrüman
        </p>
      </section>
    </div>
  );
}

function Watchlist({ items }: { items: TradeInstrument[] }) {
  if (items.length === 0) {
    return (
      <p className="px-4 py-10 text-center text-[13px] text-[#787b86]">
        Eşleşen enstrüman yok
      </p>
    );
  }

  return (
    <ul>
      {items.map((i) => {
        const up = i.changePct >= 0;
        return (
          <li key={i.symbol}>
            <Link href={`/trade/${i.symbol}`} className="tv-watch-row">
              <span className="tv-chip-logo">
                <TickerLogo symbol={i.symbol} size={28} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="text-[13px] font-semibold leading-tight text-[#d1d4dc]">
                    {i.symbol}
                  </p>
                  <span className="tv-ex-badge">{i.exchange}</span>
                </div>
                <p className="truncate text-[11px] leading-tight text-[#787b86]">
                  {i.name}
                </p>
              </div>
              <Sparkline
                symbol={i.symbol}
                lastPrice={i.price}
                changePct={i.changePct}
                width={56}
                height={24}
                upColor="#26a69a"
                downColor="#ef5350"
              />
              <div className="min-w-[4.75rem] text-right">
                <p className="tv-mono text-[13px] font-semibold leading-tight text-[#d1d4dc]">
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
          </li>
        );
      })}
    </ul>
  );
}
