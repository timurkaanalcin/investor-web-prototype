"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { PhoneShell } from "./PhoneShell";
import { TabBar } from "./TabBar";
import { DesktopSidebar } from "./DesktopSidebar";
import { OnboardingGate } from "./OnboardingGate";
import { TradeThemeProvider } from "./TradeTheme";
import { getTradeTheme, type TradeTheme } from "@/lib/storage";

export function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isOnboarding = pathname.startsWith("/onboarding");
  const isTrade = pathname === "/trade" || pathname.startsWith("/trade/");
  const [tradeTheme, setTradeTheme] = useState<TradeTheme>("dark");

  useEffect(() => {
    if (isTrade) setTradeTheme(getTradeTheme());
  }, [isTrade]);

  const onThemeChange = useCallback((t: TradeTheme) => {
    setTradeTheme(t);
  }, []);

  const shellClass = isTrade
    ? `trade-tv trade-tv-${tradeTheme}`
    : undefined;

  const inner = (
    <OnboardingGate>
      {isTrade ? (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
            {children}
          </main>
        </div>
      ) : (
        <div className="app-chrome-body flex min-h-0 flex-1 overflow-hidden">
          {!isOnboarding && <DesktopSidebar />}
          <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
            <main className="app-main flex-1 overflow-y-auto">
              <div className="app-content">{children}</div>
            </main>
            {!isOnboarding && <TabBar />}
          </div>
        </div>
      )}
    </OnboardingGate>
  );

  return (
    <PhoneShell
      layout={isTrade ? "trade" : isOnboarding ? "phone" : "app"}
      className={shellClass}
    >
      {isTrade ? (
        <TradeThemeProvider onThemeChange={onThemeChange}>
          {inner}
        </TradeThemeProvider>
      ) : (
        inner
      )}
    </PhoneShell>
  );
}
