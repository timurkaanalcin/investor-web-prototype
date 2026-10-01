"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CRM_ALL_PERMISSIONS,
  CRM_PERMISSION_PACKS,
  getCrmDesks,
  getCrmEmployees,
  getCrmSession,
  isFullCrmAdmin,
  removeCrmEmployee,
  resetCrmEmployeePassword,
  setCrmEmployeeActive,
  upsertCrmEmployee,
  type CrmEmployee,
  type CrmSession,
} from "@/lib/crm/data";

const EMPTY_FORM = {
  id: "",
  name: "",
  email: "",
  password: "",
  role: "Broker",
  deskId: "desk_sup",
  active: true,
  permissions: [] as string[],
};

export default function CrmEmployeesPage() {
  const [emps, setEmps] = useState<CrmEmployee[]>([]);
  const [deskNames, setDeskNames] = useState<Record<string, string>>({});
  const [desks, setDesks] = useState<{ id: string; name: string }[]>([]);
  const [session, setSession] = useState<CrmSession | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [editing, setEditing] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const canManage = isFullCrmAdmin(session);

  function refresh() {
    setEmps(getCrmEmployees());
    const d = getCrmDesks();
    setDesks(d);
    const map: Record<string, string> = {};
    for (const x of d) map[x.id] = x.name;
    setDeskNames(map);
    setSession(getCrmSession());
  }

  useEffect(() => {
    refresh();
  }, []);

  const sorted = useMemo(
    () =>
      [...emps].sort((a, b) => {
        if (a.active !== b.active) return a.active ? -1 : 1;
        return a.name.localeCompare(b.name, "tr");
      }),
    [emps],
  );

  function openNew() {
    setForm({
      ...EMPTY_FORM,
      deskId: desks[0]?.id || "desk_sup",
      permissions: [...CRM_PERMISSION_PACKS.broker.perms],
    });
    setEditing(true);
    setMsg("");
    setErr("");
  }

  function openEdit(e: CrmEmployee) {
    setForm({
      id: e.id,
      name: e.name,
      email: e.email,
      password: "",
      role: e.role,
      deskId: e.deskId,
      active: e.active,
      permissions: [...(e.permissions || [])],
    });
    setEditing(true);
    setMsg("");
    setErr("");
  }

  function togglePerm(id: string) {
    setForm((f) => {
      const has = f.permissions.includes(id);
      if (has) return { ...f, permissions: f.permissions.filter((p) => p !== id) };
      return { ...f, permissions: [...f.permissions, id] };
    });
  }

  function applyPack(key: string) {
    const pack = CRM_PERMISSION_PACKS[key];
    if (!pack) return;
    setForm((f) => ({ ...f, permissions: [...pack.perms] }));
  }

  function save() {
    if (!canManage) {
      setErr("Sadece Tam yetki (admin) çalışan ekleyebilir/düzenleyebilir");
      return;
    }
    try {
      if (!form.name.trim() || !form.email.trim()) {
        setErr("Ad ve e-posta gerekli");
        return;
      }
      const saved = upsertCrmEmployee({
        id: form.id || undefined,
        name: form.name,
        email: form.email,
        password: form.password || undefined,
        role: form.role,
        deskId: form.deskId,
        active: form.active,
        permissions: form.permissions,
      });
      if (form.id && form.password.trim()) {
        resetCrmEmployeePassword(form.id, form.password.trim());
      }
      setMsg(`${saved.name} kaydedildi`);
      setEditing(false);
      refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Kayıt hatası");
    }
  }

  function deactivate(id: string, active: boolean) {
    if (!canManage) return;
    setCrmEmployeeActive(id, active);
    setMsg(active ? "Aktifleştirildi" : "Pasife alındı");
    refresh();
  }

  function remove(id: string) {
    if (!canManage) return;
    if (!window.confirm("Çalışanı silmek istiyor musunuz?")) return;
    const res = removeCrmEmployee(id);
    if (!res.ok) {
      setErr(res.error || "Silinemedi");
      return;
    }
    setMsg("Silindi");
    refresh();
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-[15px] font-bold text-black">Çalışanlar</h1>
          <p className="text-[11px] text-neutral-500">
            Agent yönetimi · yetki paketleri · Magda/Alisa korumalı shift
          </p>
        </div>
        {canManage ? (
          <button
            type="button"
            onClick={openNew}
            className="h-8 rounded bg-black px-3 text-[11px] font-semibold text-white"
          >
            + Çalışan ekle
          </button>
        ) : (
          <span className="rounded border border-neutral-300 px-2 py-1 text-[10px] text-neutral-500">
            Salt okunur — admin gerekli
          </span>
        )}
      </div>

      {(msg || err) && (
        <p
          className={`mb-2 rounded border px-3 py-1.5 text-[11px] font-semibold ${
            err
              ? "border-neutral-400 bg-neutral-100 text-black"
              : "border-neutral-200 bg-white text-black"
          }`}
        >
          {err || msg}
        </p>
      )}

      <div className="crm-panel overflow-auto rounded">
        <table className="crm-dense-table">
          <thead>
            <tr>
              <th>Ad</th>
              <th>E-posta</th>
              <th>Rol</th>
              <th>Yetkiler</th>
              <th>Masa</th>
              <th>Durum</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((e) => {
              const isFull = (e.permissions || []).includes("admin");
              return (
                <tr key={e.id}>
                  <td className="font-semibold text-black">
                    {e.name}
                    {isFull && (
                      <span className="ml-1.5 rounded bg-black px-1.5 py-0.5 text-[9px] font-bold uppercase text-white">
                        Tam yetki
                      </span>
                    )}
                  </td>
                  <td className="tv-mono text-[10px] text-neutral-600">
                    {e.email}
                  </td>
                  <td className="text-[11px]">{e.role}</td>
                  <td>
                    <div className="flex flex-wrap gap-0.5">
                      {(e.permissions || []).includes("shift") && (
                        <span className="rounded border border-black bg-black px-1.5 py-0.5 text-[9px] font-semibold uppercase text-white">
                          Shift
                        </span>
                      )}
                      {(e.permissions || [])
                        .filter((p) => p !== "shift" && p !== "admin")
                        .slice(0, 5)
                        .map((p) => (
                          <span
                            key={p}
                            className="rounded border border-neutral-300 bg-neutral-50 px-1.5 py-0.5 text-[9px]"
                          >
                            {p}
                          </span>
                        ))}
                      {(e.permissions || []).filter(
                        (p) => p !== "shift" && p !== "admin",
                      ).length > 5 && (
                        <span className="text-[9px] text-neutral-500">
                          +
                          {(e.permissions || []).filter(
                            (p) => p !== "shift" && p !== "admin",
                          ).length - 5}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="text-[10px] text-neutral-600">
                    {deskNames[e.deskId] || e.deskId}
                  </td>
                  <td>
                    <span
                      className={`rounded px-1.5 py-0.5 text-[9px] font-semibold ${
                        e.active
                          ? "border border-black text-black"
                          : "bg-neutral-100 text-neutral-500"
                      }`}
                    >
                      {e.active ? "Aktif" : "Pasif"}
                    </span>
                  </td>
                  <td className="whitespace-nowrap">
                    {canManage && (
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => openEdit(e)}
                          className="rounded border border-neutral-300 px-1.5 py-0.5 text-[10px] font-semibold"
                        >
                          Düzenle
                        </button>
                        <button
                          type="button"
                          onClick={() => deactivate(e.id, !e.active)}
                          className="rounded border border-neutral-300 px-1.5 py-0.5 text-[10px]"
                        >
                          {e.active ? "Pasif" : "Aktif"}
                        </button>
                        <button
                          type="button"
                          onClick={() => remove(e.id)}
                          className="rounded border border-neutral-300 px-1.5 py-0.5 text-[10px] text-neutral-600"
                        >
                          Sil
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {editing && canManage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3">
          <div className="max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded border border-neutral-200 bg-white p-4 shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-[14px] font-bold">
                {form.id ? "Çalışan düzenle" : "Yeni çalışan"}
              </h2>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="text-[12px] underline"
              >
                Kapat
              </button>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <label className="text-[11px]">
                Ad
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="mt-0.5 h-8 w-full rounded border border-neutral-200 px-2 text-[12px]"
                />
              </label>
              <label className="text-[11px]">
                E-posta
                <input
                  value={form.email}
                  disabled={!!form.id}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="mt-0.5 h-8 w-full rounded border border-neutral-200 px-2 text-[12px] disabled:bg-neutral-50"
                />
              </label>
              <label className="text-[11px]">
                Rol
                <input
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="mt-0.5 h-8 w-full rounded border border-neutral-200 px-2 text-[12px]"
                />
              </label>
              <label className="text-[11px]">
                Masa
                <select
                  value={form.deskId}
                  onChange={(e) => setForm({ ...form, deskId: e.target.value })}
                  className="mt-0.5 h-8 w-full rounded border border-neutral-200 px-2 text-[12px]"
                >
                  {desks.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-[11px] sm:col-span-2">
                Şifre {form.id ? "(boş = değiştirme)" : ""}
                <input
                  type="text"
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                  className="mt-0.5 h-8 w-full rounded border border-neutral-200 px-2 text-[12px]"
                  placeholder={form.id ? "Yeni şifre…" : "En az 4 karakter"}
                />
              </label>
            </div>

            <div className="mt-3">
              <p className="mb-1 text-[11px] font-semibold">Yetki paketi</p>
              <div className="mb-2 flex flex-wrap gap-1">
                {Object.entries(CRM_PERMISSION_PACKS).map(([k, v]) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => applyPack(k)}
                    className="rounded border border-neutral-300 px-2 py-0.5 text-[10px] font-semibold hover:bg-neutral-50"
                  >
                    {v.label}
                  </button>
                ))}
              </div>
              <div className="grid max-h-48 grid-cols-2 gap-1 overflow-y-auto rounded border border-neutral-100 bg-neutral-50 p-2">
                {CRM_ALL_PERMISSIONS.map((p) => (
                  <label
                    key={p.id}
                    className="flex cursor-pointer items-center gap-1.5 text-[11px]"
                  >
                    <input
                      type="checkbox"
                      checked={form.permissions.includes(p.id)}
                      onChange={() => togglePerm(p.id)}
                    />
                    <span
                      className={
                        p.id === "admin" ? "font-bold text-black" : ""
                      }
                    >
                      {p.label}
                    </span>
                  </label>
                ))}
              </div>
              {form.permissions.includes("admin") && (
                <p className="mt-1 rounded bg-black px-2 py-1 text-[10px] font-semibold text-white">
                  Tam yetki — platformun tamamını yönetebilir
                </p>
              )}
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="h-8 rounded border border-neutral-300 px-3 text-[11px]"
              >
                İptal
              </button>
              <button
                type="button"
                onClick={save}
                className="h-8 rounded bg-black px-3 text-[11px] font-semibold text-white"
              >
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
