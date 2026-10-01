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
  IconTerminal,
  IconPositions,
  IconBlotter,
  IconRisk,
} from "./CrmIcons";

const NAV: {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  badge?: "support" | "money";
  perm?: string;
  adminOnly?: boolean;
  group?: string;
}[] = [
  { href: "/admin/dashboard/", label: "Gösterge", icon: IconDash, group: "desk" },
  { href: "/admin/terminal/", label: "İşlem Terminali", icon: IconTerminal, perm: "terminal", group: "trade" },
  { href: "/admin/positions/", label: "Pozisyonlar", icon: IconPositions, perm: "terminal", group: "trade" },
  { href: "/admin/blotter/", label: "Emir Defteri", icon: IconBlotter, perm: "transactions", adminOnly: true, group: "trade" },
  { href: "/admin/risk/", label: "Risk", icon: IconRisk, perm: "risk", adminOnly: true, group: "trade" },
  { href: "/admin/customers/", label: "Müşteriler", icon: IconUsers, perm: "customers", group: "crm" },
  { href: "/admin/chat/", label: "Sohbet", icon: IconChat, badge: "support", perm: "chat", group: "crm" },
  { href: "/admin/tickets/", label: "Biletler", icon: IconTicket, perm: "tickets", group: "crm" },
  { href: "/admin/transactions/", label: "İşlemler", icon: IconTx, perm: "transactions", adminOnly: true, group: "crm" },
  { href: "/admin/desks/", label: "Masalar", icon: IconBuilding, perm: "desks", group: "crm" },
  { href: "/admin/employees/", label: "Çalışanlar", icon: IconEmployee, perm: "employees", adminOnly: true, group: "ops" },
  { href: "/admin/money/", label: "Para talepleri", icon: IconMoney, badge: "money", perm: "money", adminOnly: true, group: "ops" },
  { href: "/admin/referrals/", label: "Referans", icon: IconTag, perm: "referrals", adminOnly: true, group: "ops" },
  { href: "/admin/analytics/", label: "Analitik", icon: IconChart, perm: "analytics", adminOnly: true, group: "ops" },
  { href: "/admin/settings/", label: "Ayarlar", icon: IconSettings, perm: "settings", adminOnly: true, group: "ops" },
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

  let lastGroup = "";

  return (
    <aside className="flex h-full w-[200px] shrink-0 flex-col border-r border-black/10 bg-white text-black">
      <div className="flex h-11 items-center gap-2 border-b border-black/10 px-3">
        <div className="flex h-7 w-7 items-center justify-center rounded bg-black text-white">
          <IconWorkflow size={14} />
        </div>
        <div className="min-w-0 leading-tight">
          <p className="truncate text-[12px] font-bold text-black">HRAM Desk</p>
          <p className="truncate text-[9px] uppercase tracking-wider text-neutral-500">
            {session?.role || "Broker"}
          </p>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto px-1.5 py-1.5">
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
          const showGroup =
            item.group && item.group !== lastGroup
              ? ((lastGroup = item.group), true)
              : false;
          return (
            <div key={item.href}>
              {showGroup && item.group !== "desk" && (
                <p className="mb-0.5 mt-2 px-2 text-[9px] font-semibold uppercase tracking-wider text-neutral-400">
                  {item.group === "trade"
                    ? "İşlem"
                    : item.group === "crm"
                      ? "CRM"
                      : "Operasyon"}
                </p>
              )}
              <Link
                href={item.href}
                onClick={onNavigate}
                className={`flex h-[30px] items-center gap-2 rounded px-2 text-[12px] transition ${
                  active
                    ? "bg-black text-white"
                    : "text-black hover:bg-neutral-100"
                }`}
              >
                <Icon
                  size={14}
                  className={active ? "text-white/80" : "text-neutral-500"}
                />
                <span className="flex-1 truncate">{item.label}</span>
                {badge > 0 && (
                  <span
                    className={`inline-flex min-w-[16px] justify-center rounded-full px-1 text-[9px] font-bold ${
                      active ? "bg-white text-black" : "bg-neutral-800 text-white"
                    }`}
                  >
                    {badge}
                  </span>
                )}
              </Link>
            </div>
          );
        })}
      </nav>
      <div className="border-t border-black/10 px-2.5 py-2 text-[9px] text-neutral-500">
        {session?.permissions?.includes("shift") && (
          <p className="mb-0.5 font-semibold uppercase tracking-wide text-black">
            Shift
          </p>
        )}
        Prototip · LS · TV Desk
      </div>
    </aside>
  );
}
