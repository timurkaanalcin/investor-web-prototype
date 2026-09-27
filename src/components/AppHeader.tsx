"use client";

import { BrandLogo } from "./BrandLogo";
import { NotificationsBell } from "./NotificationsBell";

export function AppHeader({
  right,
  centerLogo = false,
}: {
  right?: React.ReactNode;
  centerLogo?: boolean;
}) {
  return (
    <header
      className={`flex items-center px-5 pt-5 pb-2 md:px-0 md:pt-1 ${
        centerLogo
          ? "justify-center relative md:justify-end"
          : "justify-between"
      }`}
    >
      {/* Logo in sidebar on md+ */}
      <div className={centerLogo ? "md:hidden" : "md:invisible md:w-0 md:overflow-hidden"}>
        <BrandLogo size="sm" />
      </div>
      {right !== undefined ? (
        right
      ) : (
        <div
          className={
            centerLogo ? "absolute right-5 md:static" : ""
          }
        >
          <NotificationsBell />
        </div>
      )}
    </header>
  );
}
