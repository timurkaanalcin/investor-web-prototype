"use client";

import { useState } from "react";
import { IconBell } from "./Icons";
import {
  NotificationsPanel,
  useUnreadCount,
} from "./NotificationsPanel";

export function NotificationsBell({
  className = "",
}: {
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const unread = useUnreadCount();

  return (
    <>
      <button
        type="button"
        aria-label="Bildirimler"
        onClick={() => setOpen(true)}
        className={`relative text-nest min-h-[44px] min-w-[44px] inline-flex items-center justify-center ${className}`}
      >
        <IconBell />
        {unread > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[9px] font-bold text-white md:right-0 md:top-0">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
      <NotificationsPanel open={open} onClose={() => setOpen(false)} />
    </>
  );
}
