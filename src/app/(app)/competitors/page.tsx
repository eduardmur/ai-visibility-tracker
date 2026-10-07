import type { Metadata } from "next";
import Link from "next/link";
import { Badge, Card, CardHeader, PageHeader, PeriodSelect, table } from "@/components/ui";
import { getDb } from "@/lib/db";
import { fmtDate, fmtPct, fmtPosition } from "@/lib/format";
import { platformLabel } from "@/lib/platforms";
import { scoredAnswersSince } from "@/lib/queries/answers";
import { getBrand } from "@/lib/queries/brand";
import { brandHighlights, competitorSummaries } from "@/lib/queries/competitors";
import { parsePeriod, periodRange } from "@/lib/queries/period";

export const metadata: Metadata = { title: "Competitors" };

export default async function CompetitorsPage({ searchParams }: { searchParams: Promise<{ period?: string }> }) {
  const { period: periodParam } = await searchParams;
  const period = parsePeriod(periodParam);
  const range = periodRange(period);
  const db = await getDb();
  const brand = (await getBrand(db))!;
  const answers = await scoredAnswersSince(db, brand.id, range.since);
  const competitors = await competitorSummaries(db, brand.id, range.since, answers.length);
  const ownHighlights = await brandHighlights(db, brand.id, range.since, { isSelf: true }, 12);

  return (
    <>
      <PageHeader
        title="Competitors"
        description="Every brand the platforms named as an alternative, with what they said about it."
        actions={<PeriodSelect current={period} basePath="/competitors" />}
      />

      <Card>
        <CardHeader title={`Brands named in ${answers.length} answers`} description="Share is the proportion of answers naming the brand." />
        {competitors.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-ink-3">No competitors in this period.</p>
        ) : (
          <div className={table.wrap}>
            <table className={table.table}>
              <thead>
                <tr>
                  <th className={table.th}>Brand</th>
                  <th className={table.thRight}>Answers</th>
                  <th className={table.thRight}>Share</th>
                  <th className={table.thRight}>Position</th>
                  <th className={table.thRight}>Recommended</th>
                  <th className={table.th}>Sentiment</th>
                  <th className={table.th}>Platforms</th>
                  <th className={table.th}>Last seen</th>
                </tr>
              </thead>
              <tbody>
                {competitors.map((c) => (
                  <tr key={c.key} className={table.tr}>
                    <td className={table.td}>
                      <Link href={`/competitors/${encodeURIComponent(c.key)}?period=${period}`} className="font-medium underline-offset-2 hover:underline">
                        {c.name}
                      </Link>
                      {c.website ? <p className="text-xs text-ink-3">{c.website}</p> : null}
                    </td>
                    <td className={table.tdRight}>{c.answers}</td>
                    <td className={table.tdRight}>{fmtPct(c.share)}</td>
                    <td className={table.tdRight}>{fmtPosition(c.avgPosition)}</td>
                    <td className={table.tdRight}>{c.recommended}</td>
                    <td className={`${table.tdMuted} num whitespace-nowrap`}>
                      {c.sentiment.positive} + · {c.sentiment.neutral} = · {c.sentiment.negative} −
                    </td>
                    <td className={table.tdMuted}>
                      {Object.entries(c.platforms)
                        .map(([p, n]) => `${platformLabel(p)} ${n}`)
                        .join(" · ")}
                    </td>
                    <td className={`${table.tdMuted} whitespace-nowrap`}>{fmtDate(c.lastSeenAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card className="mt-6">
        <CardHeader title={`What the platforms say about ${brand.name}`} description="Statements extracted from answers that name your brand." />
        {ownHighlights.length === 0 ? (
          <p className="px-5 py-5 text-sm text-ink-3">Nothing yet in this period.</p>
        ) : (
          <ul className="divide-y divide-line">
            {ownHighlights.map((h) => (
              <li key={`${h.answerId}`} className="px-5 py-3 text-sm">
                <div className="flex flex-wrap items-center gap-2 text-xs text-ink-3">
                  <span>{platformLabel(h.platform)}</span>
                  <span>·</span>
                  <span>{fmtDate(h.completedAt)}</span>
                  <Badge variant="outline">{h.sentiment}</Badge>
                  {h.recommended ? <Badge variant="outline">recommended</Badge> : null}
                  <Link href={`/answers/${h.answerId}`} className="underline-offset-2 hover:text-ink hover:underline">
                    {h.questionText}
                  </Link>
                </div>
                <ul className="mt-1 space-y-0.5 text-ink">
                  {h.highlights.map((text) => (
                    <li key={text}>{text}</li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
