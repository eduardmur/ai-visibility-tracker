import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge, Card, CardHeader, PageHeader, table } from "@/components/ui";
import { getDb } from "@/lib/db";
import { fmtDateTime, fmtPosition } from "@/lib/format";
import { platformLabel } from "@/lib/platforms";
import { getAnswer } from "@/lib/queries/answers";
import { getBrand } from "@/lib/queries/brand";

export const metadata: Metadata = { title: "Answer" };

export default async function AnswerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const answerId = Number(id);
  if (!Number.isInteger(answerId)) notFound();
  const db = await getDb();
  const brand = (await getBrand(db))!;
  const detail = await getAnswer(db, brand.id, answerId);
  if (!detail) notFound();
  const { answer, question, mentions } = detail;

  return (
    <>
      <PageHeader
        title={question.text}
        description={`${platformLabel(answer.platform)} · ${fmtDateTime(answer.completedAt ?? answer.createdAt)}${answer.modelId ? ` · ${answer.modelId}` : ""}`}
        actions={
          <Link href={`/runs/${answer.runId}`} className="text-sm text-ink-2 underline-offset-2 hover:text-ink hover:underline">
            View check
          </Link>
        }
      />

      <div className="mb-6 flex flex-wrap gap-2">
        {answer.status === "done" ? (
          <>
            <Badge variant={answer.brandMentioned ? "solid" : "outline"}>
              {answer.brandMentioned ? `${brand.name} mentioned ${answer.mentionCount}×` : `${brand.name} not mentioned`}
            </Badge>
            <Badge variant="outline">{answer.brandCited ? "Website cited" : "Website not cited"}</Badge>
            {answer.brandPosition ? <Badge variant="outline">Position {fmtPosition(answer.brandPosition)}</Badge> : null}
            <Badge variant="muted">{answer.brandsNamed} brands named</Badge>
          </>
        ) : (
          <Badge variant="muted" className="capitalize">
            {answer.status}
          </Badge>
        )}
      </div>

      {answer.error ? (
        <Card className="mb-6">
          <CardHeader title="Error" />
          <p className="px-5 py-4 text-sm text-ink-2">{answer.error}</p>
        </Card>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[3fr_2fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader title="Answer" />
            <div className="answer-text px-5 py-4 text-sm leading-6 text-ink">{answer.text ?? "—"}</div>
          </Card>
          {answer.searchQueries.length > 0 ? (
            <Card>
              <CardHeader title="Searches the platform ran" />
              <ul className="space-y-1 px-5 py-4 text-sm text-ink-2">
                {answer.searchQueries.map((query) => (
                  <li key={query}>{query}</li>
                ))}
              </ul>
            </Card>
          ) : null}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Brands in this answer" description="Found by the extractor; positions come from the answer text." />
            {mentions.length === 0 ? (
              <p className="px-5 py-4 text-sm text-ink-3">No brands extracted.</p>
            ) : (
              <ul className="divide-y divide-line">
                {mentions.map((m) => (
                  <li key={m.id} className="px-5 py-3 text-sm">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="num w-7 text-ink-3">{m.position ? `#${m.position}` : "—"}</span>
                      <span className="font-medium text-ink">{m.name}</span>
                      {m.isSelf ? <Badge variant="solid">you</Badge> : null}
                      {!m.isSelf && !m.isCompetitor ? <Badge variant="muted">not a competitor</Badge> : null}
                      <Badge variant="outline">{m.sentiment}</Badge>
                      {m.recommended ? <Badge variant="outline">recommended</Badge> : null}
                      {m.website ? <span className="text-xs text-ink-3">{m.website}</span> : null}
                    </div>
                    {m.highlights.length > 0 ? (
                      <ul className="mt-1.5 space-y-0.5 pl-9 text-ink-2">
                        {m.highlights.map((h) => (
                          <li key={h}>{h}</li>
                        ))}
                      </ul>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <CardHeader title={`Sources (${answer.sources.length})`} />
            {answer.sources.length === 0 ? (
              <p className="px-5 py-4 text-sm text-ink-3">The platform returned no sources.</p>
            ) : (
              <div className={table.wrap}>
                <table className={table.table}>
                  <tbody>
                    {answer.sources.map((source) => (
                      <tr key={source.url} className="border-t border-line first:border-t-0">
                        <td className="px-5 py-2.5 text-sm">
                          <a href={source.url} target="_blank" rel="noreferrer nofollow" className="break-all text-ink underline-offset-2 hover:underline">
                            {source.title ?? source.url}
                          </a>
                          {source.title ? <p className="break-all text-xs text-ink-3">{source.url}</p> : null}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
