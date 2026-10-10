/**
 * Fills the database with the fictional demo brand and its history.
 *
 *   npm run seed:demo                 # only when the database has no brand yet
 *   npm run seed:demo -- --reset      # wipe every brand first, then seed
 *   tsx scripts/seed-demo.ts --only-in-demo-mode
 *       build step: resets and seeds when DEMO_MODE=1, otherwise does nothing
 */
import { config as loadEnv } from "dotenv";

loadEnv({ path: [".env.local", ".env"], quiet: true });

async function main(): Promise<void> {
  const onlyInDemoMode = process.argv.includes("--only-in-demo-mode");
  const [{ isDemoMode }, { getDb }, { seedDemoData }] = await Promise.all([
    import("@/lib/demo"),
    import("@/lib/db"),
    import("@/lib/demo-seed"),
  ]);
  if (onlyInDemoMode && !isDemoMode()) return;

  const reset = onlyInDemoMode || process.argv.includes("--reset");
  const db = await getDb();
  const result = await seedDemoData(db, { reset });
  console.log(
    result.seeded
      ? `Seeded the demo brand with ${result.days} days and ${result.answers} answers.`
      : "A brand already exists; pass --reset to replace it with the demo data.",
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
