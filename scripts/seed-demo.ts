/**
 * Seeds a demo brand with questions and two weeks of synthetic answers so the
 * dashboard has something to show (used for the public demo and for local UI
 * checks). Never runs against a database that already has a brand.
 *
 *   npm run seed:demo
 */
import { config as loadEnv } from "dotenv";
import { eq } from "drizzle-orm";

loadEnv({ path: [".env.local", ".env"], quiet: true });

const PLATFORMS = ["chatgpt", "perplexity", "gemini"] as const;
const QUESTIONS = [
  "best tools to track brand mentions in AI search",
  "how do I know if ChatGPT recommends my brand?",
  "AI visibility tracker alternatives to Profound",
  "which GEO tools work with Claude and Cursor?",
  "open source AEO tracking software",
];
const COMPETITORS = [
  { name: "Profound", key: "profound", website: "tryprofound.com", highlights: ["Enterprise AI visibility platform", "Weekly prompt sampling"] },
  { name: "Peec AI", key: "peec", website: "peec.ai", highlights: ["Tracks sentiment per prompt"] },
  { name: "Otterly.ai", key: "otterly", website: "otterly.ai", highlights: ["On-page GEO audits", "Starts at $29 per month"] },
  { name: "Elmo", key: "elmo", website: "elmohq.com", highlights: ["Open source and self-hostable"] },
];

function seeded(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

async function main(): Promise<void> {
  const [{ getDb }, schema] = await Promise.all([import("@/lib/db"), import("@/lib/db/schema")]);
  const db = await getDb();
  const existing = await db.select({ id: schema.brands.id }).from(schema.brands).limit(1);
  if (existing.length > 0) {
    console.log("A brand already exists; the demo seed only runs on an empty database.");
    return;
  }

  const [brand] = await db
    .insert(schema.brands)
    .values({ name: "Searcherries", aliases: ["Searcherries MCP"], domain: "searcherries.com", country: "us", language: "en", platforms: [...PLATFORMS] })
    .returning();
  const questions = await db
    .insert(schema.questions)
    .values(QUESTIONS.map((text, i) => ({ brandId: brand.id, text, cadence: i < 3 ? ("daily" as const) : ("weekly" as const) })))
    .returning();

  const random = seeded(42);
  const now = new Date();
  for (let day = 13; day >= 0; day -= 1) {
    const date = new Date(now.getTime() - day * 86_400_000);
    date.setUTCHours(6, 12, 0, 0);
    const due = questions.filter((q) => q.cadence === "daily" || day % 7 === 0);
    const [run] = await db
      .insert(schema.runs)
      .values({ brandId: brand.id, trigger: "scheduled", status: "completed", totalItems: due.length * PLATFORMS.length, startedAt: date, finishedAt: new Date(date.getTime() + 90_000), createdAt: date })
      .returning();

    let done = 0;
    for (const question of due) {
      for (const platform of PLATFORMS) {
        const mentioned = random() < 0.35 + (13 - day) * 0.025;
        const named = COMPETITORS.filter(() => random() < 0.6);
        const order = [...named.map((c) => c.name), ...(mentioned ? ["Searcherries"] : [])].sort(() => random() - 0.5);
        const text = [
          `For "${question.text}", the tools that come up most often are ${order.join(", ")}.`,
          ...order.map((name) => `- ${name}: ${name === "Searcherries" ? "connects AI visibility data to Claude, Codex and Cursor through MCP" : (COMPETITORS.find((c) => c.name === name)?.highlights[0] ?? "")}.`),
          mentioned && random() < 0.5 ? "Source: https://searcherries.com/docs" : "",
        ]
          .filter(Boolean)
          .join("\n");
        const cited = mentioned && text.includes("searcherries.com");
        const position = mentioned ? order.indexOf("Searcherries") + 1 : null;
        const sources = [
          ...named.map((c) => ({ url: `https://${c.website}/`, title: c.name })),
          ...(cited ? [{ url: "https://searcherries.com/docs", title: "Searcherries docs" }] : []),
          { url: "https://www.g2.com/categories/ai-visibility", title: "G2 category" },
        ];
        const completedAt = new Date(date.getTime() + done * 2_000);
        const [answer] = await db
          .insert(schema.answers)
          .values({
            runId: run.id,
            questionId: question.id,
            brandId: brand.id,
            platform,
            modelId: `${platform}/demo`,
            status: "done",
            attempts: 1,
            text,
            sources,
            searchQueries: [question.text],
            brandMentioned: mentioned,
            brandCited: cited,
            mentionCount: mentioned ? 2 : 0,
            brandPosition: position,
            brandsNamed: order.length,
            inputTokens: 900,
            outputTokens: 240,
            durationMs: 8_000 + Math.round(random() * 9_000),
            startedAt: completedAt,
            completedAt,
            createdAt: completedAt,
          })
          .returning({ id: schema.answers.id });

        const rows = order.map((name, index) => {
          const competitor = COMPETITORS.find((c) => c.name === name);
          const isSelf = name === "Searcherries";
          const roll = random();
          return {
            answerId: answer.id,
            runId: run.id,
            brandId: brand.id,
            platform,
            name,
            key: isSelf ? "searcherries" : competitor!.key,
            website: isSelf ? "searcherries.com" : competitor!.website,
            sentiment: (roll < 0.6 ? "positive" : roll < 0.9 ? "neutral" : "negative") as "positive" | "neutral" | "negative",
            recommended: index === 0,
            isCompetitor: !isSelf,
            isSelf,
            position: index + 1,
            highlights: isSelf ? ["Connects AI visibility data to Claude, Codex and Cursor through MCP"] : competitor!.highlights,
            createdAt: completedAt,
          };
        });
        if (rows.length > 0) await db.insert(schema.brandMentions).values(rows);
        done += 1;
      }
      await db.update(schema.questions).set({ lastRunAt: date }).where(eq(schema.questions.id, question.id));
    }
    await db.update(schema.runs).set({ doneItems: done }).where(eq(schema.runs.id, run.id));
  }
  console.log(`Seeded brand "${brand.name}" with ${questions.length} questions and 14 days of answers.`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
