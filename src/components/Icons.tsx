import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement> & { size?: number };

export function IconHome({ size = 22, ...p }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V20h14V9.5" />
    </svg>
  );
}

export function IconInvest({ size = 22, ...p }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v10M9 10.5c0-1.2 1.3-2 3-2s3 .8 3 2-1.3 2-3 2-3 .8-3 2 1.3 2 3 2 3-.8 3-2" />
    </svg>
  );
}

export function IconTarget({ size = 22, ...p }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
    </svg>
  );
}

export function IconUser({ size = 22, ...p }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 19c1.5-3.5 4-5 7-5s5.5 1.5 7 5" />
    </svg>
  );
}

export function IconBell({ size = 22, ...p }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M6 9a6 6 0 0 1 12 0c0 7 2 7 2 9H4c0-2 2-2 2-9" />
      <path d="M10 20a2 2 0 0 0 4 0" />
    </svg>
  );
}

export function IconLeaf({ size = 22, ...p }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" {...p}>
      <path d="M17.5 3.5C12 4 5 9 5 15.5c0 3 1.8 5.5 5 5.5 5.5 0 10-7 10.5-14.5C16 8 14 11 12.5 13.5c1-4 3.5-7.5 5-10z" />
    </svg>
  );
}

export function IconPlus({ size = 20, ...p }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" {...p}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function IconChevron({ size = 18, ...p }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}

export function IconArrowUp({ size = 14, ...p }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M12 19V5M5 12l7-7 7 7" />
    </svg>
  );
}

export function IconArrowRight({ size = 18, ...p }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M5 12h14M13 5l7 7-7 7" />
    </svg>
  );
}

export function IconShield({ size = 22, ...p }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M12 3 4 6v6c0 5 3.5 8.5 8 10 4.5-1.5 8-5 8-10V6l-8-3z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

export function IconBank({ size = 20, ...p }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M3 10h18M5 10v8M9 10v8M15 10v8M19 10v8M2 18h20M12 3l9 7H3l9-7z" />
    </svg>
  );
}

export function IconDoc({ size = 20, ...p }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M7 3h7l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" />
      <path d="M14 3v5h5M9 13h6M9 17h4" />
    </svg>
  );
}

export function IconHelp({ size = 20, ...p }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.8.4-1.5 1-1.5 2.2M12 17h.01" />
    </svg>
  );
}

export function IconSun({ size = 20, ...p }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  );
}

export function IconLogout({ size = 20, ...p }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M10 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h5M15 16l4-4-4-4M19 12H9" />
    </svg>
  );
}

export function IconMenu({ size = 22, ...p }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" {...p}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

export function IconCrown({ size = 12, ...p }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" {...p}>
      <path d="M3 17h18l-1.5-9-4.5 4L12 5l-3 7-4.5-4L3 17zM4 19h16v2H4z" />
    </svg>
  );
}

export function IconInfo({ size = 16, ...p }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 10v6M12 7h.01" />
    </svg>
  );
}

export function IconTrend({ size = 18, ...p }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M3 17 10 10l4 4 7-7" />
      <path d="M14 7h7v7" />
    </svg>
  );
}

export function IconPiggy({ size = 20, ...p }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M19 10c0-2-2-4-5-4h-1c-1-2-3-3-5-2-1 0-2 1-2 2H5c-1.5 0-3 1.5-3 3.5S4 15 4 15v2a1 1 0 0 0 1 1h1v1a1 1 0 0 0 1 1h2v-2h6v2h2a1 1 0 0 0 1-1v-1h.5a2.5 2.5 0 0 0 2.5-2.5V12c0-.5 1-1 1-2h-2z" />
      <circle cx="16" cy="11" r="1" fill="currentColor" />
    </svg>
  );
}

export function IconCalendar({ size = 14, ...p }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </svg>
  );
}

export function IconCheck({ size = 16, ...p }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="m5 12 5 5L20 7" />
    </svg>
  );
}

export function IconTrade({ size = 22, ...p }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M4 7h11M15 7l-3-3M15 7l-3 3" />
      <path d="M20 17H9M9 17l3-3M9 17l3 3" />
    </svg>
  );
}

export function IconSearch({ size = 18, ...p }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

export function IconBack({ size = 22, ...p }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M15 18 9 12l6-6" />
    </svg>
  );
}

export function IconClose({ size = 22, ...p }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" {...p}>
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

export function IconChevronDown({ size = 16, ...p }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export function IconSettings({ size = 18, ...p }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  );
}

/** Circular 3×3 grid mark used on SDI title row */
export function IconGridDots({ size = 28, ...p }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" aria-hidden {...p}>
      <circle cx="14" cy="14" r="14" fill="#e8f1fc" />
      <rect x="6" y="6" width="4" height="4" rx="0.8" fill="#1d6ae5" />
      <rect x="12" y="6" width="4" height="4" rx="0.8" fill="#1d6ae5" />
      <rect x="18" y="6" width="4" height="4" rx="0.8" fill="#1d6ae5" />
      <rect x="6" y="12" width="4" height="4" rx="0.8" fill="#1d6ae5" />
      <rect x="12" y="12" width="4" height="4" rx="0.8" fill="#1d6ae5" />
      <rect x="18" y="12" width="4" height="4" rx="0.8" fill="#1d6ae5" />
      <rect x="6" y="18" width="4" height="4" rx="0.8" fill="#1d6ae5" />
      <rect x="12" y="18" width="4" height="4" rx="0.8" fill="#1d6ae5" />
      <rect x="18" y="18" width="4" height="4" rx="0.8" fill="#1d6ae5" />
    </svg>
  );
}
