"use client";

import { useEffect, useState } from "react";
import { IconBell, IconClose } from "@/components/Icons";
import { formatMoney, type TradeCurrency } from "@/lib/mock-data";
import {
  addAlert,
  deleteAlert,
  getAlerts,
  subscribeAlerts,
  type PriceAlert,
} from "@/lib/trade-alerts";

export function TradeAlertsPanel({
  symbol,
  lastPrice,
  currency,
  compact = false,
}: {
  symbol: string;
  lastPrice: number;
  currency: TradeCurrency;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [direction, setDirection] = useState<"above" | "below">("above");
  const [target, setTarget] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const refresh = () => setAlerts(getAlerts(symbol));
    refresh();
    return subscribeAlerts(refresh);
  }, [symbol]);

  function create() {
    setError(null);
    const n = parseFloat(target.replace(",", "."));
    if (!Number.isFinite(n) || n <= 0) {
      setError("Geçerli bir fiyat girin");
      return;
    }
    const a = addAlert({ symbol, direction, target: n });
    if (!a) {
      setError("Uyarı eklenemedi");
      return;
    }
    setTarget("");
    setAlerts(getAlerts(symbol));
  }

  const count = alerts.length;

  return (
    <div className="relative">
      <button
        type="button"
        className="tv-icon-btn trade-press relative"
        aria-label="Fiyat uyarıları"
        aria-expanded={open}
        title="Uyarılar"
        onClick={() => setOpen((o) => !o)}
      >
        <IconBell size={16} />
        {count > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-[var(--tv-text)] px-0.5 text-[8px] font-bold text-[var(--tv-bg)]">
            {count}
          </span>
        )}
      </button>

      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 cursor-default"
            aria-label="Kapat"
            onClick={() => setOpen(false)}
          />
          <div
            className={`absolute right-0 z-50 mt-1 overflow-hidden rounded border border-[var(--tv-border)] bg-[var(--tv-panel)] shadow-xl ${
              compact ? "w-64" : "w-72"
            }`}
            role="dialog"
            aria-label="Fiyat uyarıları"
          >
            <div className="flex items-center justify-between border-b border-[var(--tv-border)] px-3 py-2">
              <p className="text-[13px] font-bold text-[var(--tv-text)]">
                Uyarılar · {symbol}
              </p>
              <button
                type="button"
                className="tv-icon-btn !h-7 !w-7"
                aria-label="Kapat"
                onClick={() => setOpen(false)}
              >
                <IconClose size={14} />
              </button>
            </div>

            <div className="space-y-2 border-b border-[var(--tv-border)] px-3 py-2.5">
              <p className="text-[11px] text-[var(--tv-muted)]">
                Güncel {formatMoney(lastPrice, currency)}
              </p>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setDirection("above")}
                  className={`flex-1 rounded border px-2 py-1.5 text-[11px] font-semibold ${
                    direction === "above"
                      ? "border-[#26a69a] text-[#26a69a]"
                      : "border-[var(--tv-border)] text-[var(--tv-muted)]"
                  }`}
                >
                  Üstünde
                </button>
                <button
                  type="button"
                  onClick={() => setDirection("below")}
                  className={`flex-1 rounded border px-2 py-1.5 text-[11px] font-semibold ${
                    direction === "below"
                      ? "border-[#ef5350] text-[#ef5350]"
                      : "border-[var(--tv-border)] text-[var(--tv-muted)]"
                  }`}
                >
                  Altında
                </button>
              </div>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  inputMode="decimal"
                  value={target}
                  onChange={(e) =>
                    setTarget(e.target.value.replace(/[^0-9.,]/g, ""))
                  }
                  placeholder="Hedef fiyat"
                  className="tv-input tv-mono flex-1 py-2 text-[13px]"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") create();
                  }}
                />
                <button
                  type="button"
                  onClick={create}
                  className="tv-btn-buy shrink-0 px-3 py-2 text-[12px]"
                >
                  Ekle
                </button>
              </div>
              {error && (
                <p className="text-[11px] font-medium text-[#ef5350]">{error}</p>
              )}
            </div>

            <ul className="max-h-48 overflow-y-auto">
              {alerts.length === 0 ? (
                <li className="px-3 py-4 text-center text-[12px] text-[var(--tv-muted)]">
                  Henüz uyarı yok
                </li>
              ) : (
                alerts.map((a) => (
                  <li
                    key={a.id}
                    className="flex items-center justify-between gap-2 border-t border-[var(--tv-border)] px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="tv-mono text-[12px] font-semibold text-[var(--tv-text)]">
                        {a.direction === "above" ? "≥" : "≤"}{" "}
                        {formatMoney(a.target, currency)}
                      </p>
                      <p className="text-[10px] text-[var(--tv-muted)]">
                        {a.direction === "above" ? "Üstünde" : "Altında"} ·{" "}
                        {new Date(a.createdAt).toLocaleString("tr-TR", {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <button
                      type="button"
                      aria-label="Uyarıyı sil"
                      className="tv-icon-btn !h-7 !w-7"
                      onClick={() => {
                        deleteAlert(a.id);
                        setAlerts(getAlerts(symbol));
                      }}
                    >
                      <IconClose size={14} />
                    </button>
                  </li>
                ))
              )}
            </ul>
            <p className="border-t border-[var(--tv-border)] px-3 py-1.5 text-[9px] text-[var(--tv-muted)]">
              Yerel uyarılar · tarayıcıda saklanır
            </p>
          </div>
        </>
      )}
    </div>
  );
}
