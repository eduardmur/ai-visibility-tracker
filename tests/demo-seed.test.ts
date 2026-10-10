import { eq } from "drizzle-orm";
import { beforeAll, describe, expect, it } from "vitest";
import { createPgliteDb, type Database } from "@/lib/db";
import { answers, brands } from "@/lib/db/schema";
import { seedDemoData } from "@/lib/demo-seed";
import { trendByDay } from "@/lib/analysis/scoring";
import { scoredAnswersSince } from "@/lib/queries/answers";

let db: Database;

beforeAll(async () => {
  db = await createPgliteDb("memory://");
});

describe("seedDemoData", () => {
  it("fills every report period and refuses to seed twice unless reset", async () => {
    const now = new Date("2026-10-10T12:00:00Z");
    const first = await seedDemoData(db, { now, days: 95 });
    expect(first.seeded).toBe(true);
    const [brand] = await db.select().from(brands);
    const rows = await scoredAnswersSince(db, brand.id, new Date(now.getTime() - 90 * 86_400_000));
    const trend = trendByDay(rows, 90, now);
    expect(trend.every((p) => p.score !== null)).toBe(true);

    const second = await seedDemoData(db, { now });
    expect(second.seeded).toBe(false);

    const third = await seedDemoData(db, { now, days: 10, reset: true });
    expect(third.seeded).toBe(true);
    const [fresh] = await db.select().from(brands);
    expect(fresh.id).not.toBe(brand.id);
    expect(await db.select({ id: answers.id }).from(answers).where(eq(answers.brandId, brand.id))).toHaveLength(0);
  });
});
