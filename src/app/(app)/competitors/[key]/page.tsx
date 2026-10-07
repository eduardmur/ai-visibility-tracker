import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge, Card, CardHeader, PageHeader, PeriodSelect, Stat } from "@/components/ui";
import { getDb } from "@/lib/db";
import { fmtDate, fmtPct, fmtPosition } from "@/lib/format";
import { platformLabel } from "@/lib/platforms";
import { scoredAnswersSince } from "@/lib/queries/answers";
import { getBrand } from "@/lib/queries/brand";
import { competitorDetail } from "@/lib/queries/competitors";
import { parsePeriod, periodRange } from "@/lib/queries/period";

export const metadata: Metadata = { title: "Competitor" };

export default async function CompetitorPage({
  params,
  searchParams,
}: {
  params: Promise<{ key: string }>;
  searchParams: Promise<{ period?: string }>;
}) {
  const { key: rawKey } = await params;
  const key = decodeURIComponent(rawKey);
  const { period: periodParam } = await searchParams;
  const period = parsePeriod(periodParam);
  const range = periodRange(period);
  const db = await getDb();
  const brand = (await getBrand(db))!;
  const answers = await scoredAnswersSince(db, brand.id, range.since);
  const { summary, highlights } = await competitorDetail(db, brand.id, key, range.since, answers.length);
  if (!summary) notFound();

  return (
    <>
      <PageHeader
        title={summary.name}
        description={summary.website ?? "Website unknown"}
        actions={
          <>
            <PeriodSelect current={period} basePath={`/competitors/${encodeURIComponent(key)}`} />
            <Link href={`/competitors?period=${period}`} className="text-sm text-ink-2 underline-offset-2 hover:text-ink hover:underline">
              All competitors
            </Link>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Answers naming it" value={String(summary.answers)} hint={`${fmtPct(summary.share)} of ${answers.length} answers`} />
        <Stat label="Average position" value={fmtPosition(summary.avgPosition)} hint="among brands named" />
        <Stat label="Recommended" value={String(summary.recommended)} hint="answers ranking it as a top pick" />
        <Stat
          label="Sentiment"
          value={`${summary.sentiment.positive} / ${summary.sentiment.neutral} / ${summary.sentiment.negative}`}
          hint="positive / neutral / negative"
        />
      </div>

      <Card className="mt-6">
        <CardHeader title="By platform" />
        <ul className="flex flex-wrap gap-2 px-5 py-4">
          {Object.entries(summary.platforms).map(([platform, count]) => (
            <li key={platform}>
              <Badge variant="outline">
                {platformLabel(platform)} · {count}
              </Badge>
            </li>
          ))}
        </ul>
      </Card>

      <Card className="mt-6">
        <CardHeader title="What the platforms said" description="Newest first. Each entry links to the full answer." />
        <ul className="divide-y divide-line">
          {highlights.map((h) => (
            <li key={`${h.answerId}-${h.platform}`} className="px-5 py-3 text-sm">
              <div className="flex flex-wrap items-center gap-2 text-xs text-ink-3">
                <span>{platformLabel(h.platform)}</span>
                <span>·</span>
                <span>{fmtDate(h.completedAt)}</span>
                {h.position ? <span className="num">#{h.position}</span> : null}
                <Badge variant="outline">{h.sentiment}</Badge>
                {h.recommended ? <Badge variant="outline">recommended</Badge> : null}
                <Link href={`/answers/${h.answerId}`} className="underline-offset-2 hover:text-ink hover:underline">
                  {h.questionText}
                </Link>
              </div>
              {h.highlights.length > 0 ? (
                <ul className="mt-1 space-y-0.5 text-ink">
                  {h.highlights.map((text) => (
                    <li key={text}>{text}</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-1 text-ink-3">Named without details.</p>
              )}
            </li>
          ))}
        </ul>
      </Card>
    </>
  );
}
