"use client";

import { useCallback, useLayoutEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { PhoneShell } from "./PhoneShell";
import { TabBar } from "./TabBar";
import { DesktopSidebar } from "./DesktopSidebar";
import { OnboardingGate } from "./OnboardingGate";
import { LiveSupportWidget } from "./LiveSupportWidget";
import { TradeThemeProvider } from "./TradeTheme";
import { PlatformBanner } from "./PlatformBanner";
import { applyDarkMode, getTradeTheme, type TradeTheme } from "@/lib/storage";

export function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLanding = pathname === "/" || pathname === "";
  const isAuth =
    pathname === "/giris" ||
    pathname.startsWith("/giris/") ||
    pathname === "/kayit" ||
    pathname.startsWith("/kayit/") ||
    pathname.startsWith("/onboarding");
  const isTrade = pathname === "/trade" || pathname.startsWith("/trade/");
  const isPublic =
    pathname === "/gizlilik" ||
    pathname === "/destek" ||
    pathname === "/agent" ||
    pathname.startsWith("/agent/");
  const isAdmin =
    pathname === "/admin" || pathname.startsWith("/admin/");
  const [tradeTheme, setTradeTheme] = useState<TradeTheme>("light");

  useLayoutEffect(() => {
    applyDarkMode();
    setTradeTheme(getTradeTheme());
  }, [pathname]);

  const onThemeChange = useCallback((t: TradeTheme) => {
    setTradeTheme(t);
  }, []);

  const shellClass = isTrade
    ? `trade-tv trade-tv-${tradeTheme}`
    : isLanding
      ? "hram-marketing-shell"
      : undefined;

  const shellLayout = isTrade
    ? "trade"
    : isLanding || isAdmin
      ? "marketing"
      : isAuth || isPublic
        ? "phone"
        : "app";

  const inner = (
    <OnboardingGate>
      {isTrade ? (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
            {children}
          </main>
        </div>
      ) : isLanding ? (
        <main className="hram-landing-root flex min-h-0 flex-1 flex-col overflow-y-auto">
          {children}
        </main>
      ) : isAdmin ? (
        <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {children}
        </main>
      ) : (
        <div className="app-chrome-body flex min-h-0 flex-1 overflow-hidden">
          {!isAuth && !isPublic && <DesktopSidebar />}
          <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
            <PlatformBanner />
            <main className="app-main flex-1 overflow-y-auto">
              <div
                className={
                  isAuth
                    ? "auth-content min-h-full"
                    : isPublic
                      ? "public-content"
                      : "app-content"
                }
              >
                {children}
              </div>
            </main>
            {!isAuth && !isPublic && <TabBar />}
          </div>
        </div>
      )}
    </OnboardingGate>
  );

  return (
    <PhoneShell layout={shellLayout} className={shellClass}>
      {isTrade ? (
        <TradeThemeProvider onThemeChange={onThemeChange}>
          {inner}
        </TradeThemeProvider>
      ) : (
        inner
      )}
      {/* Unified live support chat (text + mic). VoiceCommand overlay removed. */}
      {!isAdmin && <LiveSupportWidget />}
    </PhoneShell>
  );
}
