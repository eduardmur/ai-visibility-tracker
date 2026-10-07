import type { Metadata } from "next";
import { asc, eq } from "drizzle-orm";
import { updateQuestion } from "@/app/actions/questions";
import { startRun } from "@/app/actions/runs";
import { QuestionForm } from "@/components/question-form";
import { Badge, Button, Card, CardHeader, Notice, PageHeader, table } from "@/components/ui";
import { questionBreakdown } from "@/lib/analysis/scoring";
import { getDb } from "@/lib/db";
import { questions } from "@/lib/db/schema";
import { fmtPct, fmtRelative } from "@/lib/format";
import { scoredAnswersSince } from "@/lib/queries/answers";
import { getBrand } from "@/lib/queries/brand";
import { periodRange } from "@/lib/queries/period";
import { listRuns } from "@/lib/queries/runs";

export const metadata: Metadata = { title: "Questions" };

export default async function QuestionsPage({ searchParams }: { searchParams: Promise<{ welcome?: string }> }) {
  const { welcome } = await searchParams;
  const db = await getDb();
  const brand = (await getBrand(db))!;
  const rows = await db.select().from(questions).where(eq(questions.brandId, brand.id)).orderBy(asc(questions.id));
  const stats = new Map(questionBreakdown(await scoredAnswersSince(db, brand.id, periodRange("30d").since)).map((s) => [s.questionId, s]));
  const runs = await listRuns(db, brand.id, 1);

  return (
    <>
      <PageHeader
        title="Questions"
        description="Each active question is asked on every selected platform. Daily questions run every day, weekly ones once a week."
        actions={
          rows.length > 0 && runs.length === 0 ? (
            <form action={startRun}>
              <Button type="submit">Run first check</Button>
            </form>
          ) : null
        }
      />

      {welcome ? (
        <Notice className="mb-6">
          <span className="font-medium text-ink">Step 2 of 2.</span> Add a few questions your customers would ask an AI assistant, then run the first check.
        </Notice>
      ) : null}

      <Card>
        <CardHeader title="Add questions" />
        <div className="px-5 py-5">
          <QuestionForm autoFocus={Boolean(welcome)} />
        </div>
      </Card>

      <Card className="mt-6">
        <CardHeader title={`Tracked questions (${rows.length})`} description="Score is the share of answers mentioning the brand, last 30 days." />
        {rows.length === 0 ? (
          <p className="px-5 py-5 text-sm text-ink-3">No questions yet.</p>
        ) : (
          <div className={table.wrap}>
            <table className={table.table}>
              <thead>
                <tr>
                  <th className={table.th}>Question</th>
                  <th className={table.th}>Cadence</th>
                  <th className={table.thRight}>Score</th>
                  <th className={table.th}>Last run</th>
                  <th className={table.th}>
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((q) => {
                  const stat = stats.get(q.id);
                  return (
                    <tr key={q.id} className={table.tr}>
                      <td className={table.td}>
                        {q.text}
                        {!q.isActive ? (
                          <Badge variant="muted" className="ml-2">
                            paused
                          </Badge>
                        ) : null}
                      </td>
                      <td className={table.tdMuted}>
                        <form action={updateQuestion} className="inline">
                          <input type="hidden" name="id" value={q.id} />
                          <input type="hidden" name="intent" value="cadence" />
                          <input type="hidden" name="cadence" value={q.cadence === "daily" ? "weekly" : "daily"} />
                          <button type="submit" className="underline-offset-2 hover:text-ink hover:underline" title="Switch cadence">
                            {q.cadence}
                          </button>
                        </form>
                      </td>
                      <td className={table.tdRight}>
                        {fmtPct(stat?.score ?? null)}
                        {stat ? <span className="ml-1 text-xs text-ink-3">{stat.answers}</span> : null}
                      </td>
                      <td className={table.tdMuted}>{fmtRelative(q.lastRunAt)}</td>
                      <td className={`${table.td} whitespace-nowrap text-right`}>
                        <form action={updateQuestion} className="inline">
                          <input type="hidden" name="id" value={q.id} />
                          <input type="hidden" name="intent" value="toggle" />
                          <button type="submit" className="text-ink-2 underline-offset-2 hover:text-ink hover:underline">
                            {q.isActive ? "Pause" : "Resume"}
                          </button>
                        </form>
                        <form action={updateQuestion} className="ml-3 inline">
                          <input type="hidden" name="id" value={q.id} />
                          <input type="hidden" name="intent" value="delete" />
                          <button type="submit" className="text-ink-2 underline-offset-2 hover:text-ink hover:underline">
                            Delete
                          </button>
                        </form>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
