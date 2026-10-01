"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const MARKETS = [
  { label: "Hisse", hint: "BIST · NYSE · NASDAQ" },
  { label: "Forex", hint: "Majör & çapraz çiftler" },
  { label: "Kripto", hint: "BTC · ETH · seçili altlar" },
  { label: "Emtia", hint: "Altın · gümüş · enerji" },
  { label: "Endeksler", hint: "Küresel endeksler" },
];

const FEATURES = [
  {
    title: "Düşük gecikmeli emir iletimi",
    body: "Kurumsal altyapı ile uluslararası piyasalara hızlı erişim.",
  },
  {
    title: "Çoklu varlık tek hesapta",
    body: "Hisse, döviz, kripto ve emtia — tek platform üzerinden.",
  },
  {
    title: "Masaüstü terminal",
    body: "Profesyonel izleme ve emir paneli; yüksek yoğunlukta çalışma için.",
  },
  {
    title: "Mobil erişim",
    body: "Hareket halindeyken pozisyon ve piyasa takibi.",
  },
  {
    title: "Canlı destek",
    body: "İşlem saatlerinde kurumsal destek hattı.",
  },
  {
    title: "Güvenli hesap erişimi",
    body: "Şifreli oturum ve kurumsal gizlilik standartlarıyla müşteri girişi.",
  },
];

const TICKERS = [
  { sym: "THYAO", mkt: "BIST", px: "312,40", ch: "+1,2%" },
  { sym: "AAPL", mkt: "US", px: "228,15", ch: "+0,4%" },
  { sym: "BTC", mkt: "Crypto", px: "64.820", ch: "−0,8%" },
  { sym: "XAU", mkt: "Gold", px: "2.418", ch: "+0,3%" },
];


export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="hram-landing">
      <header className={`hram-nav${scrolled ? " is-scrolled" : ""}`}>
        <div className="hram-nav__inner">
          <a href="#top" className="hram-wordmark" aria-label="HRAM">
            HRAM
          </a>
          <nav className="hram-nav__links" aria-label="Ana menü">
            <a href="#urunler">Ürünler</a>
            <a href="#markets">Piyasalar</a>
            <a href="#guvenlik">Güvenlik</a>
            <Link href="/destek">Destek</Link>
          </nav>
          <div className="hram-nav__actions">
            <Link href="/giris" className="hram-btn hram-btn--ghost">
              Giriş
            </Link>
            <Link href="/kayit" className="hram-btn hram-btn--solid">
              Hesap aç
            </Link>
          </div>
        </div>
      </header>

      <main id="top">
        <section className="hram-hero">
          <div className="hram-hero__grid" aria-hidden />
          <div className="hram-hero__inner">
            <p className="hram-eyebrow">Uluslararası piyasalar · Kurumsal altyapı</p>
            <h1>
              Küresel piyasalara
              <br />
              kurumsal erişim
            </h1>
            <p className="hram-hero__lead">
              HRAM; hisse, kripto, emtia ve döviz piyasalarına tek platformdan
              erişim sunan uluslararası bir aracılık deneyimidir. Zarif,
              hızlı ve güven odaklı.
            </p>
            <div className="hram-hero__ctas">
              <Link href="/kayit" className="hram-btn hram-btn--solid hram-btn--lg">
                Hesap aç
              </Link>
              <a href="#markets" className="hram-btn hram-btn--outline hram-btn--lg">
                Platformu keşfet
              </a>
            </div>
            <div className="hram-hero__visual" aria-hidden>
              <svg viewBox="0 0 640 220" fill="none" className="hram-chart">
                <defs>
                  <linearGradient id="hramFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#111" stopOpacity="0.14" />
                    <stop offset="100%" stopColor="#111" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path
                  d="M0 160 C60 150 90 90 140 100 C190 110 210 170 270 140 C330 110 360 40 420 55 C480 70 500 130 560 95 C600 75 620 60 640 50 L640 220 L0 220 Z"
                  fill="url(#hramFill)"
                />
                <path
                  d="M0 160 C60 150 90 90 140 100 C190 110 210 170 270 140 C330 110 360 40 420 55 C480 70 500 130 560 95 C600 75 620 60 640 50"
                  stroke="#111"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>
        </section>

        <section className="hram-trust" aria-label="Kapsanan piyasalar">
          <ul>
            {MARKETS.map((m) => (
              <li key={m.label}>
                <strong>{m.label}</strong>
                <span>{m.hint}</span>
              </li>
            ))}
          </ul>
        </section>

        <section id="urunler" className="hram-section">
          <div className="hram-section__head">
            <p className="hram-eyebrow">Ürünler</p>
            <h2>Kurumsal aracılık deneyimi</h2>
            <p>
              Interactive Brokers / Saxo tarzı sade bir arayüz; spekülatif
              fintech dilinden uzak, uluslararası standartlara yakın.
            </p>
          </div>
          <div className="hram-features">
            {FEATURES.map((f) => (
              <article key={f.title} className="hram-feature">
                <h3>{f.title}</h3>
                <p>{f.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="markets" className="hram-section hram-section--muted">
          <div className="hram-section__head">
            <p className="hram-eyebrow">Piyasalar</p>
            <h2>Örnek piyasa şeridi</h2>
            <p>
              Aşağıdaki fiyatlar yalnızca görsel amaçlıdır; gerçek zamanlı
              kotasyon değildir.
            </p>
          </div>
          <div className="hram-tickers">
            {TICKERS.map((t) => (
              <div key={t.sym} className="hram-ticker">
                <div className="hram-ticker__top">
                  <span className="hram-ticker__sym">{t.sym}</span>
                  <span className="hram-ticker__mkt">{t.mkt}</span>
                </div>
                <div className="hram-ticker__px">{t.px}</div>
                <div
                  className={`hram-ticker__ch${
                    t.ch.startsWith("−") || t.ch.startsWith("-")
                      ? " is-down"
                      : " is-up"
                  }`}
                >
                  {t.ch}
                </div>
              </div>
            ))}
          </div>
        </section>


        <section id="guvenlik" className="hram-section hram-section--dark">
          <div className="hram-section__head">
            <p className="hram-eyebrow hram-eyebrow--light">Güvenlik</p>
            <h2>Gizlilik ve kurumsal standartlar</h2>
            <p>
              Bağlantılar şifrelenir; verileriniz gizlilik politikamıza uygun
              işlenir. Demo ortamında gerçek düzenleyici lisans numarası
              iddiası yer almaz — uluslararası piyasalar erişimi sunan bir
              platform deneyimi olarak tasarlanmıştır.
            </p>
            <div className="hram-hero__ctas" style={{ marginTop: "1.5rem" }}>
              <Link href="/gizlilik" className="hram-btn hram-btn--outline-light">
                Gizlilik politikası
              </Link>
              <Link href="/destek" className="hram-btn hram-btn--ghost-light">
                Destek
              </Link>
            </div>
          </div>
        </section>

      </main>

      <footer className="hram-footer">
        <div className="hram-footer__inner">
          <span className="hram-wordmark">HRAM</span>
          <nav aria-label="Alt bilgi">
            <Link href="/gizlilik">Gizlilik</Link>
            <Link href="/destek">Destek</Link>
            <Link href="/giris">Giriş</Link>
            <Link href="/kayit">Hesap aç</Link>
          </nav>
          <details className="hram-footer__org">
            <summary>Kurumsal erişim</summary>
            <nav aria-label="Kurumsal">
              <Link href="/agent">Agent</Link>
              <Link href="/admin">Yönetim</Link>
            </nav>
          </details>
          <p>© 2026 HRAM. Tüm hakları saklıdır.</p>
        </div>
      </footer>
    </div>
  );
}
