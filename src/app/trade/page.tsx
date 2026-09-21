"use client";

import { useMemo, useState, type CSSProperties } from "react";
import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { IconChevron, IconSearch } from "@/components/Icons";
import { MarketStatusPill, Sparkline } from "@/components/TradeCharts";
import { TickerChip, TickerLogo } from "@/components/TickerLogos";
import {
  TRADE_CASH_USD,
  TRADE_INSTRUMENTS,
  TRADE_POSITIONS,
  TRADE_WATCHLIST,
  USD_TRY,
  formatPct,
  formatShares,
  formatTRY,
  formatUSD,
  getInstrument,
} from "@/lib/mock-data";

const HERO_CHIPS: { symbol: string; display?: string; style: CSSProperties }[] = [
  { symbol: "AAPL", style: { top: "8%", left: "6%", transform: "rotate(-6deg)" } },
  { symbol: "GOOGL", display: "GOOG", style: { top: "4%", right: "10%", transform: "rotate(5deg)" } },
  { symbol: "MSFT", style: { top: "38%", left: "18%", transform: "rotate(3deg)" } },
  { symbol: "AMZN", style: { top: "32%", right: "6%", transform: "rotate(-4deg)" } },
  { symbol: "NVDA", style: { bottom: "18%", left: "8%", transform: "rotate(7deg)" } },
  { symbol: "META", style: { bottom: "22%", right: "14%", transform: "rotate(-3deg)" } },
  { symbol: "SPY", style: { bottom: "6%", left: "36%", transform: "rotate(2deg)" } },
];

export default function TradeHomePage() {
  const [query, setQuery] = useState("");

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

  return (
    <div className="px-5 pb-6">
      <AppHeader centerLogo />

      <div className="mt-2 flex items-start justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl font-bold text-nest">Trade</h1>
          <p className="mt-1 text-sm text-muted">
            Hisse ve ETF al-sat · komisyonsuz
          </p>
        </div>
        <MarketStatusPill />
      </div>

      {/* Hero — floating ticker chips on navy */}
      <div className="relative mt-4 overflow-hidden rounded-2xl bg-nest px-4 pb-4 pt-4 text-white">
        <div
          className="pointer-events-none absolute inset-0 opacity-30"
          aria-hidden
          style={{
            backgroundImage:
              "linear-gradient(rgba(29,106,229,0.35) 1px, transparent 1px), linear-gradient(90deg, rgba(29,106,229,0.35) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        <div className="relative z-[1]">
          <p className="text-sm font-semibold">Kendi yönettiğin yatırım</p>
          <p className="mt-1 max-w-[70%] text-xs text-white/80">
            Popüler hisseler ve ETF&apos;ler — Investor Trade ile.
          </p>
        </div>
        <div className="relative z-[1] mt-3 h-[132px]">
          {HERO_CHIPS.map((c) => (
            <div
              key={c.symbol}
              className="absolute drop-shadow-lg"
              style={c.style}
            >
              <TickerChip symbol={c.symbol} displaySymbol={c.display} />
            </div>
          ))}
        </div>
        <ul className="relative z-[1] mt-2 space-y-1.5 border-t border-white/15 pt-3 text-xs text-white/90">
          <li className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gold text-[10px] font-bold text-nest">
              ✓
            </span>
            Komisyonsuz hisse ve ETF işlemleri
          </li>
          <li className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gold text-[10px] font-bold text-nest">
              ✓
            </span>
            Kesirli hisse — istediğin tutarla al
          </li>
          <li className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gold text-[10px] font-bold text-nest">
              ✓
            </span>
            Satışta vergi etkisi önizlemesi
          </li>
        </ul>
      </div>

      {/* Search — pill */}
      <div className="relative mt-5">
        <IconSearch
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted"
          size={18}
        />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Hisse veya ETF ara…"
          className="w-full rounded-full border border-black/5 bg-card py-3.5 pl-11 pr-4 text-sm text-nest outline-none ring-nest-blue/30 placeholder:text-muted focus:ring-2"
          aria-label="Ara"
        />
      </div>

      {/* Cash */}
      <div className="card mt-4 flex items-center justify-between p-4">
        <div>
          <p className="text-xs text-muted">Trade nakit</p>
          <p className="mt-0.5 text-lg font-bold text-nest tabular-nums">
            {formatUSD(TRADE_CASH_USD)}
          </p>
          <p className="text-[11px] text-muted">
            ≈ {formatTRY(Math.round(TRADE_CASH_USD * USD_TRY))}
          </p>
        </div>
        <span className="rounded-full bg-sage-muted px-2.5 py-1 text-[11px] font-semibold text-nest-blue">
          USD
        </span>
      </div>

      {/* Holdings */}
      <section className="mt-5">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-base font-semibold text-nest">Pozisyonların</h2>
          <p
            className={`text-xs font-semibold tabular-nums ${
              positionsPl >= 0 ? "text-nest-light" : "text-danger"
            }`}
          >
            {positionsPl >= 0 ? "+" : ""}
            {formatUSD(positionsPl)}
          </p>
        </div>
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-black/5 px-4 py-3">
            <div>
              <p className="text-xs text-muted">Toplam değer</p>
              <p className="text-base font-bold text-nest tabular-nums">
                {formatUSD(positionsValue)}
              </p>
            </div>
            <p className="text-[11px] text-muted">
              {TRADE_POSITIONS.length} pozisyon
            </p>
          </div>
          <ul className="divide-y divide-black/5">
            {TRADE_POSITIONS.map((p) => {
              const inst = getInstrument(p.symbol);
              return (
                <li key={p.symbol}>
                  <Link
                    href={`/trade/${p.symbol}`}
                    className="flex items-center gap-2.5 px-4 py-3 transition-colors hover:bg-sage-muted/50"
                  >
                    <span className="shrink-0 overflow-hidden rounded-full">
                      <TickerLogo symbol={p.symbol} size={40} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-nest">
                        {p.symbol}
                      </p>
                      <p className="text-xs text-muted">
                        {formatShares(p.shares)} hisse · ort.{" "}
                        {formatUSD(p.avgCost)}
                      </p>
                    </div>
                    {inst && (
                      <Sparkline
                        symbol={inst.symbol}
                        lastPrice={inst.price}
                        changePct={inst.changePct}
                      />
                    )}
                    <div className="min-w-[4.5rem] text-right">
                      <p className="text-sm font-semibold text-nest tabular-nums">
                        {formatUSD(p.value)}
                      </p>
                      <p
                        className={`text-xs font-medium tabular-nums ${
                          p.plPct >= 0 ? "text-nest-light" : "text-danger"
                        }`}
                      >
                        {formatPct(p.plPct)}
                      </p>
                    </div>
                    <IconChevron size={14} className="shrink-0 text-muted" />
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {query.trim() ? (
        <section className="mt-5">
          <h2 className="mb-2 text-base font-semibold text-nest">
            Sonuçlar ({filtered.length})
          </h2>
          <InstrumentList items={filtered} />
        </section>
      ) : (
        <>
          <section className="mt-5">
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
      <p className="card px-4 py-6 text-center text-sm text-muted">
        Eşleşen enstrüman yok
      </p>
    );
  }
  return (
    <ul className="card overflow-hidden divide-y divide-black/5">
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
            <Sparkline
              symbol={i.symbol}
              lastPrice={i.price}
              changePct={i.changePct}
            />
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
          </Link>
        </li>
      ))}
    </ul>
  );
}
