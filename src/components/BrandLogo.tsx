/** Official investor Swiss wordmark — black ground, gold type */
const SIZES = {
  sm: { h: 28, className: "h-7 w-auto" },
  md: { h: 36, className: "h-9 w-auto" },
  lg: { h: 56, className: "h-14 w-auto" },
} as const;

export function BrandLogo({
  size = "md",
  showIcon = true,
}: {
  size?: "sm" | "md" | "lg";
  /** Kept for API compat; image includes the mark */
  showIcon?: boolean;
}) {
  const { className } = SIZES[size];
  void showIcon;
  return (
    <div className="brand-logo flex items-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/brand/investor-logo.png"
        alt="investor"
        className={`${className} rounded-md object-contain`}
        height={SIZES[size].h}
        width={SIZES[size].h}
        decoding="async"
      />
    </div>
  );
}
