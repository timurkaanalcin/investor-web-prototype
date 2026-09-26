"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { PhoneShell } from "./PhoneShell";
import { TabBar } from "./TabBar";
import { OnboardingGate } from "./OnboardingGate";
import { TradeThemeProvider } from "./TradeTheme";
import { getTradeTheme, type TradeTheme } from "@/lib/storage";

export function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isOnboarding = pathname.startsWith("/onboarding");
  // Trade terminal — full-screen TV UI (no bottom tabs)
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
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <main
          className={
            isTrade
              ? "flex min-h-0 flex-1 flex-col overflow-hidden"
              : "flex-1 overflow-y-auto"
          }
        >
          {children}
        </main>
        {!isOnboarding && !isTrade && <TabBar />}
      </div>
    </OnboardingGate>
  );

  return (
    <PhoneShell className={shellClass}>
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
