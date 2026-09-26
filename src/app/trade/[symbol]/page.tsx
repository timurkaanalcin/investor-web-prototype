"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  IconBack,
  IconCheck,
  IconChevron,
  IconChevronDown,
  IconClose,
} from "@/components/Icons";
import {
  DayStatsGrid,
  MarketStatusPill,
  PriceHeader,
  StockPriceChart,
} from "@/components/TradeCharts";
import { TradingViewChart } from "@/components/TradingViewChart";
import { TickerLogo } from "@/components/TickerLogos";
import {
  TRADE_CASH_USD,
  cashInCurrency,
  estimateTaxImpact,
  formatMoney,
  formatShares,
  formatUSD,
  getInstrument,
  getPosition,
  type TradeCurrency,
} from "@/lib/mock-data";

type Side = "buy" | "sell";
type SellMode = "shares" | "dollars";
type Step = "detail" | "ticket" | "review" | "confirmed";
type ChartMode = "basit" | "tradingview";

export default function OrderTicketPage() {
  const params = useParams();
  const symbol = String(params.symbol || "").toUpperCase();
  const instrument = getInstrument(symbol);
  const position = getPosition(symbol);
  const ticketRef = useRef<HTMLDivElement>(null);

  const [step, setStep] = useState<Step>("detail");
  const [chartMode, setChartMode] = useState<ChartMode>("basit");
  const [side, setSide] = useState<Side>("buy");
  const [amount, setAmount] = useState("");
  const [sellMode, setSellMode] = useState<SellMode>("dollars");
  const [unitOpen, setUnitOpen] = useState(false);
  const [taxOpen, setTaxOpen] = useState(true);

  const price = instrument?.price ?? 0;
  const currency: TradeCurrency = instrument?.currency ?? "USD";
  const cashAvail = cashInCurrency(currency);
  const moneyUnit =
    currency === "TRY"
      ? "TRY"
      : currency === "RUB"
        ? "RUB"
        : currency === "EUR"
          ? "EUR"
          : currency === "GBP"
            ? "GBP"
            : "Dolar";
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
    return estimateTaxImpact(symbol, estimatedShares);
  }, [side, symbol, estimatedShares]);

  const canContinue =
    !!instrument &&
    num > 0 &&
    (side === "buy"
      ? estimatedTotal <= cashAvail
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
      <div className="bg-card px-5 pb-6 pt-5">
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
      <div className="flex min-h-[100dvh] flex-col items-center bg-card px-5 pb-10 pt-10 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-sage-muted text-nest-blue">
          <IconCheck size={32} />
        </div>
        <h1 className="mt-5 text-[26px] font-bold tracking-tight text-nest">
          Emir iletildi
        </h1>
        <p className="mt-2 text-[14px] text-muted">
          {side === "buy" ? "Alış" : "Satış"} · {instrument.symbol}
        </p>
        <div className="mt-6 w-full divide-y divide-black/[0.05] rounded-2xl bg-beige/80 px-4 text-left text-[14px] ring-1 ring-black/[0.04]">
          <Row label="Tahmini hisse" value={formatShares(estimatedShares)} />
          <Row label="Tahmini tutar" value={formatMoney(estimatedTotal, currency)} />
          <Row label="Fiyat" value={formatMoney(price, currency)} />
          <Row label="Komisyon" value={formatMoney(0, currency)} accent />
        </div>
        <p className="mt-4 text-[11px] text-muted">
          Simülasyon — gerçek işlem yapılmadı.
        </p>
        <Link
          href="/trade"
          className="btn-primary trade-press mt-8 w-full py-3.5 text-center text-base"
        >
          Trade&apos;e dön
        </Link>
        <button
          type="button"
          onClick={() => {
            setStep("detail");
            setAmount("");
          }}
          className="btn-secondary trade-press mt-3 w-full py-3 text-sm"
        >
          Yeni emir
        </button>
      </div>
    );
  }

  /* ─── Betterment-style order ticket (Sell KO layout) ─── */
  if (step === "ticket" || step === "review") {
    const availableCashOrPos = position
      ? position.value
      : side === "buy"
        ? cashAvail
        : 0;
    const availableShares = position?.shares ?? 0;
    const unitLabel =
      side === "buy"
        ? moneyUnit
        : sellMode === "dollars"
          ? moneyUnit
          : "Hisse";

    return (
      <div
        ref={ticketRef}
        className="flex min-h-[100dvh] flex-col bg-card px-5 pb-8"
      >
        <header className="flex items-center justify-between pt-5 pb-1">
          <button
            type="button"
            aria-label="Geri"
            onClick={() =>
              setStep(step === "review" ? "ticket" : "detail")
            }
            className="trade-press rounded-full p-1.5 text-nest hover:bg-beige focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nest-blue/40"
          >
            <IconBack />
          </button>
          <button
            type="button"
            aria-label="Kapat"
            onClick={() => setStep("detail")}
            className="trade-press rounded-full p-1.5 text-nest hover:bg-beige focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nest-blue/40"
          >
            <IconClose />
          </button>
        </header>

        <h1 className="mt-4 text-[28px] font-bold leading-tight tracking-tight text-nest">
          {side === "buy" ? "Al" : "Sat"} {instrument.symbol}
        </h1>

        {/* Security / Available rows */}
        <div className="mt-6 divide-y divide-black/[0.08] border-y border-black/[0.08]">
          <div className="flex items-start justify-between gap-3 py-4">
            <span className="text-[14px] text-muted">Menkul kıymet</span>
            <div className="text-right">
              <p className="text-[15px] font-semibold text-nest">
                {instrument.name}
              </p>
              <p className="mt-0.5 text-[13px] text-muted">{instrument.symbol}</p>
            </div>
          </div>
          <div className="flex items-start justify-between gap-3 py-4">
            <span className="text-[14px] text-muted">Kullanılabilir</span>
            <div className="text-right">
              {side === "buy" ? (
                <>
                  <p className="text-[15px] font-semibold text-nest tabular-nums">
                    {formatMoney(cashAvail, currency)}
                  </p>
                  <p className="mt-0.5 text-[13px] text-muted">
                    Nakit ≈ {formatUSD(TRADE_CASH_USD)}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-[15px] font-semibold text-nest tabular-nums">
                    {formatMoney(availableCashOrPos, currency)}
                  </p>
                  <p className="mt-0.5 text-[13px] text-muted">
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
            <div className="mt-5 rounded-2xl bg-[#f5f5f5] p-4 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.03)]">
              <p className="text-[15px] font-bold text-nest">Tutar</p>
              <div className="mt-3 flex items-stretch gap-2">
                <div className="relative min-w-0 flex-1">
                  {(side === "buy" || sellMode === "dollars") && (
                    <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[15px] text-muted">
                      {moneyPrefix}
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
                        ? `${moneyUnit} tutarı gir`
                        : "Hisse adedi gir"
                    }
                    className={`w-full rounded-xl border-2 border-nest-blue bg-white py-3.5 pr-3 text-[15px] text-nest outline-none ring-nest-blue/20 placeholder:text-muted focus:ring-4 ${
                      side === "buy" || sellMode === "dollars"
                        ? "pl-7"
                        : "pl-3.5"
                    }`}
                  />
                </div>
                <div className="relative shrink-0">
                  <button
                    type="button"
                    disabled={side === "buy"}
                    onClick={() => side === "sell" && setUnitOpen((o) => !o)}
                    className="trade-press flex h-full min-w-[108px] items-center justify-between gap-1 rounded-xl border border-black/10 bg-white px-3 text-[15px] font-medium text-nest disabled:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nest-blue/40"
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
                        {moneyUnit}
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
                className="trade-press mt-4 w-full text-center text-[15px] font-semibold text-nest-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nest-blue/40"
              >
                Tüm hisseleri sat
              </button>
            )}

            {side === "buy" && num > cashAvail && (
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
                className="trade-press w-full rounded-2xl bg-nest-blue py-4 text-base font-bold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nest-blue/50 focus-visible:ring-offset-2"
              >
                Devam
              </button>
              <p className="mt-3 text-center text-[11px] text-muted">
                Kesirli hisse desteklenir · Komisyon {formatMoney(0, currency)}
              </p>
            </div>
          </>
        )}

        {step === "review" && (
          <div className="mt-5 flex flex-1 flex-col">
            <div className="overflow-hidden rounded-2xl bg-card shadow-[0_4px_24px_rgba(0,11,80,0.08)] ring-1 ring-black/[0.06]">
              <div className="border-b border-black/[0.05] px-4 py-3.5">
                <p className="text-[17px] font-bold tracking-tight text-nest">
                  {side === "buy" ? "Alış" : "Satış"} incelemesi ·{" "}
                  {instrument.symbol}
                </p>
              </div>

              <div className="divide-y divide-black/[0.05] px-4 text-[14px]">
                <div className="flex items-center justify-between py-3.5">
                  <span className="text-muted">Menkul kıymet</span>
                  <span className="font-semibold text-nest">
                    {instrument.name}
                  </span>
                </div>
                <div className="flex items-center justify-between py-3.5">
                  <span className="text-muted">Tahmini hisse</span>
                  <span className="font-semibold tabular-nums text-nest">
                    {formatShares(estimatedShares)}
                  </span>
                </div>
                <div className="flex items-center justify-between py-3.5">
                  <span className="text-muted">Tahmini toplam</span>
                  <span className="font-semibold tabular-nums text-nest">
                    {formatMoney(estimatedTotal, currency)}
                  </span>
                </div>
                <div className="flex items-center justify-between py-3.5">
                  <span className="text-muted">Komisyon</span>
                  <span className="font-semibold text-gain">
                    {formatMoney(0, currency)}
                  </span>
                </div>
                {side === "buy" && currency !== "USD" && (
                  <div className="flex items-center justify-between py-3.5">
                    <span className="text-muted">≈ USD nakit</span>
                    <span className="font-semibold tabular-nums text-nest">
                      {formatUSD(TRADE_CASH_USD)}
                    </span>
                  </div>
                )}
              </div>

              {side === "sell" && tax && (
                <div className="space-y-2.5 border-t border-black/[0.05] bg-[#fafbfd] px-3 py-3">
                  {/* Elevated tax owed card — PR Newswire style */}
                  <button
                    type="button"
                    onClick={() => setTaxOpen((o) => !o)}
                    className="trade-press flex w-full items-center justify-between rounded-xl bg-card px-3.5 py-3.5 text-left shadow-[0_4px_16px_rgba(0,11,80,0.1)] ring-1 ring-nest-blue/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nest-blue/40"
                  >
                    <div>
                      <p className="text-[13px] font-semibold text-nest">
                        {tax.gain >= 0
                          ? "Tahmini vergi borcu"
                          : "Tahmini vergi tasarrufu"}
                      </p>
                      <p className="mt-0.5 text-[11px] text-muted">
                        Satış öncesi vergi etkisi
                      </p>
                    </div>
                    <div className="flex items-center gap-0.5">
                      <span className="text-[17px] font-bold tabular-nums text-nest">
                        {formatMoney(
                          tax.gain >= 0
                            ? tax.estimatedTax
                            : tax.estimatedTaxSaved
                        , currency)}
                      </span>
                      <IconChevron
                        size={16}
                        className={`text-muted/70 transition-transform ${
                          taxOpen ? "rotate-90" : ""
                        }`}
                      />
                    </div>
                  </button>

                  <div className="flex items-center justify-between rounded-xl bg-card px-3.5 py-3.5 ring-1 ring-black/[0.06]">
                    <span className="text-[13px] text-muted">
                      Tahmini işlem zamanı
                    </span>
                    <div className="flex items-center gap-0.5">
                      <span className="text-[15px] font-semibold text-nest">
                        Bugün
                      </span>
                      <IconChevron size={16} className="text-muted/70" />
                    </div>
                  </div>

                  {taxOpen && (
                    <div className="rounded-xl bg-beige/90 px-3.5 py-1">
                      <dl className="divide-y divide-black/[0.05] text-[13px]">
                        <div className="flex justify-between py-2.5">
                          <dt className="text-muted">Maliyet esası</dt>
                          <dd className="font-semibold tabular-nums text-nest">
                            {formatMoney(tax.costBasis, currency)}
                          </dd>
                        </div>
                        <div className="flex justify-between py-2.5">
                          <dt className="text-muted">Tahmini gelir</dt>
                          <dd className="font-semibold tabular-nums text-nest">
                            {formatMoney(tax.proceeds, currency)}
                          </dd>
                        </div>
                        <div className="flex justify-between py-2.5">
                          <dt className="text-muted">Sermaye kazancı</dt>
                          <dd
                            className={`font-semibold tabular-nums ${
                              tax.gain >= 0 ? "text-gain" : "text-danger"
                            }`}
                          >
                            {tax.gain >= 0 ? "+" : ""}
                            {formatMoney(tax.gain, currency)}
                          </dd>
                        </div>
                        <div className="flex justify-between py-2.5">
                          <dt className="text-muted">Kısa vadeli vergi</dt>
                          <dd className="font-semibold tabular-nums text-nest">
                            {formatMoney(tax.shortTermTax, currency)}
                          </dd>
                        </div>
                        <div className="flex justify-between py-2.5">
                          <dt className="text-muted">Uzun vadeli vergi</dt>
                          <dd className="font-semibold tabular-nums text-nest">
                            {formatMoney(tax.longTermTax, currency)}
                          </dd>
                        </div>
                      </dl>
                      {tax.washSaleRisk && (
                        <p className="mt-1 pb-2 text-[11px] text-danger">
                          Wash-sale notu: Son 30 günde aynı veya benzer menkul
                          kıymet alındıysa zarar mahsubu sınırlanabilir
                          (simülasyon).
                        </p>
                      )}
                      {!tax.washSaleRisk && (
                        <p className="mt-1 pb-2 text-[11px] text-muted">
                          Tahmini — vergi danışmanı değildir. Gerçek oranlar
                          farklılık gösterebilir.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="mt-auto pt-8">
              <button
                type="button"
                onClick={() => setStep("confirmed")}
                className="trade-press w-full rounded-2xl bg-nest-blue py-4 text-base font-bold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nest-blue/50 focus-visible:ring-offset-2"
              >
                {side === "buy" ? "Alışı onayla" : "Satışı onayla"}
              </button>
              <p className="mt-3 text-center text-[11px] text-muted">
                Simülasyon — gerçek broker bağlantısı yok
              </p>
            </div>
          </div>
        )}
      </div>
    );
  }

  /* ─── Symbol detail (chart + sticky Al/Sat) ─── */
  return (
    <div className="relative bg-card px-5 pb-28">
      <header className="flex items-center gap-2.5 pt-5 pb-1">
        <Link
          href="/trade"
          aria-label="Geri"
          className="trade-press -ml-1 rounded-full p-1.5 text-nest hover:bg-beige focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nest-blue/40"
        >
          <IconBack />
        </Link>
        <span className="shrink-0 overflow-hidden rounded-full shadow-[0_1px_2px_rgba(0,0,0,0.06)]">
          <TickerLogo symbol={instrument.symbol} size={34} />
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-[17px] font-bold tracking-tight text-nest">
            {instrument.symbol}
          </h1>
          <p className="truncate text-[12px] text-muted">
            {instrument.name} · {instrument.exchange}
          </p>
        </div>
        <MarketStatusPill />
      </header>

      <section className="mt-4">
        <PriceHeader
          lastPrice={instrument.price}
          changePct={instrument.changePct}
          currency={instrument.currency}
        />

        {/* Chart mode: Basit (Investor) | TradingView */}
        <div
          className="mt-4 flex rounded-xl bg-beige p-1 ring-1 ring-black/[0.04]"
          role="tablist"
          aria-label="Grafik modu"
        >
          {(
            [
              { id: "basit" as const, label: "Basit" },
              { id: "tradingview" as const, label: "TradingView" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={chartMode === tab.id}
              onClick={() => setChartMode(tab.id)}
              className={`trade-press flex-1 rounded-lg py-2 text-[13px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nest-blue/40 ${
                chartMode === tab.id
                  ? "bg-card text-nest shadow-[0_1px_3px_rgba(0,11,80,0.12)]"
                  : "text-muted hover:text-nest"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="mt-4 -mx-0.5">
          {chartMode === "basit" ? (
            <StockPriceChart
              symbol={instrument.symbol}
              lastPrice={instrument.price}
              changePct={instrument.changePct}
              currency={instrument.currency}
            />
          ) : (
            <TradingViewChart instrument={instrument} />
          )}
        </div>
        <div className="mt-1">
          <DayStatsGrid
            symbol={instrument.symbol}
            lastPrice={instrument.price}
            changePct={instrument.changePct}
            currency={instrument.currency}
          />
        </div>
      </section>

      {position && (
        <div className="mt-3 flex items-center justify-between rounded-2xl bg-sage-muted/55 px-4 py-3 text-[13px]">
          <span className="text-muted">Pozisyonun</span>
          <span className="font-semibold text-nest tabular-nums">
            {formatShares(position.shares)} hisse ·{" "}
            {formatMoney(position.value, currency)}
          </span>
        </div>
      )}

      <p className="mt-5 text-center text-[11px] leading-relaxed text-muted">
        Fiyat gecikmeli · simülasyon · Kesirli hisse · Komisyon{" "}
        {formatMoney(0, currency)}
      </p>

      {/* Sticky dual CTAs */}
      <div className="fixed bottom-0 left-1/2 z-30 w-full max-w-[390px] -translate-x-1/2 border-t border-black/[0.05] bg-card/95 px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-md">
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => openTicket("buy")}
            className="trade-press rounded-2xl bg-nest-blue py-3.5 text-base font-bold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nest-blue/50 focus-visible:ring-offset-2"
          >
            Al
          </button>
          <button
            type="button"
            onClick={() => openTicket("sell")}
            className="trade-press rounded-2xl bg-nest py-3.5 text-base font-bold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nest/40 focus-visible:ring-offset-2"
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
    <div className="flex items-center justify-between gap-3 py-3">
      <span className="text-muted">{label}</span>
      <span
        className={`font-semibold tabular-nums ${
          accent ? "text-gain" : "text-nest"
        }`}
      >
        {value}
      </span>
    </div>
  );
}
