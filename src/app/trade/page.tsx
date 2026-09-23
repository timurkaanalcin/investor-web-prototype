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
  formatPct,
  formatShares,
  formatUSD,
  getInstrument,
} from "@/lib/mock-data";

function shortCompanyName(name: string): string {
  return name
    .replace(/\.com/gi, "")
    .replace(
      /\s+(Inc\.?|Corp\.?|Corporation|Company|Ltd\.?|Co\.?|ETF|Trust)$/i,
      ""
    )
    .replace(/\s+Inc\.?$/i, "")
    .trim();
}

export default function TradeHomePage() {
  const [query, setQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return TRADE_INSTRUMENTS;
    return TRADE_INSTRUMENTS.filter(
      (i) =>
        i.symbol.toLowerCase().includes(q) ||
        i.name.toLowerCase().includes(q)
    );
  }, [query]);

  const popular = TRADE_INSTRUMENTS.filter((i) => i.popular);

  const positionsValue = TRADE_POSITIONS.reduce((s, p) => s + p.value, 0);
  const positionsPl = TRADE_POSITIONS.reduce((s, p) => s + p.plUsd, 0);
  const costBasis = TRADE_POSITIONS.reduce(
    (s, p) => s + p.avgCost * p.shares,
    0
  );
  const balance = positionsValue + TRADE_CASH_USD;
  const allTimePct = costBasis > 0 ? (positionsPl / costBasis) * 100 : 0;
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
  }

  function closeSearch() {
    setShowSearch(false);
    setQuery("");
  }

  /* ─── Add-asset search sheet (Betterment + Add asset) ─── */
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
            placeholder="Hisse veya ETF ara…"
            className="w-full rounded-full border border-black/[0.06] bg-beige py-3.5 pl-11 pr-4 text-[15px] text-nest outline-none placeholder:text-muted focus:border-nest-blue/40 focus:bg-card focus:ring-2 focus:ring-nest-blue/25"
            aria-label="Ara"
          />
        </div>

        <section className="mt-5 flex-1">
          <h2 className="mb-2 px-0.5 text-[13px] font-semibold uppercase tracking-wide text-muted">
            {query.trim() ? `Sonuçlar (${filtered.length})` : "Popüler"}
          </h2>
          <InstrumentList items={query.trim() ? filtered : popular} />
        </section>

        <p className="mt-4 text-center text-[11px] text-muted">
          Fiyat gecikmeli · simülasyon
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-card px-5 pb-10 pt-3">
      {/* Top bar: quiet back + Settings */}
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

      {/* Title row: blue grid icon + title */}
      <div className="mt-4 flex items-center gap-3">
        <IconGridDots size={34} />
        <h1 className="text-[21px] font-semibold leading-tight tracking-[-0.01em] text-nest">
          Kendi yönettiğin yatırım
        </h1>
      </div>

      {/* Balance */}
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

      {/* Powder-blue overview chart */}
      <div className="mt-6 -mx-0.5">
        <OverviewAreaChart
          balance={balance}
          startBalance={Math.max(startBalance * 0.92, startBalance - 800)}
          height={168}
        />
      </div>

      {/* Holdings card overlapping chart */}
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
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[15px] font-semibold leading-snug text-nest tabular-nums">
                        {formatUSD(p.value)}
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
            <span className="text-muted">Nakit</span>
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

function InstrumentList({
  items,
}: {
  items: typeof TRADE_INSTRUMENTS;
}) {
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
              <p className="text-[15px] font-semibold text-nest">{i.symbol}</p>
              <p className="truncate text-[13px] text-muted">{i.name}</p>
            </div>
            <div className="min-w-[4.75rem] text-right">
              <p className="text-[15px] font-semibold text-nest tabular-nums">
                {formatUSD(i.price)}
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
