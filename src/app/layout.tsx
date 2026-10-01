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

const siteUrl =
  process.env.HRAM_SITE_URL?.replace(/\/$/, "") ||
  "https://hram.tr";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "HRAM — Uluslararası piyasalar",
  description:
    "HRAM: hisse, kripto, emtia ve döviz piyasalarına kurumsal erişim. Siyah / beyaz / gri kurumsal platform.",
  applicationName: "HRAM",
  openGraph: {
    title: "HRAM — Uluslararası piyasalar",
    description:
      "Hisse, kripto, emtia ve döviz. Kurumsal aracılık deneyimi.",
    url: siteUrl,
    siteName: "HRAM",
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
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f5f5" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
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
              "(function(){try{function m(o,n){if(localStorage.getItem(n)==null){var v=localStorage.getItem(o);if(v!=null)localStorage.setItem(n,v);}}[['investor_dark_mode','hram_dark_mode'],['investor_trade_theme','hram_trade_theme'],['investor_auth_user','hram_auth_user'],['investor_auth_users','hram_auth_users'],['investor_onboarding_complete','hram_onboarding_complete'],['investor_balance_delta','hram_balance_delta'],['investor_money_requests','hram_money_requests'],['investor_notifications_feed','hram_notifications_feed']].forEach(function(p){m(p[0],p[1]);});var d=localStorage.getItem('hram_dark_mode');var t=localStorage.getItem('hram_trade_theme');var on=d==='1'||(d!=='0'&&t==='dark');localStorage.setItem('hram_dark_mode',on?'1':'0');localStorage.setItem('hram_trade_theme',on?'dark':'light');document.documentElement.classList.toggle('dark',on);document.body.classList.toggle('dark',on);}catch(e){}})();",
          }}
        />
        <AppChrome>{children}</AppChrome>
      </body>
    </html>
  );
}
