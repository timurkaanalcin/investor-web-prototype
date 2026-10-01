"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  TRADE_CASH_USD,
  cashInCurrency,
  estimateTaxImpact,
  formatMoney,
  formatShares,
  formatUSD,
  moneySymbol,
  type TradeCurrency,
  type TradeInstrument,
} from "@/lib/mock-data";
import {
  TradeTpSlSection,
  TpSlReviewRows,
  tpSlAllowsContinue,
  useTpSlComputed,
  useTpSlState,
} from "@/components/trade/TradeTpSlSection";
import {
  executeMarketOrder,
  getOpenPosition,
  subscribePositions,
  type LedgerPosition,
} from "@/lib/trade-ledger";
import { IconClose } from "@/components/Icons";

type Side = "buy" | "sell";
type SellMode = "shares" | "dollars";
type Step = "form" | "review" | "confirmed";
type OrderType = "market" | "limit" | "stop";

const QTY_PRESETS_BUY = [0.25, 0.5, 0.75, 1] as const;

/**
 * Desktop order ticket as a centered modal (Al/Sat open it).
 * Replaces the old always-visible right-rail panel.
 */
export function TradeOrderSidePanel({
  instrument,
  open,
  onClose,
  focusSide,
  focusNonce = 0,
}: {
  instrument: TradeInstrument;
  open: boolean;
  onClose: () => void;
  /** Hotkey / button-driven side when opening */
  focusSide?: Side | null;
  focusNonce?: number;
}) {
  const [position, setPosition] = useState<LedgerPosition | undefined>(undefined);
  const [side, setSide] = useState<Side>("buy");
  const [amount, setAmount] = useState("");
  const [sellMode, setSellMode] = useState<SellMode>("dollars");
  const [step, setStep] = useState<Step>("form");
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [orderType, setOrderType] = useState<OrderType>("market");
  const [limitPrice, setLimitPrice] = useState("");
  const [stopPrice, setStopPrice] = useState("");
  const [tpSl, patchTpSl, resetTpSl] = useTpSlState();
  const amountRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const refresh = () => setPosition(getOpenPosition(instrument.symbol));
    refresh();
    return subscribePositions(refresh);
  }, [instrument.symbol]);

  // Reset when symbol changes
  useEffect(() => {
    reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [instrument.symbol]);

  useEffect(() => {
    if (!open) return;
    if (focusSide) setSide(focusSide);
    setStep("form");
    setConfirmError(null);
    window.setTimeout(() => amountRef.current?.focus(), 60);
  }, [open, focusSide, focusNonce]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [open, onClose]);

  const price = instrument.price;
  const currency: TradeCurrency = instrument.currency;
  const cashAvail = cashInCurrency(currency);
  const moneyPrefix = moneySymbol(currency);
  const num = parseFloat(amount.replace(",", ".")) || 0;
  const limitNum = parseFloat(limitPrice.replace(",", ".")) || 0;
  const stopNum = parseFloat(stopPrice.replace(",", ".")) || 0;

  const fillPrice = useMemo(() => {
    if (orderType === "limit" && limitNum > 0) return limitNum;
    if (orderType === "stop" && stopNum > 0) return stopNum;
    return price;
  }, [orderType, limitNum, stopNum, price]);

  const estimatedShares = useMemo(() => {
    if (side === "buy") {
      if (num <= 0 || fillPrice <= 0) return 0;
      return num / fillPrice;
    }
    if (sellMode === "shares") return Math.min(num, position?.shares ?? num);
    if (num <= 0 || fillPrice <= 0) return 0;
    return Math.min(num / fillPrice, position?.shares ?? num / fillPrice);
  }, [side, num, fillPrice, sellMode, position]);

  const estimatedTotal = useMemo(() => {
    if (side === "buy") return num > 0 ? estimatedShares * fillPrice : 0;
    if (sellMode === "dollars")
      return Math.min(num, (position?.shares ?? 0) * fillPrice);
    return estimatedShares * fillPrice;
  }, [side, num, sellMode, estimatedShares, fillPrice, position]);

  const tax = useMemo(() => {
    if (side !== "sell" || estimatedShares <= 0) return null;
    return estimateTaxImpact(instrument.symbol, estimatedShares, position);
  }, [side, instrument.symbol, estimatedShares, position]);

  const tpSlComputed = useTpSlComputed(tpSl, side, fillPrice, estimatedShares);

  const orderTypeOk =
    orderType === "market" ||
    (orderType === "limit" && limitNum > 0) ||
    (orderType === "stop" && stopNum > 0);

  const canContinue =
    num > 0 &&
    orderTypeOk &&
    (side === "buy"
      ? estimatedTotal <= cashAvail
      : estimatedShares > 0 &&
        estimatedShares <= (position?.shares ?? 0) + 0.0001) &&
    tpSlAllowsContinue(tpSl, tpSlComputed);

  function reset() {
    setAmount("");
    setStep("form");
    setSellMode("dollars");
    setConfirmError(null);
    setOrderType("market");
    setLimitPrice("");
    setStopPrice("");
    resetTpSl();
  }

  function applyBuyPreset(frac: number) {
    const dollars = cashAvail * frac;
    setSellMode("dollars");
    setAmount(dollars > 0 ? dollars.toFixed(2) : "");
    amountRef.current?.focus();
  }

  function applySellAll() {
    if (!position) return;
    if (sellMode === "shares") {
      setAmount(String(position.shares));
    } else {
      setAmount((position.shares * fillPrice).toFixed(2));
    }
  }

  function confirmOrder() {
    setConfirmError(null);
    const result = executeMarketOrder({
      symbol: instrument.symbol,
      side,
      shares: estimatedShares,
      price: fillPrice,
    });
    if (!result.ok) {
      setConfirmError(result.error || "İşlem başarısız");
      return;
    }
    setStep("confirmed");
  }

  const orderTypeLabel =
    orderType === "market"
      ? "Piyasa"
      : orderType === "limit"
        ? "Limit"
        : "Stop";

  if (!open) return null;

  return (
    <div
      className="tv-order-modal-backdrop"
      role="presentation"
      onClick={onClose}
    >
      <div
        className="tv-order-modal"
        role="dialog"
        aria-modal="true"
        aria-label={side === "buy" ? "Alış emri" : "Satış emri"}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header: Al/Sat toggle + symbol + close */}
        <div className="flex shrink-0 items-center gap-2 border-b border-[var(--tv-border)] px-3 py-2.5">
          <div className="flex min-w-0 flex-1 gap-1">
            <button
              type="button"
              onClick={() => {
                setSide("buy");
                reset();
                window.setTimeout(() => amountRef.current?.focus(), 40);
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
                window.setTimeout(() => amountRef.current?.focus(), 40);
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
          <button
            type="button"
            aria-label="Kapat"
            onClick={onClose}
            className="tv-icon-btn trade-press shrink-0"
          >
            <IconClose />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3">
          {step === "confirmed" ? (
            <div className="text-center">
              <p className="text-[16px] font-bold text-[var(--tv-text)]">
                Emir iletildi
              </p>
              <p className="mt-1 text-[12px] text-[var(--tv-muted)]">
                {side === "buy" ? "Alış" : "Satış"} · {orderTypeLabel} ·{" "}
                {instrument.symbol}
              </p>
              <dl className="mt-4 space-y-2 text-left text-[13px]">
                <div className="flex justify-between">
                  <dt className="text-[var(--tv-muted)]">Menkul kıymet</dt>
                  <dd className="max-w-[60%] truncate text-right font-semibold text-[var(--tv-text)]">
                    {instrument.name}
                  </dd>
                </div>
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
                <div className="flex justify-between">
                  <dt className="text-[var(--tv-muted)]">Fiyat</dt>
                  <dd className="tv-mono font-semibold text-[var(--tv-text)]">
                    {formatMoney(fillPrice, currency)}
                  </dd>
                </div>
                <TpSlReviewRows
                  state={tpSl}
                  side={side}
                  price={fillPrice}
                  shares={estimatedShares}
                  currency={currency}
                />
              </dl>
              <p className="mt-3 text-[10px] text-[var(--tv-muted)]">
                Bakiye ve pozisyon güncellendi
              </p>
              <button
                type="button"
                onClick={reset}
                className="tv-btn-buy trade-press mt-4 w-full py-2.5 text-sm"
              >
                Yeni emir
              </button>
              <button
                type="button"
                onClick={onClose}
                className="mt-2 w-full py-2 text-[12px] font-medium text-[var(--tv-muted)] hover:text-[var(--tv-text)]"
              >
                Kapat
              </button>
            </div>
          ) : step === "review" ? (
            <div>
              <p className="text-[14px] font-bold text-[var(--tv-text)]">
                {side === "buy" ? "Alış" : "Satış"} incelemesi
              </p>
              <dl className="mt-3 divide-y divide-[var(--tv-border)] text-[13px]">
                <div className="flex justify-between py-2">
                  <dt className="text-[var(--tv-muted)]">Emir türü</dt>
                  <dd className="font-semibold text-[var(--tv-text)]">
                    {orderTypeLabel}
                  </dd>
                </div>
                <div className="flex justify-between gap-3 py-2">
                  <dt className="shrink-0 text-[var(--tv-muted)]">Sembol</dt>
                  <dd className="min-w-0 text-right font-semibold text-[var(--tv-text)]">
                    <span className="block truncate">{instrument.symbol}</span>
                    <span className="mt-0.5 block truncate text-[11px] font-medium text-[var(--tv-muted)]">
                      {instrument.name}
                    </span>
                  </dd>
                </div>
                <div className="flex justify-between py-2">
                  <dt className="text-[var(--tv-muted)]">Hisse</dt>
                  <dd className="tv-mono font-semibold text-[var(--tv-text)]">
                    {formatShares(estimatedShares)}
                  </dd>
                </div>
                <div className="flex justify-between py-2">
                  <dt className="text-[var(--tv-muted)]">Tahmini maliyet</dt>
                  <dd className="tv-mono font-semibold text-[var(--tv-text)]">
                    {formatMoney(estimatedTotal, currency)}
                  </dd>
                </div>
                <div className="flex justify-between py-2">
                  <dt className="text-[var(--tv-muted)]">Fiyat</dt>
                  <dd className="tv-mono font-semibold text-[var(--tv-text)]">
                    {formatMoney(fillPrice, currency)}
                  </dd>
                </div>
                <div className="flex justify-between py-2">
                  <dt className="text-[var(--tv-muted)]">Komisyon</dt>
                  <dd className="font-semibold text-[#26a69a]">
                    {formatMoney(0, currency)}
                  </dd>
                </div>
                <TpSlReviewRows
                  state={tpSl}
                  side={side}
                  price={fillPrice}
                  shares={estimatedShares}
                  currency={currency}
                />
                {side === "sell" && tax && (
                  <div className="flex justify-between py-2">
                    <dt className="text-[var(--tv-muted)]">Tahmini vergi</dt>
                    <dd className="tv-mono font-semibold text-[var(--tv-text)]">
                      {formatMoney(
                        tax.gain >= 0 ? tax.estimatedTax : tax.estimatedTaxSaved,
                        currency,
                      )}
                    </dd>
                  </div>
                )}
              </dl>
              {confirmError && (
                <p className="mt-3 text-center text-[12px] font-medium text-[#ef5350]">
                  {confirmError}
                </p>
              )}
              <button
                type="button"
                onClick={confirmOrder}
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
              {/* Correct symbol + name (not "EUR · ALV") */}
              <div className="mb-3 flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[14px] font-bold text-[var(--tv-text)]">
                      {instrument.symbol}
                    </span>
                    <span className="tv-ex-badge">{instrument.exchange}</span>
                    <span className="tv-ex-badge">{currency}</span>
                  </div>
                  <p className="mt-0.5 truncate text-[12px] text-[var(--tv-muted)]">
                    {instrument.name}
                  </p>
                </div>
                <p className="tv-mono shrink-0 text-[13px] font-semibold text-[var(--tv-text)]">
                  {formatMoney(price, currency)}
                </p>
              </div>

              {/* Order type */}
              <div className="mb-3 flex gap-1">
                {(
                  [
                    { key: "market" as const, label: "Piyasa" },
                    { key: "limit" as const, label: "Limit" },
                    { key: "stop" as const, label: "Stop" },
                  ] as const
                ).map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => {
                      setOrderType(t.key);
                      if (t.key === "limit" && !limitPrice) {
                        setLimitPrice(price.toFixed(price >= 10 ? 2 : 4));
                      }
                      if (t.key === "stop" && !stopPrice) {
                        setStopPrice(price.toFixed(price >= 10 ? 2 : 4));
                      }
                    }}
                    className={`flex-1 rounded border px-1.5 py-1.5 text-[11px] font-semibold ${
                      orderType === t.key
                        ? "border-[var(--tv-text)] text-[var(--tv-text)]"
                        : "border-[var(--tv-border)] text-[var(--tv-muted)]"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {orderType === "limit" && (
                <div className="mb-2">
                  <label className="text-[11px] font-semibold uppercase tracking-wide text-[var(--tv-muted)]">
                    Limit fiyat
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={limitPrice}
                    onChange={(e) =>
                      setLimitPrice(e.target.value.replace(/[^0-9.,]/g, ""))
                    }
                    className="tv-input tv-mono mt-1 w-full py-2 text-[13px]"
                  />
                </div>
              )}
              {orderType === "stop" && (
                <div className="mb-2">
                  <label className="text-[11px] font-semibold uppercase tracking-wide text-[var(--tv-muted)]">
                    Stop fiyat
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={stopPrice}
                    onChange={(e) =>
                      setStopPrice(e.target.value.replace(/[^0-9.,]/g, ""))
                    }
                    className="tv-input tv-mono mt-1 w-full py-2 text-[13px]"
                  />
                </div>
              )}

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
                  ref={amountRef}
                  type="text"
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) =>
                    setAmount(e.target.value.replace(/[^0-9.,]/g, ""))
                  }
                  placeholder={
                    side === "buy" || sellMode === "dollars" ? "Tutar" : "Adet"
                  }
                  className={`tv-input tv-mono py-2.5 text-[14px] ${
                    side === "buy" || sellMode === "dollars" ? "pl-7" : "pl-3"
                  }`}
                />
              </div>

              {side === "buy" && (
                <div className="mt-2 flex gap-1">
                  {QTY_PRESETS_BUY.map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => applyBuyPreset(f)}
                      className="flex-1 rounded border border-[var(--tv-border)] px-1 py-1 text-[10px] font-semibold text-[var(--tv-muted)] hover:border-[var(--tv-text)] hover:text-[var(--tv-text)]"
                    >
                      %{Math.round(f * 100)}
                    </button>
                  ))}
                </div>
              )}

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
                        ? "border-[var(--tv-text)] text-[var(--tv-text)]"
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
                        ? "border-[var(--tv-text)] text-[var(--tv-text)]"
                        : "border-[var(--tv-border)] text-[var(--tv-muted)]"
                    }`}
                  >
                    Hisse
                  </button>
                  {position && (
                    <button
                      type="button"
                      onClick={applySellAll}
                      className="flex-1 rounded border border-[var(--tv-border)] px-2 py-1.5 text-[11px] font-semibold text-[var(--tv-muted)] hover:border-[var(--tv-text)] hover:text-[var(--tv-text)]"
                    >
                      Tümü
                    </button>
                  )}
                </div>
              )}

              {num > 0 && (
                <div className="mt-2 rounded border border-[var(--tv-border)] bg-[var(--tv-bg)] px-2.5 py-2 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-[var(--tv-muted)]">Tahmini hisse</span>
                    <span className="tv-mono font-semibold text-[var(--tv-text)]">
                      {formatShares(estimatedShares)}
                    </span>
                  </div>
                  <div className="mt-1 flex justify-between">
                    <span className="text-[var(--tv-muted)]">
                      Tahmini maliyet
                    </span>
                    <span className="tv-mono font-semibold text-[var(--tv-text)]">
                      {formatMoney(estimatedTotal, currency)}
                    </span>
                  </div>
                  <div className="mt-1 flex justify-between">
                    <span className="text-[var(--tv-muted)]">Birim fiyat</span>
                    <span className="tv-mono text-[var(--tv-text)]">
                      {formatMoney(fillPrice, currency)}
                    </span>
                  </div>
                </div>
              )}

              <TradeTpSlSection
                state={tpSl}
                onChange={patchTpSl}
                side={side}
                price={fillPrice}
                shares={estimatedShares}
                currency={currency}
                compact
              />

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
              <p className="mt-2 text-center text-[9px] text-[var(--tv-muted)]">
                Kısayol: B Al · S Sat · Esc kapat
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
