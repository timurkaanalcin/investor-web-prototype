"use client";

import { useEffect, useMemo, useState } from "react";
import { BrandLogo } from "@/components/BrandLogo";
import { IconClose } from "@/components/Icons";
import { TickerLogo } from "@/components/TickerLogos";
import {
  TRANSACTIONS,
  TX_SIDE_LABEL,
  TX_STATUS_LABEL,
  formatTxAmount,
  formatTxDateGroup,
  type Transaction,
  type TxSide,
} from "@/lib/mock-data";
import { getExtraTransactions } from "@/lib/storage";

type Filter = "all" | TxSide;

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "Tümü" },
  { key: "buy", label: "Alış" },
  { key: "sell", label: "Satış" },
  { key: "deposit", label: "Yatırma" },
  { key: "withdraw", label: "Çekme" },
];

const SIDE_BADGE: Record<TxSide, string> = {
  buy: "bg-sage-muted text-nest-blue",
  sell: "bg-red-50 text-danger",
  deposit: "bg-emerald-50 text-gain",
  withdraw: "bg-amber-50 text-amber-700",
};

function sideSignColor(side: TxSide): string {
  if (side === "deposit" || side === "sell") return "text-gain";
  if (side === "withdraw" || side === "buy") return "text-nest";
  return "text-nest";
}

export default function TransactionsPage() {
  const [filter, setFilter] = useState<Filter>("all");
  const [selected, setSelected] = useState<Transaction | null>(null);
  const [extra, setExtra] = useState<Transaction[]>([]);

  useEffect(() => {
    setExtra(getExtraTransactions() as Transaction[]);
  }, []);

  const all = useMemo(() => {
    const merged = [...extra, ...TRANSACTIONS];
    const seen = new Set<string>();
    return merged.filter((t) => {
      if (seen.has(t.id)) return false;
      seen.add(t.id);
      return true;
    });
  }, [extra]);

  const filtered = useMemo(
    () => (filter === "all" ? all : all.filter((t) => t.side === filter)),
    [all, filter]
  );

  const groups = useMemo(() => {
    const map = new Map<string, Transaction[]>();
    for (const tx of filtered) {
      const key = formatTxDateGroup(tx.date);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(tx);
    }
    return Array.from(map.entries());
  }, [filtered]);

  return (
    <div className="px-5 pb-6 md:px-0 md:pb-0">
      <header className="flex items-center justify-between pt-5 pb-2 md:pt-2">
        <div className="md:hidden"><BrandLogo size="sm" showIcon={false} /></div>
        <div className="hidden md:block" />
        <span className="text-[11px] font-medium text-muted">
          {all.length} işlem
        </span>
      </header>

      <h1 className="mt-2 text-2xl font-bold text-nest md:mt-0 md:text-3xl">İşlem geçmişi</h1>
      <p className="mt-1 text-sm text-muted">
        Alış, satış ve para hareketlerin
      </p>

      <div className="mt-4 flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors active:scale-95 ${
              filter === f.key
                ? "bg-nest text-white"
                : "bg-card text-nest shadow-sm"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card mt-8 flex flex-col items-center gap-3 px-6 py-12 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-sage-muted text-2xl">
            📋
          </div>
          <p className="text-base font-semibold text-nest">İşlem yok</p>
          <p className="text-sm text-muted">
            Bu filtrede henüz kayıt bulunmuyor.
          </p>
          <button
            type="button"
            onClick={() => setFilter("all")}
            className="btn-secondary mt-2 px-4 py-2 text-sm"
          >
            Tümünü göster
          </button>
        </div>
      ) : (
        <div className="mt-5 space-y-5">
          {groups.map(([label, items]) => (
            <section key={label}>
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
                {label}
              </h2>
              <ul className="card overflow-hidden divide-y divide-black/5">
                {items.map((tx) => (
                  <li key={tx.id}>
                    <button
                      type="button"
                      onClick={() => setSelected(tx)}
                      className="flex w-full min-h-[52px] items-center gap-3 px-3.5 py-3 text-left transition-colors active:bg-sage-muted/50 md:px-4 md:py-3.5"
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-sage-muted">
                        {tx.symbol ? (
                          <TickerLogo symbol={tx.symbol} size={40} />
                        ) : (
                          <span className="text-sm font-bold text-nest">
                            {tx.side === "deposit"
                              ? "↓"
                              : tx.side === "withdraw"
                                ? "↑"
                                : "•"}
                          </span>
                        )}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-semibold text-nest">
                            {tx.title}
                          </p>
                          <span
                            className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${SIDE_BADGE[tx.side]}`}
                          >
                            {TX_SIDE_LABEL[tx.side]}
                          </span>
                        </div>
                        <p className="truncate text-xs text-muted">
                          {tx.subtitle || TX_STATUS_LABEL[tx.status]}
                        </p>
                      </div>
                      <div className="text-right">
                        <p
                          className={`text-sm font-semibold ${sideSignColor(tx.side)}`}
                        >
                          {formatTxAmount(tx)}
                        </p>
                        <p className="text-[10px] text-muted">
                          {TX_STATUS_LABEL[tx.status]}
                        </p>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4"
          onClick={() => setSelected(null)}
          role="presentation"
        >
          <div
            className="w-full max-w-[390px] md:max-w-md rounded-t-3xl bg-card p-5 shadow-2xl sm:rounded-3xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="tx-detail-title"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-muted">İşlem detayı</p>
                <h3
                  id="tx-detail-title"
                  className="mt-1 text-xl font-bold text-nest"
                >
                  {selected.title}
                </h3>
              </div>
              <button
                type="button"
                aria-label="Kapat"
                onClick={() => setSelected(null)}
                className="rounded-full bg-beige p-2 text-nest"
              >
                <IconClose size={18} />
              </button>
            </div>

            <div className="mt-4 space-y-3 rounded-2xl bg-beige/80 p-4 text-sm">
              <Row label="Tür" value={TX_SIDE_LABEL[selected.side]} />
              <Row label="Tutar" value={formatTxAmount(selected)} />
              <Row
                label="Tarih"
                value={new Date(selected.date + "T12:00:00").toLocaleDateString(
                  "tr-TR",
                  { day: "numeric", month: "long", year: "numeric" }
                )}
              />
              <Row label="Durum" value={TX_STATUS_LABEL[selected.status]} />
              {selected.subtitle && (
                <Row label="Açıklama" value={selected.subtitle} />
              )}
              {selected.qty != null && (
                <Row label="Adet" value={String(selected.qty)} />
              )}
              {selected.price != null && (
                <Row
                  label="Fiyat"
                  value={
                    selected.currency === "USD"
                      ? `$${selected.price.toFixed(2)}`
                      : `₺${selected.price.toLocaleString("tr-TR")}`
                  }
                />
              )}
              <Row label="Referans" value={selected.id} />
            </div>

            <button
              type="button"
              onClick={() => setSelected(null)}
              className="btn-primary mt-5 w-full py-3.5 text-sm"
            >
              Tamam
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-muted">{label}</span>
      <span className="max-w-[60%] text-right font-medium text-nest">
        {value}
      </span>
    </div>
  );
}
