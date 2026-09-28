"use client";

import { useEffect, useState } from "react";
import {
  getCrmDesks,
  getCrmEmployees,
  type CrmEmployee,
} from "@/lib/crm/data";

export default function CrmEmployeesPage() {
  const [emps, setEmps] = useState<CrmEmployee[]>([]);
  const [deskNames, setDeskNames] = useState<Record<string, string>>({});

  useEffect(() => {
    setEmps(getCrmEmployees());
    const map: Record<string, string> = {};
    for (const d of getCrmDesks()) map[d.id] = d.name;
    setDeskNames(map);
  }, []);

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-black">Çalışanlar</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Demo personel — Magda ve Alisa shift (vardiya) yetkisine sahip.
          Giriş: <span className="font-medium text-black">/log</span>
        </p>
      </div>
      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-neutral-200 bg-neutral-50 text-[11px] uppercase text-neutral-500">
            <tr>
              <th className="px-4 py-3">Ad</th>
              <th className="px-4 py-3">E-posta</th>
              <th className="px-4 py-3">Rol</th>
              <th className="px-4 py-3">Yetkiler</th>
              <th className="px-4 py-3">Masa</th>
              <th className="px-4 py-3">Durum</th>
            </tr>
          </thead>
          <tbody>
            {emps.map((e) => (
              <tr key={e.id} className="border-b border-neutral-100 last:border-0">
                <td className="px-4 py-3 font-medium text-black">{e.name}</td>
                <td className="px-4 py-3 text-neutral-600">{e.email}</td>
                <td className="px-4 py-3 text-xs text-black">{e.role}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {(e.permissions || []).includes("shift") && (
                      <span className="rounded-full border border-neutral-800 bg-black px-2 py-0.5 text-[10px] font-semibold uppercase text-white">
                        Shift
                      </span>
                    )}
                    {(e.permissions || [])
                      .filter((p) => p !== "shift")
                      .slice(0, 4)
                      .map((p) => (
                        <span
                          key={p}
                          className="rounded-full border border-neutral-300 bg-neutral-50 px-2 py-0.5 text-[10px] font-medium text-neutral-700"
                        >
                          {p}
                        </span>
                      ))}
                  </div>
                </td>
                <td className="px-4 py-3 text-xs text-neutral-600">
                  {deskNames[e.deskId] || e.deskId}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      e.active
                        ? "border border-neutral-800 bg-neutral-100 text-black"
                        : "bg-neutral-100 text-neutral-500"
                    }`}
                  >
                    {e.active ? "Aktif" : "Pasif"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
