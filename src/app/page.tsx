"use client";

import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { LineChart, ProgressRing } from "@/components/Charts";
import { IconArrowUp, IconChevron } from "@/components/Icons";
import {
  CHART_POINTS,
  DASHBOARD_GOALS,
  MONTHLY_GAIN,
  TOTAL_BALANCE,
  formatTRY,
} from "@/lib/mock-data";

export default function DashboardPage() {
  return (
    <div className="px-5 pb-6">
      <AppHeader />

      <section className="mt-2">
        <p className="text-sm font-medium text-nest/80">Merhaba</p>
        <h1 className="mt-1 text-4xl font-bold tracking-tight text-nest">
          {formatTRY(TOTAL_BALANCE)}
        </h1>
        <p className="mt-1.5 inline-flex items-center gap-1 text-sm font-medium text-nest-light">
          <IconArrowUp size={14} />
          +{formatTRY(MONTHLY_GAIN)} bu ay
        </p>
      </section>

      <section className="card mt-5 px-3 pb-3 pt-4">
        <LineChart points={CHART_POINTS} />
      </section>

      <section className="mt-4 grid grid-cols-2 gap-3">
        {DASHBOARD_GOALS.map((g) => (
          <div key={g.id} className="card flex flex-col gap-2 p-3.5">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-nest">{g.title}</p>
                <p className="mt-1 text-[11px] text-muted">
                  Hedef: {formatTRY(g.target)}
                </p>
                <p className="text-[11px] font-medium text-nest">
                  {formatTRY(g.current)}
                </p>
              </div>
              <ProgressRing pct={g.pct} size={52} />
            </div>
          </div>
        ))}
      </section>

      <section className="mt-5">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-base font-semibold text-nest">Portföyün</h2>
          <Link
            href="/yatir"
            className="inline-flex items-center text-sm font-medium text-nest-light"
          >
            Detaylar <IconChevron size={16} />
          </Link>
        </div>
        <div className="card flex items-center gap-3 p-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-sage-muted text-nest">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm1 2.07A8 8 0 0 1 19.93 11H13zM4 12a8 8 0 0 1 7-7.93V19.93A8 8 0 0 1 4 12zm9 7.93V13h6.93A8 8 0 0 1 13 19.93z" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-nest">Dağılım</p>
            <p className="text-xs text-muted">Varlık dağılımın</p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="rounded-full bg-sage-soft px-2.5 py-0.5 text-[11px] font-semibold text-nest">
              ETF 80%
            </span>
            <span className="rounded-full bg-beige/80 px-2.5 py-0.5 text-[11px] font-semibold text-nest/80">
              Nakit 20%
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}
