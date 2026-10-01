"use client";

import { useEffect, useMemo, useState } from "react";
import {
  exposureBySymbol,
  formatTryMono,
  getDeskPositions,
  positionExposureTry,
  positionPlTry,
  subscribeDeskPositions,
  summarizePositions,
  type DeskPosition,
} from "@/lib/crm/terminal";
import { getCrmDesks, formatTry } from "@/lib/crm/data";
import { getDisplayBalance } from "@/lib/money-requests";

export default function CrmRiskPage() {
  const [rows, setRows] = useState<DeskPosition[]>([]);
  const [balance, setBalance] = useState(0);

  function refresh() {
    setRows(getDeskPositions());
    setBalance(getDisplayBalance());
  }

  useEffect(() => {
    refresh();
    return subscribeDeskPositions(refresh);
  }, []);

  const summary = useMemo(() => summarizePositions(rows), [rows]);
  const bySymbol = useMemo(() => exposureBySymbol(rows), [rows]);
  const desks = useMemo(() => getCrmDesks(), []);

  const winners = [...rows]
    .sort((a, b) => positionPlTry(b) - positionPlTry(a))
    .slice(0, 5);
  const losers = [...rows]
    .sort((a, b) => positionPlTry(a) - positionPlTry(b))
    .slice(0, 5);

  const totalExp = summary.exposureTry || 1;
  const marginUsedPct =
    balance > 0 ? Math.min(999, (summary.exposureTry / (balance || 1)) * 100) : 0;
  const concentration = bySymbol[0]
    ? (bySymbol[0].exposureTry / totalExp) * 100
    : 0;

  return (
    <div>
      <div className="mb-3">
        <h1 className="text-[15px] font-bold text-black">Risk</h1>
        <p className="text-[11px] text-neutral-500">
          Maruziyet · konsantrasyon · margin stub · kazanan/kaybeden
        </p>
      </div>

      <div className="mb-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
        <div className="crm-kpi rounded">
          <p className="label">Toplam maruziyet</p>
          <p className="value tv-mono">{formatTryMono(summary.exposureTry, 0)}</p>
        </div>
        <div className="crm-kpi rounded">
          <p className="label">Net K/Z (açık)</p>
          <p
            className={`value tv-mono ${summary.unrealizedPlTry >= 0 ? "crm-pl-pos" : "crm-pl-neg"}`}
          >
            {formatTryMono(summary.unrealizedPlTry)}
          </p>
        </div>
        <div className="crm-kpi rounded">
          <p className="label">Margin kullanımı</p>
          <p className="value tv-mono">{marginUsedPct.toFixed(1)}%</p>
          <p className="mt-1 text-[10px] text-neutral-500">
            Bakiye {formatTryMono(balance, 0)}
          </p>
        </div>
        <div className="crm-kpi rounded">
          <p className="label">En büyük konsantrasyon</p>
          <p className="value tv-mono">
            {bySymbol[0]?.symbol || "—"} · {concentration.toFixed(1)}%
          </p>
        </div>
        <div className="crm-kpi rounded">
          <p className="label">Açık pozisyon</p>
          <p className="value tv-mono">{summary.openCount}</p>
        </div>
      </div>

      <div className="grid gap-2 lg:grid-cols-2">
        <section className="crm-panel overflow-hidden rounded">
          <div className="border-b border-black/10 px-3 py-2">
            <h2 className="text-[12px] font-bold">Sembol maruziyeti</h2>
          </div>
          <table className="crm-dense-table">
            <thead>
              <tr>
                <th>Sembol</th>
                <th>Poz.</th>
                <th>Maruziyet</th>
                <th>Pay</th>
                <th>K/Z</th>
              </tr>
            </thead>
            <tbody>
              {bySymbol.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-neutral-500">
                    Veri yok
                  </td>
                </tr>
              )}
              {bySymbol.map((r) => (
                <tr key={r.symbol}>
                  <td className="tv-mono font-bold">{r.symbol}</td>
                  <td className="tv-mono">{r.count}</td>
                  <td className="tv-mono">{formatTryMono(r.exposureTry, 0)}</td>
                  <td className="tv-mono">
                    {((r.exposureTry / totalExp) * 100).toFixed(1)}%
                  </td>
                  <td
                    className={`tv-mono ${r.plTry >= 0 ? "crm-pl-pos" : "crm-pl-neg"}`}
                  >
                    {formatTryMono(r.plTry)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="crm-panel overflow-hidden rounded">
          <div className="border-b border-black/10 px-3 py-2">
            <h2 className="text-[12px] font-bold">Masa yatırma vs maruziyet</h2>
          </div>
          <table className="crm-dense-table">
            <thead>
              <tr>
                <th>Masa</th>
                <th>Yatırma (mock)</th>
                <th>Maruziyet</th>
                <th>Oran</th>
              </tr>
            </thead>
            <tbody>
              {desks.map((d) => {
                const exp = rows
                  .filter((p) => p.deskId === d.id)
                  .reduce((s, p) => s + positionExposureTry(p), 0);
                const ratio = d.depositSum > 0 ? (exp / d.depositSum) * 100 : 0;
                return (
                  <tr key={d.id}>
                    <td className="text-[11px] font-semibold">{d.name}</td>
                    <td className="tv-mono">{formatTry(d.depositSum)}</td>
                    <td className="tv-mono">{formatTryMono(exp, 0)}</td>
                    <td className="tv-mono">{ratio.toFixed(1)}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>

        <section className="crm-panel overflow-hidden rounded">
          <div className="border-b border-black/10 px-3 py-2">
            <h2 className="text-[12px] font-bold">En büyük kazananlar</h2>
          </div>
          <ul className="divide-y divide-black/5">
            {winners.map((p) => {
              const pl = positionPlTry(p);
              return (
                <li
                  key={"w" + p.symbol}
                  className="flex items-center justify-between px-3 py-2"
                >
                  <span className="tv-mono text-[12px] font-bold">{p.symbol}</span>
                  <span className="tv-mono text-[12px] font-semibold crm-pl-pos">
                    {formatTryMono(pl)}
                  </span>
                </li>
              );
            })}
            {winners.length === 0 && (
              <li className="px-3 py-6 text-center text-[11px] text-neutral-500">
                Yok
              </li>
            )}
          </ul>
        </section>

        <section className="crm-panel overflow-hidden rounded">
          <div className="border-b border-black/10 px-3 py-2">
            <h2 className="text-[12px] font-bold">En büyük kaybedenler</h2>
          </div>
          <ul className="divide-y divide-black/5">
            {losers.map((p) => {
              const pl = positionPlTry(p);
              return (
                <li
                  key={"l" + p.symbol}
                  className="flex items-center justify-between px-3 py-2"
                >
                  <span className="tv-mono text-[12px] font-bold">{p.symbol}</span>
                  <span
                    className={`tv-mono text-[12px] font-semibold ${pl >= 0 ? "crm-pl-pos" : "crm-pl-neg"}`}
                  >
                    {formatTryMono(pl)}
                  </span>
                </li>
              );
            })}
            {losers.length === 0 && (
              <li className="px-3 py-6 text-center text-[11px] text-neutral-500">
                Yok
              </li>
            )}
          </ul>
        </section>
      </div>
    </div>
  );
}
