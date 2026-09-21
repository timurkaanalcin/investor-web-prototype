"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  IconBank,
  IconBell,
  IconChevron,
  IconCrown,
  IconDoc,
  IconHelp,
  IconLogout,
  IconMenu,
  IconShield,
  IconSun,
} from "@/components/Icons";
import { USER } from "@/lib/mock-data";
import {
  getDarkMode,
  resetOnboarding,
  setDarkMode,
} from "@/lib/storage";

const ROWS = [
  { id: "security", label: "Hesap ve güvenlik", icon: IconShield },
  { id: "banks", label: "Bağlı banka hesapları", icon: IconBank },
  { id: "notif", label: "Bildirimler", icon: IconBell },
  { id: "fees", label: "Ücretler ve belgeler", icon: IconDoc },
  { id: "help", label: "Yardım", icon: IconHelp },
];

export default function ProfilePage() {
  const router = useRouter();
  const [dark, setDark] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    setDark(getDarkMode());
  }, []);

  function flash(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 1800);
  }

  function toggleDark() {
    const next = !dark;
    setDark(next);
    setDarkMode(next);
  }

  function logout() {
    resetOnboarding();
    router.push("/onboarding");
  }

  return (
    <div className="px-5 pb-6">
      <header className="flex items-center justify-between pt-5 pb-2">
        <button type="button" aria-label="Menü" className="text-nest">
          <IconMenu />
        </button>
        <h1 className="text-lg font-bold text-nest">Profil</h1>
        <button type="button" aria-label="Bildirimler" className="relative text-nest">
          <IconBell />
        </button>
      </header>

      <div className="mt-6 flex flex-col items-center">
        <div className="relative">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-nest text-2xl font-bold text-white">
            {USER.initials}
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-nest-light text-white ring-2 ring-background">
            <IconShield size={14} />
          </span>
        </div>
        <p className="mt-3 text-lg font-bold text-nest">{USER.name}</p>
        <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-nest px-2.5 py-1 text-[11px] font-medium text-white">
          <IconCrown /> {USER.tier}
        </span>
      </div>

      <div className="card mt-6 overflow-hidden">
        {ROWS.map((row, i) => {
          const Icon = row.icon;
          return (
            <button
              key={row.id}
              type="button"
              onClick={() => flash(`${row.label} (prototip)`)}
              className={`flex w-full items-center gap-3 px-4 py-3.5 text-left hover:bg-sage-muted/40 ${
                i !== 0 ? "border-t border-black/5" : ""
              }`}
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sage-muted text-nest">
                <Icon size={18} />
              </span>
              <span className="flex-1 text-sm font-medium text-nest">
                {row.label}
              </span>
              <IconChevron className="text-muted" />
            </button>
          );
        })}

        <div className="flex w-full items-center gap-3 border-t border-black/5 px-4 py-3.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sage-muted text-nest">
            <IconSun size={18} />
          </span>
          <span className="flex-1 text-sm font-medium text-nest">Karanlık mod</span>
          <button
            type="button"
            role="switch"
            aria-checked={dark}
            onClick={toggleDark}
            className={`toggle ${dark ? "on" : ""}`}
            aria-label="Karanlık mod"
          />
        </div>

        <button
          type="button"
          onClick={logout}
          className="flex w-full items-center gap-3 border-t border-black/5 px-4 py-3.5 text-left"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50 text-danger">
            <IconLogout size={18} />
          </span>
          <span className="flex-1 text-sm font-medium text-danger">Çıkış yap</span>
        </button>
      </div>

      {toast && (
        <div className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-full bg-nest px-4 py-2 text-xs font-medium text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
