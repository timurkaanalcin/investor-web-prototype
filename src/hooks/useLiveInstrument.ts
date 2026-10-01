"use client";

import { useEffect, useMemo, useState } from "react";
import type { TradeInstrument } from "@/lib/trade-instruments";
import { toYahooSymbol } from "@/lib/to-yahoo-symbol";

export type LiveQuote = {
  symbol: string;
  yahoo: string;
  price: number;
  previousClose: number;
  change: number;
  changePct: number;
  open: number;
  high: number;
  low: number;
  close: number;
  ts: number;
};

type Options = {
  /** Poll interval ms (default 2000). */
  intervalMs?: number;
  /** When false, keep catalog mock price (default true). */
  enabled?: boolean;
};

/**
 * Overlay a live Yahoo mid on a catalog instrument so UI (header, özet, Al/Sat)
 * matches TradingView / real market 1:1. Falls back to catalog price on error.
 */
export function useLiveInstrument(
  instrument: TradeInstrument | undefined,
  options: Options = {}
): {
  instrument: TradeInstrument | undefined;
  quote: LiveQuote | null;
  live: boolean;
} {
  const intervalMs = options.intervalMs ?? 800;
  const enabled = options.enabled !== false;
  const [quote, setQuote] = useState<LiveQuote | null>(null);

  const yahoo = useMemo(
    () => (instrument ? toYahooSymbol(instrument) : ""),
    [instrument]
  );

  useEffect(() => {
    if (!enabled || !instrument || !yahoo) {
      setQuote(null);
      return;
    }
    let cancelled = false;

    async function pull() {
      try {
        const qs = new URLSearchParams({
          symbol: instrument!.symbol,
          yahoo,
        });
        const res = await fetch(`/api/quote.php?${qs.toString()}`, {
          cache: "no-store",
        });
        if (!res.ok) return;
        const data = (await res.json()) as LiveQuote;
        if (cancelled || !data?.price || !Number.isFinite(data.price)) return;
        setQuote(data);
      } catch {
        /* keep last good / catalog */
      }
    }

    pull();
    const id = window.setInterval(pull, intervalMs);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [enabled, instrument?.symbol, yahoo, intervalMs]);

  const liveInstrument = useMemo(() => {
    if (!instrument) return undefined;
    if (!quote || !Number.isFinite(quote.price) || quote.price <= 0) return instrument;
    return {
      ...instrument,
      price: quote.price,
      changePct: quote.changePct,
    };
  }, [instrument, quote]);

  return {
    instrument: liveInstrument,
    quote,
    live: !!quote && Number.isFinite(quote.price),
  };
}
