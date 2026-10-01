"use client";

import { useEffect } from "react";
import { applyDarkMode } from "@/lib/storage";

export function PhoneShell({
  children,
  className,
  layout = "phone",
}: {
  children: React.ReactNode;
  className?: string;
  /** phone = mobile shell; app = desktop-capable full shell; marketing = full-bleed landing */
  layout?: "phone" | "app" | "trade" | "marketing";
}) {
  useEffect(() => {
    applyDarkMode();
  }, []);

  const base =
    layout === "marketing"
      ? "phone-shell marketing-shell"
      : layout === "trade"
        ? "phone-shell"
        : layout === "app"
          ? "phone-shell app-shell"
          : "phone-shell";

  return (
    <div
      className={`${base}${className ? ` ${className}` : ""}`}
      data-layout={layout}
    >
      {children}
    </div>
  );
}
