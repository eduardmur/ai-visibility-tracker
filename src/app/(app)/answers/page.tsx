import type { Metadata } from "next";
import Link from "next/link";
import { asc, eq } from "drizzle-orm";
import { Badge, Button, Card, PageHeader, Select, table } from "@/components/ui";
import { getDb } from "@/lib/db";
import { questions } from "@/lib/db/schema";
import { fmtDateTime, fmtPosition, truncate } from "@/lib/format";
import { PLATFORM_IDS, PLATFORMS, platformLabel } from "@/lib/platforms";
import { listAnswers } from "@/lib/queries/answers";
import { getBrand } from "@/lib/queries/brand";
import { PERIODS, parsePeriod, periodRange } from "@/lib/queries/period";

export const metadata: Metadata = { title: "Answers" };

const PAGE_SIZE = 50;

type Search = { period?: string; platform?: string; questionId?: string; mentioned?: string; page?: string };

export default async function AnswersPage({ searchParams }: { searchParams: Promise<Search> }) {
  const params = await searchParams;
  const period = parsePeriod(params.period);
  const platform = PLATFORM_IDS.includes(params.platform as (typeof PLATFORM_IDS)[number]) ? params.platform : undefined;
  const questionId = Number(params.questionId) > 0 ? Number(params.questionId) : undefined;
  const mentioned = params.mentioned === "yes" || params.mentioned === "no" ? params.mentioned : undefined;
  const page = Math.max(1, Number(params.page) || 1);

  const db = await getDb();
  const brand = (await getBrand(db))!;
  const questionRows = await db
    .select({ id: questions.id, text: questions.text })
    .from(questions)
    .where(eq(questions.brandId, brand.id))
    .orderBy(asc(questions.id));
  const { rows, total } = await listAnswers(db, brand.id, {
    since: periodRange(period).since,
    platform,
    questionId,
    mentioned,
    page,
    pageSize: PAGE_SIZE,
  });
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const pageLink = (n: number) => {
    const search = new URLSearchParams();
    search.set("period", period);
    if (platform) search.set("platform", platform);
    if (questionId) search.set("questionId", String(questionId));
    if (mentioned) search.set("mentioned", mentioned);
    search.set("page", String(n));
    return `/answers?${search.toString()}`;
  };

  return (
    <>
      <PageHeader title="Answers" description="Every stored answer, with the brands it names and the sources it cites." />

      <form method="get" className="mb-4 flex flex-wrap items-end gap-3">
        <div className="w-32">
          <label className="mb-1 block text-xs text-ink-3" htmlFor="period">
            Period
          </label>
          <Select id="period" name="period" defaultValue={period}>
            {PERIODS.map((p) => (
              <option key={p.key} value={p.key}>
                {p.label}
              </option>
            ))}
          </Select>
        </div>
        <div className="w-40">
          <label className="mb-1 block text-xs text-ink-3" htmlFor="platform">
            Platform
          </label>
          <Select id="platform" name="platform" defaultValue={platform ?? ""}>
            <option value="">All platforms</option>
            {PLATFORM_IDS.map((id) => (
              <option key={id} value={id}>
                {PLATFORMS[id].label}
              </option>
            ))}
          </Select>
        </div>
        <div className="w-72">
          <label className="mb-1 block text-xs text-ink-3" htmlFor="questionId">
            Question
          </label>
          <Select id="questionId" name="questionId" defaultValue={questionId ? String(questionId) : ""}>
            <option value="">All questions</option>
            {questionRows.map((q) => (
              <option key={q.id} value={q.id}>
                {truncate(q.text, 60)}
              </option>
            ))}
          </Select>
        </div>
        <div className="w-40">
          <label className="mb-1 block text-xs text-ink-3" htmlFor="mentioned">
            Brand
          </label>
          <Select id="mentioned" name="mentioned" defaultValue={mentioned ?? ""}>
            <option value="">Any</option>
            <option value="yes">Mentioned</option>
            <option value="no">Not mentioned</option>
          </Select>
        </div>
        <Button type="submit" variant="secondary">
          Filter
        </Button>
        <a href={`/api/export/answers?period=${period}`} className="ml-auto text-sm text-ink-2 underline-offset-2 hover:text-ink hover:underline">
          Export CSV
        </a>
      </form>

      <Card>
        {rows.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-ink-3">No answers match these filters.</p>
        ) : (
          <div className={table.wrap}>
            <table className={table.table}>
              <thead>
                <tr>
                  <th className={table.th}>Date</th>
                  <th className={table.th}>Question</th>
                  <th className={table.th}>Platform</th>
                  <th className={table.th}>Brand</th>
                  <th className={table.thRight}>Position</th>
                  <th className={table.thRight}>Brands</th>
                  <th className={table.thRight}>Sources</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className={table.tr}>
                    <td className={`${table.tdMuted} whitespace-nowrap`}>
                      <Link href={`/answers/${row.id}`} className="text-ink underline-offset-2 hover:underline">
                        {fmtDateTime(row.completedAt ?? null)}
                      </Link>
                    </td>
                    <td className={table.td}>{truncate(row.questionText, 80)}</td>
                    <td className={table.tdMuted}>{platformLabel(row.platform)}</td>
                    <td className={table.td}>
                      {row.status === "done" ? (
                        <span className="flex flex-wrap gap-1">
                          <Badge variant={row.brandMentioned ? "solid" : "outline"}>{row.brandMentioned ? "Mentioned" : "Not mentioned"}</Badge>
                          {row.brandCited ? <Badge variant="outline">Cited</Badge> : null}
                        </span>
                      ) : (
                        <Badge variant="muted" className="capitalize">
                          {row.status}
                        </Badge>
                      )}
                    </td>
                    <td className={table.tdRight}>{fmtPosition(row.brandPosition)}</td>
                    <td className={table.tdRight}>{row.brandsNamed}</td>
                    <td className={table.tdRight}>{row.sourcesCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {pages > 1 ? (
          <div className="flex items-center justify-between border-t border-line px-5 py-3 text-sm text-ink-2">
            <span className="num">
              Page {page} of {pages} · {total} answers
            </span>
            <span className="flex gap-3">
              {page > 1 ? (
                <Link href={pageLink(page - 1)} className="underline-offset-2 hover:text-ink hover:underline">
                  Previous
                </Link>
              ) : null}
              {page < pages ? (
                <Link href={pageLink(page + 1)} className="underline-offset-2 hover:text-ink hover:underline">
                  Next
                </Link>
              ) : null}
            </span>
          </div>
        ) : null}
      </Card>
    </>
  );
}
