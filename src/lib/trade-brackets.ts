/** Pure TP / SL bracket helpers for mock order tickets. */

export type BracketMode = "percent" | "money";
export type BracketSide = "buy" | "sell";

export type ComputeTpSlInput = {
  side: BracketSide;
  /** Entry / market price (sim) */
  price: number;
  /** Estimated fill shares */
  shares: number;
  mode: BracketMode;
  tpEnabled: boolean;
  slEnabled: boolean;
  /** Percent (e.g. 2) or money profit/loss amount in instrument currency */
  tpValue: number;
  slValue: number;
};

export type ComputeTpSlResult = {
  tpPrice: number | null;
  slPrice: number | null;
  /** Estimated profit if TP hits (absolute, always ≥ 0 when valid) */
  tpProfit: number | null;
  /** Estimated loss if SL hits (absolute, always ≥ 0 when valid) */
  slLoss: number | null;
  tpOk: boolean;
  slOk: boolean;
  /** Hint when money mode needs shares */
  needsShares: boolean;
};

/**
 * Attach brackets as if entry = current price.
 * For long (buy entry or sell-to-close long): TP above, SL below.
 * Sell side uses the same long-bracket direction (limit sell target up, stop down).
 */
export function computeTpSl(input: ComputeTpSlInput): ComputeTpSlResult {
  const { price, shares, mode, tpEnabled, slEnabled, tpValue, slValue } =
    input;

  const empty: ComputeTpSlResult = {
    tpPrice: null,
    slPrice: null,
    tpProfit: null,
    slLoss: null,
    tpOk: !tpEnabled,
    slOk: !slEnabled,
    needsShares: false,
  };

  if (!Number.isFinite(price) || price <= 0) return empty;

  const moneyNeedsShares =
    mode === "money" && ((tpEnabled && tpValue > 0) || (slEnabled && slValue > 0));
  if (moneyNeedsShares && (!Number.isFinite(shares) || shares <= 0)) {
    return { ...empty, needsShares: true, tpOk: false, slOk: false };
  }

  let tpPrice: number | null = null;
  let slPrice: number | null = null;

  if (tpEnabled && tpValue > 0) {
    if (mode === "percent") {
      tpPrice = price * (1 + tpValue / 100);
    } else {
      tpPrice = price + tpValue / shares;
    }
  }

  if (slEnabled && slValue > 0) {
    if (mode === "percent") {
      slPrice = price * (1 - slValue / 100);
    } else {
      slPrice = price - slValue / shares;
    }
  }

  // Long brackets: TP above entry, SL below
  const tpOk = !tpEnabled || (tpPrice != null && tpPrice > price);
  const slOk =
    !slEnabled || (slPrice != null && slPrice < price && slPrice > 0);

  const qty = shares > 0 ? shares : 0;
  const tpProfit =
    tpPrice != null && qty > 0 ? (tpPrice - price) * qty : tpPrice != null ? null : null;
  const slLoss =
    slPrice != null && qty > 0 ? (price - slPrice) * qty : slPrice != null ? null : null;

  // When percent mode without shares yet, still show profit/loss as % of 1 share notionally
  const tpProfitOut =
    tpPrice != null
      ? qty > 0
        ? (tpPrice - price) * qty
        : mode === "percent"
          ? tpPrice - price
          : null
      : null;
  const slLossOut =
    slPrice != null
      ? qty > 0
        ? (price - slPrice) * qty
        : mode === "percent"
          ? price - slPrice
          : null
      : null;

  void tpProfit;
  void slLoss;

  return {
    tpPrice: tpPrice != null && Number.isFinite(tpPrice) ? roundPrice(tpPrice) : null,
    slPrice: slPrice != null && Number.isFinite(slPrice) ? roundPrice(slPrice) : null,
    tpProfit:
      tpProfitOut != null && Number.isFinite(tpProfitOut)
        ? roundMoney(tpProfitOut)
        : null,
    slLoss:
      slLossOut != null && Number.isFinite(slLossOut)
        ? roundMoney(slLossOut)
        : null,
    tpOk,
    slOk,
    needsShares: false,
  };
}

function roundPrice(n: number): number {
  if (n >= 1000) return Math.round(n * 100) / 100;
  if (n >= 1) return Math.round(n * 10000) / 10000;
  return Math.round(n * 1e6) / 1e6;
}

function roundMoney(n: number): number {
  return Math.round(n * 100) / 100;
}

export const TP_SL_MODE_KEY = "investor_tp_sl_mode";

export function loadTpSlMode(): BracketMode {
  if (typeof window === "undefined") return "percent";
  try {
    const v = localStorage.getItem(TP_SL_MODE_KEY);
    if (v === "money" || v === "percent") return v;
  } catch {
    /* ignore */
  }
  return "percent";
}

export function saveTpSlMode(mode: BracketMode): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(TP_SL_MODE_KEY, mode);
  } catch {
    /* ignore */
  }
}
