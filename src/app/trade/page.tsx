"use client";

import { TradeWatchlistPanel } from "@/components/trade/TradeWatchlistPanel";
import { useIsDesktop } from "@/hooks/useMediaQuery";

export default function TradeHomePage() {
  const isDesktop = useIsDesktop();

  if (isDesktop) {
    return (
      <div className="trade-tv-root flex h-full min-h-0 flex-col items-center justify-center px-8 text-center">
        <div className="max-w-sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--tv-muted)]">
            Investor Trade
          </p>
          <h1 className="mt-3 text-[22px] font-bold tracking-tight text-[var(--tv-text)]">
            Bir hisse seçin
          </h1>
          <p className="mt-2 text-[14px] leading-relaxed text-[var(--tv-muted)]">
            Soldaki izleme listesinden bir sembole tıklayın. Grafik ve Al/Sat
            paneli burada açılır.
          </p>
        </div>
      </div>
    );
  }

  return <TradeWatchlistPanel showTopChrome />;
}
