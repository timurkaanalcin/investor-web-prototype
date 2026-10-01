"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  addReferralCode,
  deleteReferralCode,
  getReferralCodes,
  refreshReferralCodesFromServer,
  setReferralCodeActive,
  subscribeReferralCodes,
  type ReferralCode,
} from "@/lib/referral-codes";

export default function CrmReferralsPage() {
  const [codes, setCodes] = useState<ReferralCode[]>([]);
  const [newCode, setNewCode] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [err, setErr] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  function refresh() {
    setCodes(getReferralCodes());
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await refreshReferralCodesFromServer();
      } catch {
        /* cache / seed still used */
      }
      if (!cancelled) {
        refresh();
        setLoading(false);
      }
    })();
    return subscribeReferralCodes(refresh);
  }, []);

  function flash(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  async function onAdd(e: FormEvent) {
    e.preventDefault();
    setErr("");
    const res = await addReferralCode({ code: newCode, label: newLabel });
    if (!res.ok) {
      setErr(res.error);
      return;
    }
    setNewCode("");
    setNewLabel("");
    refresh();
    if (res.warning) {
      flash(`Kod eklendi (${res.warning})`);
      setErr(res.warning);
    } else {
      flash("Kod eklendi — tüm cihazlarda geçerli");
    }
  }

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-nest">Referans kodları</h1>
        <p className="mt-1 text-sm text-muted">
          Kodlar sunucuya kaydedilir; kayıt sayfasında tüm cihaz ve tarayıcılarda
          geçerlidir.
        </p>
      </div>

      <form
        onSubmit={onAdd}
        className="mb-4 flex flex-col gap-3 rounded-2xl border border-border bg-white p-4 shadow-sm"
      >
        <p className="text-sm font-semibold text-nest">Yeni kod</p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            value={newCode}
            onChange={(e) => setNewCode(e.target.value)}
            placeholder="Kod (ör. HRAM2026)"
            className="min-w-0 flex-1 rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none"
          />
          <input
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            placeholder="Not / etiket"
            className="min-w-0 flex-1 rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none"
          />
          <button type="submit" className="btn-primary shrink-0 px-4 py-2.5 text-sm">
            Ekle
          </button>
        </div>
        {err && <p className="text-xs text-danger">{err}</p>}
      </form>

      {loading && (
        <p className="mb-3 text-xs text-muted">Sunucudan yükleniyor…</p>
      )}

      <ul className="space-y-2">
        {codes.map((c) => (
          <li
            key={c.code}
            className="rounded-2xl border border-border bg-white p-4 shadow-sm"
          >
            <div className="flex flex-wrap items-start gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-sm font-bold text-nest">
                    {c.code}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      c.active ? "bg-gain-soft text-gain" : "bg-beige text-muted"
                    }`}
                  >
                    {c.active ? "Aktif" : "Pasif"}
                  </span>
                </div>
                {c.label && (
                  <p className="mt-1 text-xs text-muted">{c.label}</p>
                )}
                <p className="mt-1 text-[10px] text-muted">
                  Kullanım: {c.useCount} ·{" "}
                  {new Date(c.createdAt).toLocaleString("tr-TR")}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  role="switch"
                  aria-checked={c.active}
                  onClick={async () => {
                    const res = await setReferralCodeActive(c.code, !c.active);
                    refresh();
                    if (!res.ok) {
                      setErr(res.error);
                      return;
                    }
                    flash(
                      res.warning
                        ? `${c.active ? "Pasif" : "Aktif"} (${res.warning})`
                        : c.active
                          ? "Pasif"
                          : "Aktif",
                    );
                    if (res.warning) setErr(res.warning);
                  }}
                  className={`toggle ${c.active ? "on" : ""}`}
                />
                <button
                  type="button"
                  onClick={async () => {
                    const res = await deleteReferralCode(c.code);
                    refresh();
                    if (!res.ok) {
                      setErr(res.error);
                      return;
                    }
                    flash(
                      res.warning ? `Silindi (${res.warning})` : "Silindi",
                    );
                    if (res.warning) setErr(res.warning);
                  }}
                  className="rounded-full bg-beige px-3 py-1.5 text-xs font-semibold text-danger"
                >
                  Sil
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      {toast && (
        <div className="fixed bottom-8 left-1/2 z-50 -translate-x-1/2 rounded-full bg-nest-solid px-4 py-2 text-xs font-medium text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
