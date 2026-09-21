"use client";

import { useEffect } from "react";
import { getDarkMode } from "@/lib/storage";

export function PhoneShell({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    document.body.classList.toggle("dark", getDarkMode());
  }, []);

  return <div className="phone-shell">{children}</div>;
}
