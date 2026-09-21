"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  IconBack,
  IconCheck,
  IconChevronDown,
  IconClose,
} from "@/components/Icons";
import {
  DayStatsGrid,
  MarketStatusPill,
  PriceHeader,
  StockPriceChart,
} from "@/components/TradeCharts";
import { TickerLogo } from "@/components/TickerLogos";
import {
  TRADE_CASH_USD,
  USD_TRY,
  estimateTaxImpact,
  formatShares,
  formatTRY,
  formatUSD,
  getInstrument,
  getPosition,
} from "@/lib/mock-data";

type Side = "buy" | "sell";
type SellMode = "shares" | "dollars";
type Step = "detail" | "ticket" | "review" | "confirmed";

export default function OrderTicketPage() {
  const params = useParams();
  const symbol = String(params.symbol || "").toUpperCase();
  const instrument = getInstrument(symbol);
  const position = getPosition(symbol);
  const ticketRef = useRef<HTMLDivElement>(null);

  const [step, setStep] = useState<Step>("detail");
  const [side, setSide] = useState<Side>("buy");
  const [amount, setAmount] = useState("");
  const [sellMode, setSellMode] = useState<SellMode>("dollars");
  const [unitOpen, setUnitOpen] = useState(false);
  const [taxOpen, setTaxOpen] = useState(true);

  const price = instrument?.price ?? 0;
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
    return estimateTaxImpact(symbol, estimatedShares);
  }, [side, symbol, estimatedShares]);

  const canContinue =
    !!instrument &&
    num > 0 &&
    (side === "buy"
      ? estimatedTotal <= TRADE_CASH_USD
      : estimatedShares > 0 &&
        estimatedShares <= (position?.shares ?? 0) + 0.0001);

  function openTicket(s: Side) {
    setSide(s);
    setAmount("");
    setSellMode("dollars");
    setUnitOpen(false);
    setStep("ticket");
    setTimeout(() => ticketRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  }

  if (!instrument) {
    return (
      <div className="px-5 pb-6 pt-5">
        <Link
          href="/trade"
          className="inline-flex items-center gap-1 text-sm font-medium text-nest-blue"
        >
          <IconBack size={18} /> Trade
        </Link>
        <p className="mt-8 text-center text-muted">
          Enstrüman bulunamadı: {symbol}
        </p>
      </div>
    );
  }

  if (step === "confirmed") {
    return (
      <div className="flex flex-col items-center px-5 pb-10 pt-8 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-sage-muted text-nest-blue">
          <IconCheck size={32} />
        </div>
        <h1 className="mt-5 font-serif text-2xl font-bold text-nest">
          Emir iletildi
        </h1>
        <p className="mt-2 text-sm text-muted">
          {side === "buy" ? "Alış" : "Satış"} · {instrument.symbol}
        </p>
        <div className="card mt-6 w-full space-y-3 p-4 text-left text-sm">
          <Row label="Tahmini hisse" value={formatShares(estimatedShares)} />
          <Row label="Tahmini tutar" value={formatUSD(estimatedTotal)} />
          <Row label="Fiyat" value={formatUSD(price)} />
          <Row label="Komisyon" value="$0" accent />
        </div>
        <p className="mt-4 text-xs text-muted">
          Simülasyon — gerçek işlem yapılmadı.
        </p>
        <Link
          href="/trade"
          className="btn-primary mt-8 w-full py-3.5 text-center text-base"
        >
          Trade&apos;e dön
        </Link>
        <button
          type="button"
          onClick={() => {
            setStep("detail");
            setAmount("");
          }}
          className="btn-secondary mt-3 w-full py-3 text-sm"
        >
          Yeni emir
        </button>
      </div>
    );
  }

  /* ─── Betterment-style order ticket (Sell KO layout) ─── */
  if (step === "ticket" || step === "review") {
    const availableUsd = position
      ? position.value
      : side === "buy"
        ? TRADE_CASH_USD
        : 0;
    const availableShares = position?.shares ?? 0;
    const unitLabel =
      side === "buy"
        ? "Dolar"
        : sellMode === "dollars"
          ? "Dolar"
          : "Hisse";

    return (
      <div ref={ticketRef} className="flex min-h-[100dvh] flex-col bg-card px-5 pb-8">
        <header className="flex items-center justify-between pt-5 pb-1">
          <button
            type="button"
            aria-label="Geri"
            onClick={() =>
              setStep(step === "review" ? "ticket" : "detail")
            }
            className="rounded-full p-1.5 text-nest hover:bg-beige"
          >
            <IconBack />
          </button>
          <button
            type="button"
            aria-label="Kapat"
            onClick={() => setStep("detail")}
            className="rounded-full p-1.5 text-nest hover:bg-beige"
          >
            <IconClose />
          </button>
        </header>

        <h1 className="mt-3 text-[28px] font-bold leading-tight text-nest">
          {side === "buy" ? "Al" : "Sat"} {instrument.symbol}
        </h1>

        {/* Security / Available rows */}
        <div className="mt-5 divide-y divide-black/10 border-y border-black/10">
          <div className="flex items-start justify-between gap-3 py-4">
            <span className="text-[15px] text-nest">Menkul kıymet</span>
            <div className="text-right">
              <p className="text-[15px] font-semibold text-nest">
                {instrument.name}
              </p>
              <p className="text-sm text-muted">{instrument.symbol}</p>
            </div>
          </div>
          <div className="flex items-start justify-between gap-3 py-4">
            <span className="text-[15px] text-nest">Kullanılabilir</span>
            <div className="text-right">
              {side === "buy" ? (
                <>
                  <p className="text-[15px] font-semibold text-nest tabular-nums">
                    {formatUSD(TRADE_CASH_USD)}
                  </p>
                  <p className="text-sm text-muted">Nakit</p>
                </>
              ) : (
                <>
                  <p className="text-[15px] font-semibold text-nest tabular-nums">
                    {formatUSD(availableUsd)}
                  </p>
                  <p className="text-sm text-muted">
                    {formatShares(availableShares)} hisse
                  </p>
                </>
              )}
            </div>
          </div>
        </div>

        {step === "ticket" && (
          <>
            {/* Amount card */}
            <div className="mt-5 rounded-2xl bg-[#f5f5f5] p-4">
              <p className="text-[15px] font-bold text-nest">Tutar</p>
              <div className="mt-3 flex items-stretch gap-2">
                <div className="relative min-w-0 flex-1">
                  {(side === "buy" || sellMode === "dollars") && (
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-base text-muted">
                      $
                    </span>
                  )}
                  <input
                    type="text"
                    inputMode="decimal"
                    autoFocus
                    value={amount}
                    onChange={(e) =>
                      setAmount(e.target.value.replace(/[^0-9.,]/g, ""))
                    }
                    placeholder={
                      side === "buy" || sellMode === "dollars"
                        ? "Dolar tutarı gir"
                        : "Hisse adedi gir"
                    }
                    className={`w-full rounded-xl border-2 border-nest-blue bg-white py-3.5 pr-3 text-[15px] text-nest outline-none placeholder:text-muted ${
                      side === "buy" || sellMode === "dollars"
                        ? "pl-7"
                        : "pl-3"
                    }`}
                  />
                </div>
                <div className="relative shrink-0">
                  <button
                    type="button"
                    disabled={side === "buy"}
                    onClick={() => side === "sell" && setUnitOpen((o) => !o)}
                    className="flex h-full min-w-[108px] items-center justify-between gap-1 rounded-xl border border-black/10 bg-white px-3 text-[15px] font-medium text-nest disabled:opacity-90"
                  >
                    {unitLabel}
                    {side === "sell" && <IconChevronDown size={16} />}
                  </button>
                  {unitOpen && side === "sell" && (
                    <div className="absolute right-0 z-20 mt-1 w-full overflow-hidden rounded-xl border border-black/10 bg-white shadow-lg">
                      <button
                        type="button"
                        className="block w-full px-3 py-2.5 text-left text-sm hover:bg-beige"
                        onClick={() => {
                          setSellMode("dollars");
                          setAmount("");
                          setUnitOpen(false);
                        }}
                      >
                        Dolar
                      </button>
                      <button
                        type="button"
                        className="block w-full px-3 py-2.5 text-left text-sm hover:bg-beige"
                        onClick={() => {
                          setSellMode("shares");
                          setAmount("");
                          setUnitOpen(false);
                        }}
                      >
                        Hisse
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {side === "sell" && position && (
              <button
                type="button"
                onClick={() =>
                  setAmount(
                    sellMode === "shares"
                      ? String(position.shares)
                      : position.value.toFixed(2)
                  )
                }
                className="mt-4 w-full text-center text-[15px] font-semibold text-nest-blue"
              >
                Tüm hisseleri sat
              </button>
            )}

            {side === "buy" && num > TRADE_CASH_USD && (
              <p className="mt-3 text-center text-xs font-medium text-danger">
                Yetersiz nakit bakiyesi
              </p>
            )}
            {side === "sell" && !position && num > 0 && (
              <p className="mt-3 text-center text-xs font-medium text-danger">
                Bu sembolde pozisyonun yok
              </p>
            )}

            <div className="mt-auto pt-8">
              <button
                type="button"
                disabled={!canContinue}
                onClick={() => {
                  setTaxOpen(true);
                  setStep("review");
                }}
                className="w-full rounded-2xl bg-nest-blue py-4 text-base font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                Devam
              </button>
              <p className="mt-3 text-center text-[11px] text-muted">
                Kesirli hisse desteklenir · Komisyon $0
              </p>
            </div>
          </>
        )}

        {step === "review" && (
          <div className="mt-5 flex flex-1 flex-col">
            <div className="card space-y-3 p-4 text-sm">
              <Row
                label="Tahmini hisse"
                value={`${formatShares(estimatedShares)} (kesirli OK)`}
              />
              <Row label="Tahmini toplam" value={formatUSD(estimatedTotal)} />
              <Row label="Fiyat" value={formatUSD(price)} />
              <Row label="Komisyon" value="$0" accent />
              {side === "buy" && (
                <Row
                  label="≈ TRY"
                  value={formatTRY(Math.round(estimatedTotal * USD_TRY))}
                />
              )}
            </div>

            {side === "sell" && tax && (
              <section className="mt-4 overflow-hidden rounded-2xl border border-black/10 bg-card">
                <button
                  type="button"
                  onClick={() => setTaxOpen((o) => !o)}
                  className="flex w-full items-center justify-between px-4 py-3.5 text-left"
                >
                  <div>
                    <p className="text-[15px] font-bold text-nest">
                      Vergi etkisi önizlemesi
                    </p>
                    <p className="text-[11px] text-muted">
                      Tahmini — vergi danışmanı değildir
                    </p>
                  </div>
                  <IconChevronDown
                    size={18}
                    className={`text-muted transition-transform ${
                      taxOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {taxOpen && (
                  <div className="border-t border-black/5 px-4 pb-4 pt-1">
                    <dl className="space-y-0 divide-y divide-black/5 text-sm">
                      <div className="flex justify-between py-2.5">
                        <dt className="text-muted">Maliyet esası</dt>
                        <dd className="font-semibold tabular-nums text-nest">
                          {formatUSD(tax.costBasis)}
                        </dd>
                      </div>
                      <div className="flex justify-between py-2.5">
                        <dt className="text-muted">Tahmini gelir</dt>
                        <dd className="font-semibold tabular-nums text-nest">
                          {formatUSD(tax.proceeds)}
                        </dd>
                      </div>
                      <div className="flex justify-between py-2.5">
                        <dt className="text-muted">Sermaye kazancı</dt>
                        <dd
                          className={`font-semibold tabular-nums ${
                            tax.gain >= 0 ? "text-nest-light" : "text-danger"
                          }`}
                        >
                          {tax.gain >= 0 ? "+" : ""}
                          {formatUSD(tax.gain)}
                        </dd>
                      </div>
                      <div className="flex justify-between py-2.5">
                        <dt className="text-muted">Kısa vadeli (tahmini vergi)</dt>
                        <dd className="font-semibold tabular-nums text-nest">
                          {formatUSD(tax.shortTermTax)}
                          <span className="ml-1 text-[11px] font-normal text-muted">
                            ({formatUSD(tax.shortTermGain)})
                          </span>
                        </dd>
                      </div>
                      <div className="flex justify-between py-2.5">
                        <dt className="text-muted">Uzun vadeli (tahmini vergi)</dt>
                        <dd className="font-semibold tabular-nums text-nest">
                          {formatUSD(tax.longTermTax)}
                          <span className="ml-1 text-[11px] font-normal text-muted">
                            ({formatUSD(tax.longTermGain)})
                          </span>
                        </dd>
                      </div>
                      <div className="flex justify-between py-2.5">
                        <dt className="font-medium text-nest">
                          {tax.gain >= 0
                            ? "Tahmini vergi borcu"
                            : "Tahmini vergi tasarrufu"}
                        </dt>
                        <dd className="font-bold tabular-nums text-nest">
                          {formatUSD(
                            tax.gain >= 0
                              ? tax.estimatedTax
                              : tax.estimatedTaxSaved
                          )}
                        </dd>
                      </div>
                    </dl>
                    {tax.washSaleRisk && (
                      <p className="mt-3 rounded-xl bg-[color-mix(in_srgb,var(--danger)_8%,white)] px-3 py-2 text-[11px] text-danger">
                        Wash-sale notu: Son 30 günde aynı veya benzer menkul
                        kıymet alındıysa zarar mahsubu sınırlanabilir
                        (simülasyon).
                      </p>
                    )}
                    {!tax.washSaleRisk && (
                      <p className="mt-3 text-[11px] text-muted">
                        Kısa/uzun vade ayrımı mock lot dağılımına göredir. Gerçek
                        vergi oranları farklılık gösterebilir.
                      </p>
                    )}
                  </div>
                )}
              </section>
            )}

            <div className="mt-auto pt-8">
              <button
                type="button"
                onClick={() => setStep("confirmed")}
                className="w-full rounded-2xl bg-nest-blue py-4 text-base font-bold text-white"
              >
                {side === "buy" ? "Alışı onayla" : "Satışı onayla"}
              </button>
              <p className="mt-3 text-center text-[11px] text-muted">
                Prototip — gerçek broker bağlantısı yok
              </p>
            </div>
          </div>
        )}
      </div>
    );
  }

  /* ─── Symbol detail (chart + sticky Al/Sat) ─── */
  return (
    <div className="relative px-5 pb-28">
      <header className="flex items-center gap-2 pt-5 pb-2">
        <Link
          href="/trade"
          aria-label="Geri"
          className="rounded-full p-1.5 text-nest hover:bg-sage-muted"
        >
          <IconBack />
        </Link>
        <span className="shrink-0 overflow-hidden rounded-full">
          <TickerLogo symbol={instrument.symbol} size={32} />
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-bold text-nest">
            {instrument.symbol}
          </h1>
          <p className="truncate text-xs text-muted">{instrument.name}</p>
        </div>
        <MarketStatusPill />
      </header>

      <section className="mt-3">
        <PriceHeader
          lastPrice={instrument.price}
          changePct={instrument.changePct}
        />
        <div className="mt-4 -mx-1">
          <StockPriceChart
            symbol={instrument.symbol}
            lastPrice={instrument.price}
            changePct={instrument.changePct}
          />
        </div>
        <div className="mt-2">
          <DayStatsGrid
            symbol={instrument.symbol}
            lastPrice={instrument.price}
            changePct={instrument.changePct}
          />
        </div>
      </section>

      {position && (
        <div className="mt-4 flex items-center justify-between rounded-2xl bg-sage-muted/60 px-3.5 py-2.5 text-xs">
          <span className="text-muted">Pozisyonun</span>
          <span className="font-semibold text-nest tabular-nums">
            {formatShares(position.shares)} hisse · {formatUSD(position.value)}
          </span>
        </div>
      )}

      <p className="mt-4 text-center text-[11px] text-muted">
        Kesirli hisse · Komisyon $0 · Vergi önizlemesi satışta
      </p>

      {/* Sticky dual CTAs */}
      <div className="fixed bottom-0 left-1/2 z-30 w-full max-w-[390px] -translate-x-1/2 border-t border-black/5 bg-card/95 px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-md">
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => openTicket("buy")}
            className="rounded-2xl bg-nest-blue py-3.5 text-base font-bold text-white"
          >
            Al
          </button>
          <button
            type="button"
            onClick={() => openTicket("sell")}
            className="rounded-2xl border-2 border-nest bg-nest py-3.5 text-base font-bold text-white"
          >
            Sat
          </button>
        </div>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted">{label}</span>
      <span
        className={`font-semibold tabular-nums ${
          accent ? "text-nest-light" : "text-nest"
        }`}
      >
        {value}
      </span>
    </div>
  );
}
