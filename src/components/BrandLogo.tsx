import { IconLeaf } from "./Icons";

/** Investor wordmark — follows chrome theme (white in dark, black in light) */
export function BrandLogo({
  size = "md",
  showIcon = true,
}: {
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
}) {
  const text =
    size === "lg" ? "text-3xl" : size === "sm" ? "text-xl" : "text-2xl";
  const icon = size === "lg" ? 26 : size === "sm" ? 18 : 22;
  return (
    <div className="brand-logo flex items-center gap-1.5">
      {showIcon && <IconLeaf size={icon} className="brand-logo-icon" />}
      <span className={`font-serif font-semibold tracking-tight ${text}`}>
        Investor
      </span>
    </div>
  );
}
