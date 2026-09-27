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
  loadTpSlOpen,
  saveTpSlMode,
  saveTpSlOpen,
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

function formatSummaryChip(state: TpSlState): string | null {
  const bits: string[] = [];
  if (state.tpEnabled && state.tpValue) {
    bits.push(
      state.mode === "percent"
        ? `TP ${state.tpValue}%`
        : `TP ${state.tpValue}`
    );
  }
  if (state.slEnabled && state.slValue) {
    bits.push(
      state.mode === "percent"
        ? `SL ${state.slValue}%`
        : `SL ${state.slValue}`
    );
  }
  if (!bits.length && (state.tpEnabled || state.slEnabled)) {
    if (state.tpEnabled) bits.push("TP");
    if (state.slEnabled) bits.push("SL");
  }
  return bits.length ? bits.join(" · ") : null;
}

/** Compact collapsible TP/SL controls for order tickets (Turkish labels). */
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
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(loadTpSlOpen());
  }, []);

  function toggleOpen() {
    setOpen((prev) => {
      const next = !prev;
      saveTpSlOpen(next);
      return next;
    });
  }

  const summary = formatSummaryChip(state);
  void compact; // API compat (rail + mobile form share compact ticket layout)

  return (
    <div className="trade-tpsl mt-3 w-full max-w-full overflow-hidden rounded border border-[var(--tv-border)] bg-[var(--tv-panel)]">
      <button
        type="button"
        onClick={toggleOpen}
        aria-expanded={open}
        className="trade-tpsl__header flex w-full items-center gap-2 px-2.5 py-2 text-left transition-colors hover:bg-[color-mix(in_srgb,var(--tv-hover)_55%,transparent)]"
      >
        <span className="min-w-0 flex-1 truncate text-[12px] font-bold tracking-tight text-[var(--tv-text)]">
          TP / SL
        </span>
        {summary && (
          <span className="tv-mono shrink-0 rounded border border-[var(--tv-border)] bg-[var(--tv-bg)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--tv-text)]">
            {summary}
          </span>
        )}
        <Chevron open={open} />
      </button>

      {open && (
        <div className="trade-tpsl__body border-t border-[var(--tv-border)] px-2.5 pb-2.5 pt-2">
          <div className="mx-auto flex w-full max-w-[300px] flex-col items-stretch gap-2">
            <div className="flex justify-center">
              <div className="inline-flex w-full max-w-[220px] gap-1 rounded border border-[var(--tv-border)] bg-[var(--tv-bg)] p-0.5">
                <ModeBtn
                  active={state.mode === "percent"}
                  onClick={() => onChange({ mode: "percent" })}
                >
                  Oran (%)
                </ModeBtn>
                <ModeBtn
                  active={state.mode === "money"}
                  onClick={() => onChange({ mode: "money" })}
                >
                  Tutar
                </ModeBtn>
              </div>
            </div>

            <BracketRow
              label="TP"
              sub="Kâr al"
              enabled={state.tpEnabled}
              onToggle={() => onChange({ tpEnabled: !state.tpEnabled })}
              value={state.tpValue}
              onValue={(v) => onChange({ tpValue: v })}
              mode={state.mode}
              prefix={prefix}
              placeholder={state.mode === "percent" ? "2" : "50"}
              accent="#26a69a"
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
              placeholder={state.mode === "percent" ? "1" : "20"}
              accent="#ef5350"
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
              />
            )}

            <p className="text-center text-[9px] text-[var(--tv-muted)]">
              {currency} · {side === "buy" ? "Al" : "Sat"} · simülasyon
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden
      className={`shrink-0 text-[var(--tv-muted)] transition-transform duration-150 ${
        open ? "rotate-180" : ""
      }`}
    >
      <path
        d="M4 6l4 4 4-4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ModeBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 rounded px-2 py-1 text-[11px] font-semibold transition-colors ${
        active
          ? "bg-[color-mix(in_srgb,var(--tv-text)_12%,transparent)] text-[var(--tv-text)] shadow-sm"
          : "text-[var(--tv-muted)] hover:text-[var(--tv-text)]"
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
}) {
  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={enabled}
        aria-label={`${sub} ${enabled ? "açık" : "kapalı"}`}
        className={`inline-flex h-7 w-9 shrink-0 items-center justify-center rounded border text-[11px] font-bold transition-colors ${
          enabled
            ? "border-transparent text-white"
            : "border-[var(--tv-border)] bg-[var(--tv-bg)] text-[var(--tv-muted)]"
        }`}
        style={enabled ? { backgroundColor: accent } : undefined}
      >
        {label}
      </button>
      <span className="w-[4.5rem] shrink-0 truncate text-[11px] text-[var(--tv-muted)]">
        {sub}
      </span>
      <div className="relative min-w-0 flex-1">
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
          className={`tv-input trade-tpsl__input tv-mono w-full py-1.5 text-[12px] disabled:opacity-40 ${
            mode === "money" && enabled ? "pl-6 pr-2" : "pl-2"
          } ${mode === "percent" && enabled ? "pr-6" : "pr-2"}`}
        />
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
}: {
  kind: "tp" | "sl";
  price: number | null;
  amount: number | null;
  currency: TradeCurrency;
  ok: boolean;
  needsShares: boolean;
  mode: BracketMode;
  shares: number;
}) {
  const labelPrice = kind === "tp" ? "TP" : "SL";
  const labelAmt = kind === "tp" ? "kâr" : "zarar";
  const color = kind === "tp" ? "text-[#26a69a]" : "text-[#ef5350]";

  if (needsShares || (mode === "money" && shares <= 0)) {
    return (
      <p className="-mt-1 text-center text-[10px] leading-tight text-[var(--tv-muted)]">
        Tutar için önce emir / hisse girin
      </p>
    );
  }

  if (price == null) {
    return (
      <p className="-mt-1 text-center text-[10px] leading-tight text-[var(--tv-muted)]">
        Değer girin
      </p>
    );
  }

  if (!ok) {
    return (
      <p className="-mt-1 text-center text-[10px] leading-tight text-[#ef5350]">
        {kind === "tp"
          ? "TP girişin üzerinde olmalı"
          : "SL girişin altında ve pozitif olmalı"}
      </p>
    );
  }

  return (
    <p
      className={`tv-mono -mt-1 text-center text-[10px] leading-tight ${color}`}
    >
      {labelPrice} {formatMoney(price, currency)}
      {amount != null && shares > 0 ? (
        <>
          {" "}
          · {labelAmt} {formatMoney(amount, currency)}
        </>
      ) : mode === "percent" && amount != null ? (
        <>
          {" "}
          · {labelAmt}/h {formatMoney(amount, currency)}
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
