const ONBOARDING_KEY = "investor_onboarding_complete";
const DARK_KEY = "investor_dark_mode";
const GOAL_KEY = "investor_goal";
const RISK_KEY = "investor_risk";
const AUTO_CONTRIB_KEY = "investor_auto_contribution";
const NOTIF_KEY = "investor_notifications";
const TX_EXTRA_KEY = "investor_tx_extra";

export function isOnboardingComplete(): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(ONBOARDING_KEY) === "1";
}

export function completeOnboarding(): void {
  localStorage.setItem(ONBOARDING_KEY, "1");
}

export function resetOnboarding(): void {
  localStorage.removeItem(ONBOARDING_KEY);
}

export function getDarkMode(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(DARK_KEY) === "1";
}

export function setDarkMode(on: boolean): void {
  localStorage.setItem(DARK_KEY, on ? "1" : "0");
  document.documentElement.classList.toggle("dark", on);
  document.body.classList.toggle("dark", on);
}

/** Apply persisted chrome theme (non-trade). Safe to call on mount. */
export function applyDarkMode(): boolean {
  const on = getDarkMode();
  document.documentElement.classList.toggle("dark", on);
  document.body.classList.toggle("dark", on);
  return on;
}

export function saveOnboardingChoices(goal: string, risk: string): void {
  localStorage.setItem(GOAL_KEY, goal);
  localStorage.setItem(RISK_KEY, risk);
}

export function getOnboardingChoices(): { goal: string; risk: string } {
  if (typeof window === "undefined") {
    return { goal: "emeklilik", risk: "dengeli" };
  }
  return {
    goal: localStorage.getItem(GOAL_KEY) || "emeklilik",
    risk: localStorage.getItem(RISK_KEY) || "dengeli",
  };
}

const TRADE_THEME_KEY = "investor_trade_theme";

export type TradeTheme = "dark" | "light";

export function getTradeTheme(): TradeTheme {
  if (typeof window === "undefined") return "dark";
  const v = localStorage.getItem(TRADE_THEME_KEY);
  return v === "light" ? "light" : "dark";
}

export function setTradeTheme(theme: TradeTheme): void {
  localStorage.setItem(TRADE_THEME_KEY, theme);
}

export function getAutoContribution(): boolean {
  if (typeof window === "undefined") return true;
  const v = localStorage.getItem(AUTO_CONTRIB_KEY);
  if (v === null) return true;
  return v === "1";
}

export function setAutoContribution(on: boolean): void {
  localStorage.setItem(AUTO_CONTRIB_KEY, on ? "1" : "0");
}

export function getNotifications(): boolean {
  if (typeof window === "undefined") return true;
  const v = localStorage.getItem(NOTIF_KEY);
  if (v === null) return true;
  return v === "1";
}

export function setNotifications(on: boolean): void {
  localStorage.setItem(NOTIF_KEY, on ? "1" : "0");
}

export type StoredTx = {
  id: string;
  side: "buy" | "sell" | "deposit" | "withdraw";
  title: string;
  subtitle?: string;
  symbol?: string;
  amount: number;
  currency: "TRY" | "USD";
  date: string;
  status: "completed" | "pending" | "failed";
  qty?: number;
  price?: number;
};

export function getExtraTransactions(): StoredTx[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(TX_EXTRA_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function appendTransaction(tx: StoredTx): void {
  const list = getExtraTransactions();
  list.unshift(tx);
  localStorage.setItem(TX_EXTRA_KEY, JSON.stringify(list.slice(0, 50)));
}

export function clearSession(): void {
  resetOnboarding();
  localStorage.removeItem(TX_EXTRA_KEY);
}
