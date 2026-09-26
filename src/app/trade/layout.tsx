"use client";

import { TradeDesktopShell } from "@/components/trade/TradeDesktopShell";

export default function TradeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <TradeDesktopShell>{children}</TradeDesktopShell>;
}
