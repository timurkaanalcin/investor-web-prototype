"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { listAuthAccounts } from "@/lib/storage";
import {
  getMoneyRequests,
  methodLabel,
  statusLabel,
} from "@/lib/money-requests";
import { openThreadCount } from "@/lib/live-support";
import {
  formatTry,
  getCrmDashboardStats,
  getCrmDesks,
  getCrmTickets,
  type CrmDesk,
  type CrmTicket,
} from "@/lib/crm/data";
import { formatTRY } from "@/lib/mock-data";
import {
  formatTryMono,
  getDeskPositions,
  getTradeBlotter,
  subscribeDeskPositions,
  summarizePositions,
  type DeskPosition,
} from "@/lib/crm/terminal";
import type { StoredTx } from "@/lib/storage";

function Spark({ values }: { values: number[] }) {
  const max = Math.max(...values, 1);
  return (
    <div className="crm-spark" aria-hidden>
      {values.map((v, i) => (
        <span
          key={i}
          style={{ height: `${Math.max(8, (v / max) * 100)}%` }}
        />
      ))}
    </div>
  );
}

export default function CrmDashboardPage() {
  const [stats, setStats] = useState<ReturnType<typeof getCrmDashboardStats> | null>(null);
  const [desks, setDesks] = useState<CrmDesk[]>([]);
  const [tickets, setTickets] = useState<CrmTicket[]>([]);
  const [recentMoney, setRecentMoney] = useState<
    ReturnType<typeof getMoneyRequests>
  >([]);
  const [supportOpen, setSupportOpen] = useState(0);
  const [positions, setPositions] = useState<DeskPosition[]>([]);
  const [fills, setFills] = useState<StoredTx[]>([]);
  const [openMoney, setOpenMoney] = useState(0);

  useEffect(() => {
    function refresh() {
      const customers = listAuthAccounts().length;
      const money = getMoneyRequests();
      const om = money.filter(
        (r) => r.status === "ai_reviewed" || r.status === "pending_ai",
      ).length;
      setOpenMoney(om);
      const depositSumApproved = money
        .filter((r) => r.type === "deposit" && r.status === "approved")
        .reduce((s, r) => s + r.amount, 0);
      const openSupport = openThreadCount();
      setSupportOpen(openSupport);
      setStats(
        getCrmDashboardStats({
          customers,
          openSupport,
          openMoney: om,
          depositSumApproved,
        }),
      );
      setDesks(getCrmDesks());
      setTickets(getCrmTickets().slice(0, 6));
      setRecentMoney(money.slice(0, 6));
      setPositions(getDeskPositions());
      setFills(getTradeBlotter().slice(0, 8));
    }
    refresh();
    const unsub = subscribeDeskPositions(refresh);
    const iv = window.setInterval(refresh, 3000);
    return () => {
      unsub();
      window.clearInterval(iv);
    };
  }, []);

  const posSummary = useMemo(() => summarizePositions(positions), [positions]);
  const sparkVol = useMemo(() => {
    const base = [12, 18, 14, 22, 19, 28, 24, 31, 27, 35];
    return base.map((b, i) => b + (fills[i]?.amount || 0) / 5000);
  }, [fills]);

  if (!stats) {
    return <p className="text-sm text-neutral-500">Yükleniyor…</p>;
  }

  const kpis = [
    {
      label: "Müşteriler",
      value: String(stats.customers),
      hint: `${stats.leads} lead (mock+)`,
      href: "/admin/customers/",
    },
    {
      label: "Açık pozisyon",
      value: String(posSummary.openCount),
      hint: formatTryMono(posSummary.exposureTry, 0),
      href: "/admin/positions/",
    },
    {
      label: "Net K/Z",
      value: formatTryMono(posSummary.unrealizedPlTry),
      hint: "Gerçekleşmemiş",
      href: "/admin/terminal/",
      pl: posSummary.unrealizedPlTry,
    },
    {
      label: "Bekleyen yatırma",
      value: String(openMoney),
      hint: formatTry(stats.depositSum),
      href: "/admin/money/",
    },
    {
      label: "Canlı destek",
      value: String(supportOpen),
      hint: "Açık sohbet",
      href: "/admin/chat/",
    },
  ];

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="mb-2 rounded border border-amber-200 bg-amber-50 px-2 py-1 text-[11px] text-amber-900">Prototip CRM — localStorage mock; gerçek CRM değildir.</p>
      <h1 className="text-[15px] font-bold text-black">Gösterge Paneli</h1>
          <p className="text-[11px] text-neutral-500">{stats.mockNote}</p>
        </div>
        <Link
          href="/admin/terminal/"
          className="h-8 rounded bg-black px-3 text-[11px] font-semibold leading-8 text-white"
        >
          İşlem Terminali →
        </Link>
      </div>

      <div className="mb-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
        {kpis.map((c) => (
          <Link key={c.label} href={c.href} className="crm-kpi rounded block hover:bg-neutral-50">
            <p className="label">{c.label}</p>
            <p
              className={`value tv-mono ${
                "pl" in c && typeof c.pl === "number"
                  ? c.pl >= 0
                    ? "crm-pl-pos"
                    : "crm-pl-neg"
                  : ""
              }`}
            >
              {c.value}
            </p>
            <p className="mt-1 text-[10px] text-neutral-500">{c.hint}</p>
            {c.label === "Açık pozisyon" && <Spark values={sparkVol} />}
          </Link>
        ))}
      </div>

      <div className="grid gap-2 lg:grid-cols-3">
        <section className="crm-panel overflow-hidden rounded lg:col-span-2">
          <div className="flex items-center justify-between border-b border-black/10 px-3 py-2">
            <h2 className="text-[12px] font-bold">Son işlemler</h2>
            <Link href="/admin/blotter/" className="text-[10px] underline">
              Emir defteri
            </Link>
          </div>
          <table className="crm-dense-table">
            <thead>
              <tr>
                <th>Zaman</th>
                <th>Sembol</th>
                <th>Yön</th>
                <th>Tutar</th>
                <th>Not</th>
              </tr>
            </thead>
            <tbody>
              {fills.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-neutral-500">
                    Henüz trade fill yok
                  </td>
                </tr>
              )}
              {fills.map((f) => (
                <tr key={f.id}>
                  <td className="tv-mono text-[10px]">{f.date}</td>
                  <td className="tv-mono font-bold">{f.symbol || "—"}</td>
                  <td
                    className={`text-[11px] font-bold ${
                      f.side === "buy" ? "crm-pl-pos" : "crm-pl-neg"
                    }`}
                  >
                    {f.side === "buy" ? "Al" : "Sat"}
                  </td>
                  <td className="tv-mono">{formatTryMono(f.amount, 0)}</td>
                  <td className="max-w-[160px] truncate text-[10px] text-neutral-500">
                    {f.subtitle || f.title}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="crm-panel overflow-hidden rounded">
          <div className="border-b border-black/10 px-3 py-2">
            <h2 className="text-[12px] font-bold">Uyarı / akış</h2>
          </div>
          <ul className="divide-y divide-black/5 text-[11px]">
            {supportOpen > 0 && (
              <li className="px-3 py-2">
                <Link href="/admin/chat/" className="font-semibold underline">
                  {supportOpen} açık destek sohbeti
                </Link>
              </li>
            )}
            {openMoney > 0 && (
              <li className="px-3 py-2">
                <Link href="/admin/money/" className="font-semibold underline">
                  {openMoney} bekleyen para talebi
                </Link>
              </li>
            )}
            {tickets
              .filter((t) => t.status === "Open")
              .slice(0, 4)
              .map((t) => (
                <li key={t.id} className="px-3 py-2">
                  <span className="font-semibold">{t.title}</span>
                  <span className="text-neutral-500"> · {t.type}</span>
                </li>
              ))}
            {supportOpen === 0 && openMoney === 0 && tickets.every((t) => t.status !== "Open") && (
              <li className="px-3 py-6 text-center text-neutral-500">
                Aktif uyarı yok
              </li>
            )}
          </ul>
        </section>

        <section className="crm-panel overflow-hidden rounded">
          <div className="flex items-center justify-between border-b border-black/10 px-3 py-2">
            <h2 className="text-[12px] font-bold">Masalar</h2>
            <Link href="/admin/desks/" className="text-[10px] underline">
              Tümü
            </Link>
          </div>
          <ul className="divide-y divide-black/5">
            {desks.map((d) => (
              <li
                key={d.id}
                className="flex items-center justify-between px-3 py-2"
              >
                <div>
                  <p className="text-[12px] font-semibold">{d.name}</p>
                  <p className="text-[10px] text-neutral-500">
                    {d.type} · {d.leadCount} lead
                  </p>
                </div>
                <span className="tv-mono text-[12px] font-semibold">
                  {formatTry(d.depositSum)}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="crm-panel overflow-hidden rounded lg:col-span-2">
          <div className="flex items-center justify-between border-b border-black/10 px-3 py-2">
            <h2 className="text-[12px] font-bold">Son para talepleri</h2>
            <Link href="/admin/money/" className="text-[10px] underline">
              Tümü
            </Link>
          </div>
          <table className="crm-dense-table">
            <thead>
              <tr>
                <th>Tür</th>
                <th>Tutar</th>
                <th>Yöntem</th>
                <th>Durum</th>
                <th>Zaman</th>
              </tr>
            </thead>
            <tbody>
              {recentMoney.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-neutral-500">
                    Talep yok
                  </td>
                </tr>
              )}
              {recentMoney.map((r) => (
                <tr key={r.id}>
                  <td className="text-[11px] font-semibold">
                    {r.type === "deposit" ? "Yatırma" : "Çekme"}
                  </td>
                  <td className="tv-mono font-semibold">{formatTRY(r.amount)}</td>
                  <td className="text-[10px]">{methodLabel(r.method)}</td>
                  <td className="text-[10px]">{statusLabel(r.status)}</td>
                  <td className="tv-mono text-[10px] text-neutral-500">
                    {new Date(r.createdAt).toLocaleString("tr-TR")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
}
