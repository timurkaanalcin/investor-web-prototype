"use client";

import { useEffect, useState } from "react";
import {
  formatTry,
  getCrmTickets,
  subscribeCrm,
  updateCrmTicketStatus,
  type CrmTicket,
} from "@/lib/crm/data";

export default function CrmTicketsPage() {
  const [tickets, setTickets] = useState<CrmTicket[]>([]);
  const [filter, setFilter] = useState<"Open" | "all">("Open");

  function refresh() {
    setTickets(getCrmTickets());
  }

  useEffect(() => {
    refresh();
    return subscribeCrm(refresh);
  }, []);

  const list =
    filter === "Open"
      ? tickets.filter((t) => t.status === "Open")
      : tickets;

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-nest">Biletler</h1>
        <p className="mt-1 text-sm text-muted">
          Basit ticket listesi (mock + localStorage). Para onayları için{" "}
          <span className="font-semibold">Para talepleri</span> sekmesini
          kullanın.
        </p>
      </div>

      <div className="mb-3 flex gap-2">
        <button
          type="button"
          onClick={() => setFilter("Open")}
          className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
            filter === "Open"
              ? "bg-nest-solid text-white"
              : "border border-border bg-white"
          }`}
        >
          Açık
        </button>
        <button
          type="button"
          onClick={() => setFilter("all")}
          className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
            filter === "all"
              ? "bg-nest-solid text-white"
              : "border border-border bg-white"
          }`}
        >
          Tümü
        </button>
      </div>

      <ul className="space-y-2">
        {list.length === 0 && (
          <li className="rounded-2xl border border-border bg-white p-8 text-center text-sm text-muted">
            Bilet yok
          </li>
        )}
        {list.map((t) => (
          <li
            key={t.id}
            className="rounded-2xl border border-border bg-white p-4 shadow-sm"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-nest">{t.title}</p>
                <p className="mt-1 text-xs text-muted">
                  {t.type} · {t.customerName || "—"}{" "}
                  {t.customerEmail ? `(${t.customerEmail})` : ""}
                </p>
                {t.amount != null && (
                  <p className="mt-1 text-sm font-semibold">
                    {formatTry(t.amount)}
                  </p>
                )}
                {t.note && (
                  <p className="mt-1 text-[11px] text-muted">{t.note}</p>
                )}
                <p className="mt-1 text-[10px] text-muted">
                  {new Date(t.createdAt).toLocaleString("tr-TR")}
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className="rounded-full bg-beige px-2 py-0.5 text-[10px] font-semibold">
                  {t.status}
                </span>
                {t.status === "Open" && (
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        updateCrmTicketStatus(t.id, "Approved");
                        refresh();
                      }}
                      className="rounded-full bg-nest-solid px-2.5 py-1 text-[10px] font-semibold text-white"
                    >
                      Onayla
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        updateCrmTicketStatus(t.id, "Rejected");
                        refresh();
                      }}
                      className="rounded-full bg-danger px-2.5 py-1 text-[10px] font-semibold text-white"
                    >
                      Red
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        updateCrmTicketStatus(t.id, "Closed");
                        refresh();
                      }}
                      className="rounded-full bg-beige px-2.5 py-1 text-[10px] font-semibold"
                    >
                      Kapat
                    </button>
                  </div>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
