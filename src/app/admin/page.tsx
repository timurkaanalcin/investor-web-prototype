"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { isAdminUnlocked } from "@/lib/money-requests";
import { getCrmSession } from "@/lib/crm/data";

/** PIN / session gate lives in layout; redirect unlocked sessions to dashboard. */
export default function AdminIndexPage() {
  const router = useRouter();
  useEffect(() => {
    if (isAdminUnlocked() || getCrmSession()) {
      router.replace("/admin/dashboard/");
    }
  }, [router]);

  return (
    <div className="flex min-h-[40vh] items-center justify-center text-sm text-neutral-500">
      PIN veya personel oturumu doğrulandıysa gösterge paneline yönlendiriliyorsunuz…
    </div>
  );
}
