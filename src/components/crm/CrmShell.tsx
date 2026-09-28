"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ADMIN_PIN } from "@/lib/payment-config";
import {
  isAdminUnlocked,
  setAdminUnlocked,
} from "@/lib/money-requests";
import {
  clearCrmSession,
  ensureCrmSeeded,
  getCrmSession,
  setCrmSession,
  type CrmSession,
} from "@/lib/crm/data";
import { CrmSidebar } from "./CrmSidebar";
import { IconLock, IconMenu } from "./CrmIcons";

export function CrmShell({ children }: { children: ReactNode }) {
  const [unlocked, setUnlocked] = useState(false);
  const [session, setSession] = useState<CrmSession | null>(null);
  const [ready, setReady] = useState(false);
  const [pin, setPin] = useState("");
  const [pinErr, setPinErr] = useState("");
  const [mobileNav, setMobileNav] = useState(false);
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
  }, [pathname]);

  function tryUnlock() {
    if (pin === ADMIN_PIN) {
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
      setPinErr("");
      setPin("");
      if (pathname === "/admin" || pathname === "/admin/") {
        router.replace("/admin/dashboard/");
      }
    } else {
      setPinErr("Yanlış PIN");
    }
  }

  function lock() {
    clearCrmSession();
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
          <p className="rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs text-neutral-600">
            Prototip admin — gerçek kimlik doğrulama yok. PIN:{" "}
            <span className="font-semibold text-black">{ADMIN_PIN}</span>
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
    <div className="hram-crm flex h-[100dvh] min-h-0 bg-[#f7f7f7] text-black">
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
        <header className="flex h-12 shrink-0 items-center justify-between border-b border-black/10 bg-white px-3 md:px-5">
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="rounded-lg p-2 hover:bg-neutral-100 md:hidden"
              onClick={() => setMobileNav(true)}
              aria-label="Menü"
            >
              <IconMenu size={18} />
            </button>
            <p className="text-sm font-semibold text-black">HRAM CRM</p>
            {session && (
              <span className="hidden text-xs text-neutral-500 sm:inline">
                · {session.name}
                {session.permissions.includes("shift") && (
                  <span className="ml-1.5 rounded-full border border-neutral-300 bg-neutral-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-black">
                    Shift
                  </span>
                )}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={lock}
            className="text-xs font-semibold text-neutral-600 underline"
          >
            Çıkış
          </button>
        </header>
        <main className="min-h-0 flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
