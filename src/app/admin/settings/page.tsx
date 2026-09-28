"use client";

import { ADMIN_PIN } from "@/lib/payment-config";
import { setAdminUnlocked } from "@/lib/money-requests";
import { clearCrmSession } from "@/lib/crm/data";
import { useRouter } from "next/navigation";

export default function CrmSettingsPage() {
  const router = useRouter();

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold text-black">Ayarlar</h1>
      <p className="mt-1 text-sm text-neutral-500">HRAM CRM · Broker Desk prototipi</p>

      <div className="mt-5 space-y-3">
        <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-semibold text-black">Kimlik doğrulama</p>
          <p className="mt-1 text-xs text-neutral-500">
            PIN kapısı: <span className="font-mono font-semibold text-black">{ADMIN_PIN}</span>{" "}
            veya personel girişi <span className="font-medium text-black">/log</span>.
            Gerçek SSO / 2FA yok.
          </p>
          <button
            type="button"
            onClick={() => {
              clearCrmSession();
              setAdminUnlocked(false);
              router.replace("/log/");
            }}
            className="mt-3 rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-neutral-50"
          >
            Oturumu kilitle
          </button>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-semibold text-black">Veri katmanı</p>
          <ul className="mt-2 list-inside list-disc space-y-1 text-xs text-neutral-500">
            <li>Müşteriler → investor_auth_users</li>
            <li>Sohbet → investor_live_support_threads</li>
            <li>Para → investor_money_requests</li>
            <li>Referans → hram_referral_codes</li>
            <li>Masalar / çalışanlar / biletler → hram_crm_*</li>
          </ul>
          <p className="mt-2 text-xs text-neutral-500">
            Natro&apos;da Prisma / sunucu yok — statik export.
          </p>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-semibold text-black">Shift personeli</p>
          <p className="mt-1 text-xs text-neutral-500">
            Magda (magda@hram.tr) ve Alisa (alisa@hram.tr) shift yetkisiyle
            /log üzerinden giriş yapar; tam Admin menüsü yoktur.
          </p>
        </div>
      </div>
    </div>
  );
}
