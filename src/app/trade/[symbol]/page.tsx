"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  IconBack,
  IconCheck,
  IconChevron,
  IconChevronDown,
  IconClose,
  IconMenu,
  IconMoon,
  IconSun,
} from "@/components/Icons";
import {
  DayStatsGrid,
  StockPriceChart,
} from "@/components/TradeCharts";
import { TradingViewChart } from "@/components/TradingViewChart";
import { TickerLogo } from "@/components/TickerLogos";
import { useTradeTheme } from "@/components/TradeTheme";
import {
  TRADE_CASH_USD,
  cashInCurrency,
  estimateTaxImpact,
  formatMoney,
  formatPct,
  formatShares,
  formatUSD,
  getInstrument,
  getPosition,
  type TradeCurrency,
} from "@/lib/mock-data";
import { getMarketStatus } from "@/lib/market-series";
import { useIsDesktop } from "@/hooks/useMediaQuery";
import { TradeOrderSidePanel } from "@/components/trade/TradeOrderSidePanel";

type Side = "buy" | "sell";
type SellMode = "shares" | "dollars";
type Step = "detail" | "ticket" | "review" | "confirmed";
type ChartMode = "tradingview" | "basit";

export default function OrderTicketPage() {
  const params = useParams();
  const symbol = String(params.symbol || "").toUpperCase();
  const isDesktop = useIsDesktop();
  const instrument = getInstrument(symbol);
  const position = getPosition(symbol);
  const ticketRef = useRef<HTMLDivElement>(null);

  const [step, setStep] = useState<Step>("detail");
  const [chartMode, setChartMode] = useState<ChartMode>("tradingview");
  const [menuOpen, setMenuOpen] = useState(false);
  const [side, setSide] = useState<Side>("buy");
  const [amount, setAmount] = useState("");
  const [sellMode, setSellMode] = useState<SellMode>("dollars");
  const [unitOpen, setUnitOpen] = useState(false);
  const [taxOpen, setTaxOpen] = useState(true);

  const { theme, toggle } = useTradeTheme();
  const [chartHeight, setChartHeight] = useState(360);

  useEffect(() => {
    const calc = () => {
      const h = window.innerHeight;
      if (window.matchMedia("(min-width: 768px)").matches) {
        setChartHeight(Math.max(320, Math.min(Math.round(h - 200), 720)));
      } else {
        setChartHeight(Math.min(Math.round(h * 0.52), 520));
      }
    };
    calc();
    window.addEventListener("resize", calc);
    return () => window.removeEventListener("resize", calc);
  }, []);

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
      <div className="trade-tv-root h-full overflow-y-auto px-4 pb-6 pt-5">
        <Link
          href="/trade"
          className="inline-flex items-center gap-1 text-sm font-medium text-[#2962ff]"
        >
          <IconBack size={18} /> Trade
        </Link>
        <p className="mt-8 text-center text-[var(--tv-muted)]">
          Enstrüman bulunamadı: {symbol}
        </p>
      </div>
    );
  }

  if (step === "confirmed") {
    return (
      <div className="trade-tv-root flex h-full min-h-0 flex-col items-center overflow-y-auto px-5 pb-10 pt-10 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#26a69a]/20 text-[#26a69a]">
          <IconCheck size={32} />
        </div>
        <h1 className="mt-5 text-[24px] font-bold tracking-tight text-[var(--tv-text)]">
          Emir iletildi
        </h1>
        <p className="mt-2 text-[14px] text-[var(--tv-muted)]">
          {side === "buy" ? "Alış" : "Satış"} · {instrument.symbol}
        </p>
        <div className="tv-panel mt-6 w-full divide-y divide-[var(--tv-border)] px-4 text-left text-[14px]">
          <TvRow label="Tahmini hisse" value={formatShares(estimatedShares)} />
          <TvRow label="Tahmini tutar" value={formatMoney(estimatedTotal, currency)} />
          <TvRow label="Fiyat" value={formatMoney(price, currency)} />
          <TvRow label="Komisyon" value={formatMoney(0, currency)} accent />
        </div>
        <p className="mt-4 text-[11px] text-[var(--tv-muted)]">
          Simülasyon — gerçek işlem yapılmadı.
        </p>
        <Link
          href="/trade"
          className="tv-btn-buy trade-press mt-8 w-full py-3.5 text-center text-base"
        >
          Trade&apos;e dön
        </Link>
        <button
          type="button"
          onClick={() => {
            setStep("detail");
            setAmount("");
          }}
          className="trade-press mt-3 w-full rounded border border-[var(--tv-border)] bg-[var(--tv-panel)] py-3 text-sm font-semibold text-[var(--tv-text)]"
        >
          Yeni emir
        </button>
      </div>
    );
  }

  /* ─── Dark TV order ticket ─── */
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
        className="trade-tv-root flex h-full min-h-0 flex-col overflow-y-auto px-4 pb-8"
      >
        <header className="flex items-center justify-between pt-4 pb-1">
          <button
            type="button"
            aria-label="Geri"
            onClick={() =>
              setStep(step === "review" ? "ticket" : "detail")
            }
            className="tv-icon-btn trade-press"
          >
            <IconBack />
          </button>
          <button
            type="button"
            aria-label="Kapat"
            onClick={() => setStep("detail")}
            className="tv-icon-btn trade-press"
          >
            <IconClose />
          </button>
        </header>

        <h1 className="mt-3 text-[26px] font-bold leading-tight tracking-tight text-[var(--tv-text)]">
          <span className={side === "buy" ? "text-[#26a69a]" : "text-[#ef5350]"}>
            {side === "buy" ? "Al" : "Sat"}
          </span>{" "}
          {instrument.symbol}
        </h1>

        <div className="mt-5 divide-y divide-[var(--tv-border)] border-y border-[var(--tv-border)]">
          <div className="flex items-start justify-between gap-3 py-3.5">
            <span className="text-[13px] text-[var(--tv-muted)]">Menkul kıymet</span>
            <div className="text-right">
              <p className="text-[14px] font-semibold text-[var(--tv-text)]">
                {instrument.name}
              </p>
              <p className="mt-0.5 text-[12px] text-[var(--tv-muted)]">{instrument.symbol}</p>
            </div>
          </div>
          <div className="flex items-start justify-between gap-3 py-3.5">
            <span className="text-[13px] text-[var(--tv-muted)]">Kullanılabilir</span>
            <div className="text-right">
              {side === "buy" ? (
                <>
                  <p className="tv-mono text-[14px] font-semibold text-[var(--tv-text)]">
                    {formatMoney(cashAvail, currency)}
                  </p>
                  <p className="mt-0.5 text-[12px] text-[var(--tv-muted)]">
                    Nakit ≈ {formatUSD(TRADE_CASH_USD)}
                  </p>
                </>
              ) : (
                <>
                  <p className="tv-mono text-[14px] font-semibold text-[var(--tv-text)]">
                    {formatMoney(availableCashOrPos, currency)}
                  </p>
                  <p className="mt-0.5 text-[12px] text-[var(--tv-muted)]">
                    {formatShares(availableShares)} hisse
                  </p>
                </>
              )}
            </div>
          </div>
        </div>

        {step === "ticket" && (
          <>
            <div className="tv-panel mt-5 p-3.5">
              <p className="text-[13px] font-bold text-[var(--tv-text)]">Tutar</p>
              <div className="mt-3 flex items-stretch gap-2">
                <div className="relative min-w-0 flex-1">
                  {(side === "buy" || sellMode === "dollars") && (
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[14px] text-[var(--tv-muted)]">
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
                    className={`tv-input tv-mono ${
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
                    className="trade-press flex h-full min-w-[100px] items-center justify-between gap-1 rounded border border-[var(--tv-border)] bg-[var(--tv-bg)] px-3 text-[14px] font-medium text-[var(--tv-text)] disabled:opacity-90"
                  >
                    {unitLabel}
                    {side === "sell" && <IconChevronDown size={16} />}
                  </button>
                  {unitOpen && side === "sell" && (
                    <div className="absolute right-0 z-20 mt-1 w-full overflow-hidden rounded border border-[var(--tv-border)] bg-[var(--tv-panel)] shadow-lg">
                      <button
                        type="button"
                        className="block w-full px-3 py-2.5 text-left text-sm text-[var(--tv-text)] hover:bg-[var(--tv-hover)]"
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
                        className="block w-full px-3 py-2.5 text-left text-sm text-[var(--tv-text)] hover:bg-[var(--tv-hover)]"
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
                className="trade-press mt-4 w-full text-center text-[14px] font-semibold text-[#2962ff]"
              >
                Tüm hisseleri sat
              </button>
            )}

            {side === "buy" && num > cashAvail && (
              <p className="mt-3 text-center text-xs font-medium text-[#ef5350]">
                Yetersiz nakit bakiyesi
              </p>
            )}
            {side === "sell" && !position && num > 0 && (
              <p className="mt-3 text-center text-xs font-medium text-[#ef5350]">
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
                className={`trade-press w-full py-3.5 text-base ${
                  side === "buy" ? "tv-btn-buy" : "tv-btn-sell"
                }`}
              >
                Devam
              </button>
              <p className="mt-3 text-center text-[11px] text-[var(--tv-muted)]">
                Kesirli hisse desteklenir · Komisyon {formatMoney(0, currency)}
              </p>
            </div>
          </>
        )}

        {step === "review" && (
          <div className="mt-5 flex flex-1 flex-col">
            <div className="tv-panel overflow-hidden">
              <div className="border-b border-[var(--tv-border)] px-4 py-3">
                <p className="text-[16px] font-bold tracking-tight text-[var(--tv-text)]">
                  {side === "buy" ? "Alış" : "Satış"} incelemesi ·{" "}
                  {instrument.symbol}
                </p>
              </div>

              <div className="divide-y divide-[var(--tv-border)] px-4 text-[14px]">
                <div className="flex items-center justify-between py-3">
                  <span className="text-[var(--tv-muted)]">Menkul kıymet</span>
                  <span className="font-semibold text-[var(--tv-text)]">
                    {instrument.name}
                  </span>
                </div>
                <div className="flex items-center justify-between py-3">
                  <span className="text-[var(--tv-muted)]">Tahmini hisse</span>
                  <span className="tv-mono font-semibold text-[var(--tv-text)]">
                    {formatShares(estimatedShares)}
                  </span>
                </div>
                <div className="flex items-center justify-between py-3">
                  <span className="text-[var(--tv-muted)]">Tahmini toplam</span>
                  <span className="tv-mono font-semibold text-[var(--tv-text)]">
                    {formatMoney(estimatedTotal, currency)}
                  </span>
                </div>
                <div className="flex items-center justify-between py-3">
                  <span className="text-[var(--tv-muted)]">Komisyon</span>
                  <span className="font-semibold text-[#26a69a]">
                    {formatMoney(0, currency)}
                  </span>
                </div>
                {side === "buy" && currency !== "USD" && (
                  <div className="flex items-center justify-between py-3">
                    <span className="text-[var(--tv-muted)]">≈ USD nakit</span>
                    <span className="tv-mono font-semibold text-[var(--tv-text)]">
                      {formatUSD(TRADE_CASH_USD)}
                    </span>
                  </div>
                )}
              </div>

              {side === "sell" && tax && (
                <div className="space-y-2.5 border-t border-[var(--tv-border)] bg-[var(--tv-bg)] px-3 py-3">
                  <button
                    type="button"
                    onClick={() => setTaxOpen((o) => !o)}
                    className="trade-press flex w-full items-center justify-between rounded border border-[var(--tv-border)] bg-[var(--tv-panel)] px-3.5 py-3 text-left"
                  >
                    <div>
                      <p className="text-[13px] font-semibold text-[var(--tv-text)]">
                        {tax.gain >= 0
                          ? "Tahmini vergi borcu"
                          : "Tahmini vergi tasarrufu"}
                      </p>
                      <p className="mt-0.5 text-[11px] text-[var(--tv-muted)]">
                        Satış öncesi vergi etkisi
                      </p>
                    </div>
                    <div className="flex items-center gap-0.5">
                      <span className="tv-mono text-[16px] font-bold text-[var(--tv-text)]">
                        {formatMoney(
                          tax.gain >= 0
                            ? tax.estimatedTax
                            : tax.estimatedTaxSaved
                        , currency)}
                      </span>
                      <IconChevron
                        size={16}
                        className={`text-[var(--tv-muted)] transition-transform ${
                          taxOpen ? "rotate-90" : ""
                        }`}
                      />
                    </div>
                  </button>

                  <div className="flex items-center justify-between rounded border border-[var(--tv-border)] bg-[var(--tv-panel)] px-3.5 py-3">
                    <span className="text-[13px] text-[var(--tv-muted)]">
                      Tahmini işlem zamanı
                    </span>
                    <span className="text-[14px] font-semibold text-[var(--tv-text)]">
                      Bugün
                    </span>
                  </div>

                  {taxOpen && (
                    <div className="rounded border border-[var(--tv-border)] bg-[var(--tv-panel)] px-3.5 py-1">
                      <dl className="divide-y divide-[var(--tv-border)] text-[13px]">
                        <div className="flex justify-between py-2.5">
                          <dt className="text-[var(--tv-muted)]">Maliyet esası</dt>
                          <dd className="tv-mono font-semibold text-[var(--tv-text)]">
                            {formatMoney(tax.costBasis, currency)}
                          </dd>
                        </div>
                        <div className="flex justify-between py-2.5">
                          <dt className="text-[var(--tv-muted)]">Tahmini gelir</dt>
                          <dd className="tv-mono font-semibold text-[var(--tv-text)]">
                            {formatMoney(tax.proceeds, currency)}
                          </dd>
                        </div>
                        <div className="flex justify-between py-2.5">
                          <dt className="text-[var(--tv-muted)]">Sermaye kazancı</dt>
                          <dd
                            className={`tv-mono font-semibold ${
                              tax.gain >= 0
                                ? "text-[#26a69a]"
                                : "text-[#ef5350]"
                            }`}
                          >
                            {tax.gain >= 0 ? "+" : ""}
                            {formatMoney(tax.gain, currency)}
                          </dd>
                        </div>
                        <div className="flex justify-between py-2.5">
                          <dt className="text-[var(--tv-muted)]">Kısa vadeli vergi</dt>
                          <dd className="tv-mono font-semibold text-[var(--tv-text)]">
                            {formatMoney(tax.shortTermTax, currency)}
                          </dd>
                        </div>
                        <div className="flex justify-between py-2.5">
                          <dt className="text-[var(--tv-muted)]">Uzun vadeli vergi</dt>
                          <dd className="tv-mono font-semibold text-[var(--tv-text)]">
                            {formatMoney(tax.longTermTax, currency)}
                          </dd>
                        </div>
                      </dl>
                      {tax.washSaleRisk && (
                        <p className="mt-1 pb-2 text-[11px] text-[#ef5350]">
                          Wash-sale notu: Son 30 günde aynı veya benzer menkul
                          kıymet alındıysa zarar mahsubu sınırlanabilir
                          (simülasyon).
                        </p>
                      )}
                      {!tax.washSaleRisk && (
                        <p className="mt-1 pb-2 text-[11px] text-[var(--tv-muted)]">
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
                className={`trade-press w-full py-3.5 text-base ${
                  side === "buy" ? "tv-btn-buy" : "tv-btn-sell"
                }`}
              >
                {side === "buy" ? "Alışı onayla" : "Satışı onayla"}
              </button>
              <p className="mt-3 text-center text-[11px] text-[var(--tv-muted)]">
                Simülasyon — gerçek broker bağlantısı yok
              </p>
            </div>
          </div>
        )}
      </div>
    );
  }

  /* ─── Symbol detail — TV terminal ─── */
  const market = getMarketStatus();
  const changeAbs = price - price / (1 + instrument.changePct / 100);
  const up = instrument.changePct >= 0;

  const detail = (
    <div className="trade-tv-root flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      <header className="flex shrink-0 items-center gap-2 border-b border-[var(--tv-border)] bg-[var(--tv-panel)] px-3 py-2.5">
        <Link
          href="/trade"
          aria-label="Geri"
          className="tv-icon-btn trade-press -ml-1 md:hidden"
        >
          <IconBack />
        </Link>
        <span className="tv-chip-logo">
          <TickerLogo symbol={instrument.symbol} size={28} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h1 className="truncate text-[15px] font-bold tracking-tight text-[var(--tv-text)]">
              {instrument.symbol}
            </h1>
            <span className="tv-ex-badge">{instrument.exchange}</span>
          </div>
          <p className="truncate text-[11px] text-[var(--tv-muted)]">
            {instrument.name}
          </p>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 rounded px-2 py-1 text-[10px] font-semibold ${
            market.open
              ? "bg-[#26a69a]/15 text-[#26a69a]"
              : "bg-[var(--tv-panel-2)] text-[var(--tv-muted)]"
          }`}
        >
          <span
            className={`inline-block h-1.5 w-1.5 rounded-full ${
              market.open ? "bg-[#26a69a]" : "bg-[var(--tv-muted)]"
            }`}
            aria-hidden
          />
          {market.label}
        </span>
        <button
          type="button"
          className="tv-icon-btn trade-press"
          aria-label={theme === "dark" ? "Beyaz tema" : "Siyah tema"}
          title={theme === "dark" ? "Beyaz" : "Siyah"}
          onClick={toggle}
        >
          {theme === "dark" ? <IconSun size={16} /> : <IconMoon size={16} />}
        </button>
        <div className="relative">
          <button
            type="button"
            aria-label="Grafik menüsü"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((o) => !o)}
            className="tv-icon-btn trade-press"
          >
            <IconMenu size={18} />
          </button>
          {menuOpen && (
            <div className="absolute right-0 z-40 mt-1 w-44 overflow-hidden rounded border border-[var(--tv-border)] bg-[var(--tv-panel)] shadow-xl">
              <button
                type="button"
                className={`block w-full px-3 py-2.5 text-left text-[13px] ${
                  chartMode === "tradingview"
                    ? "bg-[#2962ff]/20 font-semibold text-[var(--tv-text)]"
                    : "text-[var(--tv-text)] hover:bg-[var(--tv-hover)]"
                }`}
                onClick={() => {
                  setChartMode("tradingview");
                  setMenuOpen(false);
                }}
              >
                TradingView
              </button>
              <button
                type="button"
                className={`block w-full px-3 py-2.5 text-left text-[13px] ${
                  chartMode === "basit"
                    ? "bg-[#2962ff]/20 font-semibold text-[var(--tv-text)]"
                    : "text-[var(--tv-text)] hover:bg-[var(--tv-hover)]"
                }`}
                onClick={() => {
                  setChartMode("basit");
                  setMenuOpen(false);
                }}
              >
                Basit
              </button>
              <Link
                href="/profil"
                className="block w-full border-t border-[var(--tv-border)] px-3 py-2.5 text-left text-[13px] text-[var(--tv-text)] hover:bg-[var(--tv-hover)]"
                onClick={() => setMenuOpen(false)}
              >
                Profil
              </Link>
            </div>
          )}
        </div>
      </header>

      <div className="tv-detail-scroll">
        <section className="px-3 pt-3">
          <p className="tv-mono text-[32px] font-bold leading-none tracking-tight text-[var(--tv-text)]">
            {formatMoney(instrument.price, instrument.currency)}
          </p>
          <p
            className={`tv-mono mt-1.5 text-[14px] font-semibold ${
              up ? "tv-change-up" : "tv-change-down"
            }`}
          >
            {up ? "+" : ""}
            {formatMoney(changeAbs, instrument.currency)}{" "}
            <span className="opacity-90">({formatPct(instrument.changePct)})</span>
            <span className="ml-1.5 text-[11px] font-medium text-[var(--tv-muted)]">
              bugün
            </span>
          </p>
        </section>

        <section className="mt-3">
          {chartMode === "tradingview" ? (
            <TradingViewChart
              instrument={instrument}
              theme={theme}
              height={chartHeight}
            />
          ) : (
            <div className="border-y border-[var(--tv-border)] bg-[var(--tv-bg)] px-3 py-2">
              <StockPriceChart
                symbol={instrument.symbol}
                lastPrice={instrument.price}
                changePct={instrument.changePct}
                currency={instrument.currency}
              />
            </div>
          )}
        </section>

        <section className="mt-1 px-3">
          <DarkDayStats
            symbol={instrument.symbol}
            lastPrice={instrument.price}
            changePct={instrument.changePct}
            currency={instrument.currency}
          />
        </section>

        {position && (
          <div className="mx-3 mt-3 flex items-center justify-between rounded border border-[var(--tv-border)] bg-[var(--tv-panel)] px-3.5 py-2.5 text-[13px]">
            <span className="text-[var(--tv-muted)]">Pozisyonun</span>
            <span className="tv-mono font-semibold text-[var(--tv-text)]">
              {formatShares(position.shares)} hisse ·{" "}
              {formatMoney(position.value, currency)}
            </span>
          </div>
        )}

        <p className="mt-4 px-3 pb-4 text-center text-[10px] leading-relaxed text-[var(--tv-muted)]">
          Investor Trade · fiyat gecikmeli · simülasyon · Kesirli hisse · Komisyon{" "}
          {formatMoney(0, currency)}
        </p>
      </div>

      <div className="tv-sticky-orders lg:hidden">
        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => openTicket("buy")}
            className="tv-btn-buy trade-press py-3.5 text-base"
          >
            Al
          </button>
          <button
            type="button"
            onClick={() => openTicket("sell")}
            className="tv-btn-sell trade-press py-3.5 text-base"
          >
            Sat
          </button>
        </div>
      </div>
    </div>
  );

  if (isDesktop) {
    return (
      <>
        {detail}
        <TradeOrderSidePanel instrument={instrument} />
      </>
    );
  }

  return detail;
}

function TvRow({
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
      <span className="text-[var(--tv-muted)]">{label}</span>
      <span
        className={`tv-mono font-semibold ${
          accent ? "text-[#26a69a]" : "text-[var(--tv-text)]"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

/** Dark-styled day stats — wraps same data as DayStatsGrid */
function DarkDayStats({
  symbol,
  lastPrice,
  changePct,
  currency,
}: {
  symbol: string;
  lastPrice: number;
  changePct: number;
  currency: TradeCurrency;
}) {
  return (
    <div className="[&_li]:border-[var(--tv-border)] [&_li_span:first-child]:text-[var(--tv-muted)] [&_li_span:last-child]:text-[var(--tv-text)] [&_ul]:divide-[var(--tv-border)]">
      <DayStatsGrid
        symbol={symbol}
        lastPrice={lastPrice}
        changePct={changePct}
        currency={currency}
      />
    </div>
  );
}
