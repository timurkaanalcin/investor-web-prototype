"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  formatMoney,
  moneySymbol,
  type TradeCurrency,
} from "@/lib/mock-data";
import {
  computeTpSl,
  loadTpSlMode,
  saveTpSlMode,
  type BracketMode,
  type BracketSide,
} from "@/lib/trade-brackets";

export type TpSlState = {
  tpEnabled: boolean;
  slEnabled: boolean;
  mode: BracketMode;
  tpValue: string;
  slValue: string;
};

export const DEFAULT_TP_SL: TpSlState = {
  tpEnabled: false,
  slEnabled: false,
  mode: "percent",
  tpValue: "",
  slValue: "",
};

export function useTpSlState(): [TpSlState, (patch: Partial<TpSlState>) => void, () => void] {
  const [state, setState] = useState<TpSlState>(DEFAULT_TP_SL);

  useEffect(() => {
    const mode = loadTpSlMode();
    setState((s) => ({ ...s, mode }));
  }, []);

  function patch(p: Partial<TpSlState>) {
    setState((s) => {
      const next = { ...s, ...p };
      if (p.mode && p.mode !== s.mode) {
        saveTpSlMode(p.mode);
        next.tpValue = "";
        next.slValue = "";
      }
      return next;
    });
  }

  function reset() {
    setState((s) => ({
      ...DEFAULT_TP_SL,
      mode: s.mode,
    }));
  }

  return [state, patch, reset];
}

export function useTpSlComputed(
  state: TpSlState,
  side: BracketSide,
  price: number,
  shares: number
) {
  return useMemo(() => {
    const tpNum = parseFloat(state.tpValue.replace(",", ".")) || 0;
    const slNum = parseFloat(state.slValue.replace(",", ".")) || 0;
    return computeTpSl({
      side,
      price,
      shares,
      mode: state.mode,
      tpEnabled: state.tpEnabled,
      slEnabled: state.slEnabled,
      tpValue: tpNum,
      slValue: slNum,
    });
  }, [state, side, price, shares]);
}

/** Compact TP/SL controls for order tickets (Turkish labels). */
export function TradeTpSlSection({
  state,
  onChange,
  side,
  price,
  shares,
  currency,
  compact,
}: {
  state: TpSlState;
  onChange: (patch: Partial<TpSlState>) => void;
  side: BracketSide;
  price: number;
  shares: number;
  currency: TradeCurrency;
  compact?: boolean;
}) {
  const computed = useTpSlComputed(state, side, price, shares);
  const prefix = moneySymbol(currency);
  const pad = compact ? "px-2 py-1.5 text-[12px]" : "px-3 py-2 text-[13px]";

  return (
    <div
      className={`mt-3 rounded border border-[var(--tv-border)] bg-[var(--tv-bg)] ${
        compact ? "p-2.5" : "p-3.5"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <p
          className={`font-bold text-[var(--tv-text)] ${
            compact ? "text-[12px]" : "text-[13px]"
          }`}
        >
          Kâr al / Zarar durdur
        </p>
        <span className="tv-ex-badge text-[10px]">
          {currency} · {side === "buy" ? "Al" : "Sat"}
        </span>
      </div>

      <div className="mt-2 flex gap-1">
        <ModeBtn
          active={state.mode === "percent"}
          onClick={() => onChange({ mode: "percent" })}
          compact={!!compact}
        >
          Oran (%)
        </ModeBtn>
        <ModeBtn
          active={state.mode === "money"}
          onClick={() => onChange({ mode: "money" })}
          compact={!!compact}
        >
          Tutar
        </ModeBtn>
      </div>

      <div className={`mt-2.5 space-y-2 ${compact ? "" : "space-y-2.5"}`}>
        <BracketRow
          label="TP"
          sub="Kâr al"
          enabled={state.tpEnabled}
          onToggle={() => onChange({ tpEnabled: !state.tpEnabled })}
          value={state.tpValue}
          onValue={(v) => onChange({ tpValue: v })}
          mode={state.mode}
          prefix={prefix}
          placeholder={state.mode === "percent" ? "örn. 2" : "örn. 50"}
          accent="#26a69a"
          compact={!!compact}
          pad={pad}
        />
        {state.tpEnabled && (
          <PreviewLine
            kind="tp"
            price={computed.tpPrice}
            amount={computed.tpProfit}
            currency={currency}
            ok={computed.tpOk}
            needsShares={computed.needsShares}
            mode={state.mode}
            shares={shares}
            compact={!!compact}
          />
        )}

        <BracketRow
          label="SL"
          sub="Zarar durdur"
          enabled={state.slEnabled}
          onToggle={() => onChange({ slEnabled: !state.slEnabled })}
          value={state.slValue}
          onValue={(v) => onChange({ slValue: v })}
          mode={state.mode}
          prefix={prefix}
          placeholder={state.mode === "percent" ? "örn. 1" : "örn. 20"}
          accent="#ef5350"
          compact={!!compact}
          pad={pad}
        />
        {state.slEnabled && (
          <PreviewLine
            kind="sl"
            price={computed.slPrice}
            amount={computed.slLoss}
            currency={currency}
            ok={computed.slOk}
            needsShares={computed.needsShares}
            mode={state.mode}
            shares={shares}
            compact={!!compact}
          />
        )}
      </div>
    </div>
  );
}

function ModeBtn({
  active,
  onClick,
  children,
  compact,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
  compact: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 rounded border font-semibold transition-colors ${
        compact ? "px-2 py-1 text-[11px]" : "px-2 py-1.5 text-[12px]"
      } ${
        active
          ? "border-[var(--tv-text)] bg-[color-mix(in_srgb,var(--tv-text)_12%,transparent)] text-[var(--tv-text)]"
          : "border-[var(--tv-border)] text-[var(--tv-muted)] hover:text-[var(--tv-text)]"
      }`}
    >
      {children}
    </button>
  );
}

function BracketRow({
  label,
  sub,
  enabled,
  onToggle,
  value,
  onValue,
  mode,
  prefix,
  placeholder,
  accent,
  compact,
  pad,
}: {
  label: string;
  sub: string;
  enabled: boolean;
  onToggle: () => void;
  value: string;
  onValue: (v: string) => void;
  mode: BracketMode;
  prefix: string;
  placeholder: string;
  accent: string;
  compact: boolean;
  pad: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={enabled}
        className={`shrink-0 rounded border font-bold transition-colors ${
          compact ? "h-7 w-10 text-[11px]" : "h-8 w-11 text-[12px]"
        } ${
          enabled
            ? "border-transparent text-white"
            : "border-[var(--tv-border)] bg-[var(--tv-panel)] text-[var(--tv-muted)]"
        }`}
        style={enabled ? { backgroundColor: accent } : undefined}
      >
        {label}
      </button>
      <div className="min-w-0 flex-1">
        <p className="mb-0.5 text-[10px] text-[var(--tv-muted)]">{sub}</p>
        <div className="relative">
          {enabled && mode === "money" && (
            <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-[11px] text-[var(--tv-muted)]">
              {prefix}
            </span>
          )}
          {enabled && mode === "percent" && (
            <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[11px] text-[var(--tv-muted)]">
              %
            </span>
          )}
          <input
            type="text"
            inputMode="decimal"
            disabled={!enabled}
            value={value}
            onChange={(e) =>
              onValue(e.target.value.replace(/[^0-9.,]/g, ""))
            }
            placeholder={enabled ? placeholder : "—"}
            className={`tv-input tv-mono w-full disabled:opacity-40 ${pad} ${
              mode === "money" && enabled ? "pl-7" : "pl-2"
            } ${mode === "percent" && enabled ? "pr-7" : "pr-2"}`}
          />
        </div>
      </div>
    </div>
  );
}

function PreviewLine({
  kind,
  price,
  amount,
  currency,
  ok,
  needsShares,
  mode,
  shares,
  compact,
}: {
  kind: "tp" | "sl";
  price: number | null;
  amount: number | null;
  currency: TradeCurrency;
  ok: boolean;
  needsShares: boolean;
  mode: BracketMode;
  shares: number;
  compact: boolean;
}) {
  const labelPrice = kind === "tp" ? "TP fiyat" : "SL fiyat";
  const labelAmt = kind === "tp" ? "tahmini kâr" : "tahmini zarar";
  const color = kind === "tp" ? "text-[#26a69a]" : "text-[#ef5350]";

  if (needsShares || (mode === "money" && shares <= 0)) {
    return (
      <p className={`text-[10px] text-[var(--tv-muted)] ${compact ? "pl-12" : "pl-14"}`}>
        Tutar modu için önce emir tutarı / hisse girin
      </p>
    );
  }

  if (price == null) {
    return (
      <p className={`text-[10px] text-[var(--tv-muted)] ${compact ? "pl-12" : "pl-14"}`}>
        Değer girin
      </p>
    );
  }

  if (!ok) {
    return (
      <p className={`text-[10px] text-[#ef5350] ${compact ? "pl-12" : "pl-14"}`}>
        {kind === "tp"
          ? "TP fiyatı girişin üzerinde olmalı"
          : "SL fiyatı girişin altında ve pozitif olmalı"}
      </p>
    );
  }

  return (
    <p
      className={`tv-mono ${color} ${
        compact ? "pl-12 text-[10px]" : "pl-14 text-[11px]"
      }`}
    >
      {labelPrice}: {formatMoney(price, currency)}
      {amount != null && shares > 0 ? (
        <>
          {" "}
          · {labelAmt}: {formatMoney(amount, currency)}
        </>
      ) : mode === "percent" && amount != null ? (
        <>
          {" "}
          · {labelAmt}/hisse: {formatMoney(amount, currency)}
        </>
      ) : null}
    </p>
  );
}

/** Rows for review / confirmed screens */
export function TpSlReviewRows({
  state,
  side,
  price,
  shares,
  currency,
}: {
  state: TpSlState;
  side: BracketSide;
  price: number;
  shares: number;
  currency: TradeCurrency;
}) {
  const computed = useTpSlComputed(state, side, price, shares);
  if (!state.tpEnabled && !state.slEnabled) return null;

  const modeLabel = state.mode === "percent" ? "Oran (%)" : "Tutar";

  return (
    <>
      <div className="flex justify-between py-2 text-[13px]">
        <dt className="text-[var(--tv-muted)]">TP / SL modu</dt>
        <dd className="font-semibold text-[var(--tv-text)]">{modeLabel}</dd>
      </div>
      {state.tpEnabled && (
        <div className="flex justify-between py-2 text-[13px]">
          <dt className="text-[var(--tv-muted)]">
            TP{" "}
            {state.mode === "percent"
              ? `(${state.tpValue || "—"}%)`
              : `(${state.tpValue || "—"} ${currency})`}
          </dt>
          <dd className="tv-mono font-semibold text-[#26a69a]">
            {computed.tpPrice != null
              ? formatMoney(computed.tpPrice, currency)
              : "—"}
            {computed.tpProfit != null && shares > 0
              ? ` · +${formatMoney(computed.tpProfit, currency)}`
              : ""}
          </dd>
        </div>
      )}
      {state.slEnabled && (
        <div className="flex justify-between py-2 text-[13px]">
          <dt className="text-[var(--tv-muted)]">
            SL{" "}
            {state.mode === "percent"
              ? `(${state.slValue || "—"}%)`
              : `(${state.slValue || "—"} ${currency})`}
          </dt>
          <dd className="tv-mono font-semibold text-[#ef5350]">
            {computed.slPrice != null
              ? formatMoney(computed.slPrice, currency)
              : "—"}
            {computed.slLoss != null && shares > 0
              ? ` · −${formatMoney(computed.slLoss, currency)}`
              : ""}
          </dd>
        </div>
      )}
    </>
  );
}

/** Bracket validity for enabling Devam when TP/SL toggled with values */
export function tpSlAllowsContinue(state: TpSlState, computed: ReturnType<typeof computeTpSl>): boolean {
  if (!state.tpEnabled && !state.slEnabled) return true;
  if (state.tpEnabled) {
    const v = parseFloat(state.tpValue.replace(",", ".")) || 0;
    if (v <= 0 || !computed.tpOk) return false;
  }
  if (state.slEnabled) {
    const v = parseFloat(state.slValue.replace(",", ".")) || 0;
    if (v <= 0 || !computed.slOk) return false;
  }
  if (computed.needsShares) return false;
  return true;
}
