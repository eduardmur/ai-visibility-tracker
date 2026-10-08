# Vercel Templates gallery submission

Form: https://vercel.com/templates/submit (sign in with the Vercel account that owns the demo).

## Before submitting

1. **Demo deployment.** Create a second Vercel project from `eduardmur/ai-visibility-tracker` named `ai-visibility-tracker-demo`, attach a Neon database, and set:
   - `DEMO_MODE=1` (opens every page read-only; sample data is seeded during the build)
   - `ADMIN_PASSWORD` (lets you sign in to the demo as admin if ever needed)
   - `CRON_SECRET` (any value; the scheduled check is a no-op in demo mode)
   Give it a stable domain, e.g. `ai-visibility-tracker-demo.vercel.app`.
2. **Thumbnail.** `public/thumbnail.png` (1440×756, the 1200×630 aspect ratio) is served by any deployment at `/thumbnail.png`; the raw GitHub URL also works: `https://raw.githubusercontent.com/eduardmur/ai-visibility-tracker/main/public/thumbnail.png`.
3. Confirm the README's Deploy button opens the import flow with Neon and the two env prompts.

## Form values

| Field | Value |
|---|---|
| Template name | AI Visibility Tracker |
| Description (≤140 chars) | Track how ChatGPT, Perplexity, Gemini, Claude and Grok mention and cite your brand. One AI Gateway key, one-click deploy. |
| Demo URL | https://ai-visibility-tracker-demo.vercel.app |
| GitHub URL | https://github.com/eduardmur/ai-visibility-tracker |
| Branch | main |
| Thumbnail | https://raw.githubusercontent.com/eduardmur/ai-visibility-tracker/main/public/thumbnail.png |
| Use case | AI, Analytics, Monitoring (pick what the form offers; AI first) |
| Framework | Next.js |
| CSS | Tailwind CSS |
| Database | Neon (Postgres) |
| CMS | None |
| Authentication | None (single admin password) |
| Integrations | Neon |
| Required environment variables | `ADMIN_PASSWORD`, `CRON_SECRET` |
| Environment variables description | ADMIN_PASSWORD protects the dashboard. CRON_SECRET protects the daily check (any long random string). AI access uses the deployment's AI Gateway identity; the team needs a positive AI Gateway balance. |
| Environment variables documentation URL | https://github.com/eduardmur/ai-visibility-tracker#configuration |
| Publisher name | Searcherries |
| Contact email | the Searcherries contact address |

## Longer description, if the form asks for one

Self-hosted AI visibility tracker. Ask the questions your customers ask, on every major AI platform, and see who gets mentioned, cited and recommended: visibility score per platform and question, citation rate, competitors with sentiment and the exact statements made about them, full answers with sources, CSV export. One Vercel AI Gateway key covers every platform, each platform answers with its own native web search, a daily Vercel Cron keeps the history growing, and long checks run in self-chaining batches that fit the Hobby function limit. Next.js App Router, AI SDK, Drizzle on Neon Postgres, shadcn/ui.

## After approval

Add the gallery link to the README's hero and to the Searcherries site.
