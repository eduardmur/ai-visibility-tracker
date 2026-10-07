import type { Metadata } from "next";
import { logout } from "@/app/actions/auth";
import { Muted, PageHeader, Section, TABLE_INSET } from "@/components/blocks";
import { BrandForm } from "@/components/brand-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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

      <Section title="Brand" description="Changes apply to the next check. Stored answers are not re-analyzed.">
        <BrandForm brand={brand} platformOptions={platformOptions} submitLabel="Save" />
      </Section>

      <Section
        className="mt-6"
        title="AI access"
        description={
          mode === "gateway"
            ? "Requests go through the Vercel AI Gateway with one key (or the deployment's own identity on Vercel)."
            : "Requests go directly to each vendor with its own API key. Set AI_GATEWAY_API_KEY to use one key for everything."
        }
        flush
      >
        <Table className={TABLE_INSET}>
          <TableHeader>
            <TableRow>
              <TableHead>Platform</TableHead>
              <TableHead>Model</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {platformOptions.map((option) => (
              <TableRow key={option.id}>
                <TableCell className="whitespace-normal">
                  {PLATFORMS[option.id].label}
                  <p className="text-xs text-muted-foreground">{PLATFORMS[option.id].description}</p>
                </TableCell>
                <TableCell className="whitespace-normal">
                  <code className="font-mono text-xs">{option.modelId}</code>
                  <p className="text-xs text-muted-foreground">override with {PLATFORMS[option.id].modelEnv}</p>
                </TableCell>
                <TableCell className="whitespace-normal">
                  {option.available ? <Badge variant="outline">Ready</Badge> : <Badge variant="secondary">{option.reason}</Badge>}
                </TableCell>
              </TableRow>
            ))}
            <TableRow>
              <TableCell className="whitespace-normal">
                Brand extraction
                <p className="text-xs text-muted-foreground">Names the brands in each answer and what was said about them.</p>
              </TableCell>
              <TableCell className="whitespace-normal">
                <code className="font-mono text-xs">{extractor.modelId}</code>
                <p className="text-xs text-muted-foreground">override with MODEL_EXTRACTOR</p>
              </TableCell>
              <TableCell className="whitespace-normal">
                {extractor.available ? <Badge variant="outline">Ready</Badge> : <Badge variant="secondary">{extractor.reason}</Badge>}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </Section>

      <Section className="mt-6" title="Schedule" description="A daily check runs at 06:00 UTC through Vercel Cron (vercel.json). Weekly questions are included once every seven days.">
        {cronConfigured ? (
          <Muted>CRON_SECRET is set. The scheduled check and the background processor are protected.</Muted>
        ) : (
          <Muted>
            CRON_SECRET is not set. Manual checks work, but the scheduled check will not run until it is configured. Generate one with{" "}
            <code className="rounded bg-muted px-1 font-mono text-xs">openssl rand -hex 32</code>.
          </Muted>
        )}
      </Section>

      <Section className="mt-6" title="Data" description={databaseUrl() ? "Stored in your Postgres database." : "Stored in the embedded PGlite database under ./data/pglite."}>
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <span className="text-muted-foreground">Export answers as CSV:</span>
          {["7d", "30d", "90d"].map((period) => (
            <a key={period} href={`/api/export/answers?period=${period}`} className="underline-offset-4 hover:underline">
              last {period}
            </a>
          ))}
        </div>
      </Section>

      <Section className="mt-6" title="Session">
        <form action={logout}>
          <Button type="submit" variant="outline">
            Log out
          </Button>
        </form>
      </Section>
    </>
  );
}
