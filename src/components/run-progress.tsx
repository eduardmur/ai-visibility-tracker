"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { resumeRun } from "@/app/actions/runs";
import { platformLabel } from "@/lib/platforms";
import type { RunProgress } from "@/lib/queries/runs";
import { Badge, Button, LinkButton, table } from "./ui";

const POLL_MS = 3000;

export function RunProgressView({ initial }: { initial: RunProgress }) {
  const [progress, setProgress] = useState(initial);
  const { run, items } = progress;
  const active = run.status === "queued" || run.status === "running";

  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    const timer = setInterval(async () => {
      try {
        const response = await fetch(`/api/runs/${run.id}/status`, { cache: "no-store" });
        if (!response.ok) return;
        const next = (await response.json()) as RunProgress;
        if (!cancelled) setProgress(next);
      } catch {
        // keep polling
      }
    }, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [active, run.id]);

  const finished = run.doneItems + run.failedItems;
  const pct = run.totalItems === 0 ? 100 : Math.round((finished / run.totalItems) * 100);
  const stalled = active && items.every((i) => i.status !== "running") && items.some((i) => i.status === "pending");

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-line bg-paper px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-ink-2">
            <span className="num font-medium text-ink">
              {finished} / {run.totalItems}
            </span>{" "}
            answers · {run.failedItems > 0 ? `${run.failedItems} failed · ` : ""}
            {statusLabel(run.status)}
          </p>
          {active ? (
            <span className="text-xs text-ink-3">Updates every few seconds</span>
          ) : (
            <LinkButton href="/" variant="primary">
              View report
            </LinkButton>
          )}
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-paper-3" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
          <div className="h-full rounded-full bg-ink transition-[width]" style={{ width: `${pct}%` }} />
        </div>
        {stalled ? (
          <form action={resumeRun} className="mt-3 flex items-center gap-3 text-sm text-ink-2">
            <input type="hidden" name="runId" value={run.id} />
            <span>Nothing is being processed right now.</span>
            <Button type="submit" variant="secondary">
              Resume
            </Button>
          </form>
        ) : null}
      </div>

      <div className="rounded-xl border border-line bg-paper">
        <div className={table.wrap}>
          <table className={table.table}>
            <thead>
              <tr>
                <th className={table.th}>Question</th>
                <th className={table.th}>Platform</th>
                <th className={table.th}>Status</th>
                <th className={table.th}>Result</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className={table.tr}>
                  <td className={table.td}>{item.questionText}</td>
                  <td className={table.tdMuted}>{platformLabel(item.platform)}</td>
                  <td className={table.td}>
                    <Badge variant={item.status === "done" ? "outline" : "muted"}>{statusLabel(item.status)}</Badge>
                  </td>
                  <td className={table.tdMuted}>
                    {item.status === "done" ? (
                      <Link href={`/answers/${item.id}`} className="text-ink underline-offset-2 hover:underline">
                        {item.brandMentioned ? "Mentioned" : "Not mentioned"}
                        {item.brandCited ? " · cited" : ""}
                      </Link>
                    ) : item.status === "failed" ? (
                      <span title={item.error ?? undefined}>{item.error ? truncate(item.error) : "Failed"}</span>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function statusLabel(status: string): string {
  switch (status) {
    case "queued":
      return "Queued";
    case "running":
      return "Running";
    case "done":
      return "Done";
    case "pending":
      return "Pending";
    case "completed":
      return "Completed";
    case "failed":
      return "Failed";
    default:
      return status;
  }
}

function truncate(text: string, max = 90): string {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}
