import Link from "next/link";

export const metadata = {
  title: "Gizlilik Politikası | HRAM",
  description: "HRAM uygulaması için Türkçe gizlilik politikası.",
};

export default function GizlilikPage() {
  return (
    <main className="public-page">
      <div className="public-page__header">
        <Link href="/" className="public-page__brand" aria-label="HRAM ana sayfa">
          HRAM
        </Link>
        <Link href="/destek" className="public-page__link">Destek</Link>
      </div>
      <article className="public-page__card">
        <p className="public-page__eyebrow">HRAM • Yasal bilgiler</p>
        <h1>Gizlilik Politikası</h1>
        <p className="public-page__lead">
          Bu politika, HRAM mobil uygulamasını ve hram.tr web sitesini kullanırken
          bilgilerinizin nasıl işlendiğini açıklar.
        </p>
        <p className="public-page__updated">Son güncelleme: 27 Eylül 2026</p>

        <h2>1. Veri sorumlusu</h2>
        <p>
          HRAM, kişisel verilerin korunmasına önem verir. Veri sorumlusu ve
          iletişim bilgileri için <Link href="/destek">Destek</Link> sayfasını
          kullanabilirsiniz.
        </p>

        <h2>2. İşlenen bilgiler</h2>
        <p>
          Hesap oluşturma ve uygulamayı kullanma sırasında ad, e-posta adresi,
          iletişim bilgileri, yatırım hedefleri, risk tercihleriniz ve uygulama
          içindeki işlem/portföy kayıtlarınız işlenebilir. Destek talebi
          gönderdiğinizde paylaştığınız mesaj ve iletişim bilgileri de kaydedilir.
        </p>
        <p>
          Ödeme veya yatırım hesabı bilgileri, ilgili hizmetin güvenli ve yetkili
          sağlayıcıları tarafından işlenebilir. HRAM, gerekli olmadıkça tam kart
          numarası gibi hassas ödeme bilgilerini saklamaz.
        </p>

        <h2>3. Kullanım amaçları ve hukuki sebepler</h2>
        <p>
          Veriler; hesabınızı oluşturmak ve hizmeti sunmak, güvenliği sağlamak,
          müşteri desteği vermek, yasal yükümlülükleri yerine getirmek, hizmeti
          geliştirmek ve açık rızanız olduğunda bilgilendirme göndermek için
          işlenir. Veriler yalnızca bu amaçlarla ve ölçülü şekilde kullanılır.
        </p>

        <h2>4. Saklama ve güvenlik</h2>
        <p>
          Bilgiler, amaç için gerekli süre boyunca ve yürürlükteki mevzuatın
          öngördüğü saklama sürelerine uygun olarak tutulur. Yetkisiz erişimi,
          kaybı ve kötüye kullanımı önlemek için teknik ve idari güvenlik
          önlemleri uygulanır. İnternet üzerinden hiçbir aktarımın tamamen
          risksiz olduğu garanti edilemez.
        </p>

        <h2>5. Paylaşım ve hizmet sağlayıcılar</h2>
        <p>
          Veriler; barındırma, teknik altyapı, kimlik doğrulama, analiz ve destek
          hizmeti sağlayan, yalnızca talimatlarımız doğrultusunda çalışan
          tedarikçilerle sınırlı olarak paylaşılabilir. Kanunen yetkili kamu
          kurumları veya güvenliğin korunması gereken durumlar bunun dışındadır.
          Veriler satılmaz.
        </p>

        <h2>6. Haklarınız</h2>
        <p>
          Kişisel verilerinize erişme, düzeltme, silme, işlenmesini kısıtlama,
          itiraz etme ve mevzuatın izin verdiği ölçüde veri taşınabilirliği
          taleplerinizi iletebilirsiniz. Talepleriniz için
          <a href="mailto:destek@hram.tr"> destek@hram.tr</a> adresine yazın;
          kimlik doğrulaması gerekebilir.
        </p>

        <h2>7. Çerezler ve değişiklikler</h2>
        <p>
          Web sitesinde oturum, güvenlik ve tercihleri hatırlamak için gerekli
          çerezler veya benzer yerel depolama teknolojileri kullanılabilir. Bu
          politika güncellendiğinde yeni sürüm bu sayfada yayımlanır.
        </p>

        <h2>8. Yatırım riski bildirimi</h2>
        <p>
          HRAM bir finansal eğitim ve yatırım takip aracıdır; yatırım tavsiyesi,
          getiri garantisi veya mevduat/sermaye piyasası hizmeti sunmaz. Yatırım
          kararları size aittir ve kayıp riski içerir.
        </p>

        <p className="public-page__footer-link">
          Sorularınız için <Link href="/destek">HRAM Destek</Link> sayfasını ziyaret edin.
        </p>
      </article>
    </main>
  );
}
