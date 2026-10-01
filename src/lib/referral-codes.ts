import { getStoredAdminToken } from "@/lib/admin-auth";

/** Session PIN held only in memory after unlock — never bundled. */
let sessionAdminPin: string | null = null;

export function setSessionAdminPin(pin: string | null) {
  sessionAdminPin = pin;
}

function resolveAdminPin(explicit?: string): string {
  if (explicit) return explicit;
  if (sessionAdminPin) return sessionAdminPin;
  return "";
}

const CODES_KEY = "hram_referral_codes";
const EVENT = "hram-referral-codes";
const PING_KEY = "hram_referral_codes_ping";

export type ReferralCode = {
  code: string;
  label?: string;
  active: boolean;
  createdAt: string;
  useCount: number;
};

const DEFAULT_SEED: ReferralCode = {
  code: "HRAM2026",
  label: "Varsayılan",
  active: true,
  createdAt: new Date(0).toISOString(),
  useCount: 0,
};

/** Prefer same-origin; crm.hram.tr (if ever created) must hit apex API store. */
export function getReferralApiUrl(): string {
  if (typeof window === "undefined") return "/api/referrals.php";
  const host = window.location.hostname;
  if (host === "crm.hram.tr" || host.endsWith(".crm.hram.tr")) {
    return "https://hram.tr/api/referrals.php";
  }
  // Always same-origin on hram.tr / www / localhost
  return "/api/referrals.php";
}

function emit(): void {
  if (typeof window === "undefined") return;
  try {
    window.dispatchEvent(new Event(EVENT));
    localStorage.setItem(PING_KEY, String(Date.now()));
  } catch {
    /* ignore */
  }
}

function normalizeCode(raw: string): string {
  return raw.trim().toUpperCase();
}

function safeParse(raw: string | null): ReferralCode[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (c): c is ReferralCode =>
          !!c &&
          typeof c === "object" &&
          typeof (c as ReferralCode).code === "string",
      )
      .map((c) => ({
        code: normalizeCode(c.code),
        label:
          typeof c.label === "string" && c.label
            ? c.label
            : undefined,
        active: Boolean(c.active),
        createdAt:
          typeof c.createdAt === "string"
            ? c.createdAt
            : new Date().toISOString(),
        useCount:
          typeof c.useCount === "number" && Number.isFinite(c.useCount)
            ? c.useCount
            : 0,
      }));
  } catch {
    return [];
  }
}

function writeCache(list: ReferralCode[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CODES_KEY, JSON.stringify(list));
    emit();
  } catch {
    /* ignore */
  }
}

function readCache(): ReferralCode[] {
  if (typeof window === "undefined") return [];
  return safeParse(localStorage.getItem(CODES_KEY));
}

function sortCodes(list: ReferralCode[]): ReferralCode[] {
  return list.slice().sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
}

function normalizeServerCodes(raw: unknown): ReferralCode[] {
  if (!Array.isArray(raw)) return [];
  return safeParse(JSON.stringify(raw));
}

/** Ensure at least the default seed exists in cache; kick off background refresh. */
export function ensureReferralCodesSeeded(): ReferralCode[] {
  if (typeof window === "undefined") return [];
  const existing = readCache();
  if (existing.length > 0) {
    void refreshReferralCodesFromServer().catch(() => {});
    return existing;
  }
  const seeded: ReferralCode[] = [
    {
      ...DEFAULT_SEED,
      createdAt: new Date().toISOString(),
    },
  ];
  writeCache(seeded);
  void refreshReferralCodesFromServer().catch(() => {});
  return seeded;
}

export function getReferralCodes(): ReferralCode[] {
  if (typeof window === "undefined") return [];
  return sortCodes(ensureReferralCodesSeeded());
}

export function findActiveReferralCode(code: string): ReferralCode | null {
  const normalized = normalizeCode(code);
  if (!normalized) return null;
  return (
    ensureReferralCodesSeeded().find(
      (c) => c.code === normalized && c.active,
    ) || null
  );
}

/** Server-backed lookup for registration reliability. Falls back to cache. */
export async function findActiveReferralCodeAsync(
  code: string,
): Promise<ReferralCode | null> {
  const normalized = normalizeCode(code);
  if (!normalized) return null;
  try {
    const url = `${getReferralApiUrl()}?action=validate&code=${encodeURIComponent(normalized)}`;
    const res = await fetch(url, { method: "GET", cache: "no-store" });
    const data = (await res.json()) as { ok?: boolean; valid?: boolean; code?: string };
    if (data?.ok && data.valid) {
      return {
        code: normalized,
        active: true,
        createdAt: new Date().toISOString(),
        useCount: 0,
      };
    }
    return null;
  } catch {
    return findActiveReferralCode(normalized);
  }
}

export async function refreshReferralCodesFromServer(
  pin?: string,
): Promise<ReferralCode[]> {
  if (typeof window === "undefined") return [];
  const adminPin = resolveAdminPin(pin);
  // Without PIN, keep local cache only (GET list is auth-gated)
  if (!adminPin) {
    const cached = readCache();
    if (cached.length) return sortCodes(cached);
    return sortCodes([
      { ...DEFAULT_SEED, createdAt: new Date().toISOString() },
    ]);
  }
  const res = await fetch(getReferralApiUrl(), {
    method: "GET",
    credentials: "omit",
    cache: "no-store",
    headers: { "X-HRAM-PIN": adminPin },
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  const data = (await res.json()) as { ok?: boolean; codes?: unknown };
  if (!data || data.ok !== true) {
    throw new Error("Bad response");
  }
  const codes = normalizeServerCodes(data.codes);
  if (codes.length === 0) {
    throw new Error("Empty codes");
  }
  writeCache(codes);
  return sortCodes(codes);
}

type MutateOk = { ok: true; warning?: string; code?: ReferralCode };
type MutateFail = { ok: false; error: string };

type PostResult =
  | { ok: true; codes: ReferralCode[]; code?: ReferralCode }
  | { ok: false; error: string; network?: boolean };

async function postAction(
  body: Record<string, unknown>,
  pin?: string,
): Promise<PostResult> {
  const adminPin = resolveAdminPin(pin);
  // increment is public (no PIN) on server
  const needsPin = body.action !== "increment" && body.action !== "validate";
  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (needsPin && adminPin) headers["X-HRAM-PIN"] = adminPin;
    const res = await fetch(getReferralApiUrl(), {
      method: "POST",
      credentials: "omit",
      cache: "no-store",
      headers,
      body: JSON.stringify({
        ...body,
        ...(needsPin && adminPin ? { pin: adminPin } : {}),
      }),
    });
    const data = (await res.json().catch(() => null)) as {
      ok?: boolean;
      error?: string;
      codes?: unknown;
      code?: unknown;
    } | null;
    if (!res.ok || !data || data.ok !== true) {
      return {
        ok: false,
        error: (data && data.error) || `HTTP ${res.status}`,
        network: false,
      };
    }
    const codes = normalizeServerCodes(data.codes);
    if (codes.length > 0) {
      writeCache(codes);
    }
    const entry =
      data.code && typeof data.code === "object"
        ? normalizeServerCodes([data.code])[0]
        : undefined;
    return { ok: true, codes, code: entry };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Ağ hatası",
      network: true,
    };
  }
}

function localAdd(input: {
  code: string;
  label?: string;
}): { ok: true; code: ReferralCode } | { ok: false; error: string } {
  const code = normalizeCode(input.code);
  if (!code) return { ok: false, error: "Kod gerekli." };
  if (!/^[A-Z0-9_-]{3,32}$/.test(code)) {
    return {
      ok: false,
      error: "Kod 3–32 karakter; harf, rakam, _ veya - olmalı.",
    };
  }
  const list = ensureReferralCodesSeeded();
  if (list.some((c) => c.code === code)) {
    return { ok: false, error: "Bu kod zaten var." };
  }
  const entry: ReferralCode = {
    code,
    label: input.label?.trim() || undefined,
    active: true,
    createdAt: new Date().toISOString(),
    useCount: 0,
  };
  list.unshift(entry);
  writeCache(list);
  return { ok: true, code: entry };
}

export async function addReferralCode(input: {
  code: string;
  label?: string;
}): Promise<MutateOk & { code?: ReferralCode } | MutateFail> {
  const code = normalizeCode(input.code);
  if (!code) return { ok: false, error: "Kod gerekli." };
  if (!/^[A-Z0-9_-]{3,32}$/.test(code)) {
    return {
      ok: false,
      error: "Kod 3–32 karakter; harf, rakam, _ veya - olmalı.",
    };
  }
  const api = await postAction({
    action: "add",
    code,
    label: input.label?.trim() || undefined,
  });
  if (api.ok) {
    const entry =
      api.code ||
      ({
        code,
        label: input.label?.trim() || undefined,
        active: true,
        createdAt: new Date().toISOString(),
        useCount: 0,
      } satisfies ReferralCode);
    if (!api.codes.length) {
      // Server ok but no list — keep cache in sync
      const list = ensureReferralCodesSeeded().filter((c) => c.code !== code);
      list.unshift(entry);
      writeCache(list);
    }
    return { ok: true, code: entry };
  }
  if (!api.network) {
    return { ok: false, error: api.error };
  }
  // Network failure → local fallback + warning
  const local = localAdd(input);
  if (!local.ok) return local;
  return {
    ok: true,
    code: local.code,
    warning: "sunucuya yazılamadı",
  };
}

export async function setReferralCodeActive(
  code: string,
  active: boolean,
): Promise<MutateOk | MutateFail> {
  const normalized = normalizeCode(code);
  const api = await postAction({
    action: "setActive",
    code: normalized,
    active,
  });
  if (api.ok) return { ok: true };
  if (!api.network) {
    return { ok: false, error: api.error };
  }
  const list = ensureReferralCodesSeeded();
  const idx = list.findIndex((c) => c.code === normalized);
  if (idx < 0) return { ok: false, error: api.error || "Kod bulunamadı." };
  list[idx] = { ...list[idx], active };
  writeCache(list);
  return { ok: true, warning: "sunucuya yazılamadı" };
}

export async function deleteReferralCode(
  code: string,
): Promise<MutateOk | MutateFail> {
  const normalized = normalizeCode(code);
  const api = await postAction({ action: "delete", code: normalized });
  if (api.ok) return { ok: true };
  if (!api.network) {
    return { ok: false, error: api.error };
  }
  const list = ensureReferralCodesSeeded();
  const next = list.filter((c) => c.code !== normalized);
  if (next.length === list.length) {
    return { ok: false, error: api.error || "Kod bulunamadı." };
  }
  writeCache(next);
  return { ok: true, warning: "sunucuya yazılamadı" };
}

/** Increment useCount for an active code. Returns false if missing/inactive. */
export async function incrementReferralUseCount(code: string): Promise<boolean> {
  const normalized = normalizeCode(code);
  const api = await postAction({ action: "increment", code: normalized });
  if (api.ok) return true;
  if (!api.network) return false;
  const list = ensureReferralCodesSeeded();
  const idx = list.findIndex((c) => c.code === normalized && c.active);
  if (idx < 0) return false;
  list[idx] = { ...list[idx], useCount: list[idx].useCount + 1 };
  writeCache(list);
  return true;
}

export function subscribeReferralCodes(cb: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const onStorage = (e: StorageEvent) => {
    if (e.key === CODES_KEY || e.key === PING_KEY) cb();
  };
  window.addEventListener("storage", onStorage);
  window.addEventListener(EVENT, cb);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(EVENT, cb);
  };
}
