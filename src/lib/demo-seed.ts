import { eq } from "drizzle-orm";
import type { Database } from "@/lib/db";
import { answers, brandMentions, brands, questions, runs, type Sentiment } from "@/lib/db/schema";

/**
 * Sample data for the public demo and local UI checks: a fictional brand with
 * five questions and a daily history long enough to fill every report period.
 * Every company, domain and statement is invented.
 */
export const DEMO_SEED_DAYS = 95;

const PLATFORMS = ["chatgpt", "perplexity", "gemini"] as const;
const BRAND = { name: "Northwind Analytics", alias: "Northwind", domain: "northwind.example", key: "northwind" };
const QUESTIONS = [
  "best analytics tools for small e-commerce teams",
  "which product analytics platform is easiest to set up?",
  "Northwind Analytics alternatives",
  "analytics tools that integrate with Shopify and Slack",
  "self-hosted product analytics software",
];
const COMPETITORS = [
  { name: "Lumen Metrics", key: "lumenmetrics", website: "lumenmetrics.example", highlights: ["Enterprise product analytics", "Weekly cohort reports"] },
  { name: "Orbit Insights", key: "orbitinsights", website: "orbitinsights.example", highlights: ["Tracks funnels per campaign"] },
  { name: "Beacon Data", key: "beacondata", website: "beacondata.example", highlights: ["No-code dashboards", "Free plan for small teams"] },
  { name: "Clearview BI", key: "clearviewbi", website: "clearviewbi.example", highlights: ["Open source and self-hostable"] },
];
const BRAND_HIGHLIGHT = "Real-time dashboards with a one-line Shopify integration";

function seeded(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

/** Mention probability: a slow climb with a weekly wobble, so the trend reads like real tracking. */
function mentionProbability(dayIndex: number, totalDays: number): number {
  const progress = dayIndex / Math.max(1, totalDays - 1);
  return 0.3 + 0.32 * progress + 0.05 * Math.sin((dayIndex / 7) * Math.PI);
}

export interface SeedDemoOptions {
  /** Delete every brand (and, by cascade, all data) before seeding. */
  reset?: boolean;
  now?: Date;
  days?: number;
}

export interface SeedDemoResult {
  seeded: boolean;
  days: number;
  answers: number;
}

export async function seedDemoData(db: Database, options: SeedDemoOptions = {}): Promise<SeedDemoResult> {
  const days = options.days ?? DEMO_SEED_DAYS;
  const now = options.now ?? new Date();

  if (options.reset) {
    await db.delete(brands);
  }
  const existing = await db.select({ id: brands.id }).from(brands).limit(1);
  if (existing.length > 0) {
    return { seeded: false, days: 0, answers: 0 };
  }

  const [brand] = await db
    .insert(brands)
    .values({ name: BRAND.name, aliases: [BRAND.alias], domain: BRAND.domain, country: "us", language: "en", platforms: [...PLATFORMS] })
    .returning();
  const questionRows = await db
    .insert(questions)
    .values(QUESTIONS.map((text, i) => ({ brandId: brand.id, text, cadence: i < 3 ? ("daily" as const) : ("weekly" as const) })))
    .returning();

  const random = seeded(42);
  let totalAnswers = 0;

  for (let day = days - 1; day >= 0; day -= 1) {
    const date = new Date(now.getTime() - day * 86_400_000);
    date.setUTCHours(6, 12, 0, 0);
    const dayIndex = days - 1 - day;
    const due = questionRows.filter((q) => q.cadence === "daily" || day % 7 === 0);
    const [run] = await db
      .insert(runs)
      .values({
        brandId: brand.id,
        trigger: "scheduled",
        status: "completed",
        totalItems: due.length * PLATFORMS.length,
        startedAt: date,
        finishedAt: new Date(date.getTime() + 90_000),
        createdAt: date,
      })
      .returning();

    const answerValues: (typeof answers.$inferInsert)[] = [];
    const mentionPlans: Array<{ order: string[]; platform: string; completedAt: Date }> = [];
    let index = 0;
    for (const question of due) {
      for (const platform of PLATFORMS) {
        const mentioned = random() < mentionProbability(dayIndex, days);
        const named = COMPETITORS.filter(() => random() < 0.6);
        const order = [...named.map((c) => c.name), ...(mentioned ? [BRAND.name] : [])].sort(() => random() - 0.5);
        const text = [
          `For "${question.text}", the tools that come up most often are ${order.join(", ")}.`,
          ...order.map((name) => `- ${name}: ${name === BRAND.name ? BRAND_HIGHLIGHT : (COMPETITORS.find((c) => c.name === name)?.highlights[0] ?? "")}.`),
          mentioned && random() < 0.5 ? `Source: https://${BRAND.domain}/docs` : "",
        ]
          .filter(Boolean)
          .join("\n");
        const cited = mentioned && text.includes(BRAND.domain);
        const completedAt = new Date(date.getTime() + index * 2_000);
        answerValues.push({
          runId: run.id,
          questionId: question.id,
          brandId: brand.id,
          platform,
          modelId: `${platform}/demo`,
          status: "done",
          attempts: 1,
          text,
          sources: [
            ...named.map((c) => ({ url: `https://${c.website}/`, title: c.name })),
            ...(cited ? [{ url: `https://${BRAND.domain}/docs`, title: `${BRAND.name} docs` }] : []),
            { url: "https://reviews.example/categories/product-analytics", title: "Review site category" },
          ],
          searchQueries: [question.text],
          brandMentioned: mentioned,
          brandCited: cited,
          mentionCount: mentioned ? 2 : 0,
          brandPosition: mentioned ? order.indexOf(BRAND.name) + 1 : null,
          brandsNamed: order.length,
          inputTokens: 900,
          outputTokens: 240,
          durationMs: 8_000 + Math.round(random() * 9_000),
          startedAt: completedAt,
          completedAt,
          createdAt: completedAt,
        });
        mentionPlans.push({ order, platform, completedAt });
        index += 1;
      }
    }

    const inserted = await db.insert(answers).values(answerValues).returning({ id: answers.id });
    const mentionValues: (typeof brandMentions.$inferInsert)[] = [];
    inserted.forEach((row, i) => {
      const plan = mentionPlans[i];
      plan.order.forEach((name, position) => {
        const competitor = COMPETITORS.find((c) => c.name === name);
        const isSelf = name === BRAND.name;
        const roll = random();
        const sentiment: Sentiment = roll < 0.6 ? "positive" : roll < 0.9 ? "neutral" : "negative";
        mentionValues.push({
          answerId: row.id,
          runId: run.id,
          brandId: brand.id,
          platform: plan.platform,
          name,
          key: isSelf ? BRAND.key : competitor!.key,
          website: isSelf ? BRAND.domain : competitor!.website,
          sentiment,
          recommended: position === 0,
          isCompetitor: !isSelf,
          isSelf,
          position: position + 1,
          highlights: isSelf ? [BRAND_HIGHLIGHT] : competitor!.highlights,
          createdAt: plan.completedAt,
        });
      });
    });
    if (mentionValues.length > 0) await db.insert(brandMentions).values(mentionValues);
    totalAnswers += inserted.length;

    await db.update(runs).set({ doneItems: inserted.length }).where(eq(runs.id, run.id));
    for (const question of due) {
      await db.update(questions).set({ lastRunAt: date }).where(eq(questions.id, question.id));
    }
  }

  return { seeded: true, days, answers: totalAnswers };
}
