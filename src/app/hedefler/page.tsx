"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Legacy /hedefler → /islemler redirect */
export default function GoalsRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/islemler");
  }, [router]);

  return (
    <div className="flex min-h-[40vh] items-center justify-center px-5">
      <p className="text-sm text-muted">İşlem geçmişine yönlendiriliyorsunuz…</p>
    </div>
  );
}
