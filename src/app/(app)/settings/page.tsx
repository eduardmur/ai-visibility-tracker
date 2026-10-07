import type { Metadata } from "next";
import { logout } from "@/app/actions/auth";
import { BrandForm } from "@/components/brand-form";
import { Badge, Button, Card, CardHeader, PageHeader, table } from "@/components/ui";
import { extractorAvailability, platformAvailability, transport } from "@/lib/ai/provider";
import { databaseUrl, getDb } from "@/lib/db";
import { PLATFORMS, PLATFORM_IDS } from "@/lib/platforms";
import { getBrand } from "@/lib/queries/brand";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const db = await getDb();
  const brand = (await getBrand(db))!;
  const platformOptions = PLATFORM_IDS.map((id) => platformAvailability(id));
  const extractor = extractorAvailability();
  const mode = transport();
  const cronConfigured = Boolean(process.env.CRON_SECRET);

  return (
    <>
      <PageHeader title="Settings" />

      <Card>
        <CardHeader title="Brand" description="Changes apply to the next check. Stored answers are not re-analyzed." />
        <div className="px-5 py-5">
          <BrandForm brand={brand} platformOptions={platformOptions} submitLabel="Save" />
        </div>
      </Card>

      <Card className="mt-6">
        <CardHeader
          title="AI access"
          description={
            mode === "gateway"
              ? "Requests go through the Vercel AI Gateway with one key (or the deployment's own identity on Vercel)."
              : "Requests go directly to each vendor with its own API key. Set AI_GATEWAY_API_KEY to use one key for everything."
          }
        />
        <div className={table.wrap}>
          <table className={table.table}>
            <thead>
              <tr>
                <th className={table.th}>Platform</th>
                <th className={table.th}>Model</th>
                <th className={table.th}>Status</th>
              </tr>
            </thead>
            <tbody>
              {platformOptions.map((option) => (
                <tr key={option.id} className={table.tr}>
                  <td className={table.td}>
                    {PLATFORMS[option.id].label}
                    <p className="text-xs text-ink-3">{PLATFORMS[option.id].description}</p>
                  </td>
                  <td className={`${table.tdMuted} font-mono text-xs`}>
                    {option.modelId}
                    <p className="font-sans text-xs text-ink-3">override with {PLATFORMS[option.id].modelEnv}</p>
                  </td>
                  <td className={table.td}>
                    {option.available ? <Badge variant="outline">Ready</Badge> : <Badge variant="muted">{option.reason}</Badge>}
                  </td>
                </tr>
              ))}
              <tr className={table.tr}>
                <td className={table.td}>
                  Brand extraction
                  <p className="text-xs text-ink-3">Names the brands in each answer and what was said about them.</p>
                </td>
                <td className={`${table.tdMuted} font-mono text-xs`}>
                  {extractor.modelId}
                  <p className="font-sans text-xs text-ink-3">override with MODEL_EXTRACTOR</p>
                </td>
                <td className={table.td}>
                  {extractor.available ? <Badge variant="outline">Ready</Badge> : <Badge variant="muted">{extractor.reason}</Badge>}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="mt-6">
        <CardHeader title="Schedule" description="A daily check runs at 06:00 UTC through Vercel Cron (vercel.json). Weekly questions are included once every seven days." />
        <div className="px-5 py-4 text-sm text-ink-2">
          {cronConfigured ? (
            <p>CRON_SECRET is set. The scheduled check and the background processor are protected.</p>
          ) : (
            <p>
              CRON_SECRET is not set. Manual checks work, but the scheduled check will not run until it is configured. Generate one with{" "}
              <code className="rounded bg-paper-3 px-1">openssl rand -hex 32</code>.
            </p>
          )}
        </div>
      </Card>

      <Card className="mt-6">
        <CardHeader title="Data" description={databaseUrl() ? "Stored in your Postgres database." : "Stored in the embedded PGlite database under ./data/pglite."} />
        <div className="flex flex-wrap items-center gap-4 px-5 py-4 text-sm">
          <span className="text-ink-2">Export answers as CSV:</span>
          {["7d", "30d", "90d"].map((period) => (
            <a key={period} href={`/api/export/answers?period=${period}`} className="text-ink underline-offset-2 hover:underline">
              last {period}
            </a>
          ))}
        </div>
      </Card>

      <Card className="mt-6">
        <CardHeader title="Session" />
        <div className="px-5 py-4">
          <form action={logout}>
            <Button type="submit" variant="secondary">
              Log out
            </Button>
          </form>
        </div>
      </Card>
    </>
  );
}
