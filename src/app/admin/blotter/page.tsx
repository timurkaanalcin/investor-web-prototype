"use client";

import { useEffect, useMemo, useState } from "react";
import {
  formatPx,
  formatTryMono,
  getTradeBlotter,
} from "@/lib/crm/terminal";
import { listAuthAccounts, type StoredTx } from "@/lib/storage";

function sideLabel(s: StoredTx["side"]): string {
  if (s === "buy") return "Al";
  if (s === "sell") return "Sat";
  return s;
}

export default function CrmBlotterPage() {
  const [rows, setRows] = useState<StoredTx[]>([]);
  const [side, setSide] = useState<"all" | "buy" | "sell">("all");
  const [symbolQ, setSymbolQ] = useState("");

  useEffect(() => {
    setRows(getTradeBlotter());
    const iv = window.setInterval(() => setRows(getTradeBlotter()), 2500);
    return () => window.clearInterval(iv);
  }, []);

  const accounts = useMemo(() => listAuthAccounts(), [rows]);
  const accountLabel =
    accounts[0]?.email || accounts[0]?.name || "Demo hesap";

  const filtered = rows.filter((r) => {
    if (side !== "all" && r.side !== side) return false;
    if (symbolQ && !(r.symbol || "").toLowerCase().includes(symbolQ.toLowerCase()))
      return false;
    return true;
  });

  function exportCsv() {
    const header = [
      "Zaman",
      "Sembol",
      "Yön",
      "Adet",
      "Fiyat",
      "Tutar_TRY",
      "K/Z_not",
      "Hesap",
      "Durum",
    ];
    const lines = filtered.map((r) =>
      [
        r.date,
        r.symbol || "",
        sideLabel(r.side),
        r.qty ?? "",
        r.price ?? "",
        r.amount,
        (r.subtitle || "").replace(/,/g, ";"),
        accountLabel,
        r.status,
      ].join(","),
    );
    const blob = new Blob([[header.join(","), ...lines].join("\n")], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `hram-emir-defteri-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-[15px] font-bold text-black">Emir Defteri</h1>
          <p className="text-[11px] text-neutral-500">
            Kronolojik işlem geçmişi · Al/Sat · CSV dışa aktar
          </p>
        </div>
        <button
          type="button"
          onClick={exportCsv}
          className="h-8 rounded bg-black px-3 text-[11px] font-semibold text-white hover:bg-neutral-800"
        >
          CSV İndir
        </button>
      </div>

      <div className="mb-2 flex flex-wrap gap-2">
        <input
          value={symbolQ}
          onChange={(e) => setSymbolQ(e.target.value)}
          placeholder="Sembol…"
          className="h-8 w-28 rounded border border-neutral-200 bg-white px-2 text-[12px] outline-none"
        />
        <select
          value={side}
          onChange={(e) => setSide(e.target.value as typeof side)}
          className="h-8 rounded border border-neutral-200 bg-white px-2 text-[12px]"
        >
          <option value="all">Al + Sat</option>
          <option value="buy">Sadece Al</option>
          <option value="sell">Sadece Sat</option>
        </select>
        <span className="tv-mono self-center text-[11px] text-neutral-500">
          {filtered.length} kayıt
        </span>
      </div>

      <div className="crm-panel overflow-auto rounded">
        <table className="crm-dense-table">
          <thead>
            <tr>
              <th>Zaman</th>
              <th>Sembol</th>
              <th>Yön</th>
              <th>Adet</th>
              <th>Fiyat</th>
              <th>Tutar</th>
              <th>K/Z / Not</th>
              <th>Hesap</th>
              <th>Durum</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={9} className="py-10 text-center text-neutral-500">
                  Emir kaydı yok. Terminal veya müşteri trade UI üzerinden işlem
                  oluşur.
                </td>
              </tr>
            )}
            {filtered.map((r) => (
              <tr key={r.id}>
                <td className="tv-mono text-[10px] whitespace-nowrap">
                  {r.date}
                </td>
                <td className="tv-mono font-bold">{r.symbol || "—"}</td>
                <td>
                  <span
                    className={`text-[11px] font-bold ${
                      r.side === "buy" ? "crm-pl-pos" : "crm-pl-neg"
                    }`}
                  >
                    {sideLabel(r.side)}
                  </span>
                </td>
                <td className="tv-mono">
                  {r.qty != null
                    ? r.qty.toLocaleString("tr-TR", {
                        maximumFractionDigits: 4,
                      })
                    : "—"}
                </td>
                <td className="tv-mono">
                  {r.price != null ? formatPx(r.price) : "—"}
                </td>
                <td className="tv-mono font-semibold">
                  {formatTryMono(r.amount, 0)}
                </td>
                <td className="max-w-[180px] truncate text-[10px] text-neutral-600">
                  {r.subtitle || r.title}
                </td>
                <td className="tv-mono text-[10px]">{accountLabel}</td>
                <td className="text-[10px]">{r.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
