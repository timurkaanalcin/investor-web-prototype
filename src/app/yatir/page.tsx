"use client";

import { useEffect, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { AllocationBar } from "@/components/Charts";
import { IconClose, IconInfo } from "@/components/Icons";
import {
  ALLOCATION,
  AUTO_CONTRIBUTION,
  HOLDINGS,
  TOTAL_BALANCE,
  formatPct,
  formatTRY,
} from "@/lib/mock-data";
import {
  getAutoContribution,
  setAutoContribution,
} from "@/lib/storage";
import {
  MOCK_CARD_NOTE,
  MOCK_CRYPTO,
  MOCK_IBAN,
  SCREENSHOT_MAX_BYTES,
  SCREENSHOT_WARN_BYTES,
} from "@/lib/payment-config";
import {
  createDepositRequest,
  createWithdrawRequest,
  getDisplayBalance,
  methodLabel,
  subscribeMoneyUpdates,
  type MoneyMethod,
} from "@/lib/money-requests";

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
const STEPS = ["Tutar", "Yöntem", "Ödeme", "Kanıt", "Onay"] as const;

type FlowMode = "deposit" | "withdraw" | null;

export default function InvestPage() {
  const [autoOn, setAutoOn] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [balance, setBalance] = useState(TOTAL_BALANCE);
  const [rebalanceOpen, setRebalanceOpen] = useState(false);
  const [holdingId, setHoldingId] = useState<string | null>(null);

  // Deposit / withdraw flow
  const [mode, setMode] = useState<FlowMode>(null);
  const [step, setStep] = useState(0);
  const [amount, setAmount] = useState("2500");
  const [method, setMethod] = useState<MoneyMethod | null>(null);
  const [screenshot, setScreenshot] = useState<string | undefined>();
  const [shotWarn, setShotWarn] = useState<string | null>(null);
  const [paidOk, setPaidOk] = useState(false);
  const [cardSimDone, setCardSimDone] = useState(false);
  const [cardName, setCardName] = useState("");
  const [cardNum, setCardNum] = useState("");
  const [cardExp, setCardExp] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [wdIban, setWdIban] = useState("");
  const [wdName, setWdName] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setAutoOn(getAutoContribution());
    setBalance(getDisplayBalance());
    return subscribeMoneyUpdates(() => setBalance(getDisplayBalance()));
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

  function resetFlow() {
    setMode(null);
    setStep(0);
    setAmount("2500");
    setMethod(null);
    setScreenshot(undefined);
    setShotWarn(null);
    setPaidOk(false);
    setCardSimDone(false);
    setCardName("");
    setCardNum("");
    setCardExp("");
    setCardCvv("");
    setWdIban("");
    setWdName("");
    setCopied(false);
  }

  function openDeposit() {
    resetFlow();
    setMode("deposit");
    setStep(0);
  }

  function openWithdraw() {
    resetFlow();
    setMode("withdraw");
    setStep(0);
  }

  function confirmRebalance() {
    setRebalanceOpen(false);
    flash("Portföy yeniden dengelendi");
  }

  async function copyText(text: string) {
    try {
      await navigator.clipboard.writeText(text.replace(/\s/g, ""));
      setCopied(true);
      flash("Kopyalandı");
      setTimeout(() => setCopied(false), 1500);
    } catch {
      flash("Kopyalanamadı");
    }
  }

  function onScreenshotFile(file: File | null) {
    setShotWarn(null);
    setScreenshot(undefined);
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setShotWarn("Yalnızca görüntü dosyası yükleyin");
      return;
    }
    if (file.size > SCREENSHOT_MAX_BYTES) {
      setShotWarn(
        `Dosya çok büyük (~${Math.round(file.size / 1024)} KB). En fazla ~1,5 MB.`
      );
      return;
    }
    if (file.size > SCREENSHOT_WARN_BYTES) {
      setShotWarn(
        `Dosya büyük (~${Math.round(file.size / 1024)} KB). Yine de devam edebilirsiniz.`
      );
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || "");
      if (result.length > SCREENSHOT_MAX_BYTES * 1.4) {
        setShotWarn("Kodlanmış görüntü çok büyük — daha küçük bir dosya seçin");
        return;
      }
      setScreenshot(result);
    };
    reader.readAsDataURL(file);
  }

  function submitDeposit() {
    const n = parseFloat(amount.replace(",", ".")) || 0;
    if (n <= 0 || !method) {
      flash("Geçerli tutar ve yöntem gerekli");
      return;
    }
    if (!paidOk && method !== "card") {
      flash("Ödemeyi yaptım kutusunu işaretleyin");
      return;
    }
    if (method === "card" && !cardSimDone && !paidOk) {
      flash("Kart simülasyonunu tamamlayın veya onaylayın");
      return;
    }
    createDepositRequest({
      amount: n,
      method,
      screenshotDataUrl: screenshot,
      paidConfirmed: paidOk || cardSimDone,
      cardSimPaid: method === "card" && cardSimDone,
    });
    resetFlow();
    flash("Para ekleme talebi gönderildi");
  }

  function submitWithdraw() {
    const n = parseFloat(amount.replace(",", ".")) || 0;
    if (n <= 0) {
      flash("Geçerli bir tutar girin");
      return;
    }
    if (n > balance) {
      flash("Yetersiz bakiye");
      return;
    }
    if (wdIban.replace(/\s/g, "").length < 15 || !wdName.trim()) {
      flash("IBAN ve alıcı adı gerekli");
      return;
    }
    createWithdrawRequest({
      amount: n,
      userIban: wdIban.trim(),
      userHolderName: wdName.trim(),
    });
    resetFlow();
    flash("Çekim talebi gönderildi");
  }

  const selectedHolding = HOLDINGS.find((h) => h.id === holdingId);
  const amountNum = parseFloat(amount.replace(",", ".")) || 0;

  return (
    <div className="px-5 pb-6 md:px-0 md:pb-0">
      <AppHeader centerLogo />

      <div className="mt-2 flex items-center gap-2 md:mt-0">
        <h1 className="font-serif text-3xl font-bold text-nest md:text-4xl">
          Yatır
        </h1>
        <IconInfo className="text-muted" size={18} />
      </div>
      <p className="mt-1 text-sm text-muted">
        Bakiye {formatTRY(balance)} · prototip
      </p>

      <div className="md:desk-grid-invest md:mt-6">
        <div>
          <div className="card mt-5 p-4 md:mt-0 md:p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm text-muted">Otomatik katkı</p>
                <p className="mt-1 text-2xl font-bold text-nest">
                  {formatTRY(AUTO_CONTRIBUTION)}{" "}
                  <span className="text-base font-medium text-muted">
                    / ay
                  </span>
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

          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={openDeposit}
              className="btn-primary min-h-[44px] flex-1 py-3.5 text-base active:scale-[0.98]"
            >
              Hemen yatır
            </button>
            <button
              type="button"
              onClick={openWithdraw}
              className="btn-secondary min-h-[44px] flex-1 py-3.5 text-sm active:scale-[0.98]"
            >
              Para çek
            </button>
          </div>

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

      {/* Deposit / withdraw modal */}
      {mode && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:p-4"
          onClick={resetFlow}
          role="presentation"
        >
          <div
            className="max-h-[92vh] w-full max-w-[420px] overflow-y-auto rounded-t-3xl bg-card p-5 shadow-2xl sm:rounded-3xl md:max-w-md"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-nest">
                {mode === "deposit" ? "Para yatır" : "Para çek"}
              </h3>
              <button
                type="button"
                aria-label="Kapat"
                onClick={resetFlow}
                className="rounded-full bg-beige p-2"
              >
                <IconClose size={18} />
              </button>
            </div>

            {mode === "deposit" && (
              <>
                <ol className="step-indicator mt-4 flex gap-1">
                  {STEPS.map((label, i) => (
                    <li
                      key={label}
                      className={`flex-1 rounded-full px-1 py-1.5 text-center text-[10px] font-semibold ${
                        i === step
                          ? "bg-nest-solid text-white"
                          : i < step
                            ? "bg-beige text-nest"
                            : "bg-beige/50 text-muted"
                      }`}
                    >
                      {label}
                    </li>
                  ))}
                </ol>

                {/* Step A — amount */}
                {step === 0 && (
                  <>
                    <p className="mt-4 text-sm text-muted">
                      Yatırmak istediğiniz tutarı girin (TRY)
                    </p>
                    <div className="mt-3 flex items-baseline gap-1 rounded-2xl bg-beige px-4 py-3">
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
                      onClick={() => {
                        if (amountNum <= 0) {
                          flash("Geçerli bir tutar girin");
                          return;
                        }
                        setStep(1);
                      }}
                      className="btn-primary mt-5 w-full py-3.5 text-sm"
                    >
                      Devam
                    </button>
                  </>
                )}

                {/* Step B — method */}
                {step === 1 && (
                  <>
                    <p className="mt-4 text-sm text-muted">
                      Yatırma seçenekleri · {formatTRY(amountNum)}
                    </p>
                    <div className="mt-3 space-y-2">
                      {(
                        [
                          ["crypto", "Kripto", "USDT TRC20 cüzdan"],
                          ["card", "Kredi kartı", "Simülasyon ödeme"],
                          ["iban", "IBAN’a transfer", "Banka havalesi"],
                        ] as const
                      ).map(([id, title, sub]) => (
                        <button
                          key={id}
                          type="button"
                          onClick={() => {
                            setMethod(id);
                            setStep(2);
                            setCardSimDone(false);
                            setPaidOk(false);
                          }}
                          className="card flex w-full items-center justify-between p-4 text-left"
                        >
                          <div>
                            <p className="text-sm font-semibold text-nest">
                              {title}
                            </p>
                            <p className="text-xs text-muted">{sub}</p>
                          </div>
                          <span className="text-muted">›</span>
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => setStep(0)}
                      className="btn-secondary mt-4 w-full py-3 text-sm"
                    >
                      Geri
                    </button>
                  </>
                )}

                {/* Step C — payment details */}
                {step === 2 && method && (
                  <>
                    <p className="mt-4 text-sm font-semibold text-nest">
                      {methodLabel(method)} · {formatTRY(amountNum)}
                    </p>

                    {method === "crypto" && (
                      <div className="mt-3 space-y-3 rounded-2xl bg-beige p-4 text-sm">
                        <div>
                          <p className="text-xs text-muted">Ağ / varlık</p>
                          <p className="font-semibold text-nest">
                            {MOCK_CRYPTO.label}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted">Cüzdan adresi</p>
                          <p className="break-all font-mono text-xs text-nest">
                            {MOCK_CRYPTO.address}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => copyText(MOCK_CRYPTO.address)}
                          className="btn-secondary w-full py-2.5 text-xs"
                        >
                          {copied ? "Kopyalandı" : "Adresi kopyala"}
                        </button>
                      </div>
                    )}

                    {method === "iban" && (
                      <div className="mt-3 space-y-3 rounded-2xl bg-beige p-4 text-sm">
                        <div>
                          <p className="text-xs text-muted">Banka</p>
                          <p className="font-semibold text-nest">
                            {MOCK_IBAN.bank}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted">Alıcı</p>
                          <p className="font-semibold text-nest">
                            {MOCK_IBAN.holderName}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted">IBAN</p>
                          <p className="font-mono text-xs text-nest">
                            {MOCK_IBAN.iban}
                          </p>
                        </div>
                        <p className="text-[11px] text-muted">
                          {MOCK_IBAN.descriptionHint}
                        </p>
                        <button
                          type="button"
                          onClick={() => copyText(MOCK_IBAN.iban)}
                          className="btn-secondary w-full py-2.5 text-xs"
                        >
                          {copied ? "Kopyalandı" : "IBAN kopyala"}
                        </button>
                      </div>
                    )}

                    {method === "card" && (
                      <div className="mt-3 space-y-3">
                        <p className="text-xs text-muted">{MOCK_CARD_NOTE}</p>
                        {!cardSimDone ? (
                          <>
                            <input
                              className="w-full rounded-xl bg-beige px-3 py-2.5 text-sm outline-none"
                              placeholder="Kart üzerindeki ad"
                              value={cardName}
                              onChange={(e) => setCardName(e.target.value)}
                            />
                            <input
                              className="w-full rounded-xl bg-beige px-3 py-2.5 text-sm outline-none"
                              placeholder="Kart numarası (mock)"
                              inputMode="numeric"
                              value={cardNum}
                              onChange={(e) => setCardNum(e.target.value)}
                            />
                            <div className="flex gap-2">
                              <input
                                className="w-full rounded-xl bg-beige px-3 py-2.5 text-sm outline-none"
                                placeholder="AA/YY"
                                value={cardExp}
                                onChange={(e) => setCardExp(e.target.value)}
                              />
                              <input
                                className="w-full rounded-xl bg-beige px-3 py-2.5 text-sm outline-none"
                                placeholder="CVV"
                                value={cardCvv}
                                onChange={(e) => setCardCvv(e.target.value)}
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setCardSimDone(true);
                                setPaidOk(true);
                                flash("Ödeme alındı (sim)");
                              }}
                              className="btn-primary w-full py-3 text-sm"
                            >
                              Kart ile ödeme simülasyonu
                            </button>
                          </>
                        ) : (
                          <div className="rounded-2xl bg-beige p-4 text-sm text-nest">
                            Ödeme alındı (simülasyon). Talep admin onayı
                            bekleyecek.
                          </div>
                        )}
                      </div>
                    )}

                    <div className="mt-4 flex gap-2">
                      <button
                        type="button"
                        onClick={() => setStep(1)}
                        className="btn-secondary flex-1 py-3 text-sm"
                      >
                        Geri
                      </button>
                      <button
                        type="button"
                        onClick={() => setStep(3)}
                        className="btn-primary flex-1 py-3 text-sm"
                      >
                        Devam et
                      </button>
                    </div>
                  </>
                )}

                {/* Step D — screenshot */}
                {step === 3 && (
                  <>
                    <p className="mt-4 text-sm text-muted">
                      Ödeme ekran görüntüsü yükleyin (isteğe bağlı ama AI
                      incelemesi için önerilir)
                    </p>
                    <label className="mt-3 flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-beige px-4 py-8 text-center">
                      <span className="text-sm font-semibold text-nest">
                        Görüntü seç
                      </span>
                      <span className="mt-1 text-[11px] text-muted">
                        PNG / JPG · max ~1,5 MB
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) =>
                          onScreenshotFile(e.target.files?.[0] || null)
                        }
                      />
                    </label>
                    {shotWarn && (
                      <p className="mt-2 text-xs text-warn">{shotWarn}</p>
                    )}
                    {screenshot && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={screenshot}
                        alt="Önizleme"
                        className="mt-3 max-h-40 w-full rounded-xl object-contain bg-beige"
                      />
                    )}
                    <div className="mt-4 flex gap-2">
                      <button
                        type="button"
                        onClick={() => setStep(2)}
                        className="btn-secondary flex-1 py-3 text-sm"
                      >
                        Geri
                      </button>
                      <button
                        type="button"
                        onClick={() => setStep(4)}
                        className="btn-primary flex-1 py-3 text-sm"
                      >
                        Devam et
                      </button>
                    </div>
                  </>
                )}

                {/* Step E — confirm */}
                {step === 4 && (
                  <>
                    <div className="mt-4 space-y-2 rounded-2xl bg-beige p-4 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted">Tutar</span>
                        <span className="font-semibold text-nest">
                          {formatTRY(amountNum)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted">Yöntem</span>
                        <span className="font-semibold text-nest">
                          {methodLabel(method || undefined)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted">Kanıt</span>
                        <span className="font-semibold text-nest">
                          {screenshot ? "Yüklendi" : "Yok"}
                        </span>
                      </div>
                    </div>
                    <label className="mt-4 flex items-start gap-3 text-sm text-nest">
                      <input
                        type="checkbox"
                        checked={paidOk}
                        onChange={(e) => setPaidOk(e.target.checked)}
                        className="mt-1"
                      />
                      <span>
                        Ödemeyi yaptım — para ekleme talebi oluşturulsun
                        (admin onayı gerekir)
                      </span>
                    </label>
                    <div className="mt-5 flex gap-2">
                      <button
                        type="button"
                        onClick={() => setStep(3)}
                        className="btn-secondary flex-1 py-3 text-sm"
                      >
                        Geri
                      </button>
                      <button
                        type="button"
                        onClick={submitDeposit}
                        className="btn-primary flex-1 py-3 text-sm"
                      >
                        Talep gönder
                      </button>
                    </div>
                  </>
                )}
              </>
            )}

            {mode === "withdraw" && (
              <>
                <p className="mt-3 text-sm text-muted">
                  Kullanılabilir bakiye: {formatTRY(balance)}
                </p>
                <div className="mt-3 flex items-baseline gap-1 rounded-2xl bg-beige px-4 py-3">
                  <span className="text-2xl font-bold text-nest">₺</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-transparent text-3xl font-bold text-nest outline-none"
                    aria-label="Çekim tutarı"
                  />
                </div>
                <input
                  className="mt-3 w-full rounded-xl bg-beige px-3 py-2.5 text-sm outline-none"
                  placeholder="Alıcı ad soyad"
                  value={wdName}
                  onChange={(e) => setWdName(e.target.value)}
                />
                <input
                  className="mt-2 w-full rounded-xl bg-beige px-3 py-2.5 text-sm outline-none"
                  placeholder="IBAN"
                  value={wdIban}
                  onChange={(e) => setWdIban(e.target.value)}
                />
                <p className="mt-2 text-[11px] text-muted">
                  Çekim admin onayı sonrası bakiyeden düşülür. Gerçek transfer
                  yok.
                </p>
                <button
                  type="button"
                  onClick={submitWithdraw}
                  className="btn-primary mt-5 w-full py-3.5 text-sm"
                >
                  Çekim talebi oluştur
                </button>
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
