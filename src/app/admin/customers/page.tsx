"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { getCrmDesks, getCrmSession, isFullCrmAdmin } from "@/lib/crm/data";
import { formatTRY } from "@/lib/mock-data";
import { getSupportThreads } from "@/lib/live-support";
import {
  adminBulkImportCustomers,
  adminCreateCustomer,
  adjustCustomerBalance,
  bulkAdjustBalance,
  bulkAssignDesk,
  bulkDeactivate,
  bulkSetNote,
  exportCustomersCsv,
  listEnrichedCustomers,
  parseCustomerCsv,
  subscribeAdminOps,
  type EnrichedCustomer,
} from "@/lib/crm/admin-ops";
import {
  formatTryMono,
  getDeskPositions as deskPos,
  positionPlTry,
} from "@/lib/crm/terminal";

function CrmCustomersInner() {
  const searchParams = useSearchParams();
  const [rows, setRows] = useState<EnrichedCustomer[]>([]);
  const [q, setQ] = useState(searchParams.get("q") || "");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [drawer, setDrawer] = useState<EnrichedCustomer | null>(null);
  const [msg, setMsg] = useState("");
  const [importReport, setImportReport] = useState("");
  const [bulkDesk, setBulkDesk] = useState("");
  const [bulkDelta, setBulkDelta] = useState("");
  const [bulkNote, setBulkNote] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({
    email: "",
    name: "",
    password: "",
    balance: "",
    referralCode: "",
  });

  const session = useMemo(() => getCrmSession(), [rows]);
  const canAdmin = isFullCrmAdmin(session);
  const desks = useMemo(() => getCrmDesks(), []);

  function refresh() {
    setRows(listEnrichedCustomers());
  }

  useEffect(() => {
    refresh();
    return subscribeAdminOps(refresh);
  }, []);

  useEffect(() => {
    const qq = searchParams.get("q");
    if (qq) setQ(qq);
  }, [searchParams]);

  const filtered = rows.filter((a) => {
    const s = q.trim().toLowerCase();
    if (!s) return true;
    return (
      a.email.toLowerCase().includes(s) ||
      (a.name || "").toLowerCase().includes(s) ||
      (a.referralCode || "").toLowerCase().includes(s) ||
      (a.deskName || "").toLowerCase().includes(s)
    );
  });

  function toggleAll() {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((r) => r.email)));
    }
  }

  function toggleOne(email: string) {
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(email)) n.delete(email);
      else n.add(email);
      return n;
    });
  }

  function onExport() {
    const csv = exportCustomersCsv();
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `hram-musteriler-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function onImportFile(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || "");
      const parsed = parseCustomerCsv(text);
      if (parsed.length === 0) {
        setImportReport("CSV boş veya okunamadı");
        return;
      }
      const res = adminBulkImportCustomers(parsed);
      setImportReport(
        `İçe aktarım: ${res.ok} başarılı, ${res.fail} hata` +
          (res.results
            .filter((r) => !r.ok)
            .slice(0, 5)
            .map((r) => `\n• ${r.email}: ${"error" in r ? r.error : ""}`)
            .join("") || ""),
      );
      refresh();
    };
    reader.readAsText(file);
  }

  function runBulk(action: "desk" | "balance" | "deactivate" | "activate" | "note") {
    const emails = Array.from(selected);
    if (emails.length === 0) {
      setMsg("Önce müşteri seçin");
      return;
    }
    if (action === "desk") {
      if (!bulkDesk) {
        setMsg("Masa seçin");
        return;
      }
      bulkAssignDesk(emails, bulkDesk);
      setMsg(`${emails.length} müşteri masa atandı`);
    } else if (action === "balance") {
      const d = Number(bulkDelta.replace(",", "."));
      if (!Number.isFinite(d)) {
        setMsg("Geçerli bakiye delta girin");
        return;
      }
      bulkAdjustBalance(emails, d);
      setMsg(`${emails.length} bakiyeye ${d >= 0 ? "+" : ""}${d} TRY`);
    } else if (action === "deactivate") {
      bulkDeactivate(emails, false);
      setMsg(`${emails.length} pasife alındı`);
    } else if (action === "activate") {
      bulkDeactivate(emails, true);
      setMsg(`${emails.length} aktifleştirildi`);
    } else if (action === "note") {
      bulkSetNote(emails, bulkNote);
      setMsg(`${emails.length} nota yazıldı`);
    }
    refresh();
  }

  function submitAdd() {
    const bal = addForm.balance
      ? Number(addForm.balance.replace(",", "."))
      : undefined;
    const res = adminCreateCustomer({
      email: addForm.email,
      name: addForm.name,
      password: addForm.password || undefined,
      balance: Number.isFinite(bal) ? bal : undefined,
      referralCode: addForm.referralCode || undefined,
    });
    if (!res.ok) {
      setMsg(res.error);
      return;
    }
    setMsg(`${res.email} oluşturuldu`);
    setShowAdd(false);
    setAddForm({ email: "", name: "", password: "", balance: "", referralCode: "" });
    refresh();
  }

  const drawerPositions = drawer
    ? deskPos().filter(
        (p) => p.accountEmail.toLowerCase() === drawer.email.toLowerCase(),
      )
    : [];

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-[15px] font-bold text-black">Müşteriler</h1>
          <p className="text-[11px] text-neutral-500">
            Yoğun grid · toplu işlem · CSV içe/dışa aktarım
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Ara…"
            className="h-8 w-40 rounded border border-neutral-200 bg-white px-2 text-[12px] outline-none sm:w-52"
          />
          <button
            type="button"
            onClick={onExport}
            className="h-8 rounded border border-neutral-300 px-2 text-[11px] font-semibold"
          >
            CSV Dışa
          </button>
          {canAdmin && (
            <>
              <label className="inline-flex h-8 cursor-pointer items-center rounded border border-neutral-300 px-2 text-[11px] font-semibold">
                CSV İçe
                <input
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) onImportFile(f);
                    e.target.value = "";
                  }}
                />
              </label>
              <button
                type="button"
                onClick={() => setShowAdd(true)}
                className="h-8 rounded bg-black px-2 text-[11px] font-semibold text-white"
              >
                + Müşteri
              </button>
            </>
          )}
        </div>
      </div>

      {(msg || importReport) && (
        <pre className="mb-2 whitespace-pre-wrap rounded border border-neutral-200 bg-white px-3 py-2 text-[11px]">
          {importReport || msg}
        </pre>
      )}

      {canAdmin && selected.size > 0 && (
        <div className="mb-2 flex flex-wrap items-center gap-2 rounded border border-neutral-200 bg-white p-2">
          <span className="tv-mono text-[11px] font-semibold">
            {selected.size} seçili
          </span>
          <select
            value={bulkDesk}
            onChange={(e) => setBulkDesk(e.target.value)}
            className="h-7 rounded border border-neutral-200 px-1 text-[11px]"
          >
            <option value="">Masa…</option>
            {desks.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => runBulk("desk")}
            className="h-7 rounded border border-neutral-300 px-2 text-[10px] font-semibold"
          >
            Masa ata
          </button>
          <input
            value={bulkDelta}
            onChange={(e) => setBulkDelta(e.target.value)}
            placeholder="Δ TRY"
            className="tv-mono h-7 w-20 rounded border border-neutral-200 px-1 text-[11px]"
          />
          <button
            type="button"
            onClick={() => runBulk("balance")}
            className="h-7 rounded border border-neutral-300 px-2 text-[10px] font-semibold"
          >
            Bakiye ±
          </button>
          <button
            type="button"
            onClick={() => runBulk("deactivate")}
            className="h-7 rounded border border-neutral-300 px-2 text-[10px]"
          >
            Pasif
          </button>
          <button
            type="button"
            onClick={() => runBulk("activate")}
            className="h-7 rounded border border-neutral-300 px-2 text-[10px]"
          >
            Aktif
          </button>
          <input
            value={bulkNote}
            onChange={(e) => setBulkNote(e.target.value)}
            placeholder="Not…"
            className="h-7 w-32 rounded border border-neutral-200 px-1 text-[11px]"
          />
          <button
            type="button"
            onClick={() => runBulk("note")}
            className="h-7 rounded border border-neutral-300 px-2 text-[10px] font-semibold"
          >
            Not yaz
          </button>
        </div>
      )}

      <div className="crm-panel overflow-auto rounded">
        <table className="crm-dense-table">
          <thead>
            <tr>
              {canAdmin && (
                <th className="w-8">
                  <input
                    type="checkbox"
                    checked={
                      filtered.length > 0 && selected.size === filtered.length
                    }
                    onChange={toggleAll}
                  />
                </th>
              )}
              <th>Ad</th>
              <th>E-posta</th>
              <th>Bakiye</th>
              <th>Açık poz.</th>
              <th>K/Z</th>
              <th>Masa</th>
              <th>Sohbet</th>
              <th>Durum</th>
              <th>Kayıt</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={canAdmin ? 10 : 9}
                  className="py-10 text-center text-neutral-500"
                >
                  Kayıtlı müşteri yok
                </td>
              </tr>
            )}
            {filtered.map((a) => {
              const threads = getSupportThreads();
              const chat = threads.find(
                (t) =>
                  t.userEmail?.toLowerCase() === a.email.toLowerCase() ||
                  t.userName === a.name,
              );
              return (
                <tr
                  key={a.email}
                  className="cursor-pointer"
                  onClick={() => setDrawer(a)}
                >
                  {canAdmin && (
                    <td
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        checked={selected.has(a.email)}
                        onChange={() => toggleOne(a.email)}
                      />
                    </td>
                  )}
                  <td className="font-semibold text-black">{a.name || "—"}</td>
                  <td className="tv-mono text-[10px] text-neutral-600">
                    {a.email}
                  </td>
                  <td className="tv-mono font-semibold">
                    {formatTRY(a.balance)}
                  </td>
                  <td className="tv-mono">{a.openPositions}</td>
                  <td
                    className={`tv-mono font-semibold ${
                      a.pl24h >= 0 ? "crm-pl-pos" : "crm-pl-neg"
                    }`}
                  >
                    {formatTryMono(a.pl24h)}
                  </td>
                  <td className="text-[10px]">{a.deskName || "—"}</td>
                  <td className="text-[10px]">
                    {chat ? (
                      chat.status === "open" ? (
                        <span className="crm-pl-pos font-semibold">Açık</span>
                      ) : (
                        <span className="text-neutral-500">Çözüldü</span>
                      )
                    ) : (
                      "—"
                    )}
                  </td>
                  <td>
                    <span
                      className={`text-[9px] font-semibold ${
                        a.active ? "text-black" : "text-neutral-400"
                      }`}
                    >
                      {a.active ? "Aktif" : "Pasif"}
                    </span>
                  </td>
                  <td className="tv-mono text-[10px] text-neutral-500">
                    {new Date(a.createdAt).toLocaleDateString("tr-TR")}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {drawer && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/30">
          <button
            type="button"
            className="flex-1"
            aria-label="Kapat"
            onClick={() => setDrawer(null)}
          />
          <aside className="flex h-full w-full max-w-md flex-col border-l border-neutral-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3">
              <div>
                <p className="text-[14px] font-bold">{drawer.name || "—"}</p>
                <p className="tv-mono text-[11px] text-neutral-500">
                  {drawer.email}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDrawer(null)}
                className="text-[12px] underline"
              >
                Kapat
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 text-[12px]">
              <div className="mb-3 grid grid-cols-2 gap-2">
                <div className="crm-kpi rounded">
                  <p className="label">Bakiye</p>
                  <p className="value tv-mono !text-[15px]">
                    {formatTRY(drawer.balance)}
                  </p>
                </div>
                <div className="crm-kpi rounded">
                  <p className="label">Açık poz.</p>
                  <p className="value tv-mono !text-[15px]">
                    {drawer.openPositions}
                  </p>
                </div>
              </div>
              <p className="mb-1 text-[11px] font-semibold">Pozisyonlar</p>
              {drawerPositions.length === 0 && (
                <p className="mb-3 text-[11px] text-neutral-500">Pozisyon yok</p>
              )}
              <ul className="mb-3 divide-y divide-neutral-100 rounded border border-neutral-100">
                {drawerPositions.map((p) => (
                  <li
                    key={p.symbol}
                    className="flex justify-between px-2 py-1.5"
                  >
                    <span className="tv-mono font-bold">{p.symbol}</span>
                    <span
                      className={`tv-mono ${
                        positionPlTry(p) >= 0 ? "crm-pl-pos" : "crm-pl-neg"
                      }`}
                    >
                      {formatTryMono(positionPlTry(p))}
                    </span>
                  </li>
                ))}
              </ul>
              {drawer.note && (
                <p className="mb-3 rounded bg-neutral-50 p-2 text-[11px]">
                  Not: {drawer.note}
                </p>
              )}
              {canAdmin && (
                <div className="mb-3 flex gap-2">
                  <input
                    id="adj"
                    placeholder="Δ TRY"
                    className="tv-mono h-8 flex-1 rounded border border-neutral-200 px-2 text-[12px]"
                  />
                  <button
                    type="button"
                    className="h-8 rounded bg-black px-3 text-[11px] font-semibold text-white"
                    onClick={() => {
                      const el = document.getElementById(
                        "adj",
                      ) as HTMLInputElement | null;
                      const d = Number((el?.value || "").replace(",", "."));
                      if (!Number.isFinite(d)) return;
                      adjustCustomerBalance(drawer.email, d);
                      setMsg(`Bakiye güncellendi`);
                      refresh();
                      const next = listEnrichedCustomers().find(
                        (x) => x.email === drawer.email,
                      );
                      if (next) setDrawer(next);
                    }}
                  >
                    Bakiye ±
                  </button>
                </div>
              )}
              <div className="flex flex-wrap gap-3 text-[11px]">
                <Link
                  href="/admin/chat/"
                  className="font-semibold underline"
                >
                  Sohbet →
                </Link>
                <Link
                  href="/admin/money/"
                  className="font-semibold underline"
                >
                  Para talepleri →
                </Link>
                <Link
                  href="/admin/positions/"
                  className="font-semibold underline"
                >
                  Pozisyonlar →
                </Link>
              </div>
            </div>
          </aside>
        </div>
      )}

      {showAdd && canAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3">
          <div className="w-full max-w-md rounded border border-neutral-200 bg-white p-4 shadow-xl">
            <h2 className="mb-3 text-[14px] font-bold">Müşteri ekle</h2>
            <div className="grid gap-2">
              {(
                [
                  ["email", "E-posta"],
                  ["name", "Ad"],
                  ["password", "Şifre (ops.)"],
                  ["balance", "Bakiye TRY (ops.)"],
                  ["referralCode", "Referans (ops.)"],
                ] as const
              ).map(([k, label]) => (
                <label key={k} className="text-[11px]">
                  {label}
                  <input
                    value={addForm[k]}
                    onChange={(e) =>
                      setAddForm({ ...addForm, [k]: e.target.value })
                    }
                    className="mt-0.5 h-8 w-full rounded border border-neutral-200 px-2 text-[12px]"
                  />
                </label>
              ))}
            </div>
            <div className="mt-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAdd(false)}
                className="h-8 rounded border border-neutral-300 px-3 text-[11px]"
              >
                İptal
              </button>
              <button
                type="button"
                onClick={submitAdd}
                className="h-8 rounded bg-black px-3 text-[11px] font-semibold text-white"
              >
                Oluştur
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CrmCustomersPage() {
  return (
    <Suspense fallback={<p className="text-sm text-neutral-500">Yükleniyor…</p>}>
      <CrmCustomersInner />
    </Suspense>
  );
}
