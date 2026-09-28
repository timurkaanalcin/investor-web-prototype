/** Client-side CRM mock layer (localStorage). No Prisma — static-export safe. */

const DESKS_KEY = "hram_crm_desks";
const EMPLOYEES_KEY = "hram_crm_employees";
const TICKETS_KEY = "hram_crm_tickets";
const SEEDED_KEY = "hram_crm_seeded_v2";
const SESSION_KEY = "hram_crm_session";
const EVENT = "hram-crm-updated";

export type CrmPermission =
  | "shift"
  | "chat"
  | "customers"
  | "tickets"
  | "desks"
  | "employees"
  | "money"
  | "referrals"
  | "settings"
  | "analytics"
  | "transactions"
  | "admin";

export type CrmDesk = {
  id: string;
  name: string;
  type: "FTD" | "Retention" | "Support" | "Affiliate";
  leadCount: number;
  depositSum: number;
};

export type CrmEmployee = {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: string;
  deskId: string;
  active: boolean;
  permissions: string[];
};

export type CrmTicket = {
  id: string;
  title: string;
  type: "Deposit" | "Withdrawal" | "Support" | "Other";
  status: "Open" | "Approved" | "Rejected" | "Closed";
  amount?: number;
  customerEmail?: string;
  customerName?: string;
  createdAt: string;
  note?: string;
};

export type CrmSession = {
  employeeId: string;
  name: string;
  email: string;
  role: string;
  permissions: string[];
  deskId: string;
  via: "employee" | "admin_pin";
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

export function subscribeCrm(cb: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const onStorage = (e: StorageEvent) => {
    if (
      e.key === DESKS_KEY ||
      e.key === EMPLOYEES_KEY ||
      e.key === TICKETS_KEY ||
      e.key === SESSION_KEY ||
      e.key === "hram_crm_ping"
    ) {
      cb();
    }
  };
  window.addEventListener("storage", onStorage);
  window.addEventListener(EVENT, cb);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(EVENT, cb);
  };
}

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

const SEED_DESKS: CrmDesk[] = [
  { id: "desk_ftd", name: "FTD Masa 1", type: "FTD", leadCount: 42, depositSum: 185000 },
  { id: "desk_ret", name: "Retention A", type: "Retention", leadCount: 118, depositSum: 640000 },
  { id: "desk_sup", name: "Destek", type: "Support", leadCount: 0, depositSum: 0 },
  { id: "desk_aff", name: "Affiliate", type: "Affiliate", leadCount: 27, depositSum: 92000 },
];

const SHIFT_PERMS = ["shift", "chat", "customers", "tickets", "desks"] as const;

const SEED_EMPLOYEES: CrmEmployee[] = [
  {
    id: "emp_1",
    name: "Admin HRAM",
    email: "admin@hram.tr",
    password: "AdminHram1!",
    role: "Admin",
    deskId: "desk_sup",
    active: true,
    permissions: ["admin", "shift", "chat", "customers", "tickets", "desks", "employees", "money", "referrals", "settings", "analytics", "transactions"],
  },
  {
    id: "emp_2",
    name: "Ayşe Yılmaz",
    email: "ayse@hram.tr",
    password: "AyseBroker1!",
    role: "FTD Broker",
    deskId: "desk_ftd",
    active: true,
    permissions: ["chat", "customers", "tickets"],
  },
  {
    id: "emp_3",
    name: "Mehmet Kaya",
    email: "mehmet@hram.tr",
    password: "MehmetRet1!",
    role: "Retention Broker",
    deskId: "desk_ret",
    active: true,
    permissions: ["chat", "customers", "tickets"],
  },
  {
    id: "emp_4",
    name: "Zeynep Demir",
    email: "zeynep@hram.tr",
    password: "ZeynepSup1!",
    role: "Support Admin",
    deskId: "desk_sup",
    active: true,
    permissions: ["chat", "customers", "tickets", "desks"],
  },
  {
    id: "emp_5",
    name: "Can Öztürk",
    email: "can@hram.tr",
    password: "CanDesk1!",
    role: "Desk Manager",
    deskId: "desk_ret",
    active: true,
    permissions: ["chat", "customers", "tickets", "desks", "employees"],
  },
  {
    id: "emp_magda",
    name: "Magda",
    email: "magda@hram.tr",
    password: "MagdaShift1!",
    role: "Shift Broker",
    deskId: "desk_ret",
    active: true,
    permissions: [...SHIFT_PERMS],
  },
  {
    id: "emp_alisa",
    name: "Alisa",
    email: "alisa@hram.tr",
    password: "AlisaShift1!",
    role: "Shift Broker",
    deskId: "desk_sup",
    active: true,
    permissions: [...SHIFT_PERMS],
  },
];

const SEED_TICKETS: CrmTicket[] = [
  {
    id: "tkt_1",
    title: "Yatırma doğrulama",
    type: "Deposit",
    status: "Open",
    amount: 15000,
    customerName: "Demo Müşteri",
    customerEmail: "demo@ornek.com",
    createdAt: new Date(Date.now() - 3600_000).toISOString(),
    note: "Mock bilet — gerçek para hareketi değil",
  },
  {
    id: "tkt_2",
    title: "Çekim talebi",
    type: "Withdrawal",
    status: "Open",
    amount: 5000,
    customerName: "Test Hesap",
    customerEmail: "test@hram.tr",
    createdAt: new Date(Date.now() - 7200_000).toISOString(),
  },
  {
    id: "tkt_3",
    title: "Hesap sorusu",
    type: "Support",
    status: "Closed",
    customerName: "Misafir",
    createdAt: new Date(Date.now() - 86400_000).toISOString(),
  },
];

function normalizeEmployee(raw: Partial<CrmEmployee> & { id: string; name: string; email: string; role: string; deskId: string; active: boolean }): CrmEmployee {
  return {
    ...raw,
    password: raw.password,
    permissions: Array.isArray(raw.permissions) ? raw.permissions : [],
  };
}

function mergeShiftEmployees(existing: CrmEmployee[]): CrmEmployee[] {
  const byEmail = new Map(existing.map((e) => [e.email.toLowerCase(), normalizeEmployee(e)]));
  for (const seed of SEED_EMPLOYEES) {
    const key = seed.email.toLowerCase();
    const prev = byEmail.get(key);
    if (!prev) {
      byEmail.set(key, { ...seed });
      continue;
    }
    // Ensure Magda/Alisa + password/permissions fields land on upgrade
    byEmail.set(key, {
      ...prev,
      password: prev.password || seed.password,
      permissions:
        prev.permissions && prev.permissions.length > 0
          ? prev.permissions
          : [...seed.permissions],
      role: prev.role || seed.role,
      active: prev.active,
      deskId: prev.deskId || seed.deskId,
      name: prev.name || seed.name,
    });
  }
  // Force Magda + Alisa seed values (shift staff)
  for (const forced of SEED_EMPLOYEES.filter((e) => e.id === "emp_magda" || e.id === "emp_alisa")) {
    byEmail.set(forced.email.toLowerCase(), { ...forced });
  }
  return Array.from(byEmail.values());
}

export function ensureCrmSeeded(): void {
  if (typeof window === "undefined") return;
  const alreadyV2 = localStorage.getItem(SEEDED_KEY) === "1";
  if (!localStorage.getItem(DESKS_KEY)) {
    localStorage.setItem(DESKS_KEY, JSON.stringify(SEED_DESKS));
  }
  if (!localStorage.getItem(TICKETS_KEY)) {
    localStorage.setItem(TICKETS_KEY, JSON.stringify(SEED_TICKETS));
  }

  const rawEmps = localStorage.getItem(EMPLOYEES_KEY);
  if (!rawEmps) {
    localStorage.setItem(EMPLOYEES_KEY, JSON.stringify(SEED_EMPLOYEES));
  } else if (!alreadyV2) {
    const parsed = safeParse<CrmEmployee[]>(rawEmps, []);
    localStorage.setItem(EMPLOYEES_KEY, JSON.stringify(mergeShiftEmployees(parsed)));
  } else {
    // Still ensure Magda/Alisa exist even after v2 (in case wiped)
    const parsed = safeParse<CrmEmployee[]>(rawEmps, []);
    const emails = new Set(parsed.map((e) => e.email.toLowerCase()));
    let changed = false;
    const next = [...parsed.map(normalizeEmployee)];
    for (const forced of SEED_EMPLOYEES.filter((e) => e.id === "emp_magda" || e.id === "emp_alisa")) {
      if (!emails.has(forced.email.toLowerCase())) {
        next.push({ ...forced });
        changed = true;
      } else {
        const idx = next.findIndex((e) => e.email.toLowerCase() === forced.email.toLowerCase());
        if (idx >= 0) {
          const cur = next[idx];
          if (!cur.permissions?.includes("shift") || cur.password !== forced.password) {
            next[idx] = { ...forced };
            changed = true;
          }
        }
      }
    }
    if (changed) localStorage.setItem(EMPLOYEES_KEY, JSON.stringify(next));
  }

  localStorage.setItem(SEEDED_KEY, "1");
  // Drop old v1 marker if present
  try {
    localStorage.removeItem("hram_crm_seeded_v1");
  } catch {
    /* ignore */
  }
  emit();
}

export function getCrmDesks(): CrmDesk[] {
  ensureCrmSeeded();
  return safeParse<CrmDesk[]>(localStorage.getItem(DESKS_KEY), SEED_DESKS);
}

export function getCrmEmployees(): CrmEmployee[] {
  ensureCrmSeeded();
  return safeParse<CrmEmployee[]>(localStorage.getItem(EMPLOYEES_KEY), SEED_EMPLOYEES).map(
    normalizeEmployee,
  );
}

export function getCrmTickets(): CrmTicket[] {
  ensureCrmSeeded();
  return safeParse<CrmTicket[]>(localStorage.getItem(TICKETS_KEY), SEED_TICKETS).sort(
    (a, b) => +new Date(b.createdAt) - +new Date(a.createdAt),
  );
}

export function updateCrmTicketStatus(
  id: string,
  status: CrmTicket["status"],
): void {
  const list = getCrmTickets().map((t) => (t.id === id ? { ...t, status } : t));
  localStorage.setItem(TICKETS_KEY, JSON.stringify(list));
  emit();
}

export function addCrmTicket(
  input: Omit<CrmTicket, "id" | "createdAt" | "status"> & {
    status?: CrmTicket["status"];
  },
): CrmTicket {
  const ticket: CrmTicket = {
    ...input,
    id: `tkt_${Date.now().toString(36)}`,
    status: input.status || "Open",
    createdAt: new Date().toISOString(),
  };
  const list = getCrmTickets();
  list.unshift(ticket);
  localStorage.setItem(TICKETS_KEY, JSON.stringify(list.slice(0, 80)));
  emit();
  return ticket;
}

/** Mock dashboard KPIs — clearly demo. */
export function getCrmDashboardStats(live: {
  customers: number;
  openSupport: number;
  openMoney: number;
  depositSumApproved: number;
}) {
  const desks = getCrmDesks();
  const tickets = getCrmTickets();
  const openTickets = tickets.filter((t) => t.status === "Open").length;
  return {
    leads: live.customers + desks.reduce((s, d) => s + d.leadCount, 0),
    customers: live.customers,
    openTickets: openTickets + live.openMoney,
    openSupport: live.openSupport,
    depositSum:
      live.depositSumApproved + desks.reduce((s, d) => s + d.depositSum, 0),
    desks: desks.length,
    employees: getCrmEmployees().filter((e) => e.active).length,
    mockNote: "Demo / mock CRM istatistikleri — Prisma yok, localStorage",
  };
}

export function formatTry(n: number): string {
  return (
    "₺" +
    n.toLocaleString("tr-TR", {
      maximumFractionDigits: 0,
    })
  );
}

export function authenticateCrmEmployee(
  email: string,
  password: string,
): { ok: true; employee: CrmEmployee } | { ok: false; error: string } {
  ensureCrmSeeded();
  const normalized = email.trim().toLowerCase();
  const emp = getCrmEmployees().find((e) => e.email.toLowerCase() === normalized);
  if (!emp || !emp.active) {
    return { ok: false, error: "E-posta veya şifre hatalı" };
  }
  if (!emp.password || emp.password !== password) {
    return { ok: false, error: "E-posta veya şifre hatalı" };
  }
  return { ok: true, employee: emp };
}

export function getCrmSession(): CrmSession | null {
  if (typeof window === "undefined") return null;
  ensureCrmSeeded();
  return safeParse<CrmSession | null>(localStorage.getItem(SESSION_KEY), null);
}

export function setCrmSession(session: CrmSession): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  emit();
}

export function clearCrmSession(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(SESSION_KEY);
  emit();
}

export function sessionFromEmployee(emp: CrmEmployee): CrmSession {
  return {
    employeeId: emp.id,
    name: emp.name,
    email: emp.email,
    role: emp.role,
    permissions: emp.permissions || [],
    deskId: emp.deskId,
    via: "employee",
  };
}

export function hasCrmPermission(
  session: CrmSession | null,
  perm: string,
): boolean {
  if (!session) return false;
  if (session.via === "admin_pin") return true;
  if (session.permissions.includes("admin")) return true;
  return session.permissions.includes(perm);
}

export function isFullCrmAdmin(session: CrmSession | null): boolean {
  if (!session) return false;
  return session.via === "admin_pin" || session.permissions.includes("admin");
}
