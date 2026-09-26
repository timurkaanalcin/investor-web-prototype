"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { TradeInstrument } from "@/lib/trade-instruments";
import { toTradingViewSymbol } from "@/lib/tradingview-symbols";

declare global {
  interface Window {
    TradingView?: {
      widget: new (options: Record<string, unknown>) => { remove?: () => void };
    };
  }
}

const TV_SCRIPT = "https://s3.tradingview.com/tv.js";
const HEIGHT = 460;

let scriptPromise: Promise<void> | null = null;

function loadTradingViewScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject();
  if (window.TradingView) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${TV_SCRIPT}"]`
    );
    if (existing) {
      if (window.TradingView) {
        resolve();
        return;
      }
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () =>
        reject(new Error("TradingView script failed"))
      );
      return;
    }
    const script = document.createElement("script");
    script.src = TV_SCRIPT;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("TradingView script failed"));
    document.head.appendChild(script);
  });

  return scriptPromise;
}

type Props = {
  instrument: Pick<TradeInstrument, "symbol" | "exchange" | "type" | "name">;
  height?: number;
};

/**
 * Official TradingView Advanced Chart embed — client-only for static export.
 */
export function TradingViewChart({ instrument, height = HEIGHT }: Props) {
  const rawId = useId().replace(/:/g, "");
  const containerId = `tv_${instrument.symbol}_${rawId}`;
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<{ remove?: () => void } | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading"
  );

  const tvSymbol = toTradingViewSymbol(instrument);

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");

    loadTradingViewScript()
      .then(() => {
        if (cancelled || !window.TradingView || !containerRef.current) return;

        if (widgetRef.current?.remove) {
          try {
            widgetRef.current.remove();
          } catch {
            /* ignore */
          }
        }
        containerRef.current.innerHTML = "";

        const widget = new window.TradingView.widget({
          autosize: true,
          symbol: tvSymbol,
          interval: "D",
          timezone: "Europe/Istanbul",
          theme: "light",
          style: "1",
          locale: "tr",
          toolbar_bg: "#f9f0e2",
          enable_publishing: false,
          allow_symbol_change: false,
          hide_side_toolbar: false,
          hide_top_toolbar: false,
          hide_legend: false,
          save_image: false,
          withdateranges: true,
          details: false,
          hotlist: false,
          calendar: false,
          studies: [],
          container_id: containerId,
          overrides: {
            "paneProperties.background": "#ffffff",
            "paneProperties.backgroundType": "solid",
            "paneProperties.vertGridProperties.color": "rgba(0, 11, 80, 0.06)",
            "paneProperties.horzGridProperties.color": "rgba(0, 11, 80, 0.06)",
            "scalesProperties.textColor": "#5c5c5c",
            "mainSeriesProperties.candleStyle.upColor": "#1a7a4c",
            "mainSeriesProperties.candleStyle.downColor": "#c44536",
            "mainSeriesProperties.candleStyle.borderUpColor": "#1a7a4c",
            "mainSeriesProperties.candleStyle.borderDownColor": "#c44536",
            "mainSeriesProperties.candleStyle.wickUpColor": "#1a7a4c",
            "mainSeriesProperties.candleStyle.wickDownColor": "#c44536",
          },
          disabled_features: [
            "header_symbol_search",
            "header_compare",
            "header_screenshot",
            "display_market_status",
          ],
          enabled_features: ["hide_left_toolbar_by_default"],
        });

        widgetRef.current = widget;
        setStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });

    return () => {
      cancelled = true;
      if (widgetRef.current?.remove) {
        try {
          widgetRef.current.remove();
        } catch {
          /* ignore */
        }
      }
      widgetRef.current = null;
    };
  }, [tvSymbol, containerId]);

  return (
    <div className="w-full">
      <div
        className="relative overflow-hidden rounded-2xl bg-card shadow-[0_4px_24px_rgba(0,11,80,0.08)] ring-1 ring-black/[0.06]"
        style={{ height }}
      >
        {(status === "loading" || status === "error") && (
          <div
            className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-[#fafbfd] px-6 text-center"
            aria-live="polite"
          >
            {status === "loading" ? (
              <p className="text-[13px] text-muted">TradingView yükleniyor…</p>
            ) : (
              <>
                <p className="text-[14px] font-semibold text-nest">
                  Grafik yüklenemedi
                </p>
                <p className="text-[12px] text-muted">
                  Basit moda geçerek Investor grafiğini kullanabilirsiniz.
                </p>
              </>
            )}
          </div>
        )}
        <div
          id={containerId}
          ref={containerRef}
          className="h-full w-full"
          style={{ minHeight: height }}
        />
      </div>
      <p className="mt-2 text-center text-[11px] leading-relaxed text-muted">
        Canlı TradingView grafiği · sembol borsaya göre eşlenir
        <span className="mx-1 text-black/20">·</span>
        <span className="tabular-nums">{tvSymbol}</span>
      </p>
    </div>
  );
}
