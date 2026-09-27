import { TOTAL_BALANCE } from "./mock-data";
import {
  MOCK_CRYPTO,
  MOCK_IBAN,
} from "./payment-config";
import { appendTransaction } from "./storage";

const REQUESTS_KEY = "investor_money_requests";
const NOTIF_FEED_KEY = "investor_notifications_feed";
const BALANCE_DELTA_KEY = "investor_balance_delta";
const ADMIN_UNLOCK_KEY = "investor_admin_unlocked";

export type MoneyMethod = "crypto" | "card" | "iban";
export type MoneyRequestStatus =
  | "pending_ai"
  | "ai_reviewed"
  | "approved"
  | "rejected";
export type AiRisk = "low" | "medium" | "high";

export type AiReport = {
  summary: string;
  risk: AiRisk;
  notes: string[];
};

export type MoneyRequest = {
  id: string;
  type: "deposit" | "withdraw";
  amount: number;
  currency: "TRY";
  method?: MoneyMethod;
  paymentDetails?: {
    address?: string;
    iban?: string;
    holderName?: string;
    network?: string;
    bank?: string;
  };
  /** User-provided withdraw destination */
  userIban?: string;
  userHolderName?: string;
  screenshotDataUrl?: string;
  paidConfirmed: boolean;
  status: MoneyRequestStatus;
  aiReport?: AiReport;
  createdAt: string;
  reviewedAt?: string;
};

export type NotificationItem = {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
  relatedRequestId?: string;
};

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function getMoneyRequests(): MoneyRequest[] {
  if (typeof window === "undefined") return [];
  const list = safeParse<MoneyRequest[]>(
    localStorage.getItem(REQUESTS_KEY),
    []
  );
  return Array.isArray(list) ? list : [];
}

function saveMoneyRequests(list: MoneyRequest[]): void {
  localStorage.setItem(REQUESTS_KEY, JSON.stringify(list.slice(0, 100)));
}

export function getNotificationsFeed(): NotificationItem[] {
  if (typeof window === "undefined") return [];
  const list = safeParse<NotificationItem[]>(
    localStorage.getItem(NOTIF_FEED_KEY),
    []
  );
  return Array.isArray(list) ? list : [];
}

function saveNotificationsFeed(list: NotificationItem[]): void {
  localStorage.setItem(NOTIF_FEED_KEY, JSON.stringify(list.slice(0, 80)));
}

export function getUnreadNotificationCount(): number {
  return getNotificationsFeed().filter((n) => !n.read).length;
}

export function pushNotification(
  title: string,
  body: string,
  relatedRequestId?: string
): NotificationItem {
  const item: NotificationItem = {
    id: `n-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    title,
    body,
    createdAt: new Date().toISOString(),
    read: false,
    relatedRequestId,
  };
  const list = getNotificationsFeed();
  list.unshift(item);
  saveNotificationsFeed(list);
  dispatchMoneyEvent();
  return item;
}

export function markNotificationRead(id: string): void {
  const list = getNotificationsFeed().map((n) =>
    n.id === id ? { ...n, read: true } : n
  );
  saveNotificationsFeed(list);
  dispatchMoneyEvent();
}

export function markAllNotificationsRead(): void {
  const list = getNotificationsFeed().map((n) => ({ ...n, read: true }));
  saveNotificationsFeed(list);
  dispatchMoneyEvent();
}

export function getBalanceDelta(): number {
  if (typeof window === "undefined") return 0;
  const v = localStorage.getItem(BALANCE_DELTA_KEY);
  if (v === null) return 0;
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : 0;
}

export function getDisplayBalance(): number {
  return TOTAL_BALANCE + getBalanceDelta();
}

function setBalanceDelta(delta: number): void {
  localStorage.setItem(BALANCE_DELTA_KEY, String(delta));
}

export function isAdminUnlocked(): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(ADMIN_UNLOCK_KEY) === "1";
}

export function setAdminUnlocked(on: boolean): void {
  if (on) sessionStorage.setItem(ADMIN_UNLOCK_KEY, "1");
  else sessionStorage.removeItem(ADMIN_UNLOCK_KEY);
}

function dispatchMoneyEvent(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("investor-money-updated"));
}

export function subscribeMoneyUpdates(cb: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = () => cb();
  window.addEventListener("investor-money-updated", handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener("investor-money-updated", handler);
    window.removeEventListener("storage", handler);
  };
}

/** Deterministic mock AI review from request metadata (no real ML). */
export function runMockAiReview(req: MoneyRequest): AiReport {
  const notes: string[] = [];
  let riskScore = 0;

  const hasShot = Boolean(req.screenshotDataUrl);
  if (hasShot) {
    notes.push("Ekran görüntüsü mevcut");
    const dims = probeDataUrlDimensions(req.screenshotDataUrl!);
    if (dims) {
      notes.push(`Görüntü boyutu: ${dims.w}×${dims.h}px`);
      if (dims.w < 200 || dims.h < 200) {
        notes.push("Görüntü çözünürlüğü düşük");
        riskScore += 2;
      }
    }
    const sizeEst = estimateDataUrlBytes(req.screenshotDataUrl!);
    if (sizeEst > 0) {
      notes.push(`Dosya ~${Math.round(sizeEst / 1024)} KB`);
    }
  } else {
    notes.push("Ekran görüntüsü yok");
    riskScore += 3;
  }

  if (req.amount <= 0) {
    notes.push("Tutar geçersiz");
    riskScore += 4;
  } else if (req.amount < 100) {
    notes.push("Tutar çok düşük");
    riskScore += 1;
  } else if (req.amount <= 25000) {
    notes.push("Tutar uyumlu görünüyor");
  } else if (req.amount <= 75000) {
    notes.push("Tutar orta-yüksek aralıkta");
    riskScore += 1;
  } else {
    notes.push("Yüksek tutar — ekstra kontrol önerilir");
    riskScore += 2;
  }

  if (req.type === "deposit") {
    if (req.method === "crypto") {
      notes.push(`Yöntem: kripto (${req.paymentDetails?.network || "TRC20"})`);
      if (!req.paidConfirmed) {
        notes.push("Ödeme onayı işaretlenmemiş");
        riskScore += 1;
      }
    } else if (req.method === "iban") {
      notes.push("Yöntem: IBAN transferi");
    } else if (req.method === "card") {
      notes.push("Yöntem: kart (simülasyon)");
      notes.push("Kart ödemesi simüle edildi — yine de admin onayı gerekir");
    }
  } else {
    notes.push("Çekim talebi");
    if (req.userIban) notes.push(`Hedef IBAN: ${maskIban(req.userIban)}`);
    const bal = getDisplayBalance();
    if (req.amount > bal) {
      notes.push("Bakiye yetersiz olabilir");
      riskScore += 3;
    } else {
      notes.push("Bakiye yeterli görünüyor");
    }
  }

  if (!req.paidConfirmed && req.type === "deposit") {
    riskScore += 1;
  }

  let risk: AiRisk = "low";
  if (riskScore >= 5) risk = "high";
  else if (riskScore >= 2) risk = "medium";

  const riskTr =
    risk === "low" ? "düşük" : risk === "medium" ? "orta" : "yüksek";
  const summary = `${notes[0] || "İnceleme"} · risk: ${riskTr}`;

  return { summary, risk, notes };
}

function maskIban(iban: string): string {
  const clean = iban.replace(/\s/g, "");
  if (clean.length < 8) return iban;
  return `${clean.slice(0, 4)} ··· ${clean.slice(-4)}`;
}

function estimateDataUrlBytes(dataUrl: string): number {
  const i = dataUrl.indexOf(",");
  if (i < 0) return 0;
  const b64 = dataUrl.slice(i + 1);
  return Math.floor((b64.length * 3) / 4);
}

function probeDataUrlDimensions(
  dataUrl: string
): { w: number; h: number } | null {
  // Synchronous heuristic from PNG/JPEG headers when possible
  try {
    if (dataUrl.startsWith("data:image/png")) {
      const i = dataUrl.indexOf(",");
      if (i < 0) return null;
      const bin = atob(dataUrl.slice(i + 1).slice(0, 48));
      if (bin.length < 24) return null;
      const w =
        (bin.charCodeAt(16) << 24) |
        (bin.charCodeAt(17) << 16) |
        (bin.charCodeAt(18) << 8) |
        bin.charCodeAt(19);
      const h =
        (bin.charCodeAt(20) << 24) |
        (bin.charCodeAt(21) << 16) |
        (bin.charCodeAt(22) << 8) |
        bin.charCodeAt(23);
      if (w > 0 && h > 0 && w < 20000 && h < 20000) return { w, h };
    }
    if (
      dataUrl.startsWith("data:image/jpeg") ||
      dataUrl.startsWith("data:image/jpg")
    ) {
      const i = dataUrl.indexOf(",");
      if (i < 0) return null;
      const bin = atob(dataUrl.slice(i + 1).slice(0, 800));
      let off = 2;
      while (off < bin.length - 9) {
        if (bin.charCodeAt(off) !== 0xff) break;
        const marker = bin.charCodeAt(off + 1);
        const len =
          (bin.charCodeAt(off + 2) << 8) | bin.charCodeAt(off + 3);
        if (marker >= 0xc0 && marker <= 0xc3) {
          const h =
            (bin.charCodeAt(off + 5) << 8) | bin.charCodeAt(off + 6);
          const w =
            (bin.charCodeAt(off + 7) << 8) | bin.charCodeAt(off + 8);
          if (w > 0 && h > 0) return { w, h };
          break;
        }
        off += 2 + len;
      }
    }
  } catch {
    /* ignore */
  }
  return null;
}

export type CreateDepositInput = {
  amount: number;
  method: MoneyMethod;
  screenshotDataUrl?: string;
  paidConfirmed: boolean;
  /** Card sim already "paid" */
  cardSimPaid?: boolean;
};

export function createDepositRequest(input: CreateDepositInput): MoneyRequest {
  const paymentDetails =
    input.method === "crypto"
      ? {
          address: MOCK_CRYPTO.address,
          network: MOCK_CRYPTO.network,
        }
      : input.method === "iban"
        ? {
            iban: MOCK_IBAN.iban,
            holderName: MOCK_IBAN.holderName,
            bank: MOCK_IBAN.bank,
          }
        : undefined;

  let req: MoneyRequest = {
    id: `mr-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    type: "deposit",
    amount: input.amount,
    currency: "TRY",
    method: input.method,
    paymentDetails,
    screenshotDataUrl: input.screenshotDataUrl,
    paidConfirmed: input.paidConfirmed || Boolean(input.cardSimPaid),
    status: "pending_ai",
    createdAt: new Date().toISOString(),
  };

  const aiReport = runMockAiReview(req);
  req = { ...req, aiReport, status: "ai_reviewed" };

  const list = getMoneyRequests();
  list.unshift(req);
  saveMoneyRequests(list);

  appendTransaction({
    id: `tx-dep-req-${req.id}`,
    side: "deposit",
    title: "Para ekleme talebi",
    subtitle: methodLabel(input.method) + " · incelemede",
    amount: input.amount,
    currency: "TRY",
    date: req.createdAt.slice(0, 10),
    status: "pending",
  });

  pushNotification(
    "Yatırma talebi alındı",
    `${formatAmount(input.amount)} tutarında talebiniz AI incelemesine alındı.`,
    req.id
  );

  dispatchMoneyEvent();
  return req;
}

export type CreateWithdrawInput = {
  amount: number;
  userIban: string;
  userHolderName: string;
};

export function createWithdrawRequest(
  input: CreateWithdrawInput
): MoneyRequest {
  let req: MoneyRequest = {
    id: `mr-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    type: "withdraw",
    amount: input.amount,
    currency: "TRY",
    userIban: input.userIban,
    userHolderName: input.userHolderName,
    paidConfirmed: true,
    status: "pending_ai",
    createdAt: new Date().toISOString(),
  };

  const aiReport = runMockAiReview(req);
  req = { ...req, aiReport, status: "ai_reviewed" };

  const list = getMoneyRequests();
  list.unshift(req);
  saveMoneyRequests(list);

  appendTransaction({
    id: `tx-wd-req-${req.id}`,
    side: "withdraw",
    title: "Para çekme talebi",
    subtitle: "İncelemede",
    amount: input.amount,
    currency: "TRY",
    date: req.createdAt.slice(0, 10),
    status: "pending",
  });

  pushNotification(
    "Çekim talebi alındı",
    `${formatAmount(input.amount)} tutarında çekim talebiniz incelenecek.`,
    req.id
  );

  dispatchMoneyEvent();
  return req;
}

export function approveMoneyRequest(id: string): { ok: boolean; error?: string } {
  const list = getMoneyRequests();
  const idx = list.findIndex((r) => r.id === id);
  if (idx < 0) return { ok: false, error: "Talep bulunamadı" };
  const req = list[idx];
  if (req.status === "approved" || req.status === "rejected") {
    return { ok: false, error: "Talep zaten sonuçlanmış" };
  }

  if (req.type === "deposit") {
    setBalanceDelta(getBalanceDelta() + req.amount);
    appendTransaction({
      id: `tx-dep-ok-${req.id}`,
      side: "deposit",
      title: "Para yatırma onaylandı",
      subtitle: methodLabel(req.method) + " · admin",
      amount: req.amount,
      currency: "TRY",
      date: new Date().toISOString().slice(0, 10),
      status: "completed",
    });
    pushNotification(
      "Yatırma onaylandı",
      `${formatAmount(req.amount)} bakiyenize eklendi.`,
      req.id
    );
  } else {
    const bal = getDisplayBalance();
    if (req.amount > bal) {
      return { ok: false, error: "Yetersiz bakiye — onaylanamadı" };
    }
    setBalanceDelta(getBalanceDelta() - req.amount);
    appendTransaction({
      id: `tx-wd-ok-${req.id}`,
      side: "withdraw",
      title: "Para çekme onaylandı",
      subtitle: req.userHolderName || "IBAN",
      amount: req.amount,
      currency: "TRY",
      date: new Date().toISOString().slice(0, 10),
      status: "completed",
    });
    pushNotification(
      "Çekim onaylandı",
      `${formatAmount(req.amount)} bakiyenizden düşüldü.`,
      req.id
    );
  }

  list[idx] = {
    ...req,
    status: "approved",
    reviewedAt: new Date().toISOString(),
  };
  saveMoneyRequests(list);
  dispatchMoneyEvent();
  return { ok: true };
}

export function rejectMoneyRequest(id: string): { ok: boolean; error?: string } {
  const list = getMoneyRequests();
  const idx = list.findIndex((r) => r.id === id);
  if (idx < 0) return { ok: false, error: "Talep bulunamadı" };
  const req = list[idx];
  if (req.status === "approved" || req.status === "rejected") {
    return { ok: false, error: "Talep zaten sonuçlanmış" };
  }

  list[idx] = {
    ...req,
    status: "rejected",
    reviewedAt: new Date().toISOString(),
  };
  saveMoneyRequests(list);

  pushNotification(
    req.type === "deposit" ? "Yatırma reddedildi" : "Çekim reddedildi",
    `${formatAmount(req.amount)} tutarındaki talebiniz reddedildi.`,
    req.id
  );

  dispatchMoneyEvent();
  return { ok: true };
}

export function methodLabel(m?: MoneyMethod): string {
  if (m === "crypto") return "Kripto";
  if (m === "card") return "Kredi kartı";
  if (m === "iban") return "IBAN";
  return "—";
}

export function statusLabel(s: MoneyRequestStatus): string {
  switch (s) {
    case "pending_ai":
      return "AI bekliyor";
    case "ai_reviewed":
      return "AI incelendi";
    case "approved":
      return "Onaylandı";
    case "rejected":
      return "Reddedildi";
  }
}

function formatAmount(n: number): string {
  return (
    "₺" +
    n.toLocaleString("tr-TR", {
      maximumFractionDigits: 0,
    })
  );
}

export function clearMoneyData(): void {
  localStorage.removeItem(REQUESTS_KEY);
  localStorage.removeItem(NOTIF_FEED_KEY);
  localStorage.removeItem(BALANCE_DELTA_KEY);
  sessionStorage.removeItem(ADMIN_UNLOCK_KEY);
}

/** Seed a couple of sample notifications once if feed empty. */
export function ensureSeedNotifications(): void {
  if (typeof window === "undefined") return;
  if (localStorage.getItem(NOTIF_FEED_KEY) !== null) return;
  const now = Date.now();
  const seeds: NotificationItem[] = [
    {
      id: "n-seed-1",
      title: "Hoş geldiniz",
      body: "Investor prototipine hoş geldiniz. Bildirimler burada listelenir.",
      createdAt: new Date(now - 86400000).toISOString(),
      read: true,
    },
    {
      id: "n-seed-2",
      title: "Otomatik katkı hatırlatması",
      body: "Aylık ₺2.500 katkınız 25 Eyl tarihinde planlandı (simülasyon).",
      createdAt: new Date(now - 3600000).toISOString(),
      read: false,
    },
  ];
  saveNotificationsFeed(seeds);
}
