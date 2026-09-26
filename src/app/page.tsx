"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { LineChart } from "@/components/Charts";
import { IconArrowUp, IconChevron } from "@/components/Icons";
import { TickerLogo } from "@/components/TickerLogos";
import {
  CHART_POINTS,
  MONTHLY_GAIN,
  TOTAL_BALANCE,
  TRANSACTIONS,
  TX_SIDE_LABEL,
  formatTRY,
  formatTxAmount,
  type Transaction,
  type TxSide,
} from "@/lib/mock-data";
import { getExtraTransactions } from "@/lib/storage";

const RANGES = ["1H", "1A", "3A", "1Y", "Tümü"] as const;

const SIDE_BADGE: Record<TxSide, string> = {
  buy: "bg-sage-muted text-nest-blue",
  sell: "bg-red-50 text-danger",
  deposit: "bg-emerald-50 text-gain",
  withdraw: "bg-amber-50 text-amber-700",
};

export default function DashboardPage() {
  const [range, setRange] = useState<(typeof RANGES)[number]>("1A");
  const [recent, setRecent] = useState<Transaction[]>(TRANSACTIONS.slice(0, 4));

  useEffect(() => {
    const extra = getExtraTransactions() as Transaction[];
    const merged = [...extra, ...TRANSACTIONS];
    const seen = new Set<string>();
    const unique = merged.filter((t) => {
      if (seen.has(t.id)) return false;
      seen.add(t.id);
      return true;
    });
    setRecent(unique.slice(0, 4));
  }, []);

  const points = useMemo(() => {
    const n =
      range === "1H" ? 2 : range === "1A" ? 5 : range === "3A" ? 5 : 5;
    return CHART_POINTS.slice(-n);
  }, [range]);

  return (
    <div className="px-5 pb-6">
      <AppHeader />

      <section className="mt-2">
        <p className="text-sm font-medium text-nest/70">Toplam bakiye</p>
        <h1 className="mt-1 text-4xl font-bold tracking-tight text-nest">
          {formatTRY(TOTAL_BALANCE)}
        </h1>
        <p className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-sm font-medium text-gain">
          <IconArrowUp size={14} />
          +{formatTRY(MONTHLY_GAIN)} bu ay
        </p>
      </section>

      <section className="card mt-5 overflow-hidden px-3 pb-3 pt-3">
        <div className="mb-2 flex gap-1.5 overflow-x-auto px-1">
          {RANGES.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRange(r)}
              className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors active:scale-95 ${
                range === r
                  ? "bg-nest text-white"
                  : "bg-beige text-muted hover:text-nest"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
        <LineChart points={points} />
      </section>

      <section className="mt-5">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-base font-semibold text-nest">Son işlemler</h2>
          <Link
            href="/islemler"
            className="inline-flex items-center text-sm font-medium text-nest-blue active:opacity-70"
          >
            Tümü <IconChevron size={16} />
          </Link>
        </div>
        <ul className="card overflow-hidden divide-y divide-black/5">
          {recent.map((tx) => (
            <li key={tx.id}>
              <Link
                href="/islemler"
                className="flex items-center gap-3 px-3.5 py-3 transition-colors active:bg-sage-muted/50"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-sage-muted">
                  {tx.symbol ? (
                    <TickerLogo symbol={tx.symbol} size={36} />
                  ) : (
                    <span className="text-xs font-bold text-nest">
                      {tx.side === "deposit" ? "↓" : "↑"}
                    </span>
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="truncate text-sm font-semibold text-nest">
                      {tx.title}
                    </p>
                    <span
                      className={`rounded-full px-1.5 py-0.5 text-[9px] font-semibold ${SIDE_BADGE[tx.side]}`}
                    >
                      {TX_SIDE_LABEL[tx.side]}
                    </span>
                  </div>
                  <p className="truncate text-[11px] text-muted">
                    {tx.subtitle || tx.date}
                  </p>
                </div>
                <p className="text-sm font-semibold text-nest">
                  {formatTxAmount(tx)}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-5">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-base font-semibold text-nest">Portföyün</h2>
          <Link
            href="/yatir"
            className="inline-flex items-center text-sm font-medium text-nest-blue active:opacity-70"
          >
            Detaylar <IconChevron size={16} />
          </Link>
        </div>
        <Link
          href="/yatir"
          className="card flex items-center gap-3 p-4 transition-transform active:scale-[0.99]"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-sage-muted text-nest">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm1 2.07A8 8 0 0 1 19.93 11H13zM4 12a8 8 0 0 1 7-7.93V19.93A8 8 0 0 1 4 12zm9 7.93V13h6.93A8 8 0 0 1 13 19.93z" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-nest">Dağılım</p>
            <p className="text-xs text-muted">ETF %80 · Nakit %20</p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="rounded-full bg-sage-soft px-2.5 py-0.5 text-[11px] font-semibold text-nest">
              ETF 80%
            </span>
            <span className="rounded-full bg-beige/80 px-2.5 py-0.5 text-[11px] font-semibold text-nest/80">
              Nakit 20%
            </span>
          </div>
        </Link>
      </section>
    </div>
  );
}
