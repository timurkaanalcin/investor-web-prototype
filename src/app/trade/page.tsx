"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  IconChevron,
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
  TRADE_WATCHLIST,
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
  const watchlist = TRADE_WATCHLIST.map((s) => getInstrument(s)!).filter(
    Boolean
  );

  const positionsValue = TRADE_POSITIONS.reduce((s, p) => s + p.value, 0);
  const positionsPl = TRADE_POSITIONS.reduce((s, p) => s + p.plUsd, 0);
  const costBasis = TRADE_POSITIONS.reduce(
    (s, p) => s + p.avgCost * p.shares,
    0
  );
  const balance = positionsValue + TRADE_CASH_USD;
  const allTimePct = costBasis > 0 ? (positionsPl / costBasis) * 100 : 0;
  const startBalance = balance - positionsPl;

  function openAddAsset() {
    setShowSearch(true);
    setTimeout(() => searchRef.current?.focus(), 50);
  }

  return (
    <div className="bg-card px-5 pb-8 pt-4">
      {/* Top bar: Settings */}
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="rounded-full p-1 text-nest/40 hover:text-nest"
          aria-label="Ana sayfa"
        >
          <span className="text-lg leading-none">‹</span>
        </Link>
        <Link
          href="/profil"
          className="text-[15px] font-semibold text-nest-blue"
        >
          Ayarlar
        </Link>
      </div>

      {/* Title row: grid icon + Self-directed */}
      <div className="mt-3 flex items-center gap-2.5">
        <IconGridDots size={32} />
        <h1 className="text-[22px] font-semibold leading-tight text-nest">
          Kendi yönettiğin yatırım
        </h1>
      </div>

      {/* Balance */}
      <section className="mt-6">
        <p className="flex items-center gap-1 text-[13px] text-muted">
          Bakiye
          <span
            className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full border border-muted/50 text-[9px] text-muted"
            aria-hidden
          >
            i
          </span>
        </p>
        <p className="mt-1 text-[34px] font-bold leading-none tracking-tight text-nest tabular-nums">
          {formatUSD(balance)}
        </p>
        <p
          className={`mt-2 text-[15px] font-semibold tabular-nums ${
            positionsPl >= 0 ? "text-[#1a7a4c]" : "text-danger"
          }`}
        >
          {positionsPl >= 0 ? "+" : ""}
          {formatUSD(positionsPl)} ({formatPct(allTimePct)}) tüm zamanlar
        </p>
      </section>

      {/* Overview powder-blue chart — no range pills */}
      <div className="mt-5 -mx-1">
        <OverviewAreaChart
          balance={balance}
          startBalance={Math.max(startBalance * 0.92, startBalance - 800)}
          height={172}
        />
      </div>

      {/* Holdings card overlapping chart */}
      <section className="relative z-[1] -mt-3 overflow-hidden rounded-2xl bg-card shadow-[0_-4px_24px_rgba(0,11,80,0.06),0_8px_24px_rgba(0,11,80,0.08)]">
        <div className="flex items-center justify-between px-4 pb-1 pt-4">
          <h2 className="text-[17px] font-bold text-nest">Pozisyonların</h2>
          <button
            type="button"
            onClick={openAddAsset}
            className="inline-flex items-center gap-1.5 text-[15px] font-semibold text-nest-blue"
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-full border-[1.5px] border-nest-blue text-nest-blue">
              <IconPlus size={12} />
            </span>
            Varlık ekle
          </button>
        </div>

        <ul className="divide-y divide-black/5">
          {TRADE_POSITIONS.map((p) => {
            const inst = getInstrument(p.symbol);
            const company = inst
              ? shortCompanyName(inst.name)
              : p.symbol;
            return (
              <li key={p.symbol}>
                <Link
                  href={`/trade/${p.symbol}`}
                  className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-sage-muted/40"
                >
                  <span className="shrink-0 overflow-hidden rounded-full">
                    <TickerLogo symbol={p.symbol} size={40} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[15px] font-semibold text-nest">
                      {company}
                    </p>
                    <p className="text-[13px] text-muted">{p.symbol}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[15px] font-semibold text-nest tabular-nums">
                      {formatUSD(p.value)}
                    </p>
                    <p className="text-[13px] text-muted tabular-nums">
                      {formatShares(p.shares)} hisse
                    </p>
                  </div>
                  <IconChevron size={16} className="shrink-0 text-muted/70" />
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="border-t border-black/5 px-4 py-3">
          <div className="flex items-center justify-between text-[13px]">
            <span className="text-muted">Nakit</span>
            <span className="font-semibold text-nest tabular-nums">
              {formatUSD(TRADE_CASH_USD)}
            </span>
          </div>
        </div>
      </section>

      {/* Search — shown after + Varlık ekle or when typing */}
      {(showSearch || query.trim()) && (
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
            className="w-full rounded-full border border-black/5 bg-beige py-3.5 pl-11 pr-4 text-sm text-nest outline-none ring-nest-blue/30 placeholder:text-muted focus:bg-card focus:ring-2"
            aria-label="Ara"
          />
        </div>
      )}

      {query.trim() ? (
        <section className="mt-4">
          <h2 className="mb-2 text-base font-semibold text-nest">
            Sonuçlar ({filtered.length})
          </h2>
          <InstrumentList items={filtered} />
        </section>
      ) : (
        <>
          <section className="mt-6">
            <h2 className="mb-2 text-base font-semibold text-nest">
              İzleme listesi
            </h2>
            <InstrumentList items={watchlist} />
          </section>

          <section className="mt-5">
            <h2 className="mb-2 text-base font-semibold text-nest">Popüler</h2>
            <InstrumentList items={popular} />
          </section>
        </>
      )}
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
      <p className="rounded-2xl border border-black/5 bg-beige px-4 py-6 text-center text-sm text-muted">
        Eşleşen enstrüman yok
      </p>
    );
  }
  return (
    <ul className="overflow-hidden rounded-2xl border border-black/5 bg-card divide-y divide-black/5">
      {items.map((i) => (
        <li key={i.symbol}>
          <Link
            href={`/trade/${i.symbol}`}
            className="flex items-center gap-2.5 px-4 py-3 transition-colors hover:bg-sage-muted/50"
          >
            <span className="shrink-0 overflow-hidden rounded-full">
              <TickerLogo symbol={i.symbol} size={40} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-nest">{i.symbol}</p>
              <p className="truncate text-xs text-muted">{i.name}</p>
            </div>
            <div className="min-w-[4.5rem] text-right">
              <p className="text-sm font-semibold text-nest tabular-nums">
                {formatUSD(i.price)}
              </p>
              <p
                className={`text-xs font-medium tabular-nums ${
                  i.changePct >= 0 ? "text-nest-light" : "text-danger"
                }`}
              >
                {formatPct(i.changePct)}
              </p>
            </div>
            <IconChevron size={14} className="shrink-0 text-muted" />
          </Link>
        </li>
      ))}
    </ul>
  );
}
