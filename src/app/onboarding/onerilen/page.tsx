"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BrandLogo } from "@/components/BrandLogo";
import { DonutChart } from "@/components/Charts";
import { IconBell, IconDoc, IconInfo, IconTrend } from "@/components/Icons";
import { RECOMMENDED } from "@/lib/mock-data";
import {
  completeOnboarding,
  getOnboardingChoices,
} from "@/lib/storage";

const GOAL_LABELS: Record<string, string> = {
  emeklilik: "Emeklilik",
  ev: "Ev peşinatı",
  genel: "Genel birikim",
};

const RISK_LABELS: Record<string, string> = {
  muhafazakar: "Muhafazakâr risk",
  dengeli: "Dengeli risk",
  atilgan: "Atılgan risk",
};

export default function RecommendedPage() {
  const router = useRouter();
  const [meta, setMeta] = useState({ goal: "Emeklilik", risk: "Dengeli risk" });

  useEffect(() => {
    const c = getOnboardingChoices();
    setMeta({
      goal: GOAL_LABELS[c.goal] || "Emeklilik",
      risk: RISK_LABELS[c.risk] || "Dengeli risk",
    });
  }, []);

  function start() {
    completeOnboarding();
    router.push("/");
  }

  return (
    <div className="flex min-h-full flex-col px-5 pb-8 pt-5">
      <header className="flex items-center justify-between">
        <BrandLogo size="sm" />
        <button type="button" aria-label="Bildirimler" className="text-nest">
          <IconBell />
        </button>
      </header>

      <h1 className="mt-5 text-2xl font-bold leading-tight text-nest">
        Sana önerilen portföy
      </h1>
      <p className="mt-1 text-sm text-muted">
        {meta.goal} · {meta.risk}
      </p>

      <div className="mt-6 flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:justify-center sm:gap-6">
        <DonutChart
          segments={RECOMMENDED}
          centerTitle="%70 Hisse"
          centerSub="Dengeli risk için temel büyüme"
        />
        <ul className="flex flex-row gap-4 text-xs sm:flex-col sm:gap-2">
          {RECOMMENDED.map((s) => (
            <li key={s.label} className="flex items-center gap-2 text-nest">
              <span
                className="h-3 w-3 rounded-sm"
                style={{ background: s.color }}
              />
              {s.label} %{s.pct}
            </li>
          ))}
        </ul>
      </div>

      <div className="card mt-6 flex items-center gap-3 p-4">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-sage-muted text-nest">
          <IconTrend />
        </span>
        <div className="flex-1">
          <p className="text-sm font-semibold text-nest">
            Tahmini yıllık getiri ~%7–9
          </p>
        </div>
        <IconInfo className="text-muted" />
      </div>
      <p className="mt-2 text-[11px] leading-relaxed text-muted">
        Geçmiş performans gelecekteki getirilerin garantisi değildir.
      </p>

      <div className="mt-4 flex items-center gap-3 px-1 py-2">
        <IconDoc className="text-nest" />
        <span className="flex-1 text-sm font-medium text-nest">Yıllık ücret</span>
        <span className="text-sm font-semibold text-nest">%0,25</span>
      </div>

      <div className="mt-auto flex gap-3 pt-8">
        <button
          type="button"
          onClick={start}
          className="btn-primary flex-1 py-3.5 text-sm"
        >
          Bu portföylerle başla
        </button>
        <button
          type="button"
          onClick={() => router.push("/onboarding")}
          className="btn-secondary flex-1 py-3.5 text-sm"
        >
          Risk seviyesini değiştir
        </button>
      </div>
    </div>
  );
}
