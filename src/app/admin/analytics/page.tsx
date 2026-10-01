"use client";

import { useEffect, useMemo, useState } from "react";
import { listAuthAccounts } from "@/lib/storage";
import { getMoneyRequests } from "@/lib/money-requests";
import { getSupportThreads } from "@/lib/live-support";
import { formatTry, getCrmDesks, getCrmTickets } from "@/lib/crm/data";
import { getReferralCodes } from "@/lib/referral-codes";
import {
  exposureBySymbol,
  formatTryMono,
  getDeskPositions,
  getTradeBlotter,
  positionExposureTry,
  subscribeDeskPositions,
} from "@/lib/crm/terminal";

export default function CrmAnalyticsPage() {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const unsub = subscribeDeskPositions(() => setTick((t) => t + 1));
    const iv = window.setInterval(() => setTick((t) => t + 1), 4000);
    return () => {
      unsub();
      window.clearInterval(iv);
    };
  }, []);

  const data = useMemo(() => {
    void tick;
    const accounts = listAuthAccounts();
    const money = getMoneyRequests();
    const deposits = money.filter(
      (r) => r.type === "deposit" && r.status === "approved",
    );
    const withdraws = money.filter(
      (r) => r.type === "withdraw" && r.status === "approved",
    );
    const desks = getCrmDesks();
    const tickets = getCrmTickets();
    const refs = getReferralCodes();
    const threads = getSupportThreads();
    const positions = getDeskPositions();
    const blotter = getTradeBlotter();
    const buys = blotter.filter((t) => t.side === "buy");
    const sells = blotter.filter((t) => t.side === "sell");
    const buyVol = buys.reduce((s, t) => s + t.amount, 0);
    const sellVol = sells.reduce((s, t) => s + t.amount, 0);
    const bySym = exposureBySymbol(positions);
    const volumeBySymbol = new Map<string, number>();
    for (const t of blotter) {
      if (!t.symbol) continue;
      volumeBySymbol.set(
        t.symbol,
        (volumeBySymbol.get(t.symbol) || 0) + t.amount,
      );
    }
    const volRows = Array.from(volumeBySymbol.entries())
      .map(([symbol, vol]) => ({ symbol, vol }))
      .sort((a, b) => b.vol - a.vol)
      .slice(0, 12);

    const deskPerf = desks.map((d) => {
      const pos = positions.filter((p) => p.deskId === d.id);
      const exp = pos.reduce((s, p) => s + positionExposureTry(p), 0);
      return {
        ...d,
        openPos: pos.length,
        exposure: exp,
      };
    });

    return {
      kpis: [
        { label: "Kayıtlı müşteri", value: String(accounts.length) },
        {
          label: "Onaylı yatırma",
          value: formatTry(deposits.reduce((s, r) => s + r.amount, 0)),
        },
        {
          label: "Onaylı çekme",
          value: formatTry(withdraws.reduce((s, r) => s + r.amount, 0)),
        },
        { label: "Al emirleri", value: String(buys.length) },
        { label: "Sat emirleri", value: String(sells.length) },
        {
          label: "Al / Sat hacim",
          value: `${formatTryMono(buyVol, 0)} / ${formatTryMono(sellVol, 0)}`,
        },
        {
          label: "Açık bilet",
          value: String(tickets.filter((t) => t.status === "Open").length),
        },
        { label: "Destek konuşması", value: String(threads.length) },
        {
          label: "Aktif referans",
          value: String(refs.filter((r) => r.active).length),
        },
      ],
      volRows,
      bySym,
      deskPerf,
      buyCount: buys.length,
      sellCount: sells.length,
      buyVol,
      sellVol,
    };
  }, [tick]);

  const totalSide = data.buyCount + data.sellCount || 1;
  const buyPct = (data.buyCount / totalSide) * 100;

  return (
    <div>
      <div className="mb-3">
        <h1 className="text-[15px] font-bold text-black">Analitik</h1>
        <p className="text-[11px] text-neutral-500">
          Hacim · Al/Sat oranı · masa performansı · sembol maruziyeti
        </p>
      </div>

      <div className="mb-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {data.kpis.map((r) => (
          <div key={r.label} className="crm-kpi rounded">
            <p className="label">{r.label}</p>
            <p className="value tv-mono !text-[16px]">{r.value}</p>
          </div>
        ))}
      </div>

      <div className="mb-3 crm-panel rounded p-3">
        <p className="mb-2 text-[12px] font-bold">Al vs Sat oranı</p>
        <div className="flex h-3 overflow-hidden rounded bg-neutral-200">
          <div
            className="bg-[#26a69a]"
            style={{ width: `${buyPct}%` }}
            title="Al"
          />
          <div
            className="bg-[#ef5350]"
            style={{ width: `${100 - buyPct}%` }}
            title="Sat"
          />
        </div>
        <p className="mt-1 tv-mono text-[11px] text-neutral-600">
          Al {data.buyCount} ({buyPct.toFixed(0)}%) · Sat {data.sellCount} (
          {(100 - buyPct).toFixed(0)}%)
        </p>
      </div>

      <div className="grid gap-2 lg:grid-cols-2">
        <section className="crm-panel overflow-hidden rounded">
          <div className="border-b border-black/10 px-3 py-2">
            <h2 className="text-[12px] font-bold">Sembol hacmi</h2>
          </div>
          <table className="crm-dense-table">
            <thead>
              <tr>
                <th>Sembol</th>
                <th>Hacim (TRY)</th>
              </tr>
            </thead>
            <tbody>
              {data.volRows.length === 0 && (
                <tr>
                  <td colSpan={2} className="py-6 text-center text-neutral-500">
                    Henüz trade yok
                  </td>
                </tr>
              )}
              {data.volRows.map((r) => (
                <tr key={r.symbol}>
                  <td className="tv-mono font-bold">{r.symbol}</td>
                  <td className="tv-mono">{formatTryMono(r.vol, 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="crm-panel overflow-hidden rounded">
          <div className="border-b border-black/10 px-3 py-2">
            <h2 className="text-[12px] font-bold">Masa performansı</h2>
          </div>
          <table className="crm-dense-table">
            <thead>
              <tr>
                <th>Masa</th>
                <th>Lead</th>
                <th>Yatırma</th>
                <th>Açık poz.</th>
                <th>Maruziyet</th>
              </tr>
            </thead>
            <tbody>
              {data.deskPerf.map((d) => (
                <tr key={d.id}>
                  <td className="text-[11px] font-semibold">{d.name}</td>
                  <td className="tv-mono">{d.leadCount}</td>
                  <td className="tv-mono">{formatTry(d.depositSum)}</td>
                  <td className="tv-mono">{d.openPos}</td>
                  <td className="tv-mono">{formatTryMono(d.exposure, 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
}
