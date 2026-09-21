import type { ReactNode } from "react";
/** SVG monogram / stylized marks for trade UI — not trademark logo assets. */

type LogoProps = { size?: number; className?: string };

export function LogoAAPL({ size = 28, className }: LogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className={className} aria-hidden>
      <circle cx="16" cy="16" r="15" fill="#111" />
      {/* Stylized apple-ish monogram (letter + leaf), not trademark artwork */}
      <ellipse cx="16" cy="18" rx="7" ry="8.5" fill="#fff" />
      <path d="M16 8c1.5 0 3 1.2 3.2 2.8-1.6.2-3-1-3.2-2.8z" fill="#fff" />
      <circle cx="16" cy="18" r="2.2" fill="#111" />
    </svg>
  );
}

export function LogoMSFT({ size = 28, className }: LogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className={className} aria-hidden>
      <rect x="2" y="2" width="13" height="13" rx="1" fill="#f25022" />
      <rect x="17" y="2" width="13" height="13" rx="1" fill="#7fba00" />
      <rect x="2" y="17" width="13" height="13" rx="1" fill="#00a4ef" />
      <rect x="17" y="17" width="13" height="13" rx="1" fill="#ffb900" />
    </svg>
  );
}

export function LogoGOOG({ size = 28, className }: LogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className={className} aria-hidden>
      <path fill="#4285F4" d="M28.5 16.3c0-.9-.1-1.8-.2-2.6H16.4v5h6.8c-.3 1.5-1.2 2.8-2.5 3.7v3h4.1c2.4-2.2 3.7-5.5 3.7-9.1z" />
      <path fill="#34A853" d="M16.4 29c3.4 0 6.2-1.1 8.3-3.1l-4.1-3c-1.1.8-2.6 1.2-4.2 1.2-3.2 0-6-2.2-7-5.1H5.2v3.1C7.3 26.4 11.5 29 16.4 29z" />
      <path fill="#FBBC05" d="M9.4 18.9c-.5-1.4-.5-2.9 0-4.3v-3.1H5.2c-1.7 3.3-1.7 7.2 0 10.5l4.2-3.1z" />
      <path fill="#EA4335" d="M16.4 8.9c1.8 0 3.5.6 4.8 1.9l3.6-3.6C22.6 5 19.7 3.8 16.4 3.8 11.5 3.8 7.3 6.4 5.2 10.5l4.2 3.1c1-2.9 3.8-4.7 7-4.7z" />
    </svg>
  );
}

export function LogoAMZN({ size = 28, className }: LogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className={className} aria-hidden>
      <rect width="32" height="32" rx="8" fill="#232F3E" />
      <text x="16" y="18" textAnchor="middle" fill="#fff" fontSize="14" fontWeight="700" fontFamily="system-ui,sans-serif">
        a
      </text>
      <path d="M8 22c4 3 12 3 16-1" fill="none" stroke="#FF9900" strokeWidth="2" strokeLinecap="round" />
      <path d="M22 19.5l2.5 1.5-2.8.8" fill="none" stroke="#FF9900" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function LogoNVDA({ size = 28, className }: LogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className={className} aria-hidden>
      <rect width="32" height="32" rx="8" fill="#76B900" />
      <path
        fill="#fff"
        d="M16 6c-5.5 0-8.5 3.2-9.5 5.8 2.2-1.9 4.8-2.8 7.8-2.6 0 0 .1 4.6.1 6.9 0 2.4-.1 5.3-.1 5.3-3.5.3-5.9 1.6-7.3 3C8.2 27 12 28 16 28c7.2 0 11-4.8 11-11S23.2 6 16 6zm0 9.4c0-2.1 0-5.2 0-5.2 3.8.1 6.5 1.6 7.8 3.3-1.3 2.8-4.2 4.5-7.8 4.7V15.4z"
      />
    </svg>
  );
}

export function LogoMETA({ size = 28, className }: LogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className={className} aria-hidden>
      <rect width="32" height="32" rx="8" fill="#0668E1" />
      <path
        fill="#fff"
        d="M8.5 20.5c1.2-4.8 3.4-8 5.5-8 1.4 0 2.2 1.1 3.2 3.3.7 1.6 1.4 3.6 2.3 3.6.7 0 1.6-1 2.5-2.7.4 1.9.6 3.2.6 3.8h2.2c0-.9-.3-3-.8-5.1-.6-2.4-1.4-4.6-2.9-4.6-1.5 0-2.5 1.3-3.4 3.1-.7 1.5-1.2 3-1.9 3-1 0-2.2-2.8-3.2-6.2-.4 1.2-.9 2.5-1.5 3.8C9.2 16.5 7.8 19 7.2 20.5h1.3z"
      />
    </svg>
  );
}

export function LogoSPY({ size = 28, className }: LogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className={className} aria-hidden>
      <rect width="32" height="32" rx="8" fill="#1d6ae5" />
      <path d="M6 12c3-2 6-2 10 0s7 2 10 0" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M6 17c3-2 6-2 10 0s7 2 10 0" fill="none" stroke="#9ec9ff" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M6 22c3-2 6-2 10 0s7 2 10 0" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" opacity="0.7" />
    </svg>
  );
}

export function LogoTSLA({ size = 28, className }: LogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className={className} aria-hidden>
      <rect width="32" height="32" rx="8" fill="#cc0000" />
      <path fill="#fff" d="M6 10h20l-1.5 2.5H17.5V24h-3V12.5H7.5z" />
    </svg>
  );
}

export function LogoVOO({ size = 28, className }: LogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className={className} aria-hidden>
      <rect width="32" height="32" rx="8" fill="#C41230" />
      <text x="16" y="21" textAnchor="middle" fill="#fff" fontSize="11" fontWeight="800" fontFamily="system-ui,sans-serif">
        V
      </text>
    </svg>
  );
}

export function LogoQQQ({ size = 28, className }: LogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className={className} aria-hidden>
      <rect width="32" height="32" rx="8" fill="#000b50" />
      <circle cx="15" cy="15" r="7" fill="none" stroke="#ffc729" strokeWidth="2.2" />
      <path d="M20 20l4 4" stroke="#ffc729" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

export function LogoDefault({
  symbol,
  size = 28,
  className,
}: LogoProps & { symbol: string }) {
  const letters = symbol.slice(0, 2).toUpperCase();
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className={className} aria-hidden>
      <rect width="32" height="32" rx="16" fill="#e8f1fc" />
      <text
        x="16"
        y="20"
        textAnchor="middle"
        fill="#000b50"
        fontSize="11"
        fontWeight="700"
        fontFamily="system-ui,sans-serif"
      >
        {letters}
      </text>
    </svg>
  );
}

const LOGO_MAP: Record<string, (p: LogoProps) => ReactNode> = {
  AAPL: LogoAAPL,
  MSFT: LogoMSFT,
  GOOGL: LogoGOOG,
  GOOG: LogoGOOG,
  AMZN: LogoAMZN,
  NVDA: LogoNVDA,
  META: LogoMETA,
  SPY: LogoSPY,
  TSLA: LogoTSLA,
  VOO: LogoVOO,
  QQQ: LogoQQQ,
};

export function TickerLogo({
  symbol,
  size = 36,
  className,
}: {
  symbol: string;
  size?: number;
  className?: string;
}) {
  const key = symbol.toUpperCase();
  const Comp = LOGO_MAP[key];
  if (Comp) return <>{Comp({ size, className })}</>;
  return <LogoDefault symbol={key} size={size} className={className} />;
}

/** White rounded ticker chip used in hero banners */
export function TickerChip({
  symbol,
  displaySymbol,
}: {
  symbol: string;
  displaySymbol?: string;
}) {
  return (
    <div className="inline-flex items-center gap-2 rounded-2xl bg-white px-3 py-2 shadow-[0_8px_24px_rgba(0,0,0,0.18)]">
      <TickerLogo symbol={symbol} size={22} />
      <span className="text-sm font-bold tracking-wide text-nest">
        {displaySymbol ?? symbol}
      </span>
    </div>
  );
}
