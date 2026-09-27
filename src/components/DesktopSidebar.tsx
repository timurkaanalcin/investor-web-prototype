"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { BrandLogo } from "./BrandLogo";
import {
  IconBell,
  IconHelp,
  IconHistory,
  IconHome,
  IconInvest,
  IconMoon,
  IconSettings,
  IconSun,
  IconTrade,
  IconUser,
} from "./Icons";
import {
  getDarkMode,
  getNotifications,
  setDarkMode,
  setNotifications,
} from "@/lib/storage";

const NAV = [
  { href: "/", label: "Ana sayfa", icon: IconHome },
  { href: "/yatir", label: "Yatır", icon: IconInvest },
  { href: "/trade", label: "Trade", icon: IconTrade },
  { href: "/islemler", label: "İşlemler", icon: IconHistory },
  { href: "/profil", label: "Profil", icon: IconUser },
] as const;

export function DesktopSidebar() {
  const pathname = usePathname();
  const [dark, setDark] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    setDark(getDarkMode());
  }, [pathname]);

  function flash(msg: string) {
    setToast(msg);
    window.setTimeout(() => setToast(null), 1600);
  }

  function toggleTheme() {
    const next = !dark;
    setDark(next);
    setDarkMode(next);
    flash(next ? "Koyu tema" : "Aydınlık tema");
  }

  function toggleNotif() {
    const next = !getNotifications();
    setNotifications(next);
    flash(next ? "Bildirimler açıldı" : "Bildirimler kapalı");
  }

  return (
    <aside
      className="desktop-sidebar hidden md:flex"
      aria-label="Ana menü"
    >
      <div className="sidebar-brand px-5 pt-6 pb-4">
        <BrandLogo size="sm" />
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 px-3 pb-2">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/"
              ? pathname === "/"
              : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`sidebar-link ${active ? "is-active" : ""}`}
            >
              <Icon size={20} />
              <span>{label}</span>
            </Link>
          );
        })}

        <div className="sidebar-utils" role="group" aria-label="Kısayollar">
          <button
            type="button"
            className="sidebar-util"
            onClick={toggleTheme}
            aria-label={dark ? "Aydınlık temaya geç" : "Koyu temaya geç"}
            aria-pressed={dark}
          >
            {dark ? <IconSun size={16} /> : <IconMoon size={16} />}
            <span>Tema</span>
            <span className="sidebar-util-hint">
              {dark ? "Koyu" : "Aydınlık"}
            </span>
          </button>

          <button
            type="button"
            className="sidebar-util"
            onClick={toggleNotif}
            aria-label="Bildirimler"
          >
            <IconBell size={16} />
            <span>Bildirimler</span>
          </button>

          <Link
            href="/profil"
            className="sidebar-util"
            aria-label="Yardım"
          >
            <IconHelp size={16} />
            <span>Yardım</span>
          </Link>

          <Link
            href="/profil"
            className="sidebar-util"
            aria-label="Ayarlar"
          >
            <IconSettings size={16} />
            <span>Ayarlar</span>
          </Link>
        </div>
      </nav>

      <p className="sidebar-footer px-5 pb-5 text-[10px] leading-relaxed">
        Prototip · mock veri
      </p>

      {toast && (
        <div className="sidebar-toast" role="status" aria-live="polite">
          {toast}
        </div>
      )}
    </aside>
  );
}
