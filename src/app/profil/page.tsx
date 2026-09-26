"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  IconBank,
  IconBell,
  IconChevron,
  IconClose,
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
  clearSession,
  getDarkMode,
  getNotifications,
  setDarkMode,
  setNotifications,
} from "@/lib/storage";

type SheetId =
  | "security"
  | "banks"
  | "fees"
  | "help"
  | "logout"
  | null;

const SHEET_COPY: Record<
  Exclude<SheetId, null | "logout">,
  { title: string; body: string }
> = {
  security: {
    title: "Hesap ve güvenlik",
    body: "Şifre, iki adımlı doğrulama ve oturum yönetimi yakında. Bu bir prototiptir.",
  },
  banks: {
    title: "Bağlı banka hesapları",
    body: "Garanti BBVA · *4521 bağlı. Yeni hesap ekleme bu sürümde simülasyondur.",
  },
  fees: {
    title: "Ücretler ve belgeler",
    body: "Yönetim ücreti: yıllık %0,25. Vergi ve sözleşme belgeleri yakında indirilebilir olacak.",
  },
  help: {
    title: "Yardım",
    body: "Destek: destek@investor.app · SSS ve sohbet yakında eklenecek.",
  },
};

export default function ProfilePage() {
  const router = useRouter();
  const [dark, setDark] = useState(false);
  const [notif, setNotif] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [sheet, setSheet] = useState<SheetId>(null);

  useEffect(() => {
    setDark(getDarkMode());
    setNotif(getNotifications());
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

  function toggleNotif() {
    const next = !notif;
    setNotif(next);
    setNotifications(next);
    flash(next ? "Bildirimler açıldı" : "Bildirimler kapatıldı");
  }

  function confirmLogout() {
    clearSession();
    setSheet(null);
    router.push("/onboarding");
  }

  const avatar = (
      <div className="mt-6 flex flex-col items-center md:mt-0 md:items-start md:pt-2">
        <div className="relative">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-nest text-2xl font-bold text-white shadow-md md:h-24 md:w-24 md:text-3xl">
            {USER.initials}
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-[#22a06b] text-white ring-2 ring-background">
            <IconShield size={14} />
          </span>
        </div>
        <p className="mt-3 text-lg font-bold text-nest md:text-xl">{USER.name}</p>
        <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-nest px-2.5 py-1 text-[11px] font-medium text-white">
          <IconCrown /> {USER.tier}
        </span>
      </div>
  );

  return (
    <div className="px-5 pb-6 md:px-0 md:pb-0">
      <header className="flex items-center justify-between pt-5 pb-2 md:hidden">
        <button
          type="button"
          aria-label="Menü"
          className="text-nest active:opacity-70 min-h-[44px] min-w-[44px]"
          onClick={() => flash("Menü (prototip)")}
        >
          <IconMenu />
        </button>
        <h1 className="text-lg font-bold text-nest">Profil</h1>
        <button
          type="button"
          aria-label="Bildirimler"
          className="relative text-nest active:opacity-70 min-h-[44px] min-w-[44px]"
          onClick={toggleNotif}
        >
          <IconBell />
          {notif && (
            <span className="absolute right-0 top-0 h-2 w-2 rounded-full bg-nest-blue" />
          )}
        </button>
      </header>

      <h1 className="mb-6 hidden text-3xl font-bold text-nest md:block">Profil</h1>

      <div className="md:desk-grid-profile">
        {avatar}
        <div className="card mt-6 overflow-hidden md:mt-0">
        {(
          [
            { id: "security" as const, label: "Hesap ve güvenlik", icon: IconShield },
            { id: "banks" as const, label: "Bağlı banka hesapları", icon: IconBank },
          ] as const
        ).map((row, i) => {
          const Icon = row.icon;
          return (
            <button
              key={row.id}
              type="button"
              onClick={() => setSheet(row.id)}
              className={`flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors active:bg-sage-muted/40 ${
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
            <IconBell size={18} />
          </span>
          <span className="flex-1 text-sm font-medium text-nest">Bildirimler</span>
          <button
            type="button"
            role="switch"
            aria-checked={notif}
            onClick={toggleNotif}
            className={`toggle ${notif ? "on" : ""}`}
            aria-label="Bildirimler"
          />
        </div>

        {(
          [
            { id: "fees" as const, label: "Ücretler ve belgeler", icon: IconDoc },
            { id: "help" as const, label: "Yardım", icon: IconHelp },
          ] as const
        ).map((row) => {
          const Icon = row.icon;
          return (
            <button
              key={row.id}
              type="button"
              onClick={() => setSheet(row.id)}
              className="flex w-full items-center gap-3 border-t border-black/5 px-4 py-3.5 text-left transition-colors active:bg-sage-muted/40"
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
          onClick={() => setSheet("logout")}
          className="flex w-full items-center gap-3 border-t border-black/5 px-4 py-3.5 text-left active:bg-red-50/60"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50 text-danger">
            <IconLogout size={18} />
          </span>
          <span className="flex-1 text-sm font-medium text-danger">Çıkış yap</span>
        </button>
      </div>
      </div>

      {sheet && sheet !== "logout" && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:p-4"
          onClick={() => setSheet(null)}
          role="presentation"
        >
          <div
            className="w-full max-w-[390px] md:max-w-md rounded-t-3xl bg-card p-5 shadow-2xl sm:rounded-3xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-nest">
                {SHEET_COPY[sheet].title}
              </h3>
              <button
                type="button"
                aria-label="Kapat"
                onClick={() => setSheet(null)}
                className="rounded-full bg-beige p-2"
              >
                <IconClose size={18} />
              </button>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              {SHEET_COPY[sheet].body}
            </p>
            <button
              type="button"
              onClick={() => setSheet(null)}
              className="btn-primary mt-5 w-full py-3.5 text-sm"
            >
              Tamam
            </button>
          </div>
        </div>
      )}

      {sheet === "logout" && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:p-4"
          onClick={() => setSheet(null)}
          role="presentation"
        >
          <div
            className="w-full max-w-[390px] md:max-w-md rounded-t-3xl bg-card p-5 shadow-2xl sm:rounded-3xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <h3 className="text-lg font-bold text-nest">Çıkış yap</h3>
            <p className="mt-2 text-sm text-muted">
              Oturum kapatılacak ve onboarding&apos;e döneceksiniz. Yerel
              simülasyon verileri temizlenir.
            </p>
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => setSheet(null)}
                className="btn-secondary flex-1 py-3 text-sm"
              >
                İptal
              </button>
              <button
                type="button"
                onClick={confirmLogout}
                className="flex-1 rounded-[14px] bg-danger py-3 text-sm font-semibold text-white"
              >
                Çıkış yap
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 md:bottom-8 rounded-full bg-nest px-4 py-2 text-xs font-medium text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
