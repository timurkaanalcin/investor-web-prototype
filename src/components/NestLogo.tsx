import { IconLeaf } from "./Icons";

export function NestLogo({
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
    <div className="flex items-center gap-1.5 text-nest">
      {showIcon && <IconLeaf size={icon} className="text-nest" />}
      <span className={`font-serif font-semibold tracking-tight ${text}`}>
        Nest
      </span>
    </div>
  );
}
