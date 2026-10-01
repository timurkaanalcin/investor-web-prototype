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
import { NotificationsPanel, useUnreadCount } from "./NotificationsPanel";
import { getDarkMode, setDarkMode } from "@/lib/storage";

const NAV = [
  { href: "/panel", label: "Ana sayfa", icon: IconHome },
  { href: "/yatir", label: "Yatır", icon: IconInvest },
  { href: "/trade", label: "Trade", icon: IconTrade },
  { href: "/islemler", label: "İşlemler", icon: IconHistory },
  { href: "/profil", label: "Profil", icon: IconUser },
] as const;

export function DesktopSidebar() {
  const pathname = usePathname();
  const [dark, setDark] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [notifOpen, setNotifOpen] = useState(false);
  const unread = useUnreadCount();

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
            href === "/panel"
              ? pathname === "/panel" || pathname.startsWith("/panel/")
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
            onClick={() => setNotifOpen(true)}
            aria-label="Bildirimler"
          >
            <IconBell size={16} />
            <span>Bildirimler</span>
            {unread > 0 && (
              <span className="sidebar-util-hint rounded-full bg-danger px-1.5 py-0.5 text-[10px] font-bold text-white opacity-100">
                {unread > 9 ? "9+" : unread}
              </span>
            )}
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
            href="/admin"
            className="sidebar-util"
            aria-label="Admin"
          >
            <IconSettings size={16} />
            <span>Admin</span>
            <span className="sidebar-util-hint">PIN</span>
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

      <NotificationsPanel open={notifOpen} onClose={() => setNotifOpen(false)} />
    </aside>
  );
}
