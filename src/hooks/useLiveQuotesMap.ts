"use client";

import { useEffect, useMemo, useState } from "react";
import type { TradeInstrument } from "@/lib/trade-instruments";
import { toYahooSymbol } from "@/lib/to-yahoo-symbol";
import type { LiveQuote } from "@/hooks/useLiveInstrument";

/**
 * Batch-poll live Yahoo quotes for the visible watchlist (max 24 / request).
 * Returns instruments with price/changePct overlaid when a live quote exists.
 */
export function useLiveQuotesMap(
  instruments: TradeInstrument[],
  intervalMs = 4000
): TradeInstrument[] {
  const [quotes, setQuotes] = useState<Record<string, LiveQuote>>({});

  const pairsKey = useMemo(() => {
    return instruments
      .slice(0, 24)
      .map((i) => `${i.symbol}|${toYahooSymbol(i)}`)
      .join(",");
  }, [instruments]);

  useEffect(() => {
    if (!pairsKey) {
      setQuotes({});
      return;
    }
    let cancelled = false;

    async function pull() {
      try {
        const res = await fetch(
          `/api/quote.php?pairs=${encodeURIComponent(pairsKey)}`,
          { cache: "no-store" }
        );
        if (!res.ok) return;
        const data = await res.json();
        const list: LiveQuote[] = data.quotes || [];
        if (cancelled) return;
        const map: Record<string, LiveQuote> = {};
        for (const q of list) {
          if (q?.symbol && Number.isFinite(q.price) && q.price > 0) {
            map[q.symbol.toUpperCase()] = q;
          }
        }
        if (Object.keys(map).length) setQuotes((prev) => ({ ...prev, ...map }));
      } catch {
        /* keep previous */
      }
    }

    pull();
    const id = window.setInterval(pull, intervalMs);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [pairsKey, intervalMs]);

  return useMemo(
    () =>
      instruments.map((i) => {
        const q = quotes[i.symbol.toUpperCase()];
        if (!q) return i;
        return { ...i, price: q.price, changePct: q.changePct };
      }),
    [instruments, quotes]
  );
}
