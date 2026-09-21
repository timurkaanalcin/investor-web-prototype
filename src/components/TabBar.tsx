"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconHome, IconInvest, IconTarget, IconTrade, IconUser } from "./Icons";

const TABS = [
  { href: "/", label: "Ana sayfa", icon: IconHome },
  { href: "/yatir", label: "Yatır", icon: IconInvest },
  { href: "/trade", label: "Trade", icon: IconTrade },
  { href: "/hedefler", label: "Hedefler", icon: IconTarget },
  { href: "/profil", label: "Profil", icon: IconUser },
];

export function TabBar() {
  const pathname = usePathname();

  return (
    <nav className="sticky bottom-0 z-20 border-t border-black/5 bg-card/95 backdrop-blur-md px-1 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1.5">
      <ul className="flex items-stretch justify-around">
        {TABS.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/"
              ? pathname === "/"
              : pathname.startsWith(href);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                className={`flex flex-col items-center gap-0.5 rounded-2xl px-1 py-1.5 text-[10px] font-medium transition-colors ${
                  active
                    ? "bg-sage-muted text-nest-blue"
                    : "text-muted hover:text-nest-blue"
                }`}
              >
                <Icon size={20} />
                <span>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
