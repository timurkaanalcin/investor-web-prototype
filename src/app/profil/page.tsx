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
    flash(next ? "Koyu tema" : "Açık tema");
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
    <div className="mt-5 flex flex-col items-center md:mt-0 md:items-start md:pt-1">
      <div className="relative">
        <div className="profile-avatar-ring flex h-24 w-24 items-center justify-center rounded-full bg-nest-solid text-3xl font-bold tracking-tight text-white md:h-28 md:w-28 md:text-4xl">
          {USER.initials}
        </div>
        <span className="absolute -bottom-0.5 -right-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-[#22a06b] text-white ring-2 ring-background">
          <IconShield size={14} />
        </span>
      </div>
      <p className="profile-text mt-4 text-2xl font-semibold tracking-tight md:text-[1.75rem]">
        {USER.name}
      </p>
      <p className="profile-text-secondary mt-1 text-sm">Hesap ayarları</p>
      <span className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-nest-solid/90 px-3 py-1 text-[11px] font-semibold tracking-wide text-white shadow-sm">
        <IconCrown /> {USER.tier}
      </span>
    </div>
  );

  return (
    <div className="profile-page px-5 pb-6 md:px-0 md:pb-0">
      <header className="flex items-center justify-between pt-5 pb-1 md:hidden">
        <button
          type="button"
          aria-label="Menü"
          className="profile-text active:opacity-70 min-h-[44px] min-w-[44px]"
          onClick={() => flash("Menü (prototip)")}
        >
          <IconMenu />
        </button>
        <h1 className="profile-text text-lg font-semibold tracking-tight">
          Profil
        </h1>
        <button
          type="button"
          aria-label="Bildirimler"
          className="relative profile-text active:opacity-70 min-h-[44px] min-w-[44px]"
          onClick={toggleNotif}
        >
          <IconBell />
          {notif && (
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-nest-blue" />
          )}
        </button>
      </header>

      <h1 className="profile-text mb-8 hidden text-[2rem] font-semibold tracking-tight md:block">
        Profil
      </h1>

      <div className="desk-grid-profile">
        {avatar}

        <div className="profile-menu mt-7 md:mt-0">
          {(
            [
              {
                id: "security" as const,
                label: "Hesap ve güvenlik",
                icon: IconShield,
              },
              {
                id: "banks" as const,
                label: "Bağlı banka hesapları",
                icon: IconBank,
              },
            ] as const
          ).map((row) => {
            const Icon = row.icon;
            return (
              <button
                key={row.id}
                type="button"
                onClick={() => setSheet(row.id)}
                className="profile-row"
              >
                <span className="profile-icon-chip">
                  <Icon size={18} />
                </span>
                <span className="profile-text flex-1 text-[15px] font-medium">
                  {row.label}
                </span>
                <IconChevron className="profile-text-secondary opacity-70" />
              </button>
            );
          })}

          <div className="profile-row">
            <span className="profile-icon-chip">
              <IconBell size={18} />
            </span>
            <span className="profile-text flex-1 text-[15px] font-medium">
              Bildirimler
            </span>
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
              {
                id: "fees" as const,
                label: "Ücretler ve belgeler",
                icon: IconDoc,
              },
              { id: "help" as const, label: "Yardım", icon: IconHelp },
            ] as const
          ).map((row) => {
            const Icon = row.icon;
            return (
              <button
                key={row.id}
                type="button"
                onClick={() => setSheet(row.id)}
                className="profile-row"
              >
                <span className="profile-icon-chip">
                  <Icon size={18} />
                </span>
                <span className="profile-text flex-1 text-[15px] font-medium">
                  {row.label}
                </span>
                <IconChevron className="profile-text-secondary opacity-70" />
              </button>
            );
          })}

          <div className="profile-row">
            <span className="profile-icon-chip">
              <IconSun size={18} />
            </span>
            <span className="profile-text flex-1 text-[15px] font-medium">
              Karanlık mod
            </span>
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
            className="profile-row"
          >
            <span className="profile-icon-chip profile-icon-chip-danger">
              <IconLogout size={18} />
            </span>
            <span className="flex-1 text-[15px] font-medium text-danger">
              Çıkış yap
            </span>
          </button>
        </div>
      </div>

      {sheet && sheet !== "logout" && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 backdrop-blur-[2px] sm:items-center sm:p-4"
          onClick={() => setSheet(null)}
          role="presentation"
        >
          <div
            className="profile-sheet w-full max-w-[390px] rounded-t-3xl p-6 md:max-w-md sm:rounded-3xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center justify-between gap-3">
              <h3 className="profile-text text-lg font-semibold tracking-tight">
                {SHEET_COPY[sheet].title}
              </h3>
              <button
                type="button"
                aria-label="Kapat"
                onClick={() => setSheet(null)}
                className="profile-sheet-close rounded-full p-2"
              >
                <IconClose size={18} />
              </button>
            </div>
            <p className="profile-text-secondary mt-3 text-sm leading-relaxed">
              {SHEET_COPY[sheet].body}
            </p>
            <button
              type="button"
              onClick={() => setSheet(null)}
              className="btn-primary mt-6 w-full py-3.5 text-sm"
            >
              Tamam
            </button>
          </div>
        </div>
      )}

      {sheet === "logout" && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 backdrop-blur-[2px] sm:items-center sm:p-4"
          onClick={() => setSheet(null)}
          role="presentation"
        >
          <div
            className="profile-sheet w-full max-w-[390px] rounded-t-3xl p-6 md:max-w-md sm:rounded-3xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <h3 className="profile-text text-lg font-semibold tracking-tight">
              Çıkış yap
            </h3>
            <p className="profile-text-secondary mt-2 text-sm leading-relaxed">
              Oturum kapatılacak ve onboarding&apos;e döneceksiniz. Yerel
              simülasyon verileri temizlenir.
            </p>
            <div className="mt-6 flex gap-2.5">
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
        <div className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-full bg-nest-solid px-4 py-2 text-xs font-medium text-white shadow-lg md:bottom-8">
          {toast}
        </div>
      )}
    </div>
  );
}
