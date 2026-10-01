"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BrandLogo } from "@/components/BrandLogo";
import { registerUser } from "@/lib/storage";

export default function KayitPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const result = await registerUser({
        email,
        password,
        passwordConfirm,
        name,
        referralCode,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.replace("/panel");
    } catch {
      setError("Kayıt sırasında bir hata oluştu. Tekrar deneyin.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-screen flex min-h-full flex-1 flex-col px-5 pb-10 pt-8">
      <div className="flex justify-center">
        <BrandLogo size="md" showIcon={false} />
      </div>

      <div className="mx-auto mt-10 w-full max-w-sm flex-1">
        <h1 className="text-2xl font-bold tracking-tight text-nest">Kayıt ol</h1>
        <p className="mt-1.5 text-sm text-muted">
          Yeni hesap oluşturun. Bilgileriniz bu cihazda saklanır.
        </p>

        <form onSubmit={onSubmit} className="mt-7 flex flex-col gap-4">
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">
              Ad / Soyad <span className="normal-case opacity-70">(isteğe bağlı)</span>
            </span>
            <input
              type="text"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Adınız"
              className="auth-input w-full rounded-xl border border-border bg-card px-4 py-3.5 text-[15px] text-foreground outline-none transition focus:border-foreground/40"
            />
          </label>

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
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="En az 4 karakter"
              className="auth-input w-full rounded-xl border border-border bg-card px-4 py-3.5 text-[15px] text-foreground outline-none transition focus:border-foreground/40"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">
              Şifre tekrar
            </span>
            <input
              type="password"
              autoComplete="new-password"
              required
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              placeholder="Şifreyi tekrar girin"
              className="auth-input w-full rounded-xl border border-border bg-card px-4 py-3.5 text-[15px] text-foreground outline-none transition focus:border-foreground/40"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">
              Referans kodu
            </span>
            <input
              type="text"
              autoComplete="off"
              required
              value={referralCode}
              onChange={(e) => setReferralCode(e.target.value)}
              placeholder="Referans kodunuzu girin"
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
            {busy ? "Kaydediliyor…" : "Kayıt ol"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          Zaten hesabınız var mı?{" "}
          <Link
            href="/giris"
            className="font-semibold text-nest underline-offset-2 hover:underline"
          >
            Giriş
          </Link>
        </p>
      </div>
    </div>
  );
}
