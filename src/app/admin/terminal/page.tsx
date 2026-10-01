"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  formatPx,
  formatTryMono,
  getDeskPositions,
  getTradeBlotter,
  getWatchlistInstruments,
  positionPlTry,
  subscribeDeskPositions,
  summarizePositions,
  type DeskPosition,
} from "@/lib/crm/terminal";
import { executeMarketOrder } from "@/lib/trade-ledger";
import { getPlatformSettings } from "@/lib/crm/admin-ops";
import { getInstrument } from "@/lib/mock-data";
import type { StoredTx } from "@/lib/storage";

export default function CrmTerminalPage() {
  const [positions, setPositions] = useState<DeskPosition[]>([]);
  const [fills, setFills] = useState<StoredTx[]>([]);
  const [symbol, setSymbol] = useState("AAPL");
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [qty, setQty] = useState("1");
  const [msg, setMsg] = useState("");
  const [filter, setFilter] = useState<"all" | "stock" | "crypto" | "fx" | "commodity">("all");

  function refresh() {
    setPositions(getDeskPositions());
    setFills(getTradeBlotter().slice(0, 40));
  }

  useEffect(() => {
    refresh();
    return subscribeDeskPositions(refresh);
  }, []);

  const watch = useMemo(() => {
    const list = getWatchlistInstruments();
    if (filter === "all") return list;
    return list.filter((i) => filter === "stock" ? i.type === "stock" || i.type === "etf" : i.type === filter);
  }, [filter]);

  const visiblePositions = useMemo(() => {
    if (filter === "all") return positions;
    return positions.filter((p) => {
      const type = getInstrument(p.symbol)?.type;
      return filter === "stock" ? type === "stock" || type === "etf" : type === filter;
    });
  }, [filter, positions]);

  const summary = useMemo(() => summarizePositions(positions), [positions]);
  const selected = getInstrument(symbol);

  function submitOrder() {
    const shares = Number(qty.replace(",", "."));
    if (!Number.isFinite(shares) || shares <= 0) {
      setMsg("Geçersiz miktar");
      return;
    }
    if (getPlatformSettings().tradingHalt) {
      setMsg("İşlem durduruldu (trading halt) — Ayarlar'dan açın");
      return;
    }
    const res = executeMarketOrder({ symbol, side, shares });
    if (!res.ok) {
      setMsg(res.error || "Emir reddedildi");
      return;
    }
    setMsg(
      side === "buy"
        ? `Alış OK · ${symbol}`
        : `Satış OK · ${symbol}${res.plTry != null ? ` · K/Z ${formatTryMono(res.plTry)}` : ""}`,
    );
    refresh();
  }

  return (
    <div className="flex h-full min-h-[calc(100dvh-3.5rem)] flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-[15px] font-bold text-black">İşlem Terminali</h1>
        <span className="text-[11px] text-neutral-500">
          Broker desk · çoklu panel · mock ledger
        </span>
        <div className="ml-auto flex flex-wrap gap-2">
          <div className="crm-kpi !py-1.5 !px-2.5">
            <p className="label">Açık poz.</p>
            <p className="value tv-mono !text-[14px]">{summary.openCount}</p>
          </div>
          <div className="crm-kpi !py-1.5 !px-2.5">
            <p className="label">Gerçekleşmemiş K/Z</p>
            <p
              className={`value tv-mono !text-[14px] ${summary.unrealizedPlTry >= 0 ? "crm-pl-pos" : "crm-pl-neg"}`}
            >
              {formatTryMono(summary.unrealizedPlTry)}
            </p>
          </div>
          <div className="crm-kpi !py-1.5 !px-2.5">
            <p className="label">Maruziyet</p>
            <p className="value tv-mono !text-[14px]">
              {formatTryMono(summary.exposureTry, 0)}
            </p>
          </div>
          <div className="crm-kpi !py-1.5 !px-2.5">
            <p className="label">Günlük hacim</p>
            <p className="value tv-mono !text-[14px]">
              {formatTryMono(summary.dayVolume, 0)}
            </p>
          </div>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 gap-2 lg:grid-cols-[220px_minmax(0,1fr)_260px]">
        {/* Watchlist */}
        <section className="crm-panel flex min-h-[280px] flex-col overflow-hidden rounded">
          <div className="flex items-center gap-1 border-b border-black/10 px-2 py-1.5">
            <p className="text-[11px] font-bold">İzleme Listesi</p>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as typeof filter)}
              className="ml-auto rounded border border-neutral-200 bg-white px-1 py-0.5 text-[10px]"
            >
              <option value="all">Tümü</option>
              <option value="stock">Hisse</option>
              <option value="crypto">Kripto</option>
              <option value="fx">Forex</option>
              <option value="commodity">Emtia</option>
            </select>
          </div>
          <div className="flex-1 overflow-y-auto">
            {watch.map((i) => (
              <button
                key={i.symbol}
                type="button"
                onClick={() => setSymbol(i.symbol)}
                className={`flex w-full items-center gap-2 border-b border-black/[0.04] px-2 py-1.5 text-left hover:bg-neutral-50 ${
                  symbol === i.symbol ? "bg-neutral-100" : ""
                }`}
              >
                <div className="min-w-0 flex-1">
                  <p className="tv-mono text-[11px] font-bold">{i.symbol}</p>
                  <p className="truncate text-[9px] text-neutral-500">{i.name}</p>
                </div>
                <div className="text-right">
                  <p className="tv-mono text-[11px] font-semibold">
                    {formatPx(i.price)}
                  </p>
                  <p
                    className={`tv-mono text-[10px] ${i.changePct >= 0 ? "crm-pl-pos" : "crm-pl-neg"}`}
                  >
                    {i.changePct >= 0 ? "+" : ""}
                    {i.changePct.toFixed(2)}%
                  </p>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Positions */}
        <section className="crm-panel flex min-h-[280px] flex-col overflow-hidden rounded">
          <div className="flex items-center justify-between border-b border-black/10 px-2 py-1.5">
            <p className="text-[11px] font-bold">Açık Pozisyonlar</p>
            <Link href="/admin/positions/" className="text-[10px] underline">
              Tümü
            </Link>
          </div>
          <div className="flex-1 overflow-auto">
            <table className="crm-dense-table">
              <thead>
                <tr>
                  <th>Sembol</th>
                  <th>Müşteri</th>
                  <th>Adet</th>
                  <th>Ort.</th>
                  <th>Fiyat</th>
                  <th>K/Z</th>
                  <th>Masa</th>
                </tr>
              </thead>
              <tbody>
                {visiblePositions.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-neutral-500">
                      {filter === "all" ? "Açık pozisyon yok" : "Bu kategoride açık pozisyon yok"}
                    </td>
                  </tr>
                )}
                {visiblePositions.map((p) => {
                  const pl = positionPlTry(p);
                  const mark = getInstrument(p.symbol)?.price ?? p.avgCost;
                  return (
                    <tr
                      key={p.symbol + p.accountEmail}
                      className="cursor-pointer"
                      onClick={() => setSymbol(p.symbol)}
                    >
                      <td className="tv-mono font-bold">{p.symbol}</td>
                      <td className="max-w-[100px] truncate text-[11px]">
                        {p.accountName}
                      </td>
                      <td className="tv-mono">
                        {p.shares.toLocaleString("tr-TR", {
                          maximumFractionDigits: 4,
                        })}
                      </td>
                      <td className="tv-mono">{formatPx(p.avgCost)}</td>
                      <td className="tv-mono">{formatPx(mark)}</td>
                      <td
                        className={`tv-mono font-semibold ${pl >= 0 ? "crm-pl-pos" : "crm-pl-neg"}`}
                      >
                        {formatTryMono(pl)}
                      </td>
                      <td className="text-[10px] text-neutral-500">{p.deskName}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* Order ticket + fills */}
        <section className="flex min-h-[280px] flex-col gap-2">
          <div className="crm-panel rounded p-2.5">
            <p className="mb-2 text-[11px] font-bold">Emir Bileti</p>
            <p className="tv-mono text-[13px] font-bold">{symbol}</p>
            {selected && (
              <p className="mb-2 text-[10px] text-neutral-500">
                {selected.name} · {selected.exchange} ·{" "}
                <span className="tv-mono">{formatPx(selected.price)}</span>
              </p>
            )}
            <div className="mb-2 grid grid-cols-2 gap-1">
              <button
                type="button"
                onClick={() => setSide("buy")}
                className={`h-8 rounded text-[12px] font-bold text-white ${
                  side === "buy" ? "bg-[#26a69a]" : "bg-neutral-300 text-neutral-600"
                }`}
              >
                Al
              </button>
              <button
                type="button"
                onClick={() => setSide("sell")}
                className={`h-8 rounded text-[12px] font-bold text-white ${
                  side === "sell" ? "bg-[#ef5350]" : "bg-neutral-300 text-neutral-600"
                }`}
              >
                Sat
              </button>
            </div>
            <label className="mb-1 block text-[10px] font-semibold text-neutral-500">
              Miktar
            </label>
            <input
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              className="tv-mono mb-2 h-8 w-full rounded border border-neutral-200 px-2 text-[12px] outline-none"
            />
            <button
              type="button"
              onClick={submitOrder}
              className="h-8 w-full rounded bg-black text-[12px] font-semibold text-white hover:bg-neutral-800"
            >
              Piyasa Emri Gönder
            </button>
            {msg && (
              <p className="mt-2 text-[10px] font-semibold text-neutral-700">{msg}</p>
            )}
            <p className="mt-2 text-[9px] text-neutral-400">
              Stub · mevcut ledger bakiyesine yazar (demo tarayıcı)
            </p>
          </div>
          <div className="crm-panel flex min-h-0 flex-1 flex-col overflow-hidden rounded">
            <div className="border-b border-black/10 px-2 py-1.5">
              <p className="text-[11px] font-bold">Son Gerçekleşmeler</p>
            </div>
            <div className="flex-1 overflow-y-auto">
              {fills.length === 0 && (
                <p className="p-3 text-center text-[11px] text-neutral-500">
                  Henüz fill yok
                </p>
              )}
              {fills.map((f) => (
                <div
                  key={f.id}
                  className="flex items-center gap-2 border-b border-black/[0.04] px-2 py-1.5"
                >
                  <span
                    className={`text-[10px] font-bold ${
                      f.side === "buy" ? "crm-pl-pos" : "crm-pl-neg"
                    }`}
                  >
                    {f.side === "buy" ? "AL" : "SAT"}
                  </span>
                  <span className="tv-mono text-[11px] font-semibold">
                    {f.symbol || "—"}
                  </span>
                  <span className="tv-mono ml-auto text-[10px] text-neutral-600">
                    {formatTryMono(f.amount, 0)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
