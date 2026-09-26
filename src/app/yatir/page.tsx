"use client";

import { useEffect, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { AllocationBar } from "@/components/Charts";
import { IconClose, IconInfo } from "@/components/Icons";
import {
  ALLOCATION,
  AUTO_CONTRIBUTION,
  HOLDINGS,
  formatPct,
  formatTRY,
} from "@/lib/mock-data";
import {
  appendTransaction,
  getAutoContribution,
  setAutoContribution,
} from "@/lib/storage";

function HoldingIcon({ type }: { type: string }) {
  const common =
    "flex h-10 w-10 items-center justify-center rounded-full bg-sage-muted text-nest";
  if (type === "globe") {
    return (
      <span className={common}>
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18" />
        </svg>
      </span>
    );
  }
  if (type === "chart") {
    return (
      <span className={common}>
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <path d="M4 19h16M7 16V9M12 16V5M17 16v-4" />
        </svg>
      </span>
    );
  }
  return (
    <span className={common}>
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <path d="M3 8h16a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8z" />
        <path d="M3 10h18M16 14h2" />
      </svg>
    </span>
  );
}

const QUICK_AMOUNTS = [500, 1000, 2500, 5000];

export default function InvestPage() {
  const [autoOn, setAutoOn] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [depositOpen, setDepositOpen] = useState(false);
  const [amount, setAmount] = useState("2500");
  const [confirmDeposit, setConfirmDeposit] = useState(false);
  const [rebalanceOpen, setRebalanceOpen] = useState(false);
  const [holdingId, setHoldingId] = useState<string | null>(null);

  useEffect(() => {
    setAutoOn(getAutoContribution());
  }, []);

  function flash(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  }

  function toggleAuto() {
    const next = !autoOn;
    setAutoOn(next);
    setAutoContribution(next);
    flash(next ? "Otomatik katkı açıldı" : "Otomatik katkı kapatıldı");
  }

  function submitDeposit() {
    const n = parseFloat(amount.replace(",", ".")) || 0;
    if (n <= 0) {
      flash("Geçerli bir tutar girin");
      return;
    }
    const today = new Date().toISOString().slice(0, 10);
    appendTransaction({
      id: `tx-user-${Date.now()}`,
      side: "deposit",
      title: "Hemen yatır",
      subtitle: "Tek seferlik katkı",
      amount: n,
      currency: "TRY",
      date: today,
      status: "completed",
    });
    setConfirmDeposit(false);
    setDepositOpen(false);
    setAmount("2500");
    flash(`${formatTRY(n)} yatırıldı`);
  }

  function confirmRebalance() {
    setRebalanceOpen(false);
    flash("Portföy yeniden dengelendi");
  }

  const selectedHolding = HOLDINGS.find((h) => h.id === holdingId);

  return (
    <div className="px-5 pb-6 md:px-0 md:pb-0">
      <AppHeader centerLogo />

      <div className="mt-2 flex items-center gap-2 md:mt-0">
        <h1 className="font-serif text-3xl font-bold text-nest md:text-4xl">Yatır</h1>
        <IconInfo className="text-muted" size={18} />
      </div>

      <div className="md:desk-grid-invest md:mt-6">
        <div>
          <div className="card mt-5 p-4 md:mt-0 md:p-5">
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
                onClick={toggleAuto}
                className={`toggle ${autoOn ? "on" : ""}`}
                aria-label="Otomatik katkı"
              />
            </div>
            <p className="mt-3 text-xs text-muted">Sonraki tarih: 25 Eyl</p>
          </div>

          <button
            type="button"
            onClick={() => {
              setDepositOpen(true);
              setConfirmDeposit(false);
            }}
            className="btn-primary mt-4 w-full min-h-[44px] py-3.5 text-base active:scale-[0.98]"
          >
            Hemen yatır
          </button>

          <section className="mt-6 md:mt-5">
            <h2 className="mb-3 text-base font-semibold text-nest">Dağılım</h2>
            <AllocationBar segments={ALLOCATION} />
            <button
              type="button"
              onClick={() => setRebalanceOpen(true)}
              className="btn-secondary mt-4 w-full min-h-[44px] py-3 text-sm active:scale-[0.98]"
            >
              Yeniden dengele
            </button>
          </section>
        </div>

        <section className="mt-6 md:mt-0">
          <h2 className="mb-3 text-base font-semibold text-nest">Portföyün</h2>
          <ul className="space-y-2">
            {HOLDINGS.map((h) => (
              <li key={h.id}>
                <button
                  type="button"
                  onClick={() => setHoldingId(h.id)}
                  className="card flex w-full items-center gap-3 p-3.5 text-left transition-transform active:scale-[0.99] md:min-h-[56px]"
                >
                  <HoldingIcon type={h.icon} />
                  <div className="min-w-0 flex-1">
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
                </button>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {depositOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:p-4"
          onClick={() => setDepositOpen(false)}
          role="presentation"
        >
          <div
            className="w-full max-w-[390px] md:max-w-md rounded-t-3xl bg-card p-5 shadow-2xl sm:rounded-3xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-nest">
                {confirmDeposit ? "Onayla" : "Hemen yatır"}
              </h3>
              <button
                type="button"
                aria-label="Kapat"
                onClick={() => setDepositOpen(false)}
                className="rounded-full bg-beige p-2"
              >
                <IconClose size={18} />
              </button>
            </div>

            {!confirmDeposit ? (
              <>
                <p className="mt-2 text-sm text-muted">
                  Tek seferlik katkı tutarını seçin
                </p>
                <div className="mt-4 flex items-baseline gap-1 rounded-2xl bg-beige px-4 py-3">
                  <span className="text-2xl font-bold text-nest">₺</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-transparent text-3xl font-bold text-nest outline-none"
                    aria-label="Tutar"
                  />
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {QUICK_AMOUNTS.map((a) => (
                    <button
                      key={a}
                      type="button"
                      onClick={() => setAmount(String(a))}
                      className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                        amount === String(a)
                          ? "bg-nest-solid text-white"
                          : "bg-beige text-nest"
                      }`}
                    >
                      {formatTRY(a)}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setConfirmDeposit(true)}
                  className="btn-primary mt-5 w-full py-3.5 text-sm"
                >
                  Devam
                </button>
              </>
            ) : (
              <>
                <p className="mt-4 text-sm text-muted">
                  <span className="font-semibold text-nest">
                    {formatTRY(parseFloat(amount) || 0)}
                  </span>{" "}
                  tutarında tek seferlik katkı yapılacak.
                </p>
                <div className="mt-5 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setConfirmDeposit(false)}
                    className="btn-secondary flex-1 py-3 text-sm"
                  >
                    Geri
                  </button>
                  <button
                    type="button"
                    onClick={submitDeposit}
                    className="btn-primary flex-1 py-3 text-sm"
                  >
                    Onayla
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {rebalanceOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:p-4"
          onClick={() => setRebalanceOpen(false)}
          role="presentation"
        >
          <div
            className="w-full max-w-[390px] md:max-w-md rounded-t-3xl bg-card p-5 shadow-2xl sm:rounded-3xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <h3 className="text-lg font-bold text-nest">Yeniden dengele</h3>
            <p className="mt-2 text-sm text-muted">
              Portföyünüz hedef dağılıma (Hisse %70 · Tahvil %20 · Nakit %10)
              yaklaştırılacak. Simülasyon — gerçek emir verilmez.
            </p>
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => setRebalanceOpen(false)}
                className="btn-secondary flex-1 py-3 text-sm"
              >
                İptal
              </button>
              <button
                type="button"
                onClick={confirmRebalance}
                className="btn-primary flex-1 py-3 text-sm"
              >
                Onayla
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedHolding && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:p-4"
          onClick={() => setHoldingId(null)}
          role="presentation"
        >
          <div
            className="w-full max-w-[390px] md:max-w-md rounded-t-3xl bg-card p-5 shadow-2xl sm:rounded-3xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center gap-3">
              <HoldingIcon type={selectedHolding.icon} />
              <div>
                <h3 className="text-lg font-bold text-nest">
                  {selectedHolding.name}
                </h3>
                <p className="text-sm text-muted">{selectedHolding.subtitle}</p>
              </div>
            </div>
            <div className="mt-4 space-y-2 rounded-2xl bg-beige/80 p-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted">Değer</span>
                <span className="font-semibold text-nest">
                  {formatTRY(selectedHolding.value)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Günlük değişim</span>
                <span
                  className={`font-semibold ${
                    selectedHolding.change >= 0 ? "text-gain" : "text-danger"
                  }`}
                >
                  {formatPct(selectedHolding.change)}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setHoldingId(null)}
              className="btn-primary mt-5 w-full py-3.5 text-sm"
            >
              Kapat
            </button>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 md:bottom-8 rounded-full bg-nest-solid px-4 py-2 text-xs font-medium text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
