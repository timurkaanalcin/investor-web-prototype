# Nest — Web Prototipi

Betterment tarzı otomatik yatırım uygulamasının tıklanabilir Next.js prototipi. Tüm arayüz Türkçe’dir; veriler mock’tur (gerçek banka / kimlik doğrulama yok).

## Özellikler

- **Dashboard** — bakiye, aylık getiri, grafik, hedefler, portföy özeti
- **Onboarding** — hedef seçimi, risk kaydırıcısı, önerilen portföy
- **Yatır** — otomatik katkı, hemen yatır, dağılım çubuğu, varlıklar
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

## Marka

- Ana renk: `#1B4332` (orman yeşili)
- Vurgu: sage yeşili
- Arka plan: kırık beyaz
- Logo: serif; arayüz: sans-serif

## Not

Bu depo yalnızca ürün / UX prototipidir; yatırım tavsiyesi veya gerçek işlem sunmaz.
