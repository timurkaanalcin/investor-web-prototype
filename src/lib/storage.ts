import {
  ensureReferralCodesSeeded,
  findActiveReferralCode,
  findActiveReferralCodeAsync,
  incrementReferralUseCount,
} from "./referral-codes";

const ONBOARDING_KEY = "hram_onboarding_complete";
const AUTH_USER_KEY = "hram_auth_user";
const AUTH_USERS_KEY = "hram_auth_users";
const DARK_KEY = "hram_dark_mode";
const GOAL_KEY = "hram_goal";
const RISK_KEY = "hram_risk";
const AUTO_CONTRIB_KEY = "hram_auto_contribution";
const NOTIF_KEY = "hram_notifications";
const TX_EXTRA_KEY = "hram_tx_extra";
const TRADE_THEME_KEY = "hram_trade_theme";

/** One-time copy investor_* → hram_* so shared browsers do not collide with 7FX. */
function migrateLegacyInvestorKeys(): void {
  if (typeof window === "undefined") return;
  const pairs: [string, string][] = [
    ["investor_onboarding_complete", "hram_onboarding_complete"],
    ["investor_auth_user", "hram_auth_user"],
    ["investor_auth_users", "hram_auth_users"],
    ["investor_dark_mode", "hram_dark_mode"],
    ["investor_goal", "hram_goal"],
    ["investor_risk", "hram_risk"],
    ["investor_auto_contribution", "hram_auto_contribution"],
    ["investor_notifications", "hram_notifications"],
    ["investor_notifications_feed", "hram_notifications_feed"],
    ["investor_tx_extra", "hram_tx_extra"],
    ["investor_trade_theme", "hram_trade_theme"],
    ["investor_balance_delta", "hram_balance_delta"],
    ["investor_money_requests", "hram_money_requests"],
    ["investor_tp_sl_mode", "hram_tp_sl_mode"],
    ["investor_tp_sl_open", "hram_tp_sl_open"],
    ["investor_live_support_enabled", "hram_live_support_enabled"],
    ["investor_live_support_threads", "hram_live_support_threads"],
    ["investor_live_support_my_thread", "hram_live_support_my_thread"],
  ];
  for (const [oldK, newK] of pairs) {
    try {
      if (localStorage.getItem(newK) == null) {
        const v = localStorage.getItem(oldK);
        if (v != null) localStorage.setItem(newK, v);
      }
    } catch {
      /* ignore */
    }
  }
  try {
    if (sessionStorage.getItem("hram_admin_unlocked") == null) {
      const v = sessionStorage.getItem("investor_admin_unlocked");
      if (v != null) sessionStorage.setItem("hram_admin_unlocked", v);
    }
  } catch {
    /* ignore */
  }
}


export type TradeTheme = "dark" | "light";

export type AuthUser = {
  email: string;
  name?: string;
  createdAt: string;
  referralCode?: string;
};

/** @deprecated Prefer isLoggedIn — kept for any legacy callers */
export function isOnboardingComplete(): boolean {
  return isLoggedIn();
}

/** @deprecated Auth login now marks session; kept for compatibility */
export function completeOnboarding(): void {
  localStorage.setItem(ONBOARDING_KEY, "1");
}

/** @deprecated */
export function resetOnboarding(): void {
  localStorage.removeItem(ONBOARDING_KEY);
}

export function isLoggedIn(): boolean {
  if (typeof window === "undefined") return true;
  return !!getAuthUser();
}

export function getAuthUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  migrateLegacyInvestorKeys();
  try {
    const raw = localStorage.getItem(AUTH_USER_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AuthUser;
    if (!parsed?.email) return null;
    return parsed;
  } catch {
    return null;
  }
}

type StoredAccount = AuthUser & { password: string };


/* ── Seeded demo / test accounts (mock) ─────────────────────────── */
const BALANCE_DELTA_KEY = "hram_balance_delta";
/** TOTAL_BALANCE in mock-data.ts — keep in sync for delta math */
const MOCK_TOTAL_BALANCE = 248450;

export const SEEDED_TEST_ACCOUNTS: Record<
  string,
  { password: string; name: string; balance: number }
> = {
  "test@hram.tr": {
    password: "Test1234",
    name: "Test Hesap",
    balance: 100_000,
  },
};

function applySeededBalance(email: string): void {
  const seed = SEEDED_TEST_ACCOUNTS[email];
  if (!seed) return;
  try {
    localStorage.setItem(
      BALANCE_DELTA_KEY,
      String(seed.balance - MOCK_TOTAL_BALANCE),
    );
  } catch {
    /* ignore */
  }
}

function ensureSeededAccountListed(): void {
  const accounts = readAccounts();
  let changed = false;
  for (const [email, seed] of Object.entries(SEEDED_TEST_ACCOUNTS)) {
    const idx = accounts.findIndex((a) => a.email === email);
    if (idx < 0) {
      accounts.push({
        email,
        name: seed.name,
        password: seed.password,
        createdAt: new Date().toISOString(),
      });
      changed = true;
    } else {
      // Keep password/name aligned with seed so demo creds always work
      if (accounts[idx].password !== seed.password || accounts[idx].name !== seed.name) {
        accounts[idx] = {
          ...accounts[idx],
          password: seed.password,
          name: seed.name,
        };
        changed = true;
      }
    }
  }
  if (changed) writeAccounts(accounts);
}

function readAccounts(): StoredAccount[] {
  try {
    const raw = localStorage.getItem(AUTH_USERS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAccounts(list: StoredAccount[]): void {
  localStorage.setItem(AUTH_USERS_KEY, JSON.stringify(list));
}

function setSession(user: AuthUser): void {
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  localStorage.setItem(ONBOARDING_KEY, "1");
}

export function loginUser(
  email: string,
  password: string,
): { ok: true; user: AuthUser } | { ok: false; error: string } {
  const normalized = email.trim().toLowerCase();
  if (!normalized || !password) {
    return { ok: false, error: "E-posta ve şifre gerekli." };
  }
  ensureSeededAccountListed();
  const seed = SEEDED_TEST_ACCOUNTS[normalized];
  if (seed) {
    if (password !== seed.password) {
      return { ok: false, error: "E-posta veya şifre hatalı." };
    }
    const accounts = readAccounts();
    const found = accounts.find((a) => a.email === normalized)!;
    const user: AuthUser = {
      email: found.email,
      name: found.name ?? seed.name,
      createdAt: found.createdAt,
      referralCode: found.referralCode,
    };
    setSession(user);
    applySeededBalance(normalized);
    return { ok: true, user };
  }
  const accounts = readAccounts();
  const found = accounts.find((a) => a.email === normalized);
  if (!found) {
    return { ok: false, error: "Hesap bulunamadı. Kayıt olun." };
  }
  if (found.password !== password) {
    return { ok: false, error: "E-posta veya şifre hatalı." };
  }
  const user: AuthUser = {
    email: found.email,
    name: found.name,
    createdAt: found.createdAt,
    referralCode: found.referralCode,
  };
  setSession(user);
  return { ok: true, user };
}

export async function registerUser(input: {
  email: string;
  password: string;
  passwordConfirm: string;
  name?: string;
  referralCode?: string;
}): Promise<{ ok: true; user: AuthUser } | { ok: false; error: string }> {
  const normalized = input.email.trim().toLowerCase();
  const name = input.name?.trim() || undefined;
  const referralRaw = input.referralCode ?? "";
  if (!normalized) {
    return { ok: false, error: "E-posta gerekli." };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    return { ok: false, error: "Geçerli bir e-posta girin." };
  }
  if (!input.password || input.password.length < 4) {
    return { ok: false, error: "Şifre en az 4 karakter olmalı." };
  }
  if (input.password !== input.passwordConfirm) {
    return { ok: false, error: "Şifreler eşleşmiyor." };
  }
  if (!referralRaw.trim()) {
    return { ok: false, error: "Referans kodu gerekli." };
  }
  ensureReferralCodesSeeded();
  // Prefer server list so admin-added codes work on any device/browser.
  let referral = await findActiveReferralCodeAsync(referralRaw);
  if (!referral) {
    // Offline / API down: fall back to localStorage cache or default HRAM2026
    referral = findActiveReferralCode(referralRaw);
  }
  if (!referral) {
    return { ok: false, error: "Geçersiz referans kodu." };
  }
  ensureSeededAccountListed();
  const seed = SEEDED_TEST_ACCOUNTS[normalized];
  if (seed) {
    // Prefer seed password/name for the known demo account
    if (input.password !== seed.password) {
      return { ok: false, error: "Bu e-posta demo hesap için ayrılmış. Test şifresini kullanın." };
    }
    const accounts = readAccounts();
    const found = accounts.find((a) => a.email === normalized)!;
    if (!found.referralCode) {
      found.referralCode = referral.code;
      writeAccounts(accounts);
      void incrementReferralUseCount(referral.code);
    }
    const user: AuthUser = {
      email: found.email,
      name: seed.name,
      createdAt: found.createdAt,
      referralCode: found.referralCode,
    };
    setSession(user);
    applySeededBalance(normalized);
    return { ok: true, user };
  }
  const accounts = readAccounts();
  if (accounts.some((a) => a.email === normalized)) {
    return { ok: false, error: "Bu e-posta zaten kayıtlı. Giriş yapın." };
  }
  const user: AuthUser = {
    email: normalized,
    name,
    createdAt: new Date().toISOString(),
    referralCode: referral.code,
  };
  accounts.push({ ...user, password: input.password });
  writeAccounts(accounts);
  void incrementReferralUseCount(referral.code);
  setSession(user);
  return { ok: true, user };
}

export function logoutUser(): void {
  localStorage.removeItem(AUTH_USER_KEY);
  localStorage.removeItem(ONBOARDING_KEY);
}

/**
 * Single source of truth for app chrome + Trade theme.
 * Prefer hram_dark_mode; if unset, migrate from hram_trade_theme.
 */
export function getDarkMode(): boolean {
  if (typeof window === "undefined") return false;
  const dark = localStorage.getItem(DARK_KEY);
  if (dark === "1") return true;
  if (dark === "0") return false;
  const trade = localStorage.getItem(TRADE_THEME_KEY);
  if (trade === "dark") return true;
  if (trade === "light") return false;
  return false;
}

function persistUnifiedTheme(on: boolean): void {
  localStorage.setItem(DARK_KEY, on ? "1" : "0");
  localStorage.setItem(TRADE_THEME_KEY, on ? "dark" : "light");
}

function applyDomDark(on: boolean): void {
  document.documentElement.classList.toggle("dark", on);
  document.body.classList.toggle("dark", on);
}

/** Persist + apply chrome dark mode; always keeps Trade theme key in sync. */
export function setDarkMode(on: boolean): void {
  persistUnifiedTheme(on);
  applyDomDark(on);
}

/** Apply persisted unified theme (chrome + Trade keys). Safe to call on mount. */
export function applyDarkMode(): boolean {
  const on = getDarkMode();
  persistUnifiedTheme(on);
  applyDomDark(on);
  return on;
}

export function getTradeTheme(): TradeTheme {
  return getDarkMode() ? "dark" : "light";
}

/** Persist Trade theme and mirror to app dark mode so chrome stays in sync. */
export function setTradeTheme(theme: TradeTheme): void {
  setDarkMode(theme === "dark");
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
  logoutUser();
  localStorage.removeItem(TX_EXTRA_KEY);
  try {
    localStorage.removeItem("hram_money_requests");
    localStorage.removeItem("hram_notifications_feed");
    localStorage.removeItem("hram_balance_delta");
    sessionStorage.removeItem("hram_admin_unlocked");
  } catch {
    /* ignore */
  }
}


/* ── Agent (broker / IB) mock session ───────────────────────────── */
const AGENT_SESSION_KEY = "hram_agent_session";

export type AgentSession = {
  email: string;
  name?: string;
  code?: string;
  createdAt: string;
};

export function getAgentSession(): AgentSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(AGENT_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AgentSession;
    if (!parsed?.email) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function isAgentLoggedIn(): boolean {
  return !!getAgentSession();
}

export function loginAgent(input: {
  email: string;
  password: string;
  code?: string;
}): { ok: true; session: AgentSession } | { ok: false; error: string } {
  const email = input.email.trim().toLowerCase();
  if (!email || !input.password) {
    return { ok: false, error: "E-posta ve şifre gerekli." };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: "Geçerli bir e-posta girin." };
  }
  const session: AgentSession = {
    email,
    name: email.split("@")[0],
    code: input.code?.trim() || undefined,
    createdAt: new Date().toISOString(),
  };
  localStorage.setItem(AGENT_SESSION_KEY, JSON.stringify(session));
  return { ok: true, session };
}

export function logoutAgent(): void {
  localStorage.removeItem(AGENT_SESSION_KEY);
}

/** List registered accounts for CRM (no passwords). */
export type ListedAuthAccount = {
  email: string;
  name?: string;
  createdAt: string;
  referralCode?: string;
};

export function listAuthAccounts(): ListedAuthAccount[] {
  if (typeof window === "undefined") return [];
  ensureSeededAccountListed();
  return readAccounts().map(({ email, name, createdAt, referralCode }) => ({
    email,
    name,
    createdAt,
    referralCode,
  }));
}
