# Investor — Web Prototipi

Betterment tarzı otomatik yatırım uygulamasının tıklanabilir Next.js prototipi.

- **Ürün adı:** Investor  
- **Canlı / hedef alan adı:** [https://investor.customer.org.tr](https://investor.customer.org.tr)  
- Arayüz tamamen **Türkçe**; veriler mock’tur (gerçek banka / kimlik doğrulama yok).

> GitHub depo adı `nest-web-prototype` olarak kalabilir; uygulamadaki marka **Investor**’dır.

## Özellikler

- **Dashboard** — bakiye, aylık getiri, grafik, hedefler, portföy özeti
- **Onboarding** — hedef seçimi, risk kaydırıcısı, önerilen portföy
- **Yatır** — otomatik katkı, hemen yatır, dağılım çubuğu, varlıklar
- **Trade** — kendi yönettiğin hisse/ETF al-sat (arama, pozisyonlar, Al/Sat emri, vergi etkisi önizleme, kesirli hisse; mock)
- **Hedefler** — öne çıkan acil fon, tatil, ev peşinatı
- **Profil** — Ayşe Yılmaz, ayarlar, karanlık mod, çıkış

Onboarding tamamlanınca durum `localStorage` içinde saklanır. Profil’den **Çıkış yap** ile sıfırlanır.

## Gereksinimler

- Node.js 18+
- npm

## Çalıştırma

```bash
npm install
npm run dev
```

Tarayıcıda [http://localhost:3000](http://localhost:3000) adresini açın.

## Derleme

```bash
npm run build
npm start
```

## Rotalar

| Rota | Açıklama |
|------|----------|
| `/onboarding` | Hedef ve risk seçimi |
| `/onboarding/onerilen` | Önerilen portföy (70/20/10) |
| `/` | Ana sayfa (dashboard) |
| `/yatir` | Yatırım ve portföy |
| `/hedefler` | Hedefler |
| `/profil` | Profil ve ayarlar |

## Teknoloji

- Next.js (App Router) + TypeScript
- Tailwind CSS
- SVG grafikler (ek chart kütüphanesi yok)

## Marka & renkler

Betterment.com resmi token’ları:

- Navy `#000b50` — logo, koyu paneller, öne çıkan hedef kartı
- Blue `#1d6ae5` — birincil CTA, aktif sekmeler
- Gold `#ffc729` — vurgu / rozet
- Cream `#f9f0e2` — sayfa arka planı
- Teal `#226d78` — pozitif getiri

Logo: serif **Investor**; arayüz: sans-serif.

## Not

Bu depo yalnızca ürün / UX prototipidir; yatırım tavsiyesi veya gerçek işlem sunmaz.
