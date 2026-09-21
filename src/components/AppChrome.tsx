"use client";

import { usePathname } from "next/navigation";
import { PhoneShell } from "./PhoneShell";
import { TabBar } from "./TabBar";
import { OnboardingGate } from "./OnboardingGate";

export function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isOnboarding = pathname.startsWith("/onboarding");
  // Full-screen trade ticket / symbol detail — no bottom tabs (Betterment feel)
  const isTradeSymbol =
    pathname.startsWith("/trade/") && pathname !== "/trade/";

  return (
    <PhoneShell>
      <OnboardingGate>
        <div className="flex min-h-0 flex-1 flex-col">
          <main className="flex-1 overflow-y-auto">{children}</main>
          {!isOnboarding && !isTradeSymbol && <TabBar />}
        </div>
      </OnboardingGate>
    </PhoneShell>
  );
}
