"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { setAdminUnlocked } from "@/lib/money-requests";
import {
  clearCrmSession,
  getCrmSession,
  isFullCrmAdmin,
} from "@/lib/crm/data";
import {
  getPlatformSettings,
  setPlatformSettings,
  type PlatformSettings,
} from "@/lib/crm/admin-ops";

export default function CrmSettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [msg, setMsg] = useState("");
  const [canEdit, setCanEdit] = useState(false);

  useEffect(() => {
    setSettings(getPlatformSettings());
    setCanEdit(isFullCrmAdmin(getCrmSession()));
  }, []);

  function patch(p: Partial<PlatformSettings>) {
    if (!canEdit) return;
    const next = setPlatformSettings(p);
    setSettings(next);
    setMsg("Kaydedildi");
  }

  if (!settings) {
    return <p className="text-sm text-neutral-500">Yükleniyor…</p>;
  }

  const toggles: {
    key: keyof PlatformSettings;
    label: string;
    hint: string;
  }[] = [
    {
      key: "featureLiveChat",
      label: "Canlı destek",
      hint: "Müşteri sohbet widget",
    },
    {
      key: "featureTrading",
      label: "İşlem (trade)",
      hint: "Trade UI erişimi",
    },
    {
      key: "featureDeposits",
      label: "Yatırma",
      hint: "Yatırma talepleri",
    },
    {
      key: "featureWithdrawals",
      label: "Çekme",
      hint: "Çekim talepleri",
    },
    {
      key: "featureReferrals",
      label: "Referans kodları",
      hint: "Kayıtta referans zorunluluğu",
    },
    {
      key: "tradingHalt",
      label: "İşlem durdurma (halt)",
      hint: "Mock — yeni emirleri engelle bayrağı",
    },
    {
      key: "announcementEnabled",
      label: "Duyuru bandı",
      hint: "Müşteri arayüzünde banner",
    },
  ];

  return (
    <div className="max-w-2xl">
      <div className="mb-3">
        <h1 className="text-[15px] font-bold text-black">Ayarlar</h1>
        <p className="text-[11px] text-neutral-500">
          Platform kontrolleri · yalnızca Tam yetki düzenler
        </p>
      </div>

      {msg && (
        <p className="mb-2 rounded border border-neutral-200 bg-white px-3 py-1.5 text-[11px] font-semibold">
          {msg}
        </p>
      )}

      {!canEdit && (
        <p className="mb-3 rounded border border-neutral-300 bg-neutral-50 px-3 py-2 text-[11px]">
          Salt okunur — admin / PIN gerekli
        </p>
      )}

      <div className="space-y-2">
        <section className="crm-panel rounded p-3">
          <p className="mb-2 text-[12px] font-bold">Özellik anahtarları</p>
          <ul className="space-y-2">
            {toggles.map((t) => (
              <li
                key={t.key}
                className="flex items-center justify-between gap-3 border-b border-neutral-100 pb-2 last:border-0 last:pb-0"
              >
                <div>
                  <p className="text-[12px] font-semibold text-black">
                    {t.label}
                  </p>
                  <p className="text-[10px] text-neutral-500">{t.hint}</p>
                </div>
                <button
                  type="button"
                  disabled={!canEdit}
                  onClick={() =>
                    patch({ [t.key]: !settings[t.key] } as Partial<PlatformSettings>)
                  }
                  className={`h-7 min-w-[52px] rounded px-2 text-[10px] font-bold ${
                    settings[t.key]
                      ? "bg-black text-white"
                      : "border border-neutral-300 bg-white text-neutral-500"
                  } disabled:opacity-50`}
                >
                  {settings[t.key] ? "AÇIK" : "KAPALI"}
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section className="crm-panel rounded p-3">
          <p className="mb-2 text-[12px] font-bold">Varsayılan referans kodu</p>
          <div className="flex gap-2">
            <input
              value={settings.defaultReferralCode}
              disabled={!canEdit}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  defaultReferralCode: e.target.value.toUpperCase(),
                })
              }
              className="tv-mono h-8 flex-1 rounded border border-neutral-200 px-2 text-[12px] disabled:bg-neutral-50"
            />
            <button
              type="button"
              disabled={!canEdit}
              onClick={() =>
                patch({ defaultReferralCode: settings.defaultReferralCode })
              }
              className="h-8 rounded bg-black px-3 text-[11px] font-semibold text-white disabled:opacity-50"
            >
              Kaydet
            </button>
          </div>
        </section>

        <section className="crm-panel rounded p-3">
          <p className="mb-2 text-[12px] font-bold">Müşteri duyuru bandı</p>
          <textarea
            value={settings.announcementBanner}
            disabled={!canEdit}
            onChange={(e) =>
              setSettings({ ...settings, announcementBanner: e.target.value })
            }
            rows={3}
            placeholder="Örn: Planlı bakım 22:00'de…"
            className="w-full rounded border border-neutral-200 px-2 py-1.5 text-[12px] disabled:bg-neutral-50"
          />
          <button
            type="button"
            disabled={!canEdit}
            onClick={() =>
              patch({ announcementBanner: settings.announcementBanner })
            }
            className="mt-2 h-8 rounded bg-black px-3 text-[11px] font-semibold text-white disabled:opacity-50"
          >
            Duyuruyu kaydet
          </button>
          {settings.announcementEnabled && settings.announcementBanner && (
            <div className="mt-2 rounded border border-black bg-neutral-900 px-3 py-2 text-[11px] text-white">
              Önizleme: {settings.announcementBanner}
            </div>
          )}
        </section>

        <section className="crm-panel rounded p-3">
          <p className="text-[12px] font-bold">Kimlik doğrulama</p>
          <p className="mt-1 text-[11px] text-neutral-500">
            PIN sunucu ortamında yapılandırılır (istemciye gömülmez). {" "}
            · Personel: /log · Magda/Alisa shift korunur
          </p>
          <button
            type="button"
            onClick={() => {
              clearCrmSession();
              setAdminUnlocked(false);
              router.replace("/log/");
            }}
            className="mt-2 rounded border border-neutral-300 px-3 py-1.5 text-[11px] font-semibold"
          >
            Oturumu kilitle
          </button>
        </section>

        <section className="crm-panel rounded p-3">
          <p className="text-[12px] font-bold">Veri katmanı</p>
          <ul className="mt-1 list-inside list-disc text-[10px] text-neutral-500">
            <li>Müşteriler → hram_auth_users + hram_crm_customer_*</li>
            <li>Platform ayarları → hram_platform_settings_v1</li>
            <li>Çalışanlar → hram_crm_employees</li>
            <li>Statik export · Prisma yok</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
