"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  IconChevron,
  IconClose,
  IconGridDots,
  IconPlus,
  IconSearch,
} from "@/components/Icons";
import { OverviewAreaChart } from "@/components/TradeCharts";
import { TickerLogo } from "@/components/TickerLogos";
import {
  TRADE_CASH_USD,
  TRADE_INSTRUMENTS,
  TRADE_POSITIONS,
  formatMoney,
  formatPct,
  formatShares,
  FX_USD,
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

function exchangeBadge(ex: TradeExchange): string {
  if (ex === "NASDAQ" || ex === "NYSE") return ex;
  return ex;
}

export default function TradeHomePage() {
  const [query, setQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [filter, setFilter] = useState<FilterKey>("all");
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
  const costBasisUsd = TRADE_POSITIONS.reduce((s, p) => {
    const inst = getInstrument(p.symbol);
    const ccy = (inst?.currency ?? "USD") as TradeCurrency;
    const rate = FX_USD[ccy] || 1;
    return s + (p.avgCost * p.shares) / rate;
  }, 0);
  const balance = positionsValue + TRADE_CASH_USD;
  const allTimePct = costBasisUsd > 0 ? (positionsPl / costBasisUsd) * 100 : 0;
  const startBalance = balance - positionsPl;

  useEffect(() => {
    if (showSearch) {
      const t = setTimeout(() => searchRef.current?.focus(), 40);
      return () => clearTimeout(t);
    }
  }, [showSearch]);

  function openAddAsset() {
    setShowSearch(true);
    setQuery("");
    setFilter("all");
  }

  function closeSearch() {
    setShowSearch(false);
    setQuery("");
    setFilter("all");
  }

  /* ─── Add-asset search sheet ─── */
  if (showSearch) {
    return (
      <div className="flex min-h-[100dvh] flex-col bg-card px-5 pb-10 pt-4">
        <header className="flex items-center justify-between">
          <button
            type="button"
            onClick={closeSearch}
            aria-label="Kapat"
            className="trade-press rounded-full p-1.5 text-nest hover:bg-beige focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nest-blue/40"
          >
            <IconClose />
          </button>
          <p className="text-[15px] font-semibold text-nest">Varlık ekle</p>
          <span className="w-9" aria-hidden />
        </header>

        <div className="relative mt-5">
          <IconSearch
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted"
            size={18}
          />
          <input
            ref={searchRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Sembol, isim veya borsa ara…"
            className="w-full rounded-full border border-black/[0.06] bg-beige py-3.5 pl-11 pr-4 text-[15px] text-nest outline-none placeholder:text-muted focus:border-nest-blue/40 focus:bg-card focus:ring-2 focus:ring-nest-blue/25"
            aria-label="Ara"
          />
        </div>

        <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {FILTERS.map((f) => {
            const active = filter === f.key;
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                className={`trade-press shrink-0 rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nest-blue/40 ${
                  active
                    ? "bg-nest text-white"
                    : "bg-beige text-nest hover:bg-beige/80"
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>

        <section className="mt-4 flex-1">
          <h2 className="mb-2 px-0.5 text-[13px] font-semibold uppercase tracking-wide text-muted">
            {query.trim() || filter !== "all"
              ? `Sonuçlar (${filtered.length})`
              : "Popüler"}
          </h2>
          <InstrumentList items={listItems} />
        </section>

        <p className="mt-4 text-center text-[11px] text-muted">
          Fiyat gecikmeli · simülasyon · {TRADE_INSTRUMENTS.length}+ enstrüman
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-card px-5 pb-10 pt-3">
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="trade-press -ml-1 rounded-full px-1.5 py-1 text-[22px] leading-none text-nest/35 hover:text-nest focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nest-blue/40"
          aria-label="Ana sayfa"
        >
          ‹
        </Link>
        <Link
          href="/profil"
          className="trade-press rounded-lg px-1 py-0.5 text-[15px] font-semibold text-nest-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nest-blue/40"
        >
          Ayarlar
        </Link>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <IconGridDots size={34} />
        <h1 className="text-[21px] font-semibold leading-tight tracking-[-0.01em] text-nest">
          Kendi yönettiğin yatırım
        </h1>
      </div>

      <section className="mt-7">
        <p className="flex items-center gap-1.5 text-[13px] font-medium text-muted">
          Bakiye
          <span
            className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full border border-muted/45 text-[9px] font-semibold leading-none text-muted"
            aria-hidden
          >
            i
          </span>
        </p>
        <p className="mt-1.5 text-[34px] font-bold leading-none tracking-tight text-nest tabular-nums">
          {formatUSD(balance)}
        </p>
        <p
          className={`mt-2.5 text-[15px] font-semibold tabular-nums ${
            positionsPl >= 0 ? "text-gain" : "text-danger"
          }`}
        >
          {positionsPl >= 0 ? "+" : ""}
          {formatUSD(positionsPl)} ({formatPct(allTimePct)}) tüm zamanlar
        </p>
      </section>

      <div className="mt-6 -mx-0.5">
        <OverviewAreaChart
          balance={balance}
          startBalance={Math.max(startBalance * 0.92, startBalance - 800)}
          height={168}
        />
      </div>

      <section className="relative z-[1] -mt-2 overflow-hidden rounded-[18px] bg-card shadow-[0_-2px_20px_rgba(0,11,80,0.05),0_10px_28px_rgba(0,11,80,0.08)] ring-1 ring-black/[0.04]">
        <div className="flex items-center justify-between px-4 pb-0.5 pt-[18px]">
          <h2 className="text-[17px] font-bold tracking-[-0.01em] text-nest">
            Varlıklar
          </h2>
          <button
            type="button"
            onClick={openAddAsset}
            className="trade-press inline-flex items-center gap-1.5 rounded-lg text-[15px] font-semibold text-nest-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nest-blue/40"
          >
            <span className="flex h-[18px] w-[18px] items-center justify-center rounded-full border-[1.5px] border-nest-blue text-nest-blue">
              <IconPlus size={11} />
            </span>
            Varlık ekle
          </button>
        </div>

        {TRADE_POSITIONS.length === 0 ? (
          <div className="px-4 py-10 text-center">
            <p className="text-[15px] font-semibold text-nest">
              Henüz varlık yok
            </p>
            <p className="mt-1 text-[13px] text-muted">
              Hisse veya ETF ekleyerek başla.
            </p>
            <button
              type="button"
              onClick={openAddAsset}
              className="btn-primary mt-5 inline-flex px-5 py-2.5 text-sm"
            >
              Varlık ekle
            </button>
          </div>
        ) : (
          <ul>
            {TRADE_POSITIONS.map((p, idx) => {
              const inst = getInstrument(p.symbol);
              const company = inst
                ? shortCompanyName(inst.name)
                : p.symbol;
              const ccy = (inst?.currency ?? "USD") as TradeCurrency;
              return (
                <li key={p.symbol}>
                  {idx > 0 && (
                    <div className="mx-4 h-px bg-black/[0.05]" aria-hidden />
                  )}
                  <Link
                    href={`/trade/${p.symbol}`}
                    className="trade-press flex items-center gap-3 px-4 py-[15px] transition-colors hover:bg-sage-muted/35 focus-visible:outline-none focus-visible:bg-sage-muted/40"
                  >
                    <span className="shrink-0 overflow-hidden rounded-full shadow-[0_1px_2px_rgba(0,0,0,0.06)]">
                      <TickerLogo symbol={p.symbol} size={40} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[15px] font-semibold leading-snug text-nest">
                        {company}
                      </p>
                      <p className="mt-0.5 text-[13px] leading-snug text-muted">
                        {p.symbol}
                        {inst?.exchange ? (
                          <span className="ml-1.5 rounded bg-beige px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted">
                            {exchangeBadge(inst.exchange)}
                          </span>
                        ) : null}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[15px] font-semibold leading-snug text-nest tabular-nums">
                        {formatMoney(p.value, ccy)}
                      </p>
                      <p className="mt-0.5 text-[13px] leading-snug text-muted tabular-nums">
                        {formatShares(p.shares)} hisse
                      </p>
                    </div>
                    <IconChevron
                      size={15}
                      className="shrink-0 text-muted/55"
                    />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}

        <div className="border-t border-black/[0.05] px-4 py-3.5">
          <div className="flex items-center justify-between text-[13px]">
            <span className="text-muted">Nakit (USD)</span>
            <span className="font-semibold text-nest tabular-nums">
              {formatUSD(TRADE_CASH_USD)}
            </span>
          </div>
        </div>
      </section>

      <p className="mt-5 text-center text-[11px] leading-relaxed text-muted">
        Fiyat gecikmeli · simülasyon
      </p>
    </div>
  );
}

function InstrumentList({ items }: { items: TradeInstrument[] }) {
  if (items.length === 0) {
    return (
      <p className="rounded-2xl bg-beige px-4 py-8 text-center text-[14px] text-muted">
        Eşleşen enstrüman yok
      </p>
    );
  }
  return (
    <ul className="overflow-hidden rounded-2xl bg-card ring-1 ring-black/[0.05]">
      {items.map((i, idx) => (
        <li key={i.symbol}>
          {idx > 0 && (
            <div className="mx-4 h-px bg-black/[0.05]" aria-hidden />
          )}
          <Link
            href={`/trade/${i.symbol}`}
            className="trade-press flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-sage-muted/40 focus-visible:outline-none focus-visible:bg-sage-muted/40"
          >
            <span className="shrink-0 overflow-hidden rounded-full">
              <TickerLogo symbol={i.symbol} size={40} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="text-[15px] font-semibold text-nest">{i.symbol}</p>
                <span className="rounded bg-beige px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted">
                  {exchangeBadge(i.exchange)}
                </span>
              </div>
              <p className="truncate text-[13px] text-muted">{i.name}</p>
            </div>
            <div className="min-w-[4.75rem] text-right">
              <p className="text-[15px] font-semibold text-nest tabular-nums">
                {formatMoney(i.price, i.currency)}
              </p>
              <p
                className={`text-[12px] font-semibold tabular-nums ${
                  i.changePct >= 0 ? "text-gain" : "text-danger"
                }`}
              >
                {formatPct(i.changePct)}
              </p>
            </div>
            <IconChevron size={14} className="shrink-0 text-muted/55" />
          </Link>
        </li>
      ))}
    </ul>
  );
}
