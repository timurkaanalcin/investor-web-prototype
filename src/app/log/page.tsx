"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { verifyAdminPin } from "@/lib/admin-auth";
import { setAdminUnlocked } from "@/lib/money-requests";
import {
  authenticateCrmEmployee,
  clearCrmSession,
  ensureCrmSeeded,
  getCrmSession,
  sessionFromEmployee,
  setCrmSession,
} from "@/lib/crm/data";

export default function CrmLogPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    ensureCrmSeeded();
    const existing = getCrmSession();
    if (existing) {
      router.replace("/admin/dashboard/");
    }
  }, [router]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);

    const pinTry = password.trim();
    const emailNorm = email.trim().toLowerCase();
    const adminEmailAttempt =
      emailNorm === "admin@hram.tr" || emailNorm === "" || emailNorm === "admin";

    if (adminEmailAttempt && pinTry) {
      const pinOk = await verifyAdminPin(pinTry);
      if (pinOk.ok) {
        setCrmSession({
          employeeId: "emp_1",
          name: "Admin HRAM",
          email: "admin@hram.tr",
          role: "Admin",
          permissions: ["admin"],
          deskId: "desk_sup",
          via: "admin_pin",
        });
        setAdminUnlocked(true);
        setBusy(false);
        router.replace("/admin/dashboard/");
        return;
      }
      // fall through to employee auth if email looks like staff
      if (emailNorm === "" || emailNorm === "admin" || emailNorm === "admin@hram.tr") {
        setBusy(false);
        setError(pinOk.error || "PIN veya şifre hatalı");
        return;
      }
    }

    const result = authenticateCrmEmployee(email, password);
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setCrmSession(sessionFromEmployee(result.employee));
    if (result.employee.permissions.includes("admin")) {
      setAdminUnlocked(true);
    }
    router.replace("/admin/dashboard/");
  }

  return (
    <div className="flex min-h-[100dvh] flex-col bg-[#f5f5f5] text-black">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-5 py-10">
        <div className="mb-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
            HRAM CRM
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-black">
            Personel girişi
          </h1>
          <p className="mt-1.5 text-sm text-neutral-600">
            Vardiya ve broker ekibi için e-posta + şifre ile giriş.
          </p>
        </div>

        <form
          onSubmit={onSubmit}
          className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm"
        >
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-neutral-500">
              E-posta
            </span>
            <input
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ornek@hram.tr"
              className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-[15px] text-black outline-none transition placeholder:text-neutral-400 focus:border-neutral-800"
            />
          </label>

          <label className="mt-4 block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-neutral-500">
              Şifre
            </span>
            <input
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-[15px] text-black outline-none transition placeholder:text-neutral-400 focus:border-neutral-800"
            />
          </label>

          {error && (
            <p
              className="mt-3 rounded-xl border border-neutral-300 bg-neutral-100 px-3 py-2.5 text-sm text-black"
              role="alert"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="mt-5 w-full rounded-xl bg-black py-3.5 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:opacity-60"
          >
            {busy ? "Giriş yapılıyor…" : "Giriş yap"}
          </button>
        </form>

        <p className="mt-5 text-center text-xs text-neutral-500">
          Admin PIN ile{" "}
          <Link href="/admin/" className="font-semibold text-black underline underline-offset-2">
            /admin
          </Link>{" "}
          üzerinden de giriş yapılabilir.
        </p>
        <p className="mt-3 text-center text-[11px] text-neutral-400">
          Demo: magda@hram.tr · alisa@hram.tr
        </p>
        <button
          type="button"
          className="mt-6 text-center text-xs text-neutral-500 underline"
          onClick={() => {
            clearCrmSession();
            setAdminUnlocked(false);
            setEmail("");
            setPassword("");
          }}
        >
          Oturumu temizle
        </button>
      </div>
    </div>
  );
}
