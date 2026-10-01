"use client";

import { useEffect, useState } from "react";
import {
  formatTry,
  getCrmDesks,
  getCrmEmployees,
  type CrmDesk,
} from "@/lib/crm/data";

export default function CrmDesksPage() {
  const [desks, setDesks] = useState<CrmDesk[]>([]);
  const [empByDesk, setEmpByDesk] = useState<Record<string, number>>({});

  useEffect(() => {
    setDesks(getCrmDesks());
    const emps = getCrmEmployees();
    const map: Record<string, number> = {};
    for (const e of emps) {
      if (!e.active) continue;
      map[e.deskId] = (map[e.deskId] || 0) + 1;
    }
    setEmpByDesk(map);
  }, []);

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-nest">Masalar</h1>
        <p className="mt-1 text-sm text-muted">
          Demo masalar (mock) — DeskFlow desk modülünün sade portu
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {desks.map((d) => (
          <div
            key={d.id}
            className="rounded-2xl border border-border bg-white p-5 shadow-sm"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-lg font-bold text-nest">{d.name}</p>
                <p className="text-xs text-muted">{d.type}</p>
              </div>
              <span className="rounded-full bg-beige px-2 py-0.5 text-[10px] font-semibold">
                {empByDesk[d.id] || 0} çalışan
              </span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-beige p-3">
                <p className="text-[10px] uppercase text-muted">Leads</p>
                <p className="text-xl font-bold">{d.leadCount}</p>
              </div>
              <div className="rounded-xl bg-beige p-3">
                <p className="text-[10px] uppercase text-muted">Yatırma</p>
                <p className="text-xl font-bold">{formatTry(d.depositSum)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
