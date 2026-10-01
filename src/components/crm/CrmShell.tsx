"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { verifyAdminPin, clearAdminToken } from "@/lib/admin-auth";
import { setSessionAdminPin } from "@/lib/referral-codes";
import {
  isAdminUnlocked,
  setAdminUnlocked,
  getMoneyRequests,
} from "@/lib/money-requests";
import {
  clearCrmSession,
  ensureCrmSeeded,
  getCrmSession,
  setCrmSession,
  type CrmSession,
} from "@/lib/crm/data";
import { openThreadCount } from "@/lib/live-support";
import { listAuthAccounts } from "@/lib/storage";
import { CrmSidebar } from "./CrmSidebar";
import { IconLock, IconMenu, IconSearch } from "./CrmIcons";

export function CrmShell({ children }: { children: ReactNode }) {
  const [unlocked, setUnlocked] = useState(false);
  const [session, setSession] = useState<CrmSession | null>(null);
  const [ready, setReady] = useState(false);
  const [pin, setPin] = useState("");
  const [pinErr, setPinErr] = useState("");
  const [mobileNav, setMobileNav] = useState(false);
  const [clock, setClock] = useState("");
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [supportBadge, setSupportBadge] = useState(0);
  const [moneyBadge, setMoneyBadge] = useState(0);
  const [online, setOnline] = useState(true);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    ensureCrmSeeded();
    const crm = getCrmSession();
    const pinOk = isAdminUnlocked();
    if (crm) {
      setSession(crm);
      setUnlocked(true);
      if (crm.via === "admin_pin" || crm.permissions.includes("admin")) {
        setAdminUnlocked(true);
      }
    } else if (pinOk) {
      setUnlocked(true);
      setSession({
        employeeId: "emp_1",
        name: "Admin HRAM",
        email: "admin@hram.tr",
        role: "Admin",
        permissions: ["admin"],
        deskId: "desk_sup",
        via: "admin_pin",
      });
    } else {
      setUnlocked(false);
      setSession(null);
    }
    setReady(true);
  }, []);

  useEffect(() => {
    setMobileNav(false);
    setSearchOpen(false);
  }, [pathname]);

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setClock(
        now.toLocaleString("tr-TR", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          day: "2-digit",
          month: "2-digit",
        }),
      );
      setOnline(navigator.onLine);
      setSupportBadge(openThreadCount());
      setMoneyBadge(
        getMoneyRequests().filter(
          (r) => r.status === "ai_reviewed" || r.status === "pending_ai",
        ).length,
      );
    };
    tick();
    const iv = window.setInterval(tick, 1000);
    return () => window.clearInterval(iv);
  }, []);

  const searchHits = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q || q.length < 1) return [];
    try {
      return listAuthAccounts()
        .filter(
          (a) =>
            a.email.toLowerCase().includes(q) ||
            (a.name || "").toLowerCase().includes(q),
        )
        .slice(0, 8);
    } catch {
      return [];
    }
  }, [search]);

  async function tryUnlock() {
    setPinErr("");
    const entered = pin;
    const result = await verifyAdminPin(pin);
    if (result.ok) {
      setSessionAdminPin(entered);
      const adminSession: CrmSession = {
        employeeId: "emp_1",
        name: "Admin HRAM",
        email: "admin@hram.tr",
        role: "Admin",
        permissions: ["admin"],
        deskId: "desk_sup",
        via: "admin_pin",
      };
      setCrmSession(adminSession);
      setAdminUnlocked(true);
      setSession(adminSession);
      setUnlocked(true);
      setPin("");
      if (pathname === "/admin" || pathname === "/admin/") {
        router.replace("/admin/dashboard/");
      }
    } else {
      setPinErr(result.error || "Yanlış PIN");
    }
  }

  function lock() {
    clearCrmSession();
    clearAdminToken();
    setSessionAdminPin(null);
    setAdminUnlocked(false);
    setSession(null);
    setUnlocked(false);
  }

  if (!ready) {
    return (
      <div className="hram-crm flex min-h-[60vh] items-center justify-center text-sm text-neutral-500">
        Yükleniyor…
      </div>
    );
  }

  if (!unlocked) {
    return (
      <div className="hram-crm mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-5 py-10 text-black">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-black text-white">
            <IconLock size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-black">HRAM CRM</h1>
            <p className="text-xs text-neutral-500">Broker Desk · PIN ile giriş</p>
          </div>
        </div>
        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-neutral-700">
            Prototip CRM — PIN sunucuda doğrulanır; istemci paketinde PIN yoktur.
          </p>
          <input
            type="password"
            inputMode="numeric"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && tryUnlock()}
            className="mt-4 w-full rounded-xl border border-neutral-300 bg-white px-3 py-3 text-center text-lg tracking-widest text-black outline-none focus:border-neutral-800"
            placeholder="••••"
            aria-label="Admin PIN"
            autoFocus
          />
          {pinErr && <p className="mt-2 text-xs text-neutral-700">{pinErr}</p>}
          <button
            type="button"
            onClick={tryUnlock}
            className="mt-4 w-full rounded-xl bg-black py-3 text-sm font-semibold text-white hover:bg-neutral-800"
          >
            Giriş
          </button>
          <Link
            href="/log/"
            className="mt-3 block text-center text-xs font-semibold text-black underline underline-offset-2"
          >
            Personel girişi (/log)
          </Link>
          <Link
            href="/profil"
            className="mt-2 block text-center text-xs text-neutral-500 underline"
          >
            Profile dön
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="hram-crm flex h-[100dvh] min-h-0 bg-[#f3f3f3] text-black">
      <div className="hidden md:block">
        <CrmSidebar session={session} />
      </div>
      {mobileNav && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Menüyü kapat"
            onClick={() => setMobileNav(false)}
          />
          <div className="relative z-10 h-full shadow-xl">
            <CrmSidebar
              session={session}
              onNavigate={() => setMobileNav(false)}
            />
          </div>
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="relative flex h-11 shrink-0 items-center gap-2 border-b border-black/10 bg-white px-2 md:px-3">
          <button
            type="button"
            className="rounded p-1.5 hover:bg-neutral-100 md:hidden"
            onClick={() => setMobileNav(true)}
            aria-label="Menü"
          >
            <IconMenu size={16} />
          </button>

          <div className="relative min-w-0 flex-1 max-w-md">
            <div className="flex h-8 items-center gap-1.5 rounded border border-neutral-200 bg-neutral-50 px-2">
              <IconSearch size={13} className="shrink-0 text-neutral-400" />
              <input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setSearchOpen(true);
                }}
                onFocus={() => setSearchOpen(true)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && search.trim()) {
                    router.push(
                      `/admin/customers/?q=${encodeURIComponent(search.trim())}`,
                    );
                    setSearchOpen(false);
                  }
                }}
                placeholder="Sembol tarzı ara: müşteri / e-posta…"
                className="w-full bg-transparent text-[12px] text-black outline-none placeholder:text-neutral-400"
                aria-label="Müşteri ara"
              />
            </div>
            {searchOpen && searchHits.length > 0 && (
              <div className="absolute left-0 right-0 top-9 z-40 overflow-hidden rounded border border-neutral-200 bg-white shadow-lg">
                {searchHits.map((a) => (
                  <button
                    key={a.email}
                    type="button"
                    className="flex w-full items-center justify-between gap-2 border-b border-neutral-100 px-3 py-2 text-left last:border-0 hover:bg-neutral-50"
                    onClick={() => {
                      setSearch(a.email);
                      setSearchOpen(false);
                      router.push(
                        `/admin/customers/?q=${encodeURIComponent(a.email)}`,
                      );
                    }}
                  >
                    <span className="truncate text-[12px] font-semibold text-black">
                      {a.name || "—"}
                    </span>
                    <span className="tv-mono truncate text-[11px] text-neutral-500">
                      {a.email}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
            <span
              className={`hidden items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold sm:inline-flex ${
                online
                  ? "border-neutral-300 bg-neutral-50 text-black"
                  : "border-neutral-400 bg-neutral-200 text-neutral-600"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${online ? "bg-[#26a69a]" : "bg-neutral-400"}`}
              />
              {online ? "Bağlı" : "Çevrimdışı"}
            </span>
            <Link
              href="/admin/chat/"
              className="inline-flex h-7 items-center gap-1 rounded border border-neutral-200 bg-neutral-50 px-2 text-[10px] font-semibold text-black hover:bg-neutral-100"
            >
              Destek
              {supportBadge > 0 && (
                <span className="rounded-full bg-black px-1.5 text-[9px] text-white">
                  {supportBadge}
                </span>
              )}
            </Link>
            <Link
              href="/admin/money/"
              className="inline-flex h-7 items-center gap-1 rounded border border-neutral-200 bg-neutral-50 px-2 text-[10px] font-semibold text-black hover:bg-neutral-100"
            >
              Para
              {moneyBadge > 0 && (
                <span className="rounded-full bg-black px-1.5 text-[9px] text-white">
                  {moneyBadge}
                </span>
              )}
            </Link>
            <span className="tv-mono hidden text-[11px] text-neutral-600 tabular-nums lg:inline">
              {clock}
            </span>
            {session && (
              <span className="hidden max-w-[120px] truncate text-[11px] text-neutral-500 xl:inline">
                {session.name}
                {session.permissions.includes("shift") && (
                  <span className="ml-1 rounded border border-neutral-300 px-1 text-[9px] font-semibold uppercase">
                    Shift
                  </span>
                )}
              </span>
            )}
            <button
              type="button"
              onClick={lock}
              className="text-[11px] font-semibold text-neutral-600 underline"
            >
              Çıkış
            </button>
          </div>
        </header>
        <main className="min-h-0 flex-1 overflow-y-auto p-2 md:p-3">
          {children}
        </main>
      </div>
    </div>
  );
}
