"use client";

import { useEffect } from "react";
import { getDarkMode } from "@/lib/storage";

export function PhoneShell({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  useEffect(() => {
    document.body.classList.toggle("dark", getDarkMode());
  }, []);

  return (
    <div className={`phone-shell${className ? ` ${className}` : ""}`}>
      {children}
    </div>
  );
}
