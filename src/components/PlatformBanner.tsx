"use client";

import { useEffect, useState } from "react";
import { getPlatformSettings } from "@/lib/crm/admin-ops";

/** Customer-facing announcement / trading-halt strip from CRM settings. */
export function PlatformBanner() {
  const [text, setText] = useState<string | null>(null);

  useEffect(() => {
    const refresh = () => {
      const s = getPlatformSettings();
      if (s.tradingHalt) {
        setText(
          s.announcementEnabled && s.announcementBanner
            ? `⚠ İşlem durduruldu — ${s.announcementBanner}`
            : "⚠ İşlemler geçici olarak durduruldu (trading halt)",
        );
      } else if (s.announcementEnabled && s.announcementBanner.trim()) {
        setText(s.announcementBanner.trim());
      } else {
        setText(null);
      }
    };
    refresh();
    const iv = window.setInterval(refresh, 4000);
    return () => window.clearInterval(iv);
  }, []);

  if (!text) return null;
  return (
    <div className="shrink-0 border-b border-black bg-black px-3 py-1.5 text-center text-[11px] font-semibold text-white">
      {text}
    </div>
  );
}
