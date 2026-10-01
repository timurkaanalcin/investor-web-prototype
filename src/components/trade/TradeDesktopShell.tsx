"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconChevron, IconMoon, IconSun, IconUser } from "@/components/Icons";
import { useTradeTheme } from "@/components/TradeTheme";
import { useIsDesktop } from "@/hooks/useMediaQuery";
import {
  getMarketOpen,
  setMarketOpen,
  subscribeMarketOpen,
} from "@/lib/trade-watchlist-prefs";
import { TradeWatchlistPanel } from "./TradeWatchlistPanel";

function activeSymbolFromPath(pathname: string): string | null {
  const m = pathname.match(/^\/trade\/([^/]+)\/?$/);
  if (!m) return null;
  return decodeURIComponent(m[1]).toUpperCase();
}

/**
 * Desktop (≥768): left watchlist + flex area for page (chart/history full width; order via modal).
 * Market panel is collapsible (persisted). Mobile: pass-through.
 */
export function TradeDesktopShell({ children }: { children: React.ReactNode }) {
  const isDesktop = useIsDesktop();
  const pathname = usePathname();
  const activeSymbol = activeSymbolFromPath(pathname);
  const { theme, toggle } = useTradeTheme();
  const onHome = pathname === "/trade" || pathname === "/trade/";
  const [marketOpen, setMarketOpenState] = useState(false);

  useEffect(() => {
    setMarketOpenState(getMarketOpen());
    return subscribeMarketOpen(() => setMarketOpenState(getMarketOpen()));
  }, []);

  function toggleMarket() {
    const next = !marketOpen;
    setMarketOpen(next);
    setMarketOpenState(next);
  }

  if (!isDesktop) {
    return <>{children}</>;
  }

  return (
    <div
      className={`trade-desk trade-tv-root h-full min-h-0${
        marketOpen ? "" : " trade-desk--market-collapsed"
      }`}
    >
      {marketOpen ? (
        <aside className="trade-desk-left">
          <div className="trade-market-bar">
            <span className="trade-market-bar-title">Market</span>
            <button
              type="button"
              className="trade-market-toggle trade-press"
              aria-label="Listeyi gizle"
              title="Listeyi gizle"
              onClick={toggleMarket}
            >
              <IconChevron
                size={14}
                className="trade-market-chevron trade-market-chevron--open"
              />
              <span>Listeyi gizle</span>
            </button>
          </div>
          <div className="min-h-0 flex-1">
            <TradeWatchlistPanel
              activeSymbol={activeSymbol}
              showTopChrome={false}
              compact
            />
          </div>
        </aside>
      ) : (
        <aside className="trade-desk-left trade-desk-left--collapsed">
          <button
            type="button"
            className="trade-market-rail trade-press"
            aria-label="Listeyi göster"
            title="Listeyi göster"
            onClick={toggleMarket}
          >
            <IconChevron
              size={14}
              className="trade-market-chevron trade-market-chevron--closed"
            />
            <span className="trade-market-rail-label">Market</span>
          </button>
        </aside>
      )}
      <div className="relative flex min-h-0 min-w-0 flex-1">
        {onHome && (
          <div className="absolute right-3 top-2.5 z-20 flex gap-1">
            <button
              type="button"
              className="tv-icon-btn"
              aria-label={theme === "dark" ? "Beyaz tema" : "Siyah tema"}
              onClick={toggle}
            >
              {theme === "dark" ? (
                <IconSun size={16} />
              ) : (
                <IconMoon size={16} />
              )}
            </button>
            <Link
              href="/profil"
              className="tv-icon-btn"
              aria-label="Profil"
            >
              <IconUser size={16} />
            </Link>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
