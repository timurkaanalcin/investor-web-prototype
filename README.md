# llvadACC — Web Prototipi

Betterment tarzı otomatik yatırım uygulamasının tıklanabilir Next.js prototipi.

- **Ürün adı:** llvadACC  
- **Canlı / hedef alan adı:** [https://llvadacc.customer.org.tr](https://llvadacc.customer.org.tr)  
- Arayüz tamamen **Türkçe**; veriler mock’tur (gerçek banka / kimlik doğrulama yok).

> GitHub depo adı `nest-web-prototype` olarak kalabilir; uygulamadaki marka **llvadACC**’dir.

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

Kök alan adı (Vercel / llvadacc.customer.org.tr) — varsayılan `basePath` boş:

```bash
npm run build
```

GitHub Pages alt yolu için:

```bash
INVESTOR_BASE_PATH=/investor-web-prototype npm run build
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
| `/trade` | Trade |

## Teknoloji

- Next.js (App Router) + TypeScript
- Tailwind CSS
- SVG grafikler (ek chart kütüphanesi yok)
- `output: "export"` — statik export

## Marka & renkler

Nötr marka paleti (mavi kaldırıldı):

- Black `#111111` — logo, birincil CTA, aktif sekmeler (açık tema)
- White / gri — koyu tema CTA, toggle, vurgu çubukları
- Gold `#ffc729` — vurgu / rozet
- Cream `#f9f0e2` — açık tema arka planı
- Teal `#226d78` / `#26a69a` — pozitif getiri / Trade Al
- Red `#c44536` / `#ef5350` — tehlike / Trade Sat

Logo: serif **llvadACC**; arayüz: sans-serif.

## Not

Bu depo yalnızca ürün / UX prototipidir; yatırım tavsiyesi veya gerçek işlem sunmaz.
