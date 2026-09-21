"use client";

import { useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { AllocationBar } from "@/components/Charts";
import { IconInfo } from "@/components/Icons";
import {
  ALLOCATION,
  AUTO_CONTRIBUTION,
  HOLDINGS,
  formatPct,
  formatTRY,
} from "@/lib/mock-data";

function HoldingIcon({ type }: { type: string }) {
  const common = "flex h-10 w-10 items-center justify-center rounded-full bg-sage-muted text-nest";
  if (type === "globe") {
    return (
      <span className={common}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18" />
        </svg>
      </span>
    );
  }
  if (type === "chart") {
    return (
      <span className={common}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M4 19h16M7 16V9M12 16V5M17 16v-4" />
        </svg>
      </span>
    );
  }
  return (
    <span className={common}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M3 8h16a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8z" />
        <path d="M3 10h18M16 14h2" />
      </svg>
    </span>
  );
}

export default function InvestPage() {
  const [autoOn, setAutoOn] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  function flash(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 1800);
  }

  return (
    <div className="px-5 pb-6">
      <AppHeader centerLogo />

      <div className="mt-2 flex items-center gap-2">
        <h1 className="font-serif text-3xl font-bold text-nest">Yatır</h1>
        <IconInfo className="text-muted" size={18} />
      </div>

      <div className="card mt-5 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm text-muted">Otomatik katkı</p>
            <p className="mt-1 text-2xl font-bold text-nest">
              {formatTRY(AUTO_CONTRIBUTION)}{" "}
              <span className="text-base font-medium text-muted">/ ay</span>
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={autoOn}
            onClick={() => setAutoOn((v) => !v)}
            className={`toggle ${autoOn ? "on" : ""}`}
            aria-label="Otomatik katkı"
          />
        </div>
        <p className="mt-3 text-xs text-muted">Sonraki tarih: 25 Eyl</p>
      </div>

      <button
        type="button"
        onClick={() => flash("Yatırım emri simüle edildi")}
        className="btn-primary mt-4 w-full py-3.5 text-base"
      >
        Hemen yatır
      </button>

      <section className="mt-6">
        <h2 className="mb-3 text-base font-semibold text-nest">Portföyün</h2>
        <AllocationBar segments={ALLOCATION} />

        <ul className="mt-4 space-y-2">
          {HOLDINGS.map((h) => (
            <li key={h.id} className="card flex items-center gap-3 p-3.5">
              <HoldingIcon type={h.icon} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-nest">{h.name}</p>
                <p className="text-xs text-muted">{h.subtitle}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-nest">
                  {formatTRY(h.value)}
                </p>
                <p
                  className={`text-xs font-medium ${
                    h.change >= 0 ? "text-nest-light" : "text-danger"
                  }`}
                >
                  {formatPct(h.change)}
                </p>
              </div>
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={() => flash("Portföy yeniden dengelendi (simülasyon)")}
          className="btn-secondary mt-4 w-full py-3 text-sm"
        >
          Yeniden dengele
        </button>
      </section>

      {toast && (
        <div className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-full bg-nest px-4 py-2 text-xs font-medium text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
