import type { Metadata, Viewport } from "next";
import { DM_Sans, Libre_Baskerville } from "next/font/google";
import { AppChrome } from "@/components/AppChrome";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const libre = Libre_Baskerville({
  variable: "--font-libre",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const siteUrl = "https://investor.customer.org.tr";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Investor — Otomatik yatırım",
  description:
    "Investor web prototipi: Betterment tarzı otomatik yatırım uygulaması (mock veri).",
  applicationName: "Investor",
  openGraph: {
    title: "Investor — Otomatik yatırım",
    description:
      "Betterment tarzı otomatik yatırım prototipi. Türkçe arayüz, mock veri.",
    url: siteUrl,
    siteName: "Investor",
    locale: "tr_TR",
    type: "website",
  },
  alternates: {
    canonical: siteUrl,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#111111",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <body
        className={`${dmSans.variable} ${libre.variable} antialiased`}
        suppressHydrationWarning
      >
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{var d=localStorage.getItem('investor_dark_mode');var t=localStorage.getItem('investor_trade_theme');var on=d==='1'||(d!=='0'&&t==='dark');localStorage.setItem('investor_dark_mode',on?'1':'0');localStorage.setItem('investor_trade_theme',on?'dark':'light');document.documentElement.classList.toggle('dark',on);document.body.classList.toggle('dark',on);}catch(e){}})();",
          }}
        />
        <AppChrome>{children}</AppChrome>
      </body>
    </html>
  );
}
