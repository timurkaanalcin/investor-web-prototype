import type { ReactNode } from "react";
/** Sharper brand-like SVG marks for trade UI — stylized, not trademark assets. */

type LogoProps = { size?: number; className?: string };

export function LogoAAPL({ size = 28, className }: LogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className={className} aria-hidden>
      <circle cx="16" cy="16" r="16" fill="#111111" />
      <path
        fill="#fff"
        d="M20.4 9.1c-.9.1-2 .7-2.6 1.5-.6.7-1.1 1.8-.9 2.8 1 .1 2-.5 2.6-1.3.7-.8 1.1-1.9.9-3zM22.6 16.2c-.1-2.2 1.8-3.3 1.9-3.4-1-1.5-2.7-1.7-3.3-1.7-1.4-.1-2.7.8-3.4.8-.7 0-1.8-.8-3-.8-1.5 0-2.9.9-3.7 2.3-1.6 2.7-.4 6.8 1.1 9 .8 1.1 1.7 2.3 2.9 2.2 1.2-.1 1.6-.7 3-.7s1.8.7 3 .7c1.3 0 2.1-1.1 2.8-2.2.9-1.3 1.3-2.5 1.3-2.6-.1 0-2.4-.9-2.6-3.6z"
      />
    </svg>
  );
}

export function LogoMSFT({ size = 28, className }: LogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className={className} aria-hidden>
      <rect width="32" height="32" rx="7" fill="#F3F3F3" />
      <rect x="5" y="5" width="10" height="10" fill="#F25022" />
      <rect x="17" y="5" width="10" height="10" fill="#7FBA00" />
      <rect x="5" y="17" width="10" height="10" fill="#00A4EF" />
      <rect x="17" y="17" width="10" height="10" fill="#FFB900" />
    </svg>
  );
}

export function LogoGOOG({ size = 28, className }: LogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className={className} aria-hidden>
      <circle cx="16" cy="16" r="16" fill="#fff" />
      <path fill="#4285F4" d="M27.6 16.3c0-.8-.1-1.6-.2-2.4H16.2v4.5h6.4c-.3 1.4-1.1 2.6-2.4 3.4v2.8h3.8c2.3-2.1 3.6-5.2 3.6-8.3z" />
      <path fill="#34A853" d="M16.2 28c3.2 0 5.9-1.1 7.8-2.9l-3.8-2.8c-1.1.7-2.4 1.1-4 1.1-3.1 0-5.7-2.1-6.6-4.9H5.5v2.9C7.5 25.6 11.5 28 16.2 28z" />
      <path fill="#FBBC05" d="M9.6 18.5c-.4-1.3-.4-2.7 0-4v-2.9H5.5c-1.6 3.1-1.6 6.7 0 9.8l4.1-2.9z" />
      <path fill="#EA4335" d="M16.2 9.2c1.7 0 3.3.6 4.5 1.8l3.4-3.4C21.9 5.5 19.2 4.4 16.2 4.4 11.5 4.4 7.5 6.8 5.5 10.6l4.1 2.9c.9-2.8 3.5-4.3 6.6-4.3z" />
    </svg>
  );
}

export function LogoAMZN({ size = 28, className }: LogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className={className} aria-hidden>
      <rect width="32" height="32" rx="7" fill="#232F3E" />
      <path
        fill="#fff"
        d="M10.2 14.2c0-1.1.9-1.7 2.4-1.7 1.1 0 2 .3 2.7.7l.5-1.5c-.8-.4-2-.7-3.3-.7-2.6 0-4.3 1.4-4.3 3.4 0 2.6 2.4 3.1 4.1 3.5 1.3.3 1.7.6 1.7 1.1 0 .6-.6 1-1.7 1-1.2 0-2.3-.4-3.1-.9l-.5 1.5c.9.5 2.2.9 3.6.9 2.7 0 4.4-1.3 4.4-3.4 0-2.7-2.5-3.2-4.2-3.6-1.2-.3-1.7-.5-1.7-1.1z"
      />
      <path
        d="M8.5 23.2c3.8 2.2 9.2 2.4 13.2.4"
        fill="none"
        stroke="#FF9900"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M20.8 21.8l1.9 1.4-2.4.7"
        fill="none"
        stroke="#FF9900"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function LogoNVDA({ size = 28, className }: LogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className={className} aria-hidden>
      <rect width="32" height="32" rx="7" fill="#76B900" />
      <ellipse cx="16" cy="16.5" rx="9" ry="5.5" fill="none" stroke="#fff" strokeWidth="1.8" />
      <circle cx="16" cy="16.5" r="2.4" fill="#fff" />
      <path d="M16 8.5c0 0 3.5 2.2 3.5 8s-3.5 8-3.5 8" fill="none" stroke="#fff" strokeWidth="1.4" opacity="0.85" />
    </svg>
  );
}

export function LogoMETA({ size = 28, className }: LogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className={className} aria-hidden>
      <rect width="32" height="32" rx="7" fill="#0866FF" />
      <path
        fill="#fff"
        d="M8.2 20.8c1.1-4.4 3.1-7.4 5.1-7.4 1.3 0 2 1 3 3 .6 1.5 1.3 3.3 2.1 3.3.7 0 1.5-.9 2.3-2.5.4 1.7.6 2.9.6 3.5h2c0-.8-.3-2.7-.7-4.7-.5-2.2-1.3-4.2-2.7-4.2-1.4 0-2.3 1.2-3.1 2.8-.6 1.4-1.1 2.8-1.8 2.8-.9 0-2-2.6-2.9-5.7-.4 1.1-.8 2.3-1.4 3.5-.9 1.8-2.2 4.1-2.7 5.5h1.2z"
      />
    </svg>
  );
}

export function LogoSPY({ size = 28, className }: LogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className={className} aria-hidden>
      <rect width="32" height="32" rx="7" fill="#111111" />
      <path d="M6 12.5c3.2-2.2 6.5-2.2 10.2 0s7 2.2 10 0" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
      <path d="M6 17c3.2-2.2 6.5-2.2 10.2 0s7 2.2 10 0" fill="none" stroke="#e5e5e5" strokeWidth="2" strokeLinecap="round" />
      <path d="M6 21.5c3.2-2.2 6.5-2.2 10.2 0s7 2.2 10 0" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" opacity="0.65" />
    </svg>
  );
}

export function LogoTSLA({ size = 28, className }: LogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className={className} aria-hidden>
      <rect width="32" height="32" rx="7" fill="#CC0000" />
      <path fill="#fff" d="M6.5 10.2h19l-1.4 2.4H17.2V24h-2.4V12.6H7.9z" />
      <path fill="#fff" d="M16 7.2l9.5 3H6.5z" opacity="0.95" />
    </svg>
  );
}

export function LogoVOO({ size = 28, className }: LogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className={className} aria-hidden>
      <rect width="32" height="32" rx="7" fill="#C41230" />
      <path
        fill="#fff"
        d="M9.2 9.5h3.2l3.6 11.2 3.6-11.2h3.2L17.4 24h-2.8L9.2 9.5z"
      />
    </svg>
  );
}

export function LogoQQQ({ size = 28, className }: LogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className={className} aria-hidden>
      <rect width="32" height="32" rx="7" fill="#111111" />
      <circle cx="14.5" cy="14.5" r="6.5" fill="none" stroke="#ffc729" strokeWidth="2.2" />
      <path d="M19.2 19.2l5 5" stroke="#ffc729" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

export function LogoNFLX({ size = 28, className }: LogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className={className} aria-hidden>
      <rect width="32" height="32" rx="7" fill="#E50914" />
      <path fill="#fff" d="M10 7h3.2l5.6 12.8V7H22v18h-3.2L13.2 12.2V25H10V7z" />
    </svg>
  );
}

export function LogoKO({ size = 28, className }: LogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className={className} aria-hidden>
      <rect width="32" height="32" rx="7" fill="#F40009" />
      <path
        fill="#fff"
        d="M7.5 15.2c1.4-2.8 4-4.4 7.2-4.4 2.2 0 4 .7 5.4 2l-1.4 1.5c-1.1-1-2.5-1.5-4-1.5-2.3 0-4.1 1.1-5.1 3.1-.3.6-.4 1.2-.4 1.8s.1 1.2.4 1.8c1 2 2.8 3.1 5.1 3.1 1.5 0 2.9-.5 4-1.5l1.4 1.5c-1.4 1.3-3.2 2-5.4 2-3.2 0-5.8-1.6-7.2-4.4-.5-1-.7-2-.7-3.1s.2-2.1.7-3.1z"
      />
    </svg>
  );
}

export function LogoDefault({
  symbol,
  size = 28,
  className,
}: LogoProps & { symbol: string }) {
  const letters = symbol.slice(0, 2).toUpperCase();
  const hues = ["#111111", "#226d78", "#525252", "#737373", "#c44536"];
  let h = 0;
  for (let i = 0; i < symbol.length; i++) h = (h + symbol.charCodeAt(i) * (i + 1)) % hues.length;
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className={className} aria-hidden>
      <rect width="32" height="32" rx="16" fill={hues[h]} />
      <text
        x="16"
        y="20.5"
        textAnchor="middle"
        fill="#fff"
        fontSize="11"
        fontWeight="700"
        fontFamily="system-ui, -apple-system, sans-serif"
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
  NFLX: LogoNFLX,
  KO: LogoKO,
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
