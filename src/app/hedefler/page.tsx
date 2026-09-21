"use client";

import { useState } from "react";
import { NestLogo } from "@/components/NestLogo";
import {
  IconCalendar,
  IconPiggy,
  IconPlus,
} from "@/components/Icons";
import { GOALS, formatTRY } from "@/lib/mock-data";

export default function GoalsPage() {
  const [toast, setToast] = useState<string | null>(null);
  const featured = GOALS.find((g) => g.featured)!;
  const others = GOALS.filter((g) => !g.featured);

  function flash(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 1800);
  }

  return (
    <div className="px-5 pb-6">
      <header className="flex items-center justify-between pt-5 pb-2">
        <NestLogo size="sm" showIcon={false} />
        <button
          type="button"
          onClick={() => flash("Yeni hedef (prototip)")}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-sage-muted text-nest"
          aria-label="Yeni hedef"
        >
          <IconPlus />
        </button>
      </header>

      <h1 className="mt-2 text-2xl font-bold text-nest">Hedefler</h1>

      <div className="relative mt-5 overflow-hidden rounded-2xl bg-nest p-5 text-white">
        <p className="text-xs font-medium text-white/70">Öne çıkan hedef</p>
        <p className="mt-1 text-xl font-semibold">{featured.title}</p>
        <p className="mt-1 text-xs text-white/70">
          Hedef: {formatTRY(featured.target)}
        </p>
        <div className="mt-4 flex items-end justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold">
                {formatTRY(featured.current)}
              </span>
              <span className="text-sm font-semibold text-sage">
                %{featured.pct}
              </span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/20">
              <div
                className="h-full rounded-full bg-sage"
                style={{ width: `${featured.pct}%` }}
              />
            </div>
            <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-white/75">
              <IconCalendar size={13} /> Tahmini tarih: {featured.eta}
            </p>
          </div>
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-sage/30 text-3xl">
            🛡️
          </div>
        </div>
      </div>

      <ul className="mt-4 space-y-3">
        {others.map((g) => (
          <li key={g.id} className="card flex items-center gap-3 p-3.5">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-sage-muted text-xl">
              {g.icon === "palm" ? "🌴" : "🏡"}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-nest">{g.title}</p>
              <p className="text-xs text-muted">
                {formatTRY(g.current)} / {formatTRY(g.target)}
              </p>
            </div>
            <div className="w-16 text-right">
              <p className="text-xs font-semibold text-nest">%{g.pct}</p>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-sage-soft">
                <div
                  className="h-full rounded-full bg-nest"
                  style={{ width: `${g.pct}%` }}
                />
              </div>
            </div>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={() => flash("Yeni hedef (prototip)")}
        className="btn-primary mt-5 flex w-full items-center justify-center gap-2 py-3.5 text-sm"
      >
        <IconPiggy /> Yeni hedef
      </button>

      {toast && (
        <div className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-full bg-nest px-4 py-2 text-xs font-medium text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
