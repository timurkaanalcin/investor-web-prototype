/** Admin platform ops — localStorage mock, static-export safe. */
import {
  ensureReferralCodesSeeded,
  findActiveReferralCode,
} from "@/lib/referral-codes";
import { TOTAL_BALANCE } from "@/lib/mock-data";
import { listAuthAccounts, type ListedAuthAccount } from "@/lib/storage";
import { getDisplayBalance } from "@/lib/money-requests";
import { getCrmDesks } from "@/lib/crm/data";
import {
  getDeskPositions,
  positionPlTry,
} from "@/lib/crm/terminal";

const AUTH_USERS_KEY = "hram_auth_users";
const META_KEY = "hram_crm_customer_meta_v1";
const BALANCES_KEY = "hram_crm_customer_balances_v1";
const SETTINGS_KEY = "hram_platform_settings_v1";
const EVENT = "hram-crm-admin-ops";

export type CustomerMeta = {
  email: string;
  deskId?: string;
  active: boolean;
  note?: string;
  deactivatedAt?: string;
};

export type PlatformSettings = {
  featureLiveChat: boolean;
  featureTrading: boolean;
  featureDeposits: boolean;
  featureWithdrawals: boolean;
  featureReferrals: boolean;
  tradingHalt: boolean;
  defaultReferralCode: string;
  announcementBanner: string;
  announcementEnabled: boolean;
};

const DEFAULT_SETTINGS: PlatformSettings = {
  featureLiveChat: true,
  featureTrading: true,
  featureDeposits: true,
  featureWithdrawals: true,
  featureReferrals: true,
  tradingHalt: false,
  defaultReferralCode: "HRAM2026",
  announcementBanner: "",
  announcementEnabled: false,
};

type StoredAccount = {
  email: string;
  name?: string;
  password: string;
  createdAt: string;
  referralCode?: string;
};

function emit(): void {
  if (typeof window === "undefined") return;
  try {
    window.dispatchEvent(new Event(EVENT));
    localStorage.setItem("hram_crm_ping", String(Date.now()));
  } catch {
    /* ignore */
  }
}

export function subscribeAdminOps(cb: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const onStorage = () => cb();
  window.addEventListener("storage", onStorage);
  window.addEventListener(EVENT, cb);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(EVENT, cb);
  };
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

function readMeta(): Record<string, CustomerMeta> {
  try {
    const raw = localStorage.getItem(META_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, CustomerMeta>;
  } catch {
    return {};
  }
}

function writeMeta(map: Record<string, CustomerMeta>): void {
  localStorage.setItem(META_KEY, JSON.stringify(map));
}

function readBalances(): Record<string, number> {
  try {
    const raw = localStorage.getItem(BALANCES_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, number>;
  } catch {
    return {};
  }
}

function writeBalances(map: Record<string, number>): void {
  localStorage.setItem(BALANCES_KEY, JSON.stringify(map));
}

export function getPlatformSettings(): PlatformSettings {
  if (typeof window === "undefined") return { ...DEFAULT_SETTINGS };
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function setPlatformSettings(patch: Partial<PlatformSettings>): PlatformSettings {
  const next = { ...getPlatformSettings(), ...patch };
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
  emit();
  return next;
}

export function getCustomerMeta(email: string): CustomerMeta {
  const key = email.toLowerCase();
  const map = readMeta();
  return map[key] || { email: key, active: true };
}

export function upsertCustomerMeta(
  email: string,
  patch: Partial<CustomerMeta>,
): CustomerMeta {
  const key = email.toLowerCase();
  const map = readMeta();
  const prev = map[key] || { email: key, active: true };
  const next = { ...prev, ...patch, email: key };
  map[key] = next;
  writeMeta(map);
  emit();
  return next;
}

export function getCustomerBalance(email: string): number {
  const key = email.toLowerCase();
  const map = readBalances();
  if (map[key] != null && Number.isFinite(map[key])) return map[key];
  // Session display balance only as fallback for single-account browsers
  const accounts = listAuthAccounts();
  if (accounts.length <= 1) return getDisplayBalance();
  return TOTAL_BALANCE;
}

export function setCustomerBalance(email: string, amountTry: number): void {
  if (!Number.isFinite(amountTry)) return;
  const key = email.toLowerCase();
  const map = readBalances();
  map[key] = amountTry;
  writeBalances(map);
  // If this is the only / current session user, also sync display delta
  try {
    const session = localStorage.getItem("hram_auth_user");
    if (session) {
      const u = JSON.parse(session) as { email?: string };
      if (u.email?.toLowerCase() === key) {
        const delta = amountTry - TOTAL_BALANCE;
        localStorage.setItem("hram_balance_delta", String(delta));
        window.dispatchEvent(new CustomEvent("investor-money-updated"));
      }
    }
  } catch {
    /* ignore */
  }
  emit();
}

export function adjustCustomerBalance(email: string, deltaTry: number): number {
  const cur = getCustomerBalance(email);
  const next = cur + deltaTry;
  setCustomerBalance(email, next);
  return next;
}

export type AdminCreateCustomerInput = {
  email: string;
  name?: string;
  password?: string;
  balance?: number;
  referralCode?: string;
  deskId?: string;
};

export type AdminCreateResult =
  | { ok: true; email: string }
  | { ok: false; email: string; error: string };

/** Create customer without logging them in (admin import / manual add). */
export function adminCreateCustomer(
  input: AdminCreateCustomerInput,
): AdminCreateResult {
  if (typeof window === "undefined") {
    return { ok: false, email: input.email || "", error: "Sunucu tarafında oluşturulamaz" };
  }
  const email = (input.email || "").trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, email, error: "Geçersiz e-posta" };
  }
  const accounts = readAccounts();
  if (accounts.some((a) => a.email === email)) {
    return { ok: false, email, error: "E-posta zaten kayıtlı" };
  }
  ensureReferralCodesSeeded();
  const settings = getPlatformSettings();
  const refRaw = (input.referralCode || settings.defaultReferralCode || "HRAM2026").trim();
  const referral = findActiveReferralCode(refRaw);
  const password =
    (input.password && input.password.length >= 4
      ? input.password
      : `Hram${Math.random().toString(36).slice(2, 8)}!`);

  accounts.push({
    email,
    name: input.name?.trim() || undefined,
    password,
    createdAt: new Date().toISOString(),
    referralCode: referral?.code || refRaw.toUpperCase(),
  });
  writeAccounts(accounts);

  if (input.balance != null && Number.isFinite(input.balance)) {
    setCustomerBalance(email, input.balance);
  }
  if (input.deskId) {
    upsertCustomerMeta(email, { deskId: input.deskId, active: true });
  } else {
    upsertCustomerMeta(email, { active: true });
  }
  emit();
  return { ok: true, email };
}

export function adminUpdateCustomer(
  email: string,
  patch: { name?: string; password?: string; referralCode?: string },
): { ok: boolean; error?: string } {
  const key = email.trim().toLowerCase();
  const accounts = readAccounts();
  const idx = accounts.findIndex((a) => a.email === key);
  if (idx < 0) return { ok: false, error: "Hesap bulunamadı" };
  if (patch.name != null) accounts[idx].name = patch.name.trim() || undefined;
  if (patch.password != null && patch.password.length >= 4) {
    accounts[idx].password = patch.password;
  }
  if (patch.referralCode != null) {
    accounts[idx].referralCode = patch.referralCode.trim().toUpperCase() || undefined;
  }
  writeAccounts(accounts);
  emit();
  return { ok: true };
}

export function adminDeactivateCustomer(email: string, active: boolean): void {
  upsertCustomerMeta(email, {
    active,
    deactivatedAt: active ? undefined : new Date().toISOString(),
  });
}

export type BulkImportRow = {
  email: string;
  name?: string;
  password?: string;
  balance?: number;
  referralCode?: string;
  deskId?: string;
};

export function parseCustomerCsv(text: string): BulkImportRow[] {
  const lines = text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length === 0) return [];
  const split = (line: string) => {
    // simple CSV: comma or semicolon
    const parts: string[] = [];
    let cur = "";
    let q = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        q = !q;
        continue;
      }
      if (!q && (ch === "," || ch === ";")) {
        parts.push(cur.trim());
        cur = "";
        continue;
      }
      cur += ch;
    }
    parts.push(cur.trim());
    return parts;
  };
  const header = split(lines[0]).map((h) => h.toLowerCase());
  const hasHeader = header.some((h) =>
    ["email", "e-posta", "eposta", "mail"].includes(h),
  );
  const start = hasHeader ? 1 : 0;
  const idx = (names: string[]) =>
    header.findIndex((h) => names.includes(h));
  const iEmail = hasHeader ? Math.max(0, idx(["email", "e-posta", "eposta", "mail"])) : 0;
  const iName = hasHeader ? idx(["name", "ad", "isim", "adsoyad"]) : 1;
  const iPass = hasHeader ? idx(["password", "sifre", "şifre"]) : 2;
  const iBal = hasHeader ? idx(["balance", "bakiye", "amount"]) : 3;
  const iRef = hasHeader ? idx(["referral", "referralcode", "referans", "kod"]) : 4;
  const iDesk = hasHeader ? idx(["desk", "deskId", "masa"]) : 5;

  const rows: BulkImportRow[] = [];
  for (let li = start; li < lines.length; li++) {
    const cols = split(lines[li]);
    const email = (cols[iEmail] || "").trim();
    if (!email) continue;
    const balRaw = iBal >= 0 ? cols[iBal] : undefined;
    const bal =
      balRaw != null && balRaw !== ""
        ? Number(String(balRaw).replace(/\s/g, "").replace(",", "."))
        : undefined;
    rows.push({
      email,
      name: iName >= 0 ? cols[iName] : undefined,
      password: iPass >= 0 ? cols[iPass] : undefined,
      balance: Number.isFinite(bal) ? bal : undefined,
      referralCode: iRef >= 0 ? cols[iRef] : undefined,
      deskId: iDesk >= 0 ? cols[iDesk] : undefined,
    });
  }
  return rows;
}

export function adminBulkImportCustomers(rows: BulkImportRow[]): {
  ok: number;
  fail: number;
  results: AdminCreateResult[];
} {
  const results = rows.map((r) => adminCreateCustomer(r));
  return {
    ok: results.filter((r) => r.ok).length,
    fail: results.filter((r) => !r.ok).length,
    results,
  };
}

export function exportCustomersCsv(): string {
  const accounts = listAuthAccounts();
  const desks = getCrmDesks();
  const deskName = (id?: string) =>
    desks.find((d) => d.id === id)?.name || "";
  const header = [
    "email",
    "name",
    "referralCode",
    "balance",
    "desk",
    "active",
    "createdAt",
  ];
  const lines = accounts.map((a) => {
    const meta = getCustomerMeta(a.email);
    const bal = getCustomerBalance(a.email);
    return [
      a.email,
      a.name || "",
      a.referralCode || "",
      String(Math.round(bal)),
      deskName(meta.deskId),
      meta.active === false ? "0" : "1",
      a.createdAt,
    ]
      .map((c) => `"${String(c).replace(/"/g, '""')}"`)
      .join(",");
  });
  return [header.join(","), ...lines].join("\n");
}

export function bulkAssignDesk(emails: string[], deskId: string): void {
  for (const e of emails) upsertCustomerMeta(e, { deskId });
}

export function bulkAdjustBalance(emails: string[], deltaTry: number): void {
  for (const e of emails) adjustCustomerBalance(e, deltaTry);
}

export function bulkDeactivate(emails: string[], active: boolean): void {
  for (const e of emails) adminDeactivateCustomer(e, active);
}

export function bulkSetNote(emails: string[], note: string): void {
  for (const e of emails) upsertCustomerMeta(e, { note });
}

export type EnrichedCustomer = ListedAuthAccount & {
  balance: number;
  openPositions: number;
  pl24h: number;
  deskId?: string;
  deskName?: string;
  active: boolean;
  note?: string;
  lastActivity: string;
};

export function listEnrichedCustomers(): EnrichedCustomer[] {
  const accounts = listAuthAccounts();
  const desks = getCrmDesks();
  const positions = getDeskPositions();
  return accounts.map((a) => {
    const meta = getCustomerMeta(a.email);
    const pos = positions.filter(
      (p) => p.accountEmail.toLowerCase() === a.email.toLowerCase(),
    );
    const pl = pos.reduce((s, p) => s + positionPlTry(p), 0);
    return {
      ...a,
      balance: getCustomerBalance(a.email),
      openPositions: pos.length,
      pl24h: pl,
      deskId: meta.deskId,
      deskName: desks.find((d) => d.id === meta.deskId)?.name,
      active: meta.active !== false,
      note: meta.note,
      lastActivity: a.createdAt,
    };
  });
}

