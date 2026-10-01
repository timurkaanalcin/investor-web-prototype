const UNLOCK_KEY = "hram_admin_unlock_token";
const UNLOCK_DAY_KEY = "hram_admin_unlock_day";

export function getStoredAdminToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const day = localStorage.getItem(UNLOCK_DAY_KEY);
    const token = localStorage.getItem(UNLOCK_KEY);
    const today = new Date().toISOString().slice(0, 10);
    if (!token || day !== today) return null;
    return token;
  } catch {
    return null;
  }
}

export function clearAdminToken(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(UNLOCK_KEY);
    localStorage.removeItem(UNLOCK_DAY_KEY);
  } catch {
    /* ignore */
  }
}

export async function verifyAdminPin(pin: string): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const res = await fetch("/api/admin-pin.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin }),
      cache: "no-store",
    });
    const data = (await res.json().catch(() => null)) as {
      ok?: boolean;
      token?: string;
      error?: string;
    } | null;
    if (!res.ok || !data?.ok || !data.token) {
      return { ok: false, error: data?.error || "PIN hatalı" };
    }
    const today = new Date().toISOString().slice(0, 10);
    localStorage.setItem(UNLOCK_KEY, data.token);
    localStorage.setItem(UNLOCK_DAY_KEY, today);
    return { ok: true };
  } catch {
    return { ok: false, error: "Sunucuya bağlanılamadı" };
  }
}

/** For admin mutating APIs — send PIN only when user just typed it; prefer session flag. */
export function adminPinHeader(pin: string): Record<string, string> {
  return { "X-HRAM-PIN": pin, "Content-Type": "application/json" };
}
