export const USER = {
  name: "Ayşe Yılmaz",
  initials: "AY",
  tier: "Standart",
};

export const TOTAL_BALANCE = 248450;
export const MONTHLY_GAIN = 3240;

export const CHART_POINTS = [
  { label: "May 1", value: 228000 },
  { label: "May 8", value: 232500 },
  { label: "May 15", value: 236000 },
  { label: "May 22", value: 241200 },
  { label: "May 29", value: 248450 },
];

export const DASHBOARD_GOALS = [
  {
    id: "emeklilik",
    title: "Emeklilik",
    icon: "umbrella",
    target: 400000,
    current: 248000,
    pct: 62,
  },
  {
    id: "acil",
    title: "Acil fon",
    icon: "shield",
    target: 100000,
    current: 40000,
    pct: 40,
  },
];

export const GOALS = [
  {
    id: "acil",
    title: "Acil fon",
    target: 50000,
    current: 20000,
    pct: 40,
    eta: "Haziran 2027",
    featured: true,
  },
  {
    id: "tatil",
    title: "Tatil",
    target: 15000,
    current: 8200,
    pct: 55,
    icon: "palm",
  },
  {
    id: "ev",
    title: "Ev peşinatı",
    target: 200000,
    current: 45000,
    pct: 23,
    icon: "home",
  },
];

export const HOLDINGS = [
  {
    id: "vti",
    name: "VTI benzeri",
    subtitle: "Global hisse",
    value: 174000,
    change: 1.24,
    icon: "globe",
  },
  {
    id: "bond",
    name: "Tahvil",
    subtitle: "Sabit getirili",
    value: 49600,
    change: -0.18,
    icon: "chart",
  },
  {
    id: "cash",
    name: "Nakit",
    subtitle: "Likit",
    value: 24850,
    change: 0.03,
    icon: "wallet",
  },
];

export const ALLOCATION = [
  { label: "Hisse ETF", pct: 70, color: "#1B4332" },
  { label: "Tahvil ETF", pct: 20, color: "#74A892" },
  { label: "Nakit", pct: 10, color: "#C8D5CB" },
];

export const RECOMMENDED = [
  { label: "Hisse", pct: 70, color: "#1B4332" },
  { label: "Tahvil", pct: 20, color: "#74A892" },
  { label: "Nakit", pct: 10, color: "#E8DFD0" },
];

export const AUTO_CONTRIBUTION = 2500;

export function formatTRY(n: number): string {
  return (
    "₺" +
    n.toLocaleString("tr-TR", {
      maximumFractionDigits: 0,
    })
  );
}

export function formatPct(n: number): string {
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toLocaleString("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}%`;
}
