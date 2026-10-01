import type { ReactNode, SVGProps } from "react";

type P = SVGProps<SVGSVGElement> & { size?: number };

function base(size: number, p: P, children: ReactNode) {
  const { size: _s, ...rest } = p;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...rest}
    >
      {children}
    </svg>
  );
}

export function IconDash({ size = 18, ...p }: P) {
  return base(size, p, (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </>
  ));
}

export function IconUsers({ size = 18, ...p }: P) {
  return base(size, p, (
    <>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3 19c.8-3 3-4.5 6-4.5s5.2 1.5 6 4.5" />
      <circle cx="17" cy="9" r="2.4" />
      <path d="M14.5 19c.4-1.8 1.6-3 3.5-3.2" />
    </>
  ));
}

export function IconChat({ size = 18, ...p }: P) {
  return base(size, p, (
    <path d="M4 5h16v10H8l-4 4V5z" />
  ));
}

export function IconTicket({ size = 18, ...p }: P) {
  return base(size, p, (
    <path d="M3 9a2 2 0 0 0 2-2V5h14v2a2 2 0 1 0 0 4v2a2 2 0 1 0 0 4v2H5v-2a2 2 0 1 0 0-4V9z" />
  ));
}

export function IconTx({ size = 18, ...p }: P) {
  return base(size, p, (
    <>
      <path d="M7 7h13M16 3l4 4-4 4" />
      <path d="M17 17H4M8 13l-4 4 4 4" />
    </>
  ));
}

export function IconBuilding({ size = 18, ...p }: P) {
  return base(size, p, (
    <>
      <path d="M4 20V6l8-3 8 3v14" />
      <path d="M9 20v-6h6v6M9 10h.01M15 10h.01M9 14h.01M15 14h.01" />
    </>
  ));
}

export function IconEmployee({ size = 18, ...p }: P) {
  return base(size, p, (
    <>
      <circle cx="12" cy="8" r="3.2" />
      <path d="M5 20c1.2-3.5 3.8-5 7-5s5.8 1.5 7 5" />
      <path d="M16 4.5 18 3l1.5 2.5" />
    </>
  ));
}

export function IconMoney({ size = 18, ...p }: P) {
  return base(size, p, (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v10M9.5 10c0-1 1.2-1.8 2.5-1.8s2.5.8 2.5 1.8-1.2 1.8-2.5 1.8-2.5.7-2.5 1.8 1.2 1.8 2.5 1.8 2.5-.8 2.5-1.8" />
    </>
  ));
}

export function IconTag({ size = 18, ...p }: P) {
  return base(size, p, (
    <path d="M3 12V4h8l10 10-8 8L3 12zM7.5 7.5h.01" />
  ));
}

export function IconChart({ size = 18, ...p }: P) {
  return base(size, p, (
    <>
      <path d="M4 19h16" />
      <path d="M7 16V10M12 16V6M17 16v-4" />
    </>
  ));
}

export function IconSettings({ size = 18, ...p }: P) {
  return base(size, p, (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3v2M12 19v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M3 12h2M19 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </>
  ));
}

export function IconLock({ size = 18, ...p }: P) {
  return base(size, p, (
    <>
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </>
  ));
}

export function IconWorkflow({ size = 18, ...p }: P) {
  return base(size, p, (
    <>
      <rect x="3" y="3" width="6" height="6" rx="1" />
      <rect x="15" y="3" width="6" height="6" rx="1" />
      <rect x="9" y="15" width="6" height="6" rx="1" />
      <path d="M6 9v3h12V9M12 12v3" />
    </>
  ));
}

export function IconMenu({ size = 18, ...p }: P) {
  return base(size, p, (
    <>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </>
  ));
}

export function IconTerminal({ size = 18, ...p }: P) {
  return base(size, p, (
    <>
      <rect x="3" y="4" width="18" height="14" rx="1.5" />
      <path d="M7 10l2 2-2 2M12 14h4" />
    </>
  ));
}

export function IconPositions({ size = 18, ...p }: P) {
  return base(size, p, (
    <>
      <path d="M4 19V9M10 19V5M16 19v-7M20 19H3" />
    </>
  ));
}

export function IconBlotter({ size = 18, ...p }: P) {
  return base(size, p, (
    <>
      <path d="M8 4h10v16H6V6z" />
      <path d="M10 9h6M10 13h6M10 17h4" />
    </>
  ));
}

export function IconRisk({ size = 18, ...p }: P) {
  return base(size, p, (
    <>
      <path d="M12 3 21 19H3L12 3z" />
      <path d="M12 10v4M12 16.5h.01" />
    </>
  ));
}

export function IconSearch({ size = 18, ...p }: P) {
  return base(size, p, (
    <>
      <circle cx="11" cy="11" r="6" />
      <path d="M20 20l-3.5-3.5" />
    </>
  ));
}
