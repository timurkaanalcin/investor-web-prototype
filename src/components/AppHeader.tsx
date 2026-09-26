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
        <button
          type="button"
          aria-label="Bildirimler"
          className={`relative text-nest min-h-[44px] min-w-[44px] inline-flex items-center justify-center ${
            centerLogo ? "absolute right-5 md:static" : ""
          }`}
        >
          <IconBell />
          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-danger md:right-0 md:top-0" />
        </button>
      )}
    </header>
  );
}
