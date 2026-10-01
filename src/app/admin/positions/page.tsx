"use client";

import { useEffect, useMemo, useState } from "react";
import {
  forceCloseDeskPosition,
  formatPx,
  formatTryMono,
  getDeskPositions,
  positionExposureTry,
  positionPlTry,
  subscribeDeskPositions,
  type DeskPosition,
} from "@/lib/crm/terminal";
import { getInstrument } from "@/lib/mock-data";
import { getCrmDesks } from "@/lib/crm/data";

export default function CrmPositionsPage() {
  const [rows, setRows] = useState<DeskPosition[]>([]);
  const [symbolQ, setSymbolQ] = useState("");
  const [deskId, setDeskId] = useState("all");
  const [customerQ, setCustomerQ] = useState("");
  const [msg, setMsg] = useState("");
  const desks = useMemo(() => getCrmDesks(), []);

  function refresh() {
    setRows(getDeskPositions());
  }

  useEffect(() => {
    refresh();
    return subscribeDeskPositions(refresh);
  }, []);

  const filtered = rows.filter((r) => {
    if (symbolQ && !r.symbol.toLowerCase().includes(symbolQ.toLowerCase()))
      return false;
    if (deskId !== "all" && r.deskId !== deskId) return false;
    if (customerQ) {
      const q = customerQ.toLowerCase();
      if (
        !r.accountEmail.toLowerCase().includes(q) &&
        !r.accountName.toLowerCase().includes(q)
      )
        return false;
    }
    return true;
  });

  function onForceClose(symbol: string) {
    if (!window.confirm(`${symbol} pozisyonunu zorla kapat?`)) return;
    const res = forceCloseDeskPosition(symbol);
    if (!res.ok) {
      setMsg(res.error || "Kapatılamadı");
      return;
    }
    setMsg(
      `${symbol} kapatıldı · K/Z ${formatTryMono(res.plTry)}`,
    );
    refresh();
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-[15px] font-bold text-black">Pozisyonlar</h1>
          <p className="text-[11px] text-neutral-500">
            Tüm açık pozisyonlar · trade-ledger · filtre + zorla kapat
          </p>
        </div>
        {msg && (
          <p className="rounded border border-neutral-200 bg-white px-2 py-1 text-[11px] font-semibold">
            {msg}
          </p>
        )}
      </div>

      <div className="mb-2 flex flex-wrap gap-2">
        <input
          value={symbolQ}
          onChange={(e) => setSymbolQ(e.target.value)}
          placeholder="Sembol…"
          className="h-8 w-28 rounded border border-neutral-200 bg-white px-2 text-[12px] outline-none"
        />
        <input
          value={customerQ}
          onChange={(e) => setCustomerQ(e.target.value)}
          placeholder="Müşteri / e-posta…"
          className="h-8 w-44 rounded border border-neutral-200 bg-white px-2 text-[12px] outline-none"
        />
        <select
          value={deskId}
          onChange={(e) => setDeskId(e.target.value)}
          className="h-8 rounded border border-neutral-200 bg-white px-2 text-[12px]"
        >
          <option value="all">Tüm masalar</option>
          {desks.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
        <span className="tv-mono self-center text-[11px] text-neutral-500">
          {filtered.length} / {rows.length}
        </span>
      </div>

      <div className="crm-panel overflow-auto rounded">
        <table className="crm-dense-table">
          <thead>
            <tr>
              <th>Sembol</th>
              <th>Müşteri</th>
              <th>E-posta</th>
              <th>Masa</th>
              <th>Adet</th>
              <th>Ort. maliyet</th>
              <th>Mark</th>
              <th>Maruziyet</th>
              <th>K/Z</th>
              <th>%</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={11} className="py-10 text-center text-neutral-500">
                  Açık pozisyon bulunamadı
                </td>
              </tr>
            )}
            {filtered.map((p) => {
              const pl = positionPlTry(p);
              const mark = getInstrument(p.symbol)?.price ?? p.avgCost;
              return (
                <tr key={p.symbol + p.accountEmail}>
                  <td className="tv-mono font-bold">{p.symbol}</td>
                  <td className="text-[11px]">{p.accountName}</td>
                  <td className="tv-mono text-[10px] text-neutral-500">
                    {p.accountEmail}
                  </td>
                  <td className="text-[10px]">{p.deskName}</td>
                  <td className="tv-mono">
                    {p.shares.toLocaleString("tr-TR", {
                      maximumFractionDigits: 4,
                    })}
                  </td>
                  <td className="tv-mono">{formatPx(p.avgCost)}</td>
                  <td className="tv-mono">{formatPx(mark)}</td>
                  <td className="tv-mono">
                    {formatTryMono(positionExposureTry(p), 0)}
                  </td>
                  <td
                    className={`tv-mono font-semibold ${pl >= 0 ? "crm-pl-pos" : "crm-pl-neg"}`}
                  >
                    {formatTryMono(pl)}
                  </td>
                  <td
                    className={`tv-mono ${p.plPct >= 0 ? "crm-pl-pos" : "crm-pl-neg"}`}
                  >
                    {p.plPct >= 0 ? "+" : ""}
                    {p.plPct.toFixed(2)}%
                  </td>
                  <td>
                    <button
                      type="button"
                      onClick={() => onForceClose(p.symbol)}
                      className="rounded border border-neutral-300 px-2 py-0.5 text-[10px] font-semibold hover:bg-neutral-100"
                    >
                      Zorla kapat
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
