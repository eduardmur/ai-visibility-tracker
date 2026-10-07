import type { ReactNode } from "react";

export interface BarRow {
  key: string;
  label: ReactNode;
  value: number | null;
  detail?: string;
}

/** Horizontal bars for one measure across a few entities, ink on a neutral track. */
export function BarRows({ rows, formatValue }: { rows: BarRow[]; formatValue: (value: number | null) => string }) {
  return (
    <ul className="space-y-3">
      {rows.map((row) => (
        <li key={row.key} className="grid grid-cols-[minmax(0,10rem)_1fr_auto] items-center gap-3 text-sm">
          <span className="truncate text-ink">{row.label}</span>
          <span className="h-2 overflow-hidden rounded-full bg-paper-3" aria-hidden>
            <span className="block h-full rounded-full bg-ink" style={{ width: `${Math.max(0, Math.min(100, row.value ?? 0))}%` }} />
          </span>
          <span className="num w-28 text-right text-ink">
            {formatValue(row.value)}
            {row.detail ? <span className="ml-1 text-xs text-ink-3">{row.detail}</span> : null}
          </span>
        </li>
      ))}
    </ul>
  );
}
