"use client";

import { useId, useState } from "react";
import type { TrendPoint } from "@/lib/analysis/scoring";
import { fmtShortDate } from "@/lib/format";

const W = 720;
const H = 220;
const PAD = { top: 16, right: 44, bottom: 28, left: 36 };

/** Visibility score per day. One series, so the title names it and no legend is needed. */
export function TrendChart({ points }: { points: TrendPoint[] }) {
  const id = useId();
  const [hover, setHover] = useState<number | null>(null);
  const withData = points.map((p, i) => ({ ...p, i })).filter((p) => p.score !== null);

  if (withData.length < 2) {
    return (
      <div className="flex h-[220px] items-center justify-center text-sm text-ink-3">
        The trend appears after checks on two different days.
      </div>
    );
  }

  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const x = (i: number) => PAD.left + (points.length === 1 ? innerW / 2 : (i / (points.length - 1)) * innerW);
  const y = (score: number) => PAD.top + innerH - (score / 100) * innerH;
  const path = withData.map((p, idx) => `${idx === 0 ? "M" : "L"}${x(p.i).toFixed(1)},${y(p.score as number).toFixed(1)}`).join(" ");
  const last = withData[withData.length - 1];
  const hovered = hover === null ? null : points[hover];

  function onMove(event: React.MouseEvent<SVGRectElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = (event.clientX - rect.left) / rect.width;
    const index = Math.round(ratio * (points.length - 1));
    setHover(Math.max(0, Math.min(points.length - 1, index)));
  }

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-labelledby={`${id}-title`}>
        <title id={`${id}-title`}>Visibility score by day</title>
        {[0, 50, 100].map((tick) => (
          <g key={tick}>
            <line x1={PAD.left} x2={W - PAD.right} y1={y(tick)} y2={y(tick)} stroke="var(--line)" strokeWidth={1} />
            <text x={PAD.left - 8} y={y(tick) + 4} textAnchor="end" fontSize={11} fill="var(--ink-3)" className="num">
              {tick}%
            </text>
          </g>
        ))}
        <text x={PAD.left} y={H - 8} fontSize={11} fill="var(--ink-3)">
          {fmtShortDate(points[0].date)}
        </text>
        <text x={W - PAD.right} y={H - 8} fontSize={11} fill="var(--ink-3)" textAnchor="end">
          {fmtShortDate(points[points.length - 1].date)}
        </text>
        <path d={path} fill="none" stroke="var(--ink)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        <text x={x(last.i) + 8} y={y(last.score as number) + 4} fontSize={12} fontWeight={600} fill="var(--ink)" className="num">
          {Math.round(last.score as number)}%
        </text>
        {hovered && hovered.score !== null ? (
          <g>
            <line x1={x(hover as number)} x2={x(hover as number)} y1={PAD.top} y2={PAD.top + innerH} stroke="var(--ink-3)" strokeWidth={1} strokeDasharray="3 3" />
            <circle cx={x(hover as number)} cy={y(hovered.score)} r={4} fill="var(--ink)" stroke="var(--paper)" strokeWidth={2} />
          </g>
        ) : null}
        <rect
          x={PAD.left}
          y={PAD.top}
          width={innerW}
          height={innerH}
          fill="transparent"
          onMouseMove={onMove}
          onMouseLeave={() => setHover(null)}
        />
      </svg>
      {hovered ? (
        <div
          className="pointer-events-none absolute top-2 rounded-md border border-line bg-paper px-2.5 py-1.5 text-xs shadow-sm"
          style={{ left: `${(x(hover as number) / W) * 100}%`, transform: "translateX(-50%)" }}
        >
          <p className="text-ink-2">{fmtShortDate(hovered.date)}</p>
          <p className="num font-medium text-ink">
            {hovered.score === null ? "No checks" : `${hovered.score}% · ${hovered.answers} answers`}
          </p>
        </div>
      ) : null}
    </div>
  );
}
