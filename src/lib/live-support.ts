const ENABLED_KEY = "hram_live_support_enabled";
const THREADS_KEY = "hram_live_support_threads";
const PROFILES_KEY = "hram_live_support_profiles";
const EVENT = "investor-live-support";

export type SupportSender = "user" | "agent" | "system";

export type SupportMessage = {
  id: string;
  sender: SupportSender;
  text: string;
  at: string;
  agentName?: string;
};

export type SupportProfile = {
  displayId: string;
  name: string;
  email?: string;
  accountType: string;
  currency: string;
  timezone: string;
  language: string;
  isActive: boolean;
  isActiveTrading: boolean;
  isActiveDeposit: boolean;
  isActiveWithdrawal: boolean;
  tradingServer: string;
  registeredAt: string;
  registrationCountry: string;
  registrationIp: string;
  lastLoginAt: string;
  markFtd: string;
  markFtdBroker: string;
  withdrawalDetails: string;
  assignmentAffiliate: string;
};

export type SupportThread = {
  id: string;
  userName: string;
  userEmail?: string;
  status: "open" | "resolved";
  createdAt: string;
  updatedAt: string;
  messages: SupportMessage[];
  profileId?: string;
  answered?: boolean;
};

const HRAM_GREETING =
  "Merhaba, HRAM Canlı Destek'e hoş geldiniz. Size nasıl yardımcı olabilirim?\n\nHRAM Destek";

function emit(): void {
  try {
    window.dispatchEvent(new Event(EVENT));
    localStorage.setItem("hram_live_support_ping", String(Date.now()));
  } catch {
    /* ignore */
  }
}

export function subscribeLiveSupport(cb: () => void): () => void {
  const onStorage = (e: StorageEvent) => {
    if (
      e.key === THREADS_KEY ||
      e.key === ENABLED_KEY ||
      e.key === PROFILES_KEY ||
      e.key === "hram_live_support_ping"
    ) {
      cb();
    }
  };
  window.addEventListener("storage", onStorage);
  window.addEventListener(EVENT, cb);
  const iv = window.setInterval(cb, 2500);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(EVENT, cb);
    window.clearInterval(iv);
  };
}

export function isLiveSupportEnabled(): boolean {
  if (typeof window === "undefined") return true;
  const v = localStorage.getItem(ENABLED_KEY);
  if (v === null) return true;
  return v === "1";
}

export function setLiveSupportEnabled(on: boolean): void {
  localStorage.setItem(ENABLED_KEY, on ? "1" : "0");
  emit();
}

function readThreads(): SupportThread[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(THREADS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeThreads(list: SupportThread[]): void {
  localStorage.setItem(THREADS_KEY, JSON.stringify(list.slice(0, 40)));
  emit();
}

function readProfiles(): Record<string, SupportProfile> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(PROFILES_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, SupportProfile>;
  } catch {
    return {};
  }
}

function writeProfiles(map: Record<string, SupportProfile>): void {
  localStorage.setItem(PROFILES_KEY, JSON.stringify(map));
  emit();
}

function uid(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function numericIdFrom(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return String(10000 + (h % 90000));
}

export function defaultProfile(meta?: {
  userName?: string;
  userEmail?: string;
  seed?: string;
}): SupportProfile {
  const seed = meta?.seed || meta?.userEmail || meta?.userName || uid("p");
  const now = new Date();
  return {
    displayId: numericIdFrom(seed),
    name: meta?.userName || "Misafir",
    email: meta?.userEmail,
    accountType: "Start",
    currency: "USD",
    timezone: "GMT +03:00 Europe/Istanbul",
    language: "Türkçe",
    isActive: true,
    isActiveTrading: false,
    isActiveDeposit: false,
    isActiveWithdrawal: false,
    tradingServer: "Web Trading Server",
    registeredAt: now.toISOString(),
    registrationCountry: "Türkiye",
    registrationIp: "—",
    lastLoginAt: now.toISOString(),
    markFtd: "",
    markFtdBroker: "Not Assigned",
    withdrawalDetails: "Empty",
    assignmentAffiliate: "-",
  };
}

export function getSupportProfile(thread: SupportThread): SupportProfile {
  const key = thread.profileId || thread.userEmail || thread.id;
  const map = readProfiles();
  if (map[key]) return map[key];
  const created = defaultProfile({
    userName: thread.userName,
    userEmail: thread.userEmail,
    seed: key,
  });
  map[key] = created;
  writeProfiles(map);
  return created;
}

export function updateSupportProfile(
  thread: SupportThread,
  patch: Partial<SupportProfile>,
): SupportProfile {
  const key = thread.profileId || thread.userEmail || thread.id;
  const map = readProfiles();
  const current = map[key] || getSupportProfile(thread);
  const next = { ...current, ...patch };
  map[key] = next;
  writeProfiles(map);
  return next;
}

function annotateAnswered(t: SupportThread): SupportThread {
  const last = [...t.messages].reverse().find((m) => m.sender !== "system");
  const answered = last?.sender === "agent";
  return { ...t, answered };
}

export function getSupportThreads(): SupportThread[] {
  return readThreads()
    .map(annotateAnswered)
    .sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt));
}

export function getSupportThread(id: string): SupportThread | null {
  const t = readThreads().find((x) => x.id === id);
  return t ? annotateAnswered(t) : null;
}

export function ensureUserThread(meta?: {
  userName?: string;
  userEmail?: string;
}): SupportThread {
  const threads = readThreads();
  const localId = localStorage.getItem("hram_live_support_my_thread");
  let thread = localId ? threads.find((t) => t.id === localId) : undefined;
  if (thread && thread.status === "resolved") {
    thread = {
      ...thread,
      status: "open",
      updatedAt: new Date().toISOString(),
    };
    const next = threads.map((t) => (t.id === thread!.id ? thread! : t));
    writeThreads(next);
    return annotateAnswered(thread);
  }
  if (thread) return annotateAnswered(thread);

  const now = new Date().toISOString();
  const id = uid("sup");
  const profile = defaultProfile({
    userName: meta?.userName || "Misafir",
    userEmail: meta?.userEmail,
    seed: meta?.userEmail || id,
  });
  const profiles = readProfiles();
  profiles[id] = profile;
  if (meta?.userEmail) profiles[meta.userEmail] = profile;
  writeProfiles(profiles);

  thread = {
    id,
    userName: meta?.userName || "Misafir",
    userEmail: meta?.userEmail,
    status: "open",
    createdAt: now,
    updatedAt: now,
    profileId: id,
    messages: [
      {
        id: uid("msg"),
        sender: "system",
        text: "HRAM Canlı Destek bağlandı. Mesajınızı yazın; ekibimiz yanıtlayacak.",
        at: now,
      },
    ],
  };
  threads.unshift(thread);
  writeThreads(threads);
  localStorage.setItem("hram_live_support_my_thread", thread.id);
  return annotateAnswered(thread);
}

export function getMyThreadId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("hram_live_support_my_thread");
}

export function sendUserMessage(text: string): SupportThread | null {
  const trimmed = text.trim();
  if (!trimmed) return null;
  const thread = ensureUserThread();
  const msg: SupportMessage = {
    id: uid("msg"),
    sender: "user",
    text: trimmed,
    at: new Date().toISOString(),
  };
  const updated: SupportThread = {
    ...thread,
    status: "open",
    updatedAt: msg.at,
    answered: false,
    messages: [...thread.messages, msg],
  };
  const next = readThreads().map((t) => (t.id === updated.id ? updated : t));
  writeThreads(next);
  return annotateAnswered(updated);
}

export function sendAgentReply(
  threadId: string,
  text: string,
  agentName?: string,
): SupportThread | null {
  const trimmed = text.trim();
  if (!trimmed) return null;
  const threads = readThreads();
  const idx = threads.findIndex((t) => t.id === threadId);
  if (idx < 0) return null;
  const msg: SupportMessage = {
    id: uid("msg"),
    sender: "agent",
    text: trimmed,
    at: new Date().toISOString(),
    agentName: agentName || "HRAM Destek",
  };
  const updated: SupportThread = {
    ...threads[idx],
    status: "open",
    updatedAt: msg.at,
    answered: true,
    messages: [...threads[idx].messages, msg],
  };
  threads[idx] = updated;
  writeThreads(threads);
  return annotateAnswered(updated);
}

export function resolveThread(threadId: string): void {
  const threads = readThreads().map((t) =>
    t.id === threadId
      ? { ...t, status: "resolved" as const, updatedAt: new Date().toISOString() }
      : t,
  );
  writeThreads(threads);
}

export function reopenThread(threadId: string): void {
  const threads = readThreads().map((t) =>
    t.id === threadId
      ? { ...t, status: "open" as const, updatedAt: new Date().toISOString() }
      : t,
  );
  writeThreads(threads);
}

export function openThreadCount(): number {
  return readThreads().filter((t) => t.status === "open").length;
}

export function unansweredThreadCount(): number {
  return getSupportThreads().filter(
    (t) => t.status === "open" && !t.answered,
  ).length;
}

export function createManualThread(meta: {
  userName: string;
  userEmail?: string;
}): SupportThread {
  const now = new Date().toISOString();
  const id = uid("sup");
  const profile = defaultProfile({
    userName: meta.userName,
    userEmail: meta.userEmail,
    seed: meta.userEmail || id,
  });
  const profiles = readProfiles();
  profiles[id] = profile;
  writeProfiles(profiles);
  const thread: SupportThread = {
    id,
    userName: meta.userName,
    userEmail: meta.userEmail,
    status: "open",
    createdAt: now,
    updatedAt: now,
    profileId: id,
    answered: true,
    messages: [
      {
        id: uid("msg"),
        sender: "agent",
        text: HRAM_GREETING,
        at: now,
        agentName: "HRAM Destek",
      },
    ],
  };
  const threads = readThreads();
  threads.unshift(thread);
  writeThreads(threads);
  return annotateAnswered(thread);
}

export function getHramGreeting(): string {
  return HRAM_GREETING;
}

export function relativeTimeTr(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(diff) || diff < 0) return "az önce";
  const sec = Math.floor(diff / 1000);
  if (sec < 45) return "birkaç saniye önce";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} dakika önce`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} saat önce`;
  const day = Math.floor(hr / 24);
  if (day === 1) return "bir gün önce";
  if (day < 30) return `${day} gün önce`;
  return new Date(iso).toLocaleDateString("tr-TR");
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function avatarHue(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h + seed.charCodeAt(i) * 17) % 360;
  return `hsl(${h} 28% 42%)`;
}
