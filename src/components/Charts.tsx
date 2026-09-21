"use client";

export function LineChart({
  points,
  height = 160,
}: {
  points: { label: string; value: number }[];
  height?: number;
}) {
  const w = 340;
  const padX = 8;
  const padY = 16;
  const values = points.map((p) => p.value);
  const min = Math.min(...values) * 0.98;
  const max = Math.max(...values) * 1.02;
  const coords = points.map((p, i) => {
    const x = padX + (i / (points.length - 1)) * (w - padX * 2);
    const y =
      padY + (1 - (p.value - min) / (max - min)) * (height - padY * 2);
    return { x, y, ...p };
  });
  const line = coords.map((c, i) => `${i === 0 ? "M" : "L"}${c.x},${c.y}`).join(" ");
  const area = `${line} L${coords[coords.length - 1].x},${height} L${coords[0].x},${height} Z`;
  const last = coords[coords.length - 1];

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${w} ${height}`} className="w-full h-auto" role="img" aria-label="Portföy grafiği">
        <defs>
          <linearGradient id="invFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1d6ae5" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#1d6ae5" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#invFill)" />
        <path d={line} fill="none" stroke="#1d6ae5" strokeWidth="2.5" strokeLinejoin="round" />
        <circle cx={last.x} cy={last.y} r="5" fill="#1d6ae5" stroke="white" strokeWidth="2" />
      </svg>
      <div className="mt-1 flex justify-between px-1 text-[10px] text-muted">
        {points.map((p) => (
          <span key={p.label}>{p.label}</span>
        ))}
      </div>
    </div>
  );
}

export function ProgressRing({
  pct,
  size = 56,
  stroke = 5,
}: {
  pct: number;
  size?: number;
  stroke?: number;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#e6e6e6"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#1d6ae5"
          strokeWidth={stroke}
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[11px] font-semibold text-nest">
        %{pct}
      </span>
    </div>
  );
}

export function DonutChart({
  segments,
  centerTitle,
  centerSub,
}: {
  segments: { label: string; pct: number; color: string }[];
  centerTitle: string;
  centerSub: string;
}) {
  const size = 200;
  const stroke = 28;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  let acc = 0;
  const arcs = segments.map((s) => {
    const len = (s.pct / 100) * c;
    const dash = `${len} ${c - len}`;
    const offset = -acc + c * 0.25;
    acc += len;
    return { ...s, dash, offset };
  });

  return (
    <div className="relative mx-auto w-full max-w-[220px]">
      <svg viewBox={`0 0 ${size} ${size}`} className="w-full">
        {arcs.map((a) => (
          <circle
            key={a.label}
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={a.color}
            strokeWidth={stroke}
            strokeDasharray={a.dash}
            strokeDashoffset={a.offset}
            strokeLinecap="butt"
          />
        ))}
      </svg>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-8 text-center">
        <p className="text-lg font-bold text-nest">{centerTitle}</p>
        <p className="mt-0.5 text-[10px] leading-tight text-muted">{centerSub}</p>
      </div>
    </div>
  );
}

export function AllocationBar({
  segments,
}: {
  segments: { label: string; pct: number; color: string }[];
}) {
  return (
    <div>
      <div className="flex h-3 overflow-hidden rounded-full">
        {segments.map((s) => (
          <div
            key={s.label}
            style={{ width: `${s.pct}%`, background: s.color }}
            title={`${s.label} ${s.pct}%`}
          />
        ))}
      </div>
      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted">
        {segments.map((s) => (
          <span key={s.label} className="inline-flex items-center gap-1.5">
            <span
              className="inline-block h-2.5 w-2.5 rounded-sm"
              style={{ background: s.color }}
            />
            {s.label} {s.pct}%
          </span>
        ))}
      </div>
    </div>
  );
}
