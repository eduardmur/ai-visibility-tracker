import Link from "next/link";
import { startRun } from "@/app/actions/runs";
import { BarRows } from "@/components/bar-rows";
import { TrendChart } from "@/components/trend-chart";
import { Badge, Button, Card, CardHeader, EmptyState, LinkButton, Notice, PageHeader, PeriodSelect, Stat, table } from "@/components/ui";
import { getDb } from "@/lib/db";
import { fmtDateTime, fmtDelta, fmtPct, fmtPosition, truncate } from "@/lib/format";
import { marketLabel } from "@/lib/markets";
import { platformLabel } from "@/lib/platforms";
import { getBrand } from "@/lib/queries/brand";
import { getOverview } from "@/lib/queries/overview";
import { parsePeriod } from "@/lib/queries/period";

export default async function OverviewPage({ searchParams }: { searchParams: Promise<{ period?: string }> }) {
  const { period: periodParam } = await searchParams;
  const period = parsePeriod(periodParam);
  const db = await getDb();
  const brand = (await getBrand(db))!;
  const data = await getOverview(db, brand, period);
  const hasQuestions = data.questions.length > 0;

  if (data.runs.length === 0) {
    return (
      <>
        <PageHeader title="Overview" description={`${brand.name} · ${marketLabel(brand)}`} />
        <Card>
          <EmptyState
            title={hasQuestions ? "Run your first check" : "Add the questions your customers ask"}
            description={
              hasQuestions
                ? `Every active question is asked on ${brand.platforms.length} platform${brand.platforms.length === 1 ? "" : "s"}. The first results appear within a minute.`
                : "The tracker asks each question on the AI platforms you selected and records who gets mentioned, cited and recommended."
            }
            action={
              hasQuestions ? (
                <form action={startRun}>
                  <Button type="submit">Run now</Button>
                </form>
              ) : (
                <LinkButton href="/questions" variant="primary">
                  Add questions
                </LinkButton>
              )
            }
          />
        </Card>
      </>
    );
  }

  const competitorsTotal = data.competitors.length;

  return (
    <>
      <PageHeader
        title="Overview"
        description={`${brand.name} · ${marketLabel(brand)}`}
        actions={
          <>
            <PeriodSelect current={period} basePath="/" />
            <a href={`/api/export/answers?period=${period}`} className="text-sm text-ink-2 underline-offset-2 hover:text-ink hover:underline">
              Export CSV
            </a>
          </>
        }
      />

      {data.answers === 0 ? (
        <Notice className="mb-6">No completed answers in the last {data.days} days. Scores appear after the next check.</Notice>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Visibility score" value={fmtPct(data.score)} delta={fmtDelta(data.scoreDelta)} hint={`${data.answers} answers`} />
        <Stat label="Website cited" value={fmtPct(data.citationRate)} delta={fmtDelta(data.citationDelta)} hint="answers linking your site" />
        <Stat label="Share of voice" value={fmtPct(data.shareOfVoice)} hint={competitorsTotal > 0 ? `vs ${competitorsTotal} competitors` : "no competitors yet"} />
        <Stat label="Average position" value={fmtPosition(data.avgPosition)} hint="among brands named, when mentioned" />
      </div>

      <Card className="mt-6">
        <CardHeader title="Visibility score by day" description="Share of answers that mention the brand." />
        <div className="px-5 py-4">
          <TrendChart points={data.trend} />
        </div>
      </Card>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader title="Platforms" description="Visibility score per platform." />
          <div className="px-5 py-5">
            {data.platforms.length === 0 ? (
              <p className="text-sm text-ink-3">No answers yet.</p>
            ) : (
              <BarRows
                rows={data.platforms.map((p) => ({
                  key: p.platform,
                  label: platformLabel(p.platform),
                  value: p.score,
                  detail: `${p.mentioned}/${p.answers}`,
                }))}
                formatValue={(v) => fmtPct(v)}
              />
            )}
          </div>
        </Card>

        <Card>
          <CardHeader
            title="What AI says about you"
            description="Sentiment of the answers that name the brand."
            action={
              <Link href="/answers?mentioned=yes" className="text-sm text-ink-2 underline-offset-2 hover:text-ink hover:underline">
                See answers
              </Link>
            }
          />
          <div className="px-5 py-5">
            {data.selfSentiment.answers === 0 ? (
              <p className="text-sm text-ink-3">The brand has not been named in this period.</p>
            ) : (
              <BarRows
                rows={[
                  { key: "positive", label: "Positive", value: pct(data.selfSentiment.positive, data.selfSentiment.answers), detail: String(data.selfSentiment.positive) },
                  { key: "neutral", label: "Neutral", value: pct(data.selfSentiment.neutral, data.selfSentiment.answers), detail: String(data.selfSentiment.neutral) },
                  { key: "negative", label: "Negative", value: pct(data.selfSentiment.negative, data.selfSentiment.answers), detail: String(data.selfSentiment.negative) },
                  { key: "recommended", label: "Recommended", value: pct(data.selfSentiment.recommended, data.selfSentiment.answers), detail: String(data.selfSentiment.recommended) },
                ]}
                formatValue={(v) => fmtPct(v)}
              />
            )}
          </div>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader
            title="Competitors"
            description="Brands the platforms name instead of, or next to, yours."
            action={
              <Link href={`/competitors?period=${period}`} className="text-sm text-ink-2 underline-offset-2 hover:text-ink hover:underline">
                All competitors
              </Link>
            }
          />
          {data.competitors.length === 0 ? (
            <p className="px-5 py-5 text-sm text-ink-3">No competitors extracted yet.</p>
          ) : (
            <div className={table.wrap}>
              <table className={table.table}>
                <thead>
                  <tr>
                    <th className={table.th}>Brand</th>
                    <th className={table.thRight}>Answers</th>
                    <th className={table.thRight}>Share</th>
                    <th className={table.thRight}>Position</th>
                  </tr>
                </thead>
                <tbody>
                  {data.competitors.map((c) => (
                    <tr key={c.key} className={table.tr}>
                      <td className={table.td}>
                        <Link href={`/competitors/${encodeURIComponent(c.key)}?period=${period}`} className="underline-offset-2 hover:underline">
                          {c.name}
                        </Link>
                        {c.website ? <span className="ml-2 text-xs text-ink-3">{c.website}</span> : null}
                      </td>
                      <td className={table.tdRight}>{c.answers}</td>
                      <td className={table.tdRight}>{fmtPct(c.share)}</td>
                      <td className={table.tdRight}>{fmtPosition(c.avgPosition)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card>
          <CardHeader title="Cited sources" description="Domains the answers cite most." />
          {data.domains.length === 0 ? (
            <p className="px-5 py-5 text-sm text-ink-3">No citations yet.</p>
          ) : (
            <div className={table.wrap}>
              <table className={table.table}>
                <thead>
                  <tr>
                    <th className={table.th}>Domain</th>
                    <th className={table.thRight}>Answers</th>
                  </tr>
                </thead>
                <tbody>
                  {data.domains.map((d) => (
                    <tr key={d.domain} className={table.tr}>
                      <td className={table.td}>
                        {d.domain}
                        {d.isOwn ? (
                          <Badge variant="solid" className="ml-2">
                            you
                          </Badge>
                        ) : null}
                      </td>
                      <td className={table.tdRight}>{d.answers}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[2fr_1fr]">
        <Card>
          <CardHeader
            title="Questions"
            description="Visibility score per question."
            action={
              <Link href="/questions" className="text-sm text-ink-2 underline-offset-2 hover:text-ink hover:underline">
                Manage
              </Link>
            }
          />
          <div className={table.wrap}>
            <table className={table.table}>
              <thead>
                <tr>
                  <th className={table.th}>Question</th>
                  <th className={table.thRight}>Score</th>
                  <th className={table.thRight}>Cited</th>
                  <th className={table.thRight}>Answers</th>
                </tr>
              </thead>
              <tbody>
                {data.questions.slice(0, 12).map((q) => (
                  <tr key={q.questionId} className={table.tr}>
                    <td className={table.td}>
                      <Link href={`/answers?questionId=${q.questionId}&period=${period}`} className="underline-offset-2 hover:underline">
                        {truncate(q.text, 90)}
                      </Link>
                      {!q.isActive ? (
                        <Badge variant="muted" className="ml-2">
                          paused
                        </Badge>
                      ) : null}
                    </td>
                    <td className={table.tdRight}>{fmtPct(q.score)}</td>
                    <td className={table.tdRight}>{fmtPct(q.citationRate)}</td>
                    <td className={table.tdRight}>{q.answers}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <CardHeader title="Latest checks" />
          <ul className="divide-y divide-line">
            {data.runs.map((run) => (
              <li key={run.id} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
                <div>
                  <Link href={`/runs/${run.id}`} className="font-medium text-ink underline-offset-2 hover:underline">
                    {run.trigger === "scheduled" ? "Scheduled" : "Manual"} check
                  </Link>
                  <p className="text-xs text-ink-3">{fmtDateTime(run.createdAt)}</p>
                </div>
                <div className="text-right">
                  <Badge variant={run.status === "completed" ? "outline" : "muted"}>{run.status}</Badge>
                  <p className="num mt-1 text-xs text-ink-3">
                    {run.doneItems}/{run.totalItems}
                    {run.failedItems > 0 ? ` · ${run.failedItems} failed` : ""}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  );
}

function pct(part: number, whole: number): number | null {
  return whole > 0 ? Math.round((part / whole) * 1000) / 10 : null;
}
