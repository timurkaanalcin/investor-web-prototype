/** HRAM wordmark — black / white / gray only */
const SIZES = {
  sm: { className: "text-lg tracking-[0.2em]" },
  md: { className: "text-xl tracking-[0.22em]" },
  lg: { className: "text-3xl tracking-[0.25em]" },
} as const;

export function BrandLogo({
  size = "md",
  showIcon = true,
}: {
  size?: "sm" | "md" | "lg";
  /** Kept for API compat */
  showIcon?: boolean;
}) {
  void showIcon;
  const { className } = SIZES[size];
  return (
    <div className="brand-logo flex items-center">
      <span
        className={`${className} font-semibold uppercase text-neutral-900 dark:text-neutral-100`}
        aria-label="HRAM"
      >
        HRAM
      </span>
    </div>
  );
}
