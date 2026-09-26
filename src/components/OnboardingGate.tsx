"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { isOnboardingComplete } from "@/lib/storage";

export function OnboardingGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const onOnboarding = pathname.startsWith("/onboarding");
    const done = isOnboardingComplete();
    if (!done && !onOnboarding) {
      router.replace("/onboarding");
      return;
    }
    if (done && onOnboarding) {
      router.replace("/");
      return;
    }
    setReady(true);
  }, [pathname, router]);

  if (!ready) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center py-24 text-sm text-muted">
        Yükleniyor…
      </div>
    );
  }

  return <>{children}</>;
}
