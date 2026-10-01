import Link from "next/link";

export const metadata = {
  title: "Destek | HRAM",
  description: "HRAM uygulaması için destek ve iletişim bilgileri.",
};

export default function DestekPage() {
  return (
    <main className="public-page public-page--short">
      <div className="public-page__header">
        <Link href="/" className="public-page__brand" aria-label="HRAM ana sayfa">
          HRAM
        </Link>
        <Link href="/gizlilik" className="public-page__link">Gizlilik</Link>
      </div>
      <article className="public-page__card">
        <p className="public-page__eyebrow">HRAM • Yardım merkezi</p>
        <h1>Destek</h1>
        <p className="public-page__lead">
          HRAM uygulaması, hesabınız veya gizlilik haklarınız hakkında desteğe
          ihtiyacınız varsa bize ulaşın.
        </p>
        <div className="public-page__contact">
          <span className="public-page__contact-label">E-posta</span>
          <a href="mailto:destek@hram.tr">destek@hram.tr</a>
        </div>
        <p>
          Mesajınızda kullandığınız e-posta adresini ve sorununuzu kısaca
          belirtirseniz size daha hızlı yardımcı olabiliriz. Finansal kararlar
          hakkında kişiye özel yatırım tavsiyesi vermiyoruz.
        </p>
        <p className="public-page__footer-link">
          <Link href="/gizlilik">Gizlilik Politikası</Link>
        </p>
      </article>
    </main>
  );
}
