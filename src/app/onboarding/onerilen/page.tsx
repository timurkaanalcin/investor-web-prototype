"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Legacy recommended portfolio step removed. */
export default function OnboardingRecommendedRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/kayit");
  }, [router]);
  return (
    <div className="flex min-h-full flex-1 items-center justify-center text-sm text-muted">
      Yönlendiriliyor…
    </div>
  );
}
