"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { isLoggedIn } from "@/lib/storage";

const AUTH_PATHS = ["/giris", "/kayit"];

function isAuthPath(pathname: string): boolean {
  return AUTH_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

function isPublicPath(pathname: string): boolean {
  if (pathname === "/" || pathname === "") return true;
  if (isAuthPath(pathname)) return true;
  // Admin has its own PIN gate
  if (pathname === "/admin" || pathname.startsWith("/admin/")) return true;
  // Agent portal has its own mock login
  if (pathname === "/agent" || pathname.startsWith("/agent/")) return true;
  // Public legal/support pages must be reachable before sign-in.
  if (pathname === "/gizlilik" || pathname === "/destek") return true;
  return false;
}

/** Auth gate (renamed historically from OnboardingGate). */
export function OnboardingGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const loggedIn = isLoggedIn();
    const onAuth = isAuthPath(pathname);
    const publicOk = isPublicPath(pathname);

    if (!loggedIn && !publicOk) {
      router.replace("/giris");
      return;
    }
    if (loggedIn && onAuth) {
      router.replace("/panel");
      return;
    }
    // Soft-remove old onboarding quiz
    if (pathname.startsWith("/onboarding")) {
      router.replace(loggedIn ? "/panel" : "/kayit");
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
