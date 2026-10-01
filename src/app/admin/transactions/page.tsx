"use client";

import { useEffect, useState } from "react";
import { getExtraTransactions, type StoredTx } from "@/lib/storage";
import {
  getMoneyRequests,
  methodLabel,
  statusLabel,
  type MoneyRequest,
} from "@/lib/money-requests";
import { formatTRY } from "@/lib/mock-data";

export default function CrmTransactionsPage() {
  const [txs, setTxs] = useState<StoredTx[]>([]);
  const [money, setMoney] = useState<MoneyRequest[]>([]);

  useEffect(() => {
    setTxs(getExtraTransactions());
    setMoney(getMoneyRequests());
  }, []);
  const moneyCount = money.length;

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-nest">İşlemler</h1>
        <p className="mt-1 text-sm text-muted">
          Kullanıcı işlem geçmişi (localStorage) · {moneyCount} para talebi
          kaydı
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-beige text-[11px] uppercase text-muted">
            <tr>
              <th className="px-4 py-3">Başlık</th>
              <th className="px-4 py-3">Tür</th>
              <th className="px-4 py-3">Tutar</th>
              <th className="px-4 py-3">Durum</th>
              <th className="px-4 py-3">Tarih</th>
            </tr>
          </thead>
          <tbody>
            {txs.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-muted">
                  Henüz işlem yok. Yatırma/çekme talepleri burada listelenir.
                </td>
              </tr>
            )}
            {txs.map((t) => (
              <tr key={t.id} className="border-b border-border/50 last:border-0">
                <td className="px-4 py-3">
                  <p className="font-medium text-nest">{t.title}</p>
                  {t.subtitle && (
                    <p className="text-[11px] text-muted">{t.subtitle}</p>
                  )}
                </td>
                <td className="px-4 py-3 text-xs capitalize text-muted">
                  {t.side}
                </td>
                <td className="px-4 py-3 font-semibold">
                  {formatTRY(t.amount)}
                </td>
                <td className="px-4 py-3 text-xs">{t.status}</td>
                <td className="px-4 py-3 text-xs text-muted">{t.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6">
        <h2 className="mb-2 text-sm font-bold text-nest">Para talepleri özeti</h2>
        <ul className="space-y-1 text-xs text-muted">
          {money
            .slice(0, 8)
            .map((r) => (
              <li key={r.id}>
                {r.type} · {formatTRY(r.amount)} · {methodLabel(r.method)} ·{" "}
                {statusLabel(r.status)}
              </li>
            ))}
        </ul>
      </div>
    </div>
  );
}
