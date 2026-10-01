"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import {
  getAgentSession,
  isAgentLoggedIn,
  loginAgent,
  logoutAgent,
  type AgentSession,
} from "@/lib/storage";

export default function AgentPortalPage() {
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<AgentSession | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setSession(getAgentSession());
    setReady(true);
  }, []);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const result = loginAgent({ email, password, code });
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setSession(result.session);
  }

  function onLogout() {
    logoutAgent();
    setSession(null);
  }

  if (!ready) {
    return (
      <div className="hram-agent">
        <div className="hram-agent__card">
          <p className="text-sm text-muted">Yükleniyor…</p>
        </div>
      </div>
    );
  }

  const active = session ?? (isAgentLoggedIn() ? getAgentSession() : null);

  if (active) {
    return (
      <div className="hram-agent">
        <header className="hram-agent__top">
          <Link href="/" className="hram-wordmark">
            HRAM
          </Link>
          <nav>
            <Link href="/">Ana sayfa</Link>
            <Link href="/destek">Destek</Link>
          </nav>
        </header>
        <main className="hram-agent__main">
          <div className="hram-agent__card hram-agent__card--wide">
            <p className="hram-eyebrow">Agent portalı</p>
            <h1>Hoş geldiniz{active.name ? `, ${active.name}` : ""}</h1>
            <p className="hram-agent__lead">
              Bu alan broker / IB / affiliate agentleri için hazırlanmış bir
              demo portaldır. Canlı komisyon ve müşteri listeleri yakında.
            </p>
            <dl className="hram-agent__stats">
              <div>
                <dt>Agent kodu</dt>
                <dd>{active.code || "—"}</dd>
              </div>
              <div>
                <dt>E-posta</dt>
                <dd>{active.email}</dd>
              </div>
              <div>
                <dt>Durum</dt>
                <dd>Demo oturum aktif</dd>
              </div>
              <div>
                <dt>Referans müşteri</dt>
                <dd>12 (örnek)</dd>
              </div>
            </dl>
            <div className="hram-agent__actions">
              <button type="button" className="hram-btn hram-btn--solid" onClick={onLogout}>
                Çıkış yap
              </button>
              <Link href="/" className="hram-btn hram-btn--ghost">
                Kurumsal site
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="hram-agent">
      <header className="hram-agent__top">
        <Link href="/" className="hram-wordmark">
          HRAM
        </Link>
        <nav>
          <Link href="/giris">Müşteri girişi</Link>
          <Link href="/">Ana sayfa</Link>
        </nav>
      </header>
      <main className="hram-agent__main">
        <div className="hram-agent__card">
          <p className="hram-eyebrow">Agent · Broker / IB</p>
          <h1>Agent girişi</h1>
          <p className="hram-agent__lead">
            Partner hesabınızla giriş yapın. Demo ortamında herhangi bir e-posta
            ve şifre ile oturum açabilirsiniz.
          </p>
          <form onSubmit={onSubmit} className="hram-agent__form">
            <label>
              <span>E-posta</span>
              <input
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="agent@firma.com"
              />
            </label>
            <label>
              <span>Şifre</span>
              <input
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </label>
            <label>
              <span>
                Agent kodu <em>(isteğe bağlı)</em>
              </span>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="HRAM-AG-001"
              />
            </label>
            {error && (
              <p className="hram-agent__error" role="alert">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={busy}
              className="hram-btn hram-btn--solid hram-btn--lg"
              style={{ width: "100%" }}
            >
              {busy ? "Giriş yapılıyor…" : "Agent portalına gir"}
            </button>
          </form>
          <p className="hram-agent__foot">
            Müşteri misiniz? <Link href="/giris">Müşteri girişi</Link>
            {" · "}
            <Link href="/kayit">Hesap aç</Link>
          </p>
        </div>
      </main>
    </div>
  );
}
