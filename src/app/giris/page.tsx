"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BrandLogo } from "@/components/BrandLogo";
import { loginUser } from "@/lib/storage";

export default function GirisPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const result = loginUser(email, password);
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.replace("/panel");
  }

  return (
    <div className="auth-screen flex min-h-full flex-1 flex-col px-5 pb-10 pt-8">
      <div className="flex justify-center">
        <BrandLogo size="md" showIcon={false} />
      </div>

      <div className="mx-auto mt-10 w-full max-w-sm flex-1">
        <h1 className="text-2xl font-bold tracking-tight text-nest">Giriş</h1>
        <p className="mt-1.5 text-sm text-muted">
          Hesabınıza giriş yapın ve yatırımınıza devam edin.
        </p>

        <form onSubmit={onSubmit} className="mt-7 flex flex-col gap-4">
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">
              E-posta
            </span>
            <input
              type="email"
              autoComplete="email"
              inputMode="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ornek@posta.com"
              className="auth-input w-full rounded-xl border border-border bg-card px-4 py-3.5 text-[15px] text-foreground outline-none transition focus:border-foreground/40"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">
              Şifre
            </span>
            <input
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="auth-input w-full rounded-xl border border-border bg-card px-4 py-3.5 text-[15px] text-foreground outline-none transition focus:border-foreground/40"
            />
          </label>

          {error && (
            <p className="rounded-xl bg-danger-soft px-3 py-2.5 text-sm text-danger" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="btn-primary mt-2 w-full py-3.5 text-base disabled:opacity-60"
          >
            {busy ? "Giriş yapılıyor…" : "Giriş yap"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          Hesabınız yok mu?{" "}
          <Link
            href="/kayit"
            className="font-semibold text-nest underline-offset-2 hover:underline"
          >
            Kayıt ol
          </Link>
        </p>
        <p className="mt-4 text-center text-xs text-muted/80">
          Test: test@hram.tr / Test1234
        </p>
      </div>
    </div>
  );
}
