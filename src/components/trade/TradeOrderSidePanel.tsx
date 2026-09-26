"use client";

import { useMemo, useState } from "react";
import {
  TRADE_CASH_USD,
  cashInCurrency,
  estimateTaxImpact,
  formatMoney,
  formatShares,
  formatUSD,
  getPosition,
  type TradeCurrency,
  type TradeInstrument,
} from "@/lib/mock-data";

type Side = "buy" | "sell";
type SellMode = "shares" | "dollars";
type Step = "form" | "review" | "confirmed";

/** Desktop lg+ right-rail Al/Sat ticket — always visible on symbol pages. */
export function TradeOrderSidePanel({
  instrument,
}: {
  instrument: TradeInstrument;
}) {
  const position = getPosition(instrument.symbol);
  const [side, setSide] = useState<Side>("buy");
  const [amount, setAmount] = useState("");
  const [sellMode, setSellMode] = useState<SellMode>("dollars");
  const [step, setStep] = useState<Step>("form");

  const price = instrument.price;
  const currency: TradeCurrency = instrument.currency;
  const cashAvail = cashInCurrency(currency);
  const moneyPrefix =
    currency === "TRY"
      ? "₺"
      : currency === "RUB"
        ? "₽"
        : currency === "EUR"
          ? "€"
          : currency === "GBP"
            ? "£"
            : "$";
  const num = parseFloat(amount.replace(",", ".")) || 0;

  const estimatedShares = useMemo(() => {
    if (side === "buy") {
      if (num <= 0 || price <= 0) return 0;
      return num / price;
    }
    if (sellMode === "shares") return Math.min(num, position?.shares ?? num);
    if (num <= 0 || price <= 0) return 0;
    return Math.min(num / price, position?.shares ?? num / price);
  }, [side, num, price, sellMode, position]);

  const estimatedTotal = useMemo(() => {
    if (side === "buy") return num;
    if (sellMode === "dollars")
      return Math.min(num, (position?.shares ?? 0) * price);
    return estimatedShares * price;
  }, [side, num, sellMode, estimatedShares, price, position]);

  const tax = useMemo(() => {
    if (side !== "sell" || estimatedShares <= 0) return null;
    return estimateTaxImpact(instrument.symbol, estimatedShares);
  }, [side, instrument.symbol, estimatedShares]);

  const canContinue =
    num > 0 &&
    (side === "buy"
      ? estimatedTotal <= cashAvail
      : estimatedShares > 0 &&
        estimatedShares <= (position?.shares ?? 0) + 0.0001);

  function reset() {
    setAmount("");
    setStep("form");
    setSellMode("dollars");
  }

  return (
    <aside className="trade-desk-right flex min-h-0 flex-col overflow-hidden">
      <div className="flex shrink-0 gap-1 border-b border-[var(--tv-border)] p-2">
        <button
          type="button"
          onClick={() => {
            setSide("buy");
            reset();
          }}
          className={`flex-1 rounded py-2 text-[13px] font-bold transition-colors ${
            side === "buy"
              ? "bg-[#26a69a] text-white"
              : "bg-[var(--tv-bg)] text-[var(--tv-muted)] hover:text-[var(--tv-text)]"
          }`}
        >
          Al
        </button>
        <button
          type="button"
          onClick={() => {
            setSide("sell");
            reset();
          }}
          className={`flex-1 rounded py-2 text-[13px] font-bold transition-colors ${
            side === "sell"
              ? "bg-[#ef5350] text-white"
              : "bg-[var(--tv-bg)] text-[var(--tv-muted)] hover:text-[var(--tv-text)]"
          }`}
        >
          Sat
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3">
        {step === "confirmed" ? (
          <div className="text-center">
            <p className="text-[16px] font-bold text-[var(--tv-text)]">
              Emir iletildi
            </p>
            <p className="mt-1 text-[12px] text-[var(--tv-muted)]">
              {side === "buy" ? "Alış" : "Satış"} · {instrument.symbol}
            </p>
            <dl className="mt-4 space-y-2 text-left text-[13px]">
              <div className="flex justify-between">
                <dt className="text-[var(--tv-muted)]">Hisse</dt>
                <dd className="tv-mono font-semibold text-[var(--tv-text)]">
                  {formatShares(estimatedShares)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[var(--tv-muted)]">Tutar</dt>
                <dd className="tv-mono font-semibold text-[var(--tv-text)]">
                  {formatMoney(estimatedTotal, currency)}
                </dd>
              </div>
            </dl>
            <p className="mt-3 text-[10px] text-[var(--tv-muted)]">
              Simülasyon — gerçek işlem yok
            </p>
            <button
              type="button"
              onClick={reset}
              className="tv-btn-buy trade-press mt-4 w-full py-2.5 text-sm"
            >
              Yeni emir
            </button>
          </div>
        ) : step === "review" ? (
          <div>
            <p className="text-[14px] font-bold text-[var(--tv-text)]">
              {side === "buy" ? "Alış" : "Satış"} incelemesi
            </p>
            <dl className="mt-3 divide-y divide-[var(--tv-border)] text-[13px]">
              <div className="flex justify-between py-2">
                <dt className="text-[var(--tv-muted)]">Sembol</dt>
                <dd className="font-semibold text-[var(--tv-text)]">
                  {instrument.symbol}
                </dd>
              </div>
              <div className="flex justify-between py-2">
                <dt className="text-[var(--tv-muted)]">Hisse</dt>
                <dd className="tv-mono font-semibold text-[var(--tv-text)]">
                  {formatShares(estimatedShares)}
                </dd>
              </div>
              <div className="flex justify-between py-2">
                <dt className="text-[var(--tv-muted)]">Toplam</dt>
                <dd className="tv-mono font-semibold text-[var(--tv-text)]">
                  {formatMoney(estimatedTotal, currency)}
                </dd>
              </div>
              <div className="flex justify-between py-2">
                <dt className="text-[var(--tv-muted)]">Komisyon</dt>
                <dd className="font-semibold text-[#26a69a]">
                  {formatMoney(0, currency)}
                </dd>
              </div>
              {side === "sell" && tax && (
                <div className="flex justify-between py-2">
                  <dt className="text-[var(--tv-muted)]">Tahmini vergi</dt>
                  <dd className="tv-mono font-semibold text-[var(--tv-text)]">
                    {formatMoney(
                      tax.gain >= 0 ? tax.estimatedTax : tax.estimatedTaxSaved,
                      currency
                    )}
                  </dd>
                </div>
              )}
            </dl>
            <button
              type="button"
              onClick={() => setStep("confirmed")}
              className={`trade-press mt-4 w-full py-2.5 text-sm ${
                side === "buy" ? "tv-btn-buy" : "tv-btn-sell"
              }`}
            >
              Onayla
            </button>
            <button
              type="button"
              onClick={() => setStep("form")}
              className="mt-2 w-full py-2 text-[12px] font-medium text-[var(--tv-muted)] hover:text-[var(--tv-text)]"
            >
              Geri
            </button>
          </div>
        ) : (
          <div>
            <div className="mb-3 text-[12px] text-[var(--tv-muted)]">
              {side === "buy" ? (
                <>
                  Kullanılabilir{" "}
                  <span className="tv-mono font-semibold text-[var(--tv-text)]">
                    {formatMoney(cashAvail, currency)}
                  </span>
                  <span className="mt-0.5 block text-[11px]">
                    ≈ {formatUSD(TRADE_CASH_USD)} nakit
                  </span>
                </>
              ) : position ? (
                <>
                  Pozisyon{" "}
                  <span className="tv-mono font-semibold text-[var(--tv-text)]">
                    {formatShares(position.shares)} hisse
                  </span>
                </>
              ) : (
                <span className="text-[#ef5350]">Pozisyon yok</span>
              )}
            </div>

            <label className="text-[11px] font-semibold uppercase tracking-wide text-[var(--tv-muted)]">
              Tutar
            </label>
            <div className="relative mt-1.5">
              {(side === "buy" || sellMode === "dollars") && (
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-[var(--tv-muted)]">
                  {moneyPrefix}
                </span>
              )}
              <input
                type="text"
                inputMode="decimal"
                value={amount}
                onChange={(e) =>
                  setAmount(e.target.value.replace(/[^0-9.,]/g, ""))
                }
                placeholder={
                  side === "buy" || sellMode === "dollars"
                    ? "Tutar"
                    : "Adet"
                }
                className={`tv-input tv-mono py-2.5 text-[14px] ${
                  side === "buy" || sellMode === "dollars" ? "pl-7" : "pl-3"
                }`}
              />
            </div>

            {side === "sell" && (
              <div className="mt-2 flex gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setSellMode("dollars");
                    setAmount("");
                  }}
                  className={`flex-1 rounded border px-2 py-1.5 text-[11px] font-semibold ${
                    sellMode === "dollars"
                      ? "border-[var(--tv-blue)] text-[var(--tv-text)]"
                      : "border-[var(--tv-border)] text-[var(--tv-muted)]"
                  }`}
                >
                  Tutar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSellMode("shares");
                    setAmount("");
                  }}
                  className={`flex-1 rounded border px-2 py-1.5 text-[11px] font-semibold ${
                    sellMode === "shares"
                      ? "border-[var(--tv-blue)] text-[var(--tv-text)]"
                      : "border-[var(--tv-border)] text-[var(--tv-muted)]"
                  }`}
                >
                  Hisse
                </button>
              </div>
            )}

            {num > 0 && (
              <p className="mt-2 tv-mono text-[12px] text-[var(--tv-muted)]">
                ≈ {formatShares(estimatedShares)} hisse ·{" "}
                {formatMoney(estimatedTotal, currency)}
              </p>
            )}

            <button
              type="button"
              disabled={!canContinue}
              onClick={() => setStep("review")}
              className={`trade-press mt-4 w-full py-2.5 text-sm ${
                side === "buy" ? "tv-btn-buy" : "tv-btn-sell"
              }`}
            >
              Devam
            </button>
            <p className="mt-2 text-center text-[10px] text-[var(--tv-muted)]">
              Komisyon {formatMoney(0, currency)} · simülasyon
            </p>
          </div>
        )}
      </div>
    </aside>
  );
}
