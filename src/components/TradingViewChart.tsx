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
const HEIGHT = 540;

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
  theme?: "dark" | "light";
};

/**
 * Official TradingView Advanced Chart embed — client-only for static export.
 */
export function TradingViewChart({
  instrument,
  height = HEIGHT,
  theme = "dark",
}: Props) {
  const rawId = useId().replace(/:/g, "");
  const containerId = `tv_${instrument.symbol}_${rawId}`;
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<{ remove?: () => void } | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading"
  );

  const tvSymbol = toTradingViewSymbol(instrument);
  const isDark = theme === "dark";

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
          theme: isDark ? "dark" : "light",
          style: "1",
          locale: "tr",
          toolbar_bg: isDark ? "#1e222d" : "#f0f3fa",
          enable_publishing: false,
          allow_symbol_change: false,
          hide_side_toolbar: true,
          hide_top_toolbar: true,
          hide_legend: false,
          save_image: false,
          withdateranges: false,
          details: false,
          hotlist: false,
          calendar: false,
          studies: [],
          container_id: containerId,
          overrides: isDark
            ? {
                "paneProperties.background": "#131722",
                "paneProperties.backgroundType": "solid",
                "paneProperties.vertGridProperties.color": "#2a2e39",
                "paneProperties.horzGridProperties.color": "#2a2e39",
                "scalesProperties.textColor": "#d1d4dc",
                "mainSeriesProperties.candleStyle.upColor": "#26a69a",
                "mainSeriesProperties.candleStyle.downColor": "#ef5350",
                "mainSeriesProperties.candleStyle.borderUpColor": "#26a69a",
                "mainSeriesProperties.candleStyle.borderDownColor": "#ef5350",
                "mainSeriesProperties.candleStyle.wickUpColor": "#26a69a",
                "mainSeriesProperties.candleStyle.wickDownColor": "#ef5350",
              }
            : {
                "paneProperties.background": "#ffffff",
                "paneProperties.backgroundType": "solid",
                "paneProperties.vertGridProperties.color": "#e0e3eb",
                "paneProperties.horzGridProperties.color": "#e0e3eb",
                "scalesProperties.textColor": "#131722",
                "mainSeriesProperties.candleStyle.upColor": "#26a69a",
                "mainSeriesProperties.candleStyle.downColor": "#ef5350",
                "mainSeriesProperties.candleStyle.borderUpColor": "#26a69a",
                "mainSeriesProperties.candleStyle.borderDownColor": "#ef5350",
                "mainSeriesProperties.candleStyle.wickUpColor": "#26a69a",
                "mainSeriesProperties.candleStyle.wickDownColor": "#ef5350",
              },
          disabled_features: [
            "header_widget",
            "header_widget_dom_node",
            "header_symbol_search",
            "header_resolutions",
            "header_chart_type",
            "header_compare",
            "header_undo_redo",
            "header_screenshot",
            "header_fullscreen_button",
            "header_settings",
            "header_indicators",
            "timeframes_toolbar",
            "control_bar",
            "edit_buttons_in_legend",
            "border_around_the_chart",
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
  }, [tvSymbol, containerId, isDark]);

  return (
    <div className="w-full">
      <div
        className={`relative overflow-hidden rounded-none border-y ${
          isDark
            ? "border-[#2a2e39] bg-[#131722]"
            : "border-[#e0e3eb] bg-[#ffffff]"
        }`}
        style={{ height }}
      >
        {(status === "loading" || status === "error") && (
          <div
            className={`absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 px-6 text-center ${
              isDark ? "bg-[#131722]" : "bg-[#ffffff]"
            }`}
            aria-live="polite"
          >
            {status === "loading" ? (
              <p
                className={`text-[13px] ${
                  isDark ? "text-[#787b86]" : "text-[#6a6d78]"
                }`}
              >
                TradingView yükleniyor…
              </p>
            ) : (
              <>
                <p
                  className={`text-[14px] font-semibold ${
                    isDark ? "text-[#d1d4dc]" : "text-[#131722]"
                  }`}
                >
                  Grafik yüklenemedi
                </p>
                <p
                  className={`text-[12px] ${
                    isDark ? "text-[#787b86]" : "text-[#6a6d78]"
                  }`}
                >
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
      <p
        className={`mt-2 text-center text-[11px] leading-relaxed ${
          isDark ? "text-[#787b86]" : "text-[#6a6d78]"
        }`}
      >
        Canlı TradingView grafiği · sembol borsaya göre eşlenir
        <span
          className={`mx-1 ${isDark ? "text-[#2a2e39]" : "text-[#e0e3eb]"}`}
        >
          ·
        </span>
        <span className="tabular-nums">{tvSymbol}</span>
      </p>
    </div>
  );
}
