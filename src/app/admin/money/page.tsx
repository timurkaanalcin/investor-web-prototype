"use client";

import { useEffect, useMemo, useState } from "react";
import { formatTRY } from "@/lib/mock-data";
import {
  approveMoneyRequest,
  getDisplayBalance,
  getMoneyRequests,
  methodLabel,
  rejectMoneyRequest,
  statusLabel,
  subscribeMoneyUpdates,
  type MoneyRequest,
} from "@/lib/money-requests";

type Filter = "all" | "deposit" | "withdraw" | "open";

export default function CrmMoneyPage() {
  const [requests, setRequests] = useState<MoneyRequest[]>([]);
  const [balance, setBalance] = useState(0);
  const [filter, setFilter] = useState<Filter>("open");
  const [selected, setSelected] = useState<MoneyRequest | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  function refresh() {
    setRequests(getMoneyRequests());
    setBalance(getDisplayBalance());
  }

  useEffect(() => {
    refresh();
    return subscribeMoneyUpdates(refresh);
  }, []);

  function flash(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
  }

  const filtered = useMemo(() => {
    return requests.filter((r) => {
      if (filter === "deposit") return r.type === "deposit";
      if (filter === "withdraw") return r.type === "withdraw";
      if (filter === "open")
        return r.status === "ai_reviewed" || r.status === "pending_ai";
      return true;
    });
  }, [requests, filter]);

  const riskClass = (r?: string) =>
    r === "high" ? "text-danger" : r === "medium" ? "text-warn" : "text-gain";

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-nest">Para talepleri</h1>
        <p className="mt-1 text-sm text-muted">
          Kullanıcı bakiyesi (bu tarayıcı): {formatTRY(balance)}
        </p>
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        {(
          [
            ["open", "Açık"],
            ["deposit", "Yatırma"],
            ["withdraw", "Çekme"],
            ["all", "Tümü"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setFilter(id)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
              filter === id
                ? "bg-nest-solid text-white"
                : "border border-border bg-white text-nest"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <ul className="space-y-2">
        {filtered.length === 0 && (
          <li className="rounded-2xl border border-border bg-white p-8 text-center text-sm text-muted">
            Talep yok
          </li>
        )}
        {filtered.map((r) => (
          <li key={r.id}>
            <button
              type="button"
              onClick={() => setSelected(r)}
              className="flex w-full items-start gap-3 rounded-2xl border border-border bg-white p-4 text-left shadow-sm"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-bold text-nest">
                    {r.type === "deposit" ? "Yatırma" : "Çekme"}
                  </span>
                  <span className="rounded-full bg-beige px-2 py-0.5 text-[10px] font-semibold">
                    {statusLabel(r.status)}
                  </span>
                  {r.method && (
                    <span className="text-[10px] text-muted">
                      {methodLabel(r.method)}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-lg font-semibold text-nest">
                  {formatTRY(r.amount)}
                </p>
                {r.aiReport && (
                  <p className={`mt-1 text-xs ${riskClass(r.aiReport.risk)}`}>
                    AI: {r.aiReport.summary}
                  </p>
                )}
                <p className="mt-1 text-[10px] text-muted">
                  {new Date(r.createdAt).toLocaleString("tr-TR")}
                </p>
              </div>
              <span className="text-muted">›</span>
            </button>
          </li>
        ))}
      </ul>

      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 sm:items-center sm:p-4"
          onClick={() => setSelected(null)}
          role="presentation"
        >
          <div
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-card p-5 shadow-2xl sm:rounded-3xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <h3 className="text-lg font-bold text-nest">
              {selected.type === "deposit" ? "Yatırma" : "Çekme"} detayı
            </h3>
            <div className="mt-3 space-y-2 rounded-2xl bg-beige p-4 text-sm">
              <Row k="Tutar" v={formatTRY(selected.amount)} />
              <Row k="Durum" v={statusLabel(selected.status)} />
              {selected.method && (
                <Row k="Yöntem" v={methodLabel(selected.method)} />
              )}
              {selected.paymentDetails?.address && (
                <Row k="Cüzdan" v={selected.paymentDetails.address} mono />
              )}
              {selected.paymentDetails?.iban && (
                <Row k="Hedef IBAN" v={selected.paymentDetails.iban} mono />
              )}
              {selected.userIban && (
                <Row k="Kullanıcı IBAN" v={selected.userIban} mono />
              )}
              {selected.userHolderName && (
                <Row k="Alıcı" v={selected.userHolderName} />
              )}
            </div>
            {selected.aiReport && (
              <div className="mt-4 rounded-2xl border border-border p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                  AI inceleme (mock)
                </p>
                <p
                  className={`mt-1 text-sm font-semibold ${riskClass(
                    selected.aiReport.risk,
                  )}`}
                >
                  {selected.aiReport.summary}
                </p>
                <ul className="mt-2 list-inside list-disc space-y-1 text-xs text-muted">
                  {selected.aiReport.notes.map((n) => (
                    <li key={n}>{n}</li>
                  ))}
                </ul>
              </div>
            )}
            {selected.screenshotDataUrl && (
              <div className="mt-4">
                <p className="mb-2 text-xs font-semibold text-muted">
                  Ekran görüntüsü
                </p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={selected.screenshotDataUrl}
                  alt="Kanıt"
                  className="max-h-56 w-full rounded-xl bg-beige object-contain"
                />
              </div>
            )}
            {(selected.status === "ai_reviewed" ||
              selected.status === "pending_ai") && (
              <div className="mt-5 flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const res = rejectMoneyRequest(selected.id);
                    flash(res.ok ? "Reddedildi" : res.error || "Hata");
                    if (res.ok) {
                      setSelected(null);
                      refresh();
                    }
                  }}
                  className="flex-1 rounded-[14px] bg-danger py-3 text-sm font-semibold text-white"
                >
                  Reddet
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const res = approveMoneyRequest(selected.id);
                    flash(res.ok ? "Onaylandı" : res.error || "Hata");
                    if (res.ok) {
                      setSelected(null);
                      refresh();
                    }
                  }}
                  className="btn-primary flex-1 py-3 text-sm"
                >
                  Onayla
                </button>
              </div>
            )}
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="btn-secondary mt-3 w-full py-3 text-sm"
            >
              Kapat
            </button>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-8 left-1/2 z-50 -translate-x-1/2 rounded-full bg-nest-solid px-4 py-2 text-xs font-medium text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}

function Row({ k, v, mono }: { k: string; v: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="shrink-0 text-muted">{k}</span>
      <span
        className={`text-right font-medium text-nest ${
          mono ? "break-all font-mono text-[11px]" : ""
        }`}
      >
        {v}
      </span>
    </div>
  );
}
