"use client";

import { useEffect, useState } from "react";
import { IconClose } from "./Icons";
import { getNotifications, setNotifications } from "@/lib/storage";
import {
  ensureSeedNotifications,
  getNotificationsFeed,
  getUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
  subscribeMoneyUpdates,
  type NotificationItem,
} from "@/lib/money-requests";

type Props = {
  open: boolean;
  onClose: () => void;
};

function formatWhen(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString("tr-TR", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function NotificationsPanel({ open, onClose }: Props) {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [enabled, setEnabled] = useState(true);
  const [unread, setUnread] = useState(0);

  function refresh() {
    ensureSeedNotifications();
    setItems(getNotificationsFeed());
    setUnread(getUnreadNotificationCount());
    setEnabled(getNotifications());
  }

  useEffect(() => {
    if (!open) return;
    refresh();
    return subscribeMoneyUpdates(refresh);
  }, [open]);

  if (!open) return null;

  function toggleEnabled() {
    const next = !enabled;
    setEnabled(next);
    setNotifications(next);
  }

  function onMarkAll() {
    markAllNotificationsRead();
    refresh();
  }

  function onItem(id: string) {
    markNotificationRead(id);
    refresh();
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex justify-end bg-black/45 backdrop-blur-[2px]"
      onClick={onClose}
      role="presentation"
    >
      <aside
        className="notif-drawer flex h-full w-full max-w-md flex-col bg-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Bildirimler"
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <h2 className="text-lg font-bold text-nest">Bildirimler</h2>
            <p className="text-xs text-muted">{unread} okunmamış</p>
          </div>
          <button
            type="button"
            aria-label="Kapat"
            onClick={onClose}
            className="rounded-full bg-beige p-2 text-nest"
          >
            <IconClose size={18} />
          </button>
        </div>

        <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-3">
          <div>
            <p className="text-sm font-medium text-nest">Bildirimler açık</p>
            <p className="text-[11px] text-muted">
              Kapalıyken yeni uyarılar sessiz kalır (prototip)
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={enabled}
            onClick={toggleEnabled}
            className={`toggle ${enabled ? "on" : ""}`}
            aria-label="Bildirimleri aç/kapat"
          />
        </div>

        <div className="flex items-center justify-between px-5 py-2">
          <button
            type="button"
            onClick={onMarkAll}
            className="text-xs font-semibold text-nest underline-offset-2 hover:underline"
          >
            Tümünü okundu işaretle
          </button>
        </div>

        <ul className="flex-1 overflow-y-auto px-3 pb-6">
          {items.length === 0 && (
            <li className="px-2 py-10 text-center text-sm text-muted">
              Henüz bildirim yok
            </li>
          )}
          {items.map((n) => (
            <li key={n.id}>
              <button
                type="button"
                onClick={() => onItem(n.id)}
                className={`mb-2 w-full rounded-2xl border border-border p-3.5 text-left transition-colors ${
                  n.read ? "bg-card opacity-80" : "bg-beige"
                }`}
              >
                <div className="flex items-start gap-2">
                  {!n.read && (
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-danger" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-nest">{n.title}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-muted">
                      {n.body}
                    </p>
                    <p className="mt-1.5 text-[10px] text-muted">
                      {formatWhen(n.createdAt)}
                    </p>
                  </div>
                </div>
              </button>
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
}

export function useUnreadCount(): number {
  const [n, setN] = useState(0);
  useEffect(() => {
    ensureSeedNotifications();
    const tick = () => setN(getUnreadNotificationCount());
    tick();
    return subscribeMoneyUpdates(tick);
  }, []);
  return n;
}
