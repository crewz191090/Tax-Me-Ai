"use client";

const RADIUS = 30;
const STROKE = 9;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function ReliefCategoryDonut({ pct, over }: { pct: number; over: boolean }) {
  const dash = (Math.min(pct, 100) / 100) * CIRCUMFERENCE;
  const gradId = `reliefCardGrad-${over ? "over" : "ok"}`;

  return (
    <div className="relative h-16 w-16 shrink-0">
      <svg viewBox="0 0 72 72" className="h-full w-full -rotate-90">
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
            {over ? (
              <>
                <stop offset="0%" stopColor="#fb7185" />
                <stop offset="100%" stopColor="#e11d48" />
              </>
            ) : (
              <>
                <stop offset="0%" stopColor="#22d3ee" />
                <stop offset="100%" stopColor="#6366f1" />
              </>
            )}
          </linearGradient>
        </defs>
        <circle cx="36" cy="36" r={RADIUS} fill="none" stroke="var(--surface)" strokeWidth={STROKE} />
        <circle
          cx="36"
          cy="36"
          r={RADIUS}
          fill="none"
          stroke={`url(#${gradId})`}
          strokeWidth={STROKE}
          strokeDasharray={`${dash} ${CIRCUMFERENCE - dash}`}
          strokeLinecap="round"
        />
      </svg>
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <span className="font-mono-tight text-xs font-bold">{Math.round(pct)}%</span>
      </div>
    </div>
  );
}
