"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { openThreadCount } from "@/lib/live-support";
import { getMoneyRequests } from "@/lib/money-requests";
import { useEffect, useMemo, useState } from "react";
import {
  hasCrmPermission,
  isFullCrmAdmin,
  type CrmSession,
} from "@/lib/crm/data";
import {
  IconDash,
  IconUsers,
  IconChat,
  IconTicket,
  IconTx,
  IconBuilding,
  IconEmployee,
  IconMoney,
  IconTag,
  IconChart,
  IconSettings,
  IconWorkflow,
} from "./CrmIcons";

const NAV: {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  badge?: "support" | "money";
  /** Required permission; admin/pin always sees all. Dashboard always shown. */
  perm?: string;
  adminOnly?: boolean;
}[] = [
  { href: "/admin/dashboard/", label: "Gösterge Paneli", icon: IconDash },
  { href: "/admin/customers/", label: "Müşteriler", icon: IconUsers, perm: "customers" },
  { href: "/admin/chat/", label: "Sohbet", icon: IconChat, badge: "support", perm: "chat" },
  { href: "/admin/tickets/", label: "Biletler", icon: IconTicket, perm: "tickets" },
  { href: "/admin/transactions/", label: "İşlemler", icon: IconTx, perm: "transactions", adminOnly: true },
  { href: "/admin/desks/", label: "Masalar", icon: IconBuilding, perm: "desks" },
  { href: "/admin/employees/", label: "Çalışanlar", icon: IconEmployee, perm: "employees", adminOnly: true },
  { href: "/admin/money/", label: "Para talepleri", icon: IconMoney, badge: "money", perm: "money", adminOnly: true },
  { href: "/admin/referrals/", label: "Referans", icon: IconTag, perm: "referrals", adminOnly: true },
  { href: "/admin/analytics/", label: "Analitik", icon: IconChart, perm: "analytics", adminOnly: true },
  { href: "/admin/settings/", label: "Ayarlar", icon: IconSettings, perm: "settings", adminOnly: true },
];

function normalize(path: string): string {
  if (!path.endsWith("/")) return `${path}/`;
  return path;
}

export function CrmSidebar({
  onNavigate,
  session,
}: {
  onNavigate?: () => void;
  session?: CrmSession | null;
}) {
  const pathname = usePathname();
  const current = normalize(pathname || "/admin/");
  const [supportBadge, setSupportBadge] = useState(0);
  const [moneyBadge, setMoneyBadge] = useState(0);
  const fullAdmin = isFullCrmAdmin(session ?? null);

  const visibleNav = useMemo(() => {
    return NAV.filter((item) => {
      if (!item.perm && !item.adminOnly) return true;
      if (fullAdmin) return true;
      if (item.adminOnly) return false;
      if (item.perm) return hasCrmPermission(session ?? null, item.perm);
      return true;
    });
  }, [session, fullAdmin]);

  useEffect(() => {
    const refresh = () => {
      setSupportBadge(openThreadCount());
      setMoneyBadge(
        getMoneyRequests().filter(
          (r) => r.status === "ai_reviewed" || r.status === "pending_ai",
        ).length,
      );
    };
    refresh();
    const iv = window.setInterval(refresh, 2500);
    return () => window.clearInterval(iv);
  }, []);

  return (
    <aside className="flex h-full w-60 shrink-0 flex-col border-r border-black/10 bg-white text-black">
      <div className="flex items-center gap-2 border-b border-black/10 px-4 py-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-black text-white">
          <IconWorkflow size={18} />
        </div>
        <div>
          <p className="text-sm font-bold text-black">HRAM CRM</p>
          <p className="text-[10px] uppercase tracking-wider text-neutral-500">
            {session?.role || "Broker Desk"}
          </p>
        </div>
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto p-2">
        {visibleNav.map((item) => {
          const active =
            current === item.href ||
            (item.href !== "/admin/dashboard/" && current.startsWith(item.href));
          const Icon = item.icon;
          const badge =
            item.badge === "support"
              ? supportBadge
              : item.badge === "money"
                ? moneyBadge
                : 0;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm transition ${
                active
                  ? "bg-black text-white"
                  : "text-black hover:bg-neutral-100"
              }`}
            >
              <Icon
                size={16}
                className={active ? "text-white/80" : "text-neutral-500"}
              />
              <span className="flex-1">{item.label}</span>
              {badge > 0 && (
                <span
                  className={`inline-flex min-w-5 justify-center rounded-full px-1.5 text-[10px] font-bold ${
                    active ? "bg-white text-black" : "bg-neutral-800 text-white"
                  }`}
                >
                  {badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-black/10 px-3 py-3 text-[10px] text-neutral-500">
        {session?.permissions?.includes("shift") && (
          <p className="mb-1 font-semibold uppercase tracking-wide text-black">
            Shift yetkisi
          </p>
        )}
        Prototip · localStorage · Prisma yok
      </div>
    </aside>
  );
}
