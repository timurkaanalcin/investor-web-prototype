"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { BrandLogo } from "@/components/BrandLogo";
import { IconArrowRight, IconCheck, IconInfo } from "@/components/Icons";
import { saveOnboardingChoices } from "@/lib/storage";

const GOALS = [
  {
    id: "emeklilik",
    title: "Emeklilik",
    desc: "Uzun vadeli büyüme ile geleceğimi güvence altına almak.",
    emoji: "🪺",
  },
  {
    id: "ev",
    title: "Ev peşinatı",
    desc: "Kısa-orta vadede birikim yapıp hayalimdeki evin peşinatını biriktirmek.",
    emoji: "🏠",
  },
  {
    id: "genel",
    title: "Genel birikim",
    desc: "Esnek birikim yapıp fırsatlara karşı hazırlıklı olmak.",
    emoji: "🐷",
  },
];

const RISKS = ["muhafazakar", "dengeli", "atilgan"] as const;
const RISK_LABELS = ["Muhafazakâr", "Dengeli", "Atılgan"];

export default function OnboardingPage() {
  const router = useRouter();
  const [goal, setGoal] = useState("emeklilik");
  const [riskIdx, setRiskIdx] = useState(1);
  const pct = useMemo(() => (riskIdx / 2) * 100, [riskIdx]);

  function continueNext() {
    saveOnboardingChoices(goal, RISKS[riskIdx]);
    router.push("/onboarding/onerilen");
  }

  return (
    <div className="flex min-h-full flex-col px-5 pb-8 pt-6">
      <div className="flex justify-center">
        <BrandLogo size="md" showIcon={false} />
      </div>

      <div className="mt-5 flex justify-center gap-2">
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className={`h-1.5 w-1.5 rounded-full ${
              i === 0 ? "bg-nest-solid" : "bg-border"
            }`}
          />
        ))}
      </div>

      <h1 className="mt-6 text-2xl font-bold text-nest">Hedefin nedir?</h1>
      <p className="mt-1 text-sm text-muted">Buna göre portföy öneririz.</p>

      <div className="mt-5 flex flex-col gap-3">
        {GOALS.map((g) => {
          const selected = goal === g.id;
          return (
            <button
              key={g.id}
              type="button"
              onClick={() => setGoal(g.id)}
              className={`relative flex items-start gap-3 rounded-2xl border p-4 text-left transition-colors ${
                selected
                  ? "border-nest-blue/40 bg-sage-muted"
                  : "border-transparent bg-card shadow-sm"
              }`}
            >
              <span className="text-2xl" aria-hidden>
                {g.emoji}
              </span>
              <span className="flex-1">
                <span className="block text-sm font-semibold text-nest">
                  {g.title}
                </span>
                <span className="mt-0.5 block text-xs leading-relaxed text-muted">
                  {g.desc}
                </span>
              </span>
              {selected && (
                <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-nest-blue text-white">
                  <IconCheck size={12} />
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-7">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-nest">Risk seviyesi</h2>
          <button
            type="button"
            className="inline-flex items-center gap-1 text-xs text-muted"
          >
            <IconInfo size={14} /> Daha fazla bilgi
          </button>
        </div>
        <input
          type="range"
          min={0}
          max={2}
          step={1}
          value={riskIdx}
          onChange={(e) => setRiskIdx(Number(e.target.value))}
          className="nest-slider"
          style={{ ["--pct" as string]: `${pct}%` }}
          aria-label="Risk seviyesi"
        />
        <div className="mt-2 flex justify-between text-[11px]">
          {RISK_LABELS.map((label, i) => (
            <span
              key={label}
              className={
                i === riskIdx ? "font-semibold text-nest" : "text-muted"
              }
            >
              {label}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-auto pt-8">
        <button
          type="button"
          onClick={continueNext}
          className="btn-primary flex w-full items-center justify-center gap-2 py-3.5 text-base"
        >
          Devam <IconArrowRight size={18} />
        </button>
        <p className="mt-3 text-center text-xs text-muted">
          İstediğin zaman değiştirebilirsin.
        </p>
      </div>
    </div>
  );
}
