"use client";

import { useEffect, useId, useRef, useState } from "react";
import {
  createChart,
  CandlestickSeries,
  LineSeries,
  AreaSeries,
  type IChartApi,
  type ISeriesApi,
  type CandlestickData,
  type Time,
  ColorType,
  CrosshairMode,
} from "lightweight-charts";
import type { TradeInstrument } from "@/lib/trade-instruments";
import { toYahooSymbol } from "@/lib/to-yahoo-symbol";
import {
  getBars,
  subscribeBars,
  unsubscribeBars,
  type Bar,
} from "@/lib/live-datafeed";

type Props = {
  instrument: Pick<TradeInstrument, "symbol" | "exchange" | "type" | "name">;
  /** TV-style resolution: 1, 5, 15, 60, 240, D, W */
  interval?: string;
  /** 1=candles, 2=line, 3=area */
  chartStyle?: string;
  theme?: "dark" | "light";
  height?: number;
  fill?: boolean;
  /** Optional live mid from useLiveInstrument — keeps chart 1:1 with header */
  livePrice?: number | null;
};

export function LiveTradingChart({
  instrument,
  interval = "W",
  chartStyle = "1",
  theme = "dark",
  height = 420,
  fill = false,
  livePrice,
}: Props) {
  const guid = useId().replace(/:/g, "");
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const lineRef = useRef<ISeriesApi<"Line"> | null>(null);
  const areaRef = useRef<ISeriesApi<"Area"> | null>(null);
  const lastBarTimeRef = useRef<number | null>(null);
  const liveBarRef = useRef<Bar | null>(null);
  const [ohlc, setOhlc] = useState<Bar | null>(null);
  const [liveFresh, setLiveFresh] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  const yahoo = toYahooSymbol(instrument);
  const isDark = theme === "dark";

  useEffect(() => {
    setMounted(true);
  }, []);

  const safeUpdate = (bar: Bar) => {
    const lastT = lastBarTimeRef.current;
    if (lastT != null && bar.time < lastT) return false;
    const candle: CandlestickData<Time> = {
      time: bar.time as Time,
      open: bar.open,
      high: bar.high,
      low: bar.low,
      close: bar.close,
    };
    try {
      candleRef.current?.update(candle);
      lineRef.current?.update({ time: bar.time as Time, value: bar.close });
      areaRef.current?.update({ time: bar.time as Time, value: bar.close });
      lastBarTimeRef.current = bar.time;
      liveBarRef.current = bar;
      setOhlc(bar);
      setLiveFresh(true);
      return true;
    } catch {
      return false;
    }
  };

  // Chart bootstrap
  useEffect(() => {
    if (!mounted || !containerRef.current) return;
    const el = containerRef.current;
    const chart = createChart(el, {
      layout: {
        background: {
          type: ColorType.Solid,
          color: isDark ? "#131722" : "#ffffff",
        },
        textColor: isDark ? "#d1d4dc" : "#131722",
      },
      grid: {
        vertLines: { color: isDark ? "#2a2e39" : "#e0e3eb" },
        horzLines: { color: isDark ? "#2a2e39" : "#e0e3eb" },
      },
      crosshair: { mode: CrosshairMode.Normal },
      rightPriceScale: { borderColor: isDark ? "#2a2e39" : "#e0e3eb" },
      timeScale: {
        borderColor: isDark ? "#2a2e39" : "#e0e3eb",
        timeVisible: true,
        secondsVisible: false,
      },
      width: el.clientWidth || 320,
      height: fill ? el.clientHeight || height : height,
    });
    chartRef.current = chart;

    candleRef.current = chart.addSeries(CandlestickSeries, {
      upColor: "#26a69a",
      downColor: "#ef5350",
      borderUpColor: "#26a69a",
      borderDownColor: "#ef5350",
      wickUpColor: "#26a69a",
      wickDownColor: "#ef5350",
      visible: chartStyle === "1",
    });
    lineRef.current = chart.addSeries(LineSeries, {
      color: "#2962ff",
      lineWidth: 2,
      visible: chartStyle === "2",
    });
    areaRef.current = chart.addSeries(AreaSeries, {
      lineColor: "#2962ff",
      topColor: "rgba(41, 98, 255, 0.35)",
      bottomColor: "rgba(41, 98, 255, 0.05)",
      lineWidth: 2,
      visible: chartStyle === "3",
    });

    const ro =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => {
            if (!containerRef.current || !chartRef.current) return;
            chartRef.current.applyOptions({
              width: containerRef.current.clientWidth,
              height: fill
                ? containerRef.current.clientHeight
                : height,
            });
          })
        : null;
    ro?.observe(el);

    return () => {
      ro?.disconnect();
      chart.remove();
      chartRef.current = null;
      candleRef.current = null;
      lineRef.current = null;
      areaRef.current = null;
      liveBarRef.current = null;
      lastBarTimeRef.current = null;
    };
  }, [mounted, isDark, fill, height]);

  // Style toggle
  useEffect(() => {
    candleRef.current?.applyOptions({ visible: chartStyle === "1" });
    lineRef.current?.applyOptions({ visible: chartStyle === "2" });
    areaRef.current?.applyOptions({ visible: chartStyle === "3" });
  }, [chartStyle]);

  // History + subscribeBars streaming
  useEffect(() => {
    if (!mounted) return;
    let cancelled = false;
    const listenerGuid = `${guid}_${instrument.symbol}_${interval}`;

    async function boot() {
      setError(null);
      lastBarTimeRef.current = null;
      liveBarRef.current = null;
      const { bars, price, error: err } = await getBars(
        instrument.symbol,
        yahoo,
        interval
      );
      if (cancelled || !candleRef.current) return;
      if (err && !bars.length) {
        setError(err);
        return;
      }

      let series = bars;
      const mid =
        livePrice && livePrice > 0
          ? livePrice
          : price && price > 0
            ? price
            : null;
      if (series.length && mid != null) {
        const last = series[series.length - 1];
        const nowSec = Math.floor(Date.now() / 1000);
        // Import align via getBars already aligned; reuse last.time floor
        const step =
          interval === "1" || interval === "1m"
            ? 60
            : interval === "5" || interval === "5m"
              ? 300
              : interval === "15" || interval === "15m"
                ? 900
                : interval === "60"
                  ? 3600
                  : interval === "240"
                    ? 14400
                    : 0;
        let t = step > 0 ? Math.floor(nowSec / step) * step : last.time;
        if (t < last.time) t = last.time;
        if (t === last.time) {
          series = [
            ...series.slice(0, -1),
            {
              time: last.time,
              open: last.open,
              high: Math.max(last.high, mid),
              low: Math.min(last.low, mid),
              close: mid,
            },
          ];
        } else {
          series = [
            ...series,
            {
              time: t,
              open: last.close,
              high: Math.max(last.close, mid),
              low: Math.min(last.close, mid),
              close: mid,
            },
          ];
        }
      }

      if (series.length) {
        try {
          const data = series.map((b) => ({
            time: b.time as Time,
            open: b.open,
            high: b.high,
            low: b.low,
            close: b.close,
          }));
          candleRef.current.setData(data);
          lineRef.current?.setData(
            data.map((b) => ({ time: b.time, value: b.close }))
          );
          areaRef.current?.setData(
            data.map((b) => ({ time: b.time, value: b.close }))
          );
          const last = series[series.length - 1];
          lastBarTimeRef.current = last.time;
          liveBarRef.current = last;
          setOhlc(last);
          chartRef.current?.timeScale().fitContent();
        } catch {
          setError("Grafik güncellenemedi");
        }
      }

      subscribeBars(
        instrument.symbol,
        yahoo,
        interval,
        (bar) => {
          if (cancelled) return;
          safeUpdate(bar);
        },
        listenerGuid,
        liveBarRef.current
      );
    }

    boot();
    return () => {
      cancelled = true;
      unsubscribeBars(listenerGuid);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, instrument.symbol, yahoo, interval]);

  // Header live mid → forming bar (≤1s path from useLiveInstrument)
  useEffect(() => {
    if (livePrice == null || !Number.isFinite(livePrice) || livePrice <= 0) return;
    const nowSec = Math.floor(Date.now() / 1000);
    const isWeek = interval === "W" || interval === "1W";
    const isDay = interval === "D" || interval === "1D";
    const step =
      interval === "1" || interval === "1m"
        ? 60
        : interval === "5" || interval === "5m"
          ? 300
          : interval === "15" || interval === "15m"
            ? 900
            : interval === "60"
              ? 3600
              : interval === "240"
                ? 14400
                : isDay
                  ? 86400
                  : isWeek
                    ? 604800
                    : 0;
    const lastT = lastBarTimeRef.current;
    let t: number;
    if (isWeek || isDay) {
      // Extend Yahoo's last D/W bar — do not invent a "now" stamp (distorts forming candle)
      if (lastT != null) {
        const period = isWeek ? 604800 : 86400;
        t = nowSec - lastT < period ? lastT : lastT;
      } else if (isDay) {
        t = Math.floor(nowSec / 86400) * 86400;
      } else {
        const day = Math.floor(nowSec / 86400);
        const daysSinceMonday = (day + 4) % 7;
        t = (day - daysSinceMonday) * 86400;
      }
    } else {
      t = step > 0 ? Math.floor(nowSec / step) * step : nowSec;
      if (lastT != null && t < lastT) t = lastT;
    }
    const prev = liveBarRef.current;
    if (!prev || prev.time !== t) {
      const open = prev && prev.time < t ? prev.close : livePrice;
      safeUpdate({
        time: t,
        open,
        high: Math.max(open, livePrice),
        low: Math.min(open, livePrice),
        close: livePrice,
      });
    } else {
      safeUpdate({
        time: t,
        open: prev.open,
        high: Math.max(prev.high, livePrice),
        low: Math.min(prev.low, livePrice),
        close: livePrice,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [livePrice, instrument.symbol, interval]);

  // Stale LIVE after 2.5s without tick
  useEffect(() => {
    const id = window.setInterval(() => {
      /* freshness driven by safeUpdate; soft fade if ohlc frozen long */
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  const digits =
    ohlc && ohlc.close >= 100
      ? 2
      : ohlc && ohlc.close < 1
        ? 6
        : ohlc && ohlc.close < 10
          ? 5
          : 4;
  const fmt = (n: number) => n.toFixed(digits);

  return (
    <div
      className={`relative flex w-full flex-col overflow-hidden ${
        fill ? "h-full min-h-0 flex-1" : ""
      }`}
      style={fill ? undefined : { height }}
    >
      <div className="pointer-events-none absolute left-3 top-2.5 z-10 flex items-start gap-2">
        <span
          className={`mt-0.5 flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide ring-1 ${
            liveFresh
              ? "bg-[#26a69a]/20 text-[#26a69a] ring-[#26a69a]/40"
              : "bg-[var(--tv-panel)] text-[var(--tv-muted)] ring-[var(--tv-border)]"
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              liveFresh ? "animate-pulse bg-[#26a69a]" : "bg-[var(--tv-muted)]"
            }`}
          />
          LIVE
        </span>
        <div>
          <div
            className={`text-[13px] font-semibold ${
              isDark ? "text-[#d1d4dc]" : "text-[#131722]"
            }`}
          >
            {instrument.symbol}
          </div>
          {ohlc && (
            <div className="mt-0.5 flex flex-wrap gap-x-2 text-[10px] tabular-nums text-[var(--tv-muted)]">
              <span>
                O <span className="text-[var(--tv-text)]">{fmt(ohlc.open)}</span>
              </span>
              <span>
                H <span className="text-[#26a69a]">{fmt(ohlc.high)}</span>
              </span>
              <span>
                L <span className="text-[#ef5350]">{fmt(ohlc.low)}</span>
              </span>
              <span>
                C <span className="text-[var(--tv-text)]">{fmt(ohlc.close)}</span>
              </span>
            </div>
          )}
        </div>
      </div>
      {error && (
        <div className="absolute bottom-3 left-1/2 z-20 -translate-x-1/2 rounded bg-amber-500/95 px-3 py-1 text-[11px] font-medium text-black">
          {error}
        </div>
      )}
      <div ref={containerRef} className="min-h-0 flex-1 w-full" />
    </div>
  );
}
