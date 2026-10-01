"use client";

import { useEffect, useMemo, useState } from "react";
import { useLiveInstrument } from "@/hooks/useLiveInstrument";
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
import { TradeOhlcStrip } from "@/components/trade/TradeOhlcStrip";
import { TradeAlertsPanel } from "@/components/trade/TradeAlertsPanel";
import {
  DayStatsGrid,
  StockPriceChart,
} from "@/components/TradeCharts";
import { TradingViewChart } from "@/components/TradingViewChart";
import { LiveTradingChart } from "@/components/LiveTradingChart";
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
  moneySymbol,
  moneyUnitLabel,
  type TradeCurrency,
} from "@/lib/mock-data";
import {
  executeMarketOrder,
  getOpenPosition,
  subscribePositions,
  type LedgerPosition,
} from "@/lib/trade-ledger";
import { getMarketStatus } from "@/lib/market-series";
import { useIsDesktop } from "@/hooks/useMediaQuery";
import { TradeOrderSidePanel } from "@/components/trade/TradeOrderSidePanel";
import { TradeBottomPanel } from "@/components/trade/TradeBottomPanel";
import {
  TradeTpSlSection,
  TpSlReviewRows,
  tpSlAllowsContinue,
  useTpSlComputed,
  useTpSlState,
} from "@/components/trade/TradeTpSlSection";

type Side = "buy" | "sell";
type SellMode = "shares" | "dollars";
type Step = "detail" | "ticket" | "review" | "confirmed";
type ChartMode = "canli" | "tradingview" | "basit";
type MobileTab = "ozet" | "pozisyon" | "gecmis";

const CHART_INTERVALS = ["1", "5", "15", "60", "240", "D", "W"] as const;
type ChartInterval = (typeof CHART_INTERVALS)[number];

export default function OrderTicketPage() {
  const params = useParams();
  const symbol = String(params.symbol || "").toUpperCase();
  const isDesktop = useIsDesktop();
  const catalogInstrument = getInstrument(symbol);
  const { instrument, quote: liveQuote } = useLiveInstrument(
    catalogInstrument,
    { intervalMs: 800 }
  );

  const [position, setPosition] = useState<LedgerPosition | undefined>(undefined);
  const [step, setStep] = useState<Step>("detail");
  const [chartMode, setChartMode] = useState<ChartMode>("canli");
  const [chartInterval, setChartInterval] = useState<ChartInterval>("W");
  const [chartStyle, setChartStyle] = useState<"1" | "2" | "3">("1");
  const [showDrawings, setShowDrawings] = useState(false);
  const [mobileTab, setMobileTab] = useState<MobileTab>("ozet");
  const [hotkeySide, setHotkeySide] = useState<"buy" | "sell" | null>(null);
  const [hotkeyNonce, setHotkeyNonce] = useState(0);
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [side, setSide] = useState<Side>("buy");
  const [amount, setAmount] = useState("");
  const [sellMode, setSellMode] = useState<SellMode>("dollars");
  const [unitOpen, setUnitOpen] = useState(false);
  const [taxOpen, setTaxOpen] = useState(true);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [tpSl, patchTpSl, resetTpSl] = useTpSlState();

  useEffect(() => {
    const refresh = () => setPosition(getOpenPosition(symbol));
    refresh();
    return subscribePositions(refresh);
  }, [symbol]);

  useEffect(() => {
    setOrderModalOpen(false);
  }, [symbol]);

  const { theme, toggle } = useTradeTheme();
  const [chartHeight, setChartHeight] = useState(360);

  useEffect(() => {
    const calc = () => {
      const h = window.innerHeight;
      if (window.matchMedia("(min-width: 768px)").matches) {
        /* Near-fullscreen: header ~52 + price ~72 + toolbar ~40 + bottom panel ~148 */
        setChartHeight(Math.max(360, Math.round(h - 312)));
      } else {
        setChartHeight(Math.min(Math.round(h * 0.55), 640));
      }
    };
    calc();
    window.addEventListener("resize", calc);
    return () => window.removeEventListener("resize", calc);
  }, []);

  /* Desktop hotkeys: B buy / S sell / Esc close modal or mobile sheet */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if ((e.target as HTMLElement | null)?.isContentEditable) return;
      if (e.key === "Escape") {
        if (orderModalOpen) {
          e.preventDefault();
          setOrderModalOpen(false);
          return;
        }
        if (step === "ticket" || step === "review") {
          e.preventDefault();
          closeSheet();
        }
        return;
      }
      if (!isDesktop) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const k = e.key.toLowerCase();
      if (k === "b") {
        e.preventDefault();
        openDesktopOrder("buy");
      } else if (k === "s") {
        e.preventDefault();
        openDesktopOrder("sell");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDesktop, step, orderModalOpen]);

  const price = instrument?.price ?? 0;
  const currency: TradeCurrency = instrument?.currency ?? "USD";
  const cashAvail = cashInCurrency(currency);
  const moneyUnit = moneyUnitLabel(currency);
  const moneyPrefix = moneySymbol(currency);
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
    return estimateTaxImpact(symbol, estimatedShares, position);
  }, [side, symbol, estimatedShares, position]);

  const tpSlComputed = useTpSlComputed(tpSl, side, price, estimatedShares);

  const canContinue =
    !!instrument &&
    num > 0 &&
    (side === "buy"
      ? estimatedTotal <= cashAvail
      : estimatedShares > 0 &&
        estimatedShares <= (position?.shares ?? 0) + 0.0001) &&
    tpSlAllowsContinue(tpSl, tpSlComputed);

  function openTicket(s: Side) {
    setSide(s);
    setAmount("");
    setSellMode("dollars");
    setUnitOpen(false);
    setConfirmError(null);
    resetTpSl();
    setStep("ticket");
  }

  function openDesktopOrder(s: Side) {
    setHotkeySide(s);
    setHotkeyNonce((n) => n + 1);
    setOrderModalOpen(true);
  }

  function closeSheet() {
    setStep("detail");
    setAmount("");
    setConfirmError(null);
    resetTpSl();
  }

  function confirmOrder() {
    setConfirmError(null);
    const result = executeMarketOrder({
      symbol,
      side,
      shares: estimatedShares,
      price,
    });
    if (!result.ok) {
      setConfirmError(result.error || "İşlem başarısız");
      return;
    }
    setStep("confirmed");
  }

  if (!catalogInstrument || !instrument) {
    return (
      <div className="trade-tv-root flex h-full flex-col items-center justify-center overflow-y-auto px-4 pb-6 pt-5">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--tv-muted)]">
          404
        </p>
        <h1 className="mt-2 text-xl font-bold text-[var(--tv-text)]">
          Sembol bulunamadı
        </h1>
        <p className="mt-2 max-w-sm text-center text-sm text-[var(--tv-muted)]">
          <span className="font-mono text-[var(--tv-text)]">{symbol || "—"}</span>{" "}
          işlem listesinde yok. Ana sayfaya yönlendirilmediniz.
        </p>
        <Link
          href="/trade/"
          className="mt-6 inline-flex items-center gap-1 rounded-xl bg-[var(--tv-text)] px-4 py-2.5 text-sm font-semibold text-[var(--tv-bg,#000)]"
        >
          <IconBack size={18} /> Trade listesine dön
        </Link>
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
          {side === "buy" ? "Alış" : "Satış"} · {currency} · {instrument.symbol}
        </p>
        <div className="tv-panel mt-6 w-full divide-y divide-[var(--tv-border)] px-4 text-left text-[14px]">
          <TvRow label="Tahmini hisse" value={formatShares(estimatedShares)} />
          <TvRow label="Tahmini tutar" value={formatMoney(estimatedTotal, currency)} />
          <TvRow label="Fiyat" value={formatMoney(price, currency)} />
          <TvRow label="Komisyon" value={formatMoney(0, currency)} accent />
          {(tpSl.tpEnabled || tpSl.slEnabled) && (
            <dl className="divide-y divide-[var(--tv-border)]">
              <TpSlReviewRows
                state={tpSl}
                side={side}
                price={price}
                shares={estimatedShares}
                currency={currency}
              />
            </dl>
          )}
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
            resetTpSl();
          }}
          className="trade-press mt-3 w-full rounded border border-[var(--tv-border)] bg-[var(--tv-panel)] py-3 text-sm font-semibold text-[var(--tv-text)]"
        >
          Yeni emir
        </button>
      </div>
    );
  }

  const market = getMarketStatus();
  const changeAbs = price - price / (1 + instrument.changePct / 100);
  const up = instrument.changePct >= 0;

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

  const orderSheetBody = (step === "ticket" || step === "review") && (
    <>
      <header className="flex shrink-0 items-center justify-between border-b border-[var(--tv-border)] px-3 py-2.5">
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
        <h2 className="text-[15px] font-bold text-[var(--tv-text)]">
          <span className={side === "buy" ? "text-[#26a69a]" : "text-[#ef5350]"}>
            {side === "buy" ? "Al" : "Sat"}
          </span>{" "}
          {instrument.symbol}
          <span className="ml-2 align-middle tv-ex-badge text-[11px] font-semibold">
            {currency}
          </span>
        </h2>
        <button
          type="button"
          aria-label="Kapat"
          onClick={closeSheet}
          className="tv-icon-btn trade-press"
        >
          <IconClose />
        </button>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-5">
        <div className="mt-3 divide-y divide-[var(--tv-border)] border-y border-[var(--tv-border)]">
          <div className="flex items-start justify-between gap-3 py-3">
            <span className="text-[13px] text-[var(--tv-muted)]">Menkul kıymet</span>
            <div className="text-right">
              <p className="text-[14px] font-semibold text-[var(--tv-text)]">
                {instrument.name}
              </p>
              <p className="mt-0.5 text-[12px] text-[var(--tv-muted)]">{instrument.symbol}</p>
            </div>
          </div>
          <div className="flex items-start justify-between gap-3 py-3">
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
            <div className="tv-panel mt-4 p-3.5">
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
                className="trade-press mt-4 w-full text-center text-[14px] font-semibold text-[var(--tv-text)]"
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

            <TradeTpSlSection
              state={tpSl}
              onChange={patchTpSl}
              side={side}
              price={price}
              shares={estimatedShares}
              currency={currency}
            />

            <div className="pt-5">
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
            </div>
          </>
        )}

        {step === "review" && (
          <div className="mt-4 flex flex-col">
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
                <TpSlReviewRows
                  state={tpSl}
                  side={side}
                  price={price}
                  shares={estimatedShares}
                  currency={currency}
                />
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

            <div className="pt-5">
              {confirmError && (
                <p className="mb-3 text-center text-[12px] font-medium text-[#ef5350]">
                  {confirmError}
                </p>
              )}
              <button
                type="button"
                onClick={confirmOrder}
                className={`trade-press w-full py-3.5 text-base ${
                  side === "buy" ? "tv-btn-buy" : "tv-btn-sell"
                }`}
              >
                {side === "buy" ? "Alışı onayla" : "Satışı onayla"}
              </button>
              <p className="mt-3 text-center text-[11px] text-[var(--tv-muted)]">
                Onayda bakiye ve pozisyon güncellenir
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  );

  /* ─── Desktop symbol detail ─── */
  const desktopDetail = (
    <div className="trade-tv-root flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      <header className="flex shrink-0 items-center gap-2 border-b border-[var(--tv-border)] bg-[var(--tv-panel)] px-3 py-2.5">
        <span className="tv-chip-logo">
          <TickerLogo symbol={instrument.symbol} size={28} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h1 className="truncate text-[15px] font-bold tracking-tight text-[var(--tv-text)]">
              {instrument.symbol}
            </h1>
            <span className="tv-ex-badge">{instrument.exchange}</span>
            <span className="tv-ex-badge">{instrument.currency}</span>
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
        <TradeAlertsPanel
          symbol={instrument.symbol}
          lastPrice={instrument.price}
          currency={instrument.currency}
        />
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
            <ChartMenu
              chartMode={chartMode}
              setChartMode={setChartMode}
              setMenuOpen={setMenuOpen}
            />
          )}
        </div>
      </header>

      <div className="tv-detail-scroll flex flex-col">
        <section className="shrink-0 px-3 pt-2.5 pb-1">
          <div className="flex flex-wrap items-end gap-x-3 gap-y-1">
            <p className="tv-mono text-[28px] font-bold leading-none tracking-tight text-[var(--tv-text)]">
              {formatMoney(instrument.price, instrument.currency)}
            </p>
            <p
              className={`tv-mono pb-0.5 text-[13px] font-semibold ${
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
          </div>
          <TradeOhlcStrip
            symbol={instrument.symbol}
            lastPrice={instrument.price}
            changePct={instrument.changePct}
              liveStats={liveQuote}
            currency={instrument.currency}
          />
        </section>

        <div className="tv-chart-toolbar" role="toolbar" aria-label="Grafik araçları">
          <div className="tv-intervals !border-0 !p-0" role="tablist" aria-label="Zaman dilimi">
            {CHART_INTERVALS.map((iv) => (
              <button
                key={iv}
                type="button"
                role="tab"
                aria-selected={chartInterval === iv}
                onClick={() => setChartInterval(iv)}
                className={`tv-interval-pill trade-press${chartInterval === iv ? " active" : ""}`}
              >
                {iv}
              </button>
            ))}
          </div>
          <span className="mx-1 h-4 w-px bg-[var(--tv-border)]" aria-hidden />
          {(
            [
              { key: "1" as const, label: "Mum" },
              { key: "2" as const, label: "Çizgi" },
              { key: "3" as const, label: "Alan" },
            ] as const
          ).map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setChartStyle(t.key)}
              className={`tv-interval-pill trade-press${chartStyle === t.key ? " active" : ""}`}
            >
              {t.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setShowDrawings((v) => !v)}
            className={`tv-interval-pill trade-press${showDrawings ? " active" : ""}`}
            title="Çizim araçları"
          >
            Çizim
          </button>
        </div>

        <section className="tv-chart-stage relative mt-0 flex min-h-0 flex-1 flex-col">
          {chartMode === "canli" ? (
            <LiveTradingChart
              instrument={instrument}
              theme={theme}
              height={chartHeight}
              interval={chartInterval}
              chartStyle={chartStyle}
              fill
              livePrice={liveQuote?.price ?? instrument.price}
            />
          ) : chartMode === "tradingview" ? (
            <TradingViewChart
              instrument={instrument}
              theme={theme}
              height={chartHeight}
              interval={chartInterval}
              chartStyle={chartStyle}
              showDrawings={showDrawings}
              fill
            />
          ) : (
            <div className="flex min-h-0 flex-1 items-center border-y border-[var(--tv-border)] bg-[var(--tv-bg)] px-3 py-2">
              <StockPriceChart
                symbol={instrument.symbol}
                lastPrice={instrument.price}
                changePct={instrument.changePct}
                currency={instrument.currency}
              />
            </div>
          )}
          {/* Floating Al / Sat — bottom-center of chart */}
          <div className="tv-float-trade" role="group" aria-label="Emir">
            <button
              type="button"
              onClick={() => openDesktopOrder("buy")}
              className="tv-float-btn tv-float-btn-buy trade-press"
            >
              Al
            </button>
            <button
              type="button"
              onClick={() => openDesktopOrder("sell")}
              className="tv-float-btn tv-float-btn-sell trade-press"
            >
              Sat
            </button>
          </div>
        </section>
      </div>

      <TradeBottomPanel
        fill
        defaultTab="positions"
        className="md:max-h-[148px] md:flex-none md:h-[148px]"
        depthSymbol={instrument.symbol}
        depthPrice={instrument.price}
        depthCurrency={instrument.currency}
      />
    </div>
  );

  /* ─── Mobile symbol detail (TV trade screen) ─── */
  const mobileDetail = (
    <div className="trade-tv-root relative flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      {/* 1. Header ~44px */}
      <header className="tv-mobile-header">
        <Link
          href="/trade"
          aria-label="Geri"
          className="tv-icon-btn trade-press -ml-1"
        >
          <IconBack />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h1 className="truncate text-[15px] font-bold tracking-tight text-[var(--tv-text)]">
              {instrument.symbol}
            </h1>
            <span className="tv-ex-badge">{instrument.exchange}</span>
          </div>
        </div>
        <TradeAlertsPanel
          symbol={instrument.symbol}
          lastPrice={instrument.price}
          currency={instrument.currency}
          compact
        />
        <button
          type="button"
          className="tv-icon-btn trade-press"
          aria-label={theme === "dark" ? "Beyaz tema" : "Siyah tema"}
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
            <ChartMenu
              chartMode={chartMode}
              setChartMode={setChartMode}
              setMenuOpen={setMenuOpen}
            />
          )}
        </div>
      </header>

      {/* 2. Price strip */}
      <section className="tv-price-strip shrink-0 px-3 py-2">
        <div className="flex items-end justify-between gap-2">
          <div className="min-w-0">
            <p className="tv-mono text-[28px] font-bold leading-none tracking-tight text-[var(--tv-text)]">
              {formatMoney(instrument.price, instrument.currency)}
            </p>
            <p
              className={`tv-mono mt-1 text-[13px] font-semibold ${
                up ? "tv-change-up" : "tv-change-down"
              }`}
            >
              {up ? "+" : ""}
              {formatMoney(changeAbs, instrument.currency)}{" "}
              <span className="opacity-90">({formatPct(instrument.changePct)})</span>
            </p>
          </div>
          <span
            className={`mb-0.5 inline-flex shrink-0 items-center gap-1.5 rounded px-2 py-1 text-[10px] font-semibold ${
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
        </div>
      </section>

      {/* 3. Chart ~45-55% via flex-1 + floating Al/Sat */}
      <section className="tv-chart-stage relative flex min-h-0 flex-[1_1_52%] flex-col overflow-hidden">
        {chartMode === "canli" ? (
          <LiveTradingChart
            key={`live-${instrument.symbol}-${chartInterval}-${chartStyle}`}
            instrument={instrument}
            theme={theme}
            interval={chartInterval}
            chartStyle={chartStyle}
            fill
            livePrice={liveQuote?.price ?? instrument.price}
          />
        ) : chartMode === "tradingview" ? (
          <TradingViewChart
            key={`${instrument.symbol}-${chartInterval}-${chartStyle}`}
            instrument={instrument}
            theme={theme}
            interval={chartInterval}
            chartStyle={chartStyle}
            mobile
          />
        ) : (
          <div className="flex h-full min-h-0 flex-1 items-center border-y border-[var(--tv-border)] bg-[var(--tv-bg)] px-2 py-1">
            <StockPriceChart
              symbol={instrument.symbol}
              lastPrice={instrument.price}
              changePct={instrument.changePct}
              currency={instrument.currency}
            />
          </div>
        )}
        <div className="tv-float-trade tv-float-trade--mobile" role="group" aria-label="Emir">
          <button
            type="button"
            onClick={() => openTicket("buy")}
            className="tv-float-btn tv-float-btn-buy trade-press"
          >
            Al
          </button>
          <button
            type="button"
            onClick={() => openTicket("sell")}
            className="tv-float-btn tv-float-btn-sell trade-press"
          >
            Sat
          </button>
        </div>
      </section>

      {/* 4. Interval + chart style pills (same defaults as desktop: W + Mum) */}
      <div className="tv-intervals shrink-0" role="toolbar" aria-label="Grafik araçları">
        <div className="flex min-w-0 flex-1 gap-1 overflow-x-auto" role="tablist" aria-label="Zaman dilimi">
          {CHART_INTERVALS.map((iv) => (
            <button
              key={iv}
              type="button"
              role="tab"
              aria-selected={chartInterval === iv}
              onClick={() => setChartInterval(iv)}
              className={`tv-interval-pill trade-press${chartInterval === iv ? " active" : ""}`}
            >
              {iv}
            </button>
          ))}
        </div>
        <span className="mx-0.5 h-4 w-px shrink-0 bg-[var(--tv-border)]" aria-hidden />
        {(
          [
            { key: "1" as const, label: "Mum" },
            { key: "2" as const, label: "Çizgi" },
            { key: "3" as const, label: "Alan" },
          ] as const
        ).map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setChartStyle(t.key)}
            className={`tv-interval-pill trade-press shrink-0${chartStyle === t.key ? " active" : ""}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* 5. Tabs: Ozet | Pozisyon | Gecmis */}
      <div className="tv-mobile-tabs shrink-0" role="tablist" aria-label="Sembol sekmeleri">
        {(
          [
            { key: "ozet" as const, label: "Özet" },
            { key: "pozisyon" as const, label: "Pozisyon" },
            { key: "gecmis" as const, label: "Geçmiş" },
          ] as const
        ).map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={mobileTab === t.key}
            onClick={() => setMobileTab(t.key)}
            className={`tv-mobile-tab trade-press${mobileTab === t.key ? " active" : ""}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="tv-mobile-tab-body min-h-0 shrink-0">
        {mobileTab === "ozet" && (
          <div className="tv-day-stats-compact px-3 py-1">
            <TradeOhlcStrip
              symbol={instrument.symbol}
              lastPrice={instrument.price}
              changePct={instrument.changePct}
              liveStats={liveQuote}
              currency={instrument.currency}
              compact
            />
            <DarkDayStats
              symbol={instrument.symbol}
              lastPrice={instrument.price}
              changePct={instrument.changePct}
              currency={instrument.currency}
            />
            {position && (
              <div className="mt-1 flex items-center justify-between border-t border-[var(--tv-border)] py-2 text-[12px]">
                <span className="text-[var(--tv-muted)]">Pozisyonun</span>
                <span className="tv-mono font-semibold text-[var(--tv-text)]">
                  {formatShares(position.shares)} ·{" "}
                  {formatMoney(position.value, currency)}
                  <span
                    className={`ml-1.5 ${
                      position.plPct >= 0 ? "tv-change-up" : "tv-change-down"
                    }`}
                  >
                    ({formatPct(position.plPct)})
                  </span>
                </span>
              </div>
            )}
          </div>
        )}
        {mobileTab === "pozisyon" && (
          <TradeBottomPanel embedTab="positions" className="!min-h-0" />
        )}
        {mobileTab === "gecmis" && (
          <TradeBottomPanel embedTab="history" className="!min-h-0" />
        )}
      </div>

      {/* Order bottom sheet */}
      {(step === "ticket" || step === "review") && (
        <div
          className="tv-sheet-backdrop"
          role="presentation"
          onClick={closeSheet}
        >
          <div
            className="tv-sheet"
            role="dialog"
            aria-modal="true"
            aria-label={side === "buy" ? "Alış emri" : "Satış emri"}
            onClick={(e) => e.stopPropagation()}
          >
            {orderSheetBody}
          </div>
        </div>
      )}
    </div>
  );

  if (isDesktop) {
    return (
      <>
        {desktopDetail}
        <TradeOrderSidePanel
          instrument={instrument}
          open={orderModalOpen}
          onClose={() => setOrderModalOpen(false)}
          focusSide={hotkeySide}
          focusNonce={hotkeyNonce}
        />
      </>
    );
  }

  return mobileDetail;
}

function ChartMenu({
  chartMode,
  setChartMode,
  setMenuOpen,
}: {
  chartMode: ChartMode;
  setChartMode: (m: ChartMode) => void;
  setMenuOpen: (o: boolean | ((p: boolean) => boolean)) => void;
}) {
  return (
    <div className="absolute right-0 z-40 mt-1 w-44 overflow-hidden rounded border border-[var(--tv-border)] bg-[var(--tv-panel)] shadow-xl">
      <button
        type="button"
        className={`block w-full px-3 py-2.5 text-left text-[13px] ${
          chartMode === "canli"
            ? "bg-[color-mix(in_srgb,var(--tv-text)_18%,transparent)] font-semibold text-[var(--tv-text)]"
            : "text-[var(--tv-text)] hover:bg-[var(--tv-hover)]"
        }`}
        onClick={() => {
          setChartMode("canli");
          setMenuOpen(false);
        }}
      >
        Canlı (Yahoo)
      </button>
      <button
        type="button"
        className={`block w-full px-3 py-2.5 text-left text-[13px] ${
          chartMode === "tradingview"
            ? "bg-[color-mix(in_srgb,var(--tv-text)_18%,transparent)] font-semibold text-[var(--tv-text)]"
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
            ? "bg-[color-mix(in_srgb,var(--tv-text)_18%,transparent)] font-semibold text-[var(--tv-text)]"
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
  );
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
    <div className="[&_li]:border-[var(--tv-border)] [&_li]:py-1.5 [&_li]:text-[12px] [&_li_span:first-child]:text-[var(--tv-muted)] [&_li_span:last-child]:tv-mono [&_li_span:last-child]:text-[var(--tv-text)] [&_ul]:divide-[var(--tv-border)]">
      <DayStatsGrid
        symbol={symbol}
        lastPrice={lastPrice}
        changePct={changePct}
        currency={currency}
      />
    </div>
  );
}
