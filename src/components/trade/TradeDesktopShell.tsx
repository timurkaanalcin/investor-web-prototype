"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconMoon, IconSun, IconUser } from "@/components/Icons";
import { useTradeTheme } from "@/components/TradeTheme";
import { useIsDesktop } from "@/hooks/useMediaQuery";
import { TradeWatchlistPanel } from "./TradeWatchlistPanel";

function activeSymbolFromPath(pathname: string): string | null {
  const m = pathname.match(/^\/trade\/([^/]+)\/?$/);
  if (!m) return null;
  return decodeURIComponent(m[1]).toUpperCase();
}

/**
 * Desktop (≥768): left watchlist + flex area for page (center ± right ticket).
 * Mobile: pass-through.
 */
export function TradeDesktopShell({ children }: { children: React.ReactNode }) {
  const isDesktop = useIsDesktop();
  const pathname = usePathname();
  const activeSymbol = activeSymbolFromPath(pathname);
  const { theme, toggle } = useTradeTheme();
  const onHome = pathname === "/trade" || pathname === "/trade/";

  if (!isDesktop) {
    return <>{children}</>;
  }

  return (
    <div className="trade-desk trade-tv-root h-full min-h-0">
      <aside className="trade-desk-left">
        <TradeWatchlistPanel
          activeSymbol={activeSymbol}
          showTopChrome={false}
          compact
        />
      </aside>
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
