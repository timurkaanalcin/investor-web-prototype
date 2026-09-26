"use client";

import { usePathname } from "next/navigation";
import { PhoneShell } from "./PhoneShell";
import { TabBar } from "./TabBar";
import { OnboardingGate } from "./OnboardingGate";

export function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isOnboarding = pathname.startsWith("/onboarding");
  // Trade terminal — full-screen TV dark UI (no bottom tabs)
  const isTrade = pathname === "/trade" || pathname.startsWith("/trade/");

  return (
    <PhoneShell className={isTrade ? "trade-tv" : undefined}>
      <OnboardingGate>
        <div className="flex min-h-0 flex-1 flex-col">
          <main className="flex-1 overflow-y-auto">{children}</main>
          {!isOnboarding && !isTrade && <TabBar />}
        </div>
      </OnboardingGate>
    </PhoneShell>
  );
}
