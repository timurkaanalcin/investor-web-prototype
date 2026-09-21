import { BrandLogo } from "./BrandLogo";
import { IconBell } from "./Icons";

export function AppHeader({
  right,
  centerLogo = false,
}: {
  right?: React.ReactNode;
  centerLogo?: boolean;
}) {
  return (
    <header
      className={`flex items-center px-5 pt-5 pb-2 ${
        centerLogo ? "justify-center relative" : "justify-between"
      }`}
    >
      <BrandLogo size="sm" />
      {right !== undefined ? (
        right
      ) : (
        <button
          type="button"
          aria-label="Bildirimler"
          className={`relative text-nest ${centerLogo ? "absolute right-5" : ""}`}
        >
          <IconBell />
          <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-danger" />
        </button>
      )}
    </header>
  );
}
