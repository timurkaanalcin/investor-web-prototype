"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandLogo } from "./BrandLogo";
import {
  IconHistory,
  IconHome,
  IconInvest,
  IconTrade,
  IconUser,
} from "./Icons";

const NAV = [
  { href: "/", label: "Ana sayfa", icon: IconHome },
  { href: "/yatir", label: "Yatır", icon: IconInvest },
  { href: "/trade", label: "Trade", icon: IconTrade },
  { href: "/islemler", label: "İşlemler", icon: IconHistory },
  { href: "/profil", label: "Profil", icon: IconUser },
] as const;

export function DesktopSidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="desktop-sidebar hidden md:flex"
      aria-label="Ana menü"
    >
      <div className="px-5 pt-6 pb-4">
        <BrandLogo size="sm" />
      </div>
      <nav className="flex flex-1 flex-col gap-1 px-3 pb-6">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/"
              ? pathname === "/"
              : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
                active
                  ? "bg-sage-muted text-nest"
                  : "text-nest/80 hover:bg-beige hover:text-nest"
              }`}
            >
              <Icon size={20} />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
      <p className="px-5 pb-5 text-[10px] leading-relaxed text-muted">
        Prototip · mock veri
      </p>
    </aside>
  );
}
