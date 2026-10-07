"use client";

import { useActionState } from "react";
import { saveBrand, type BrandFormState } from "@/app/actions/brand";
import type { Brand } from "@/lib/db/schema";
import { COUNTRIES, LANGUAGES } from "@/lib/markets";
import { PLATFORMS, PLATFORM_IDS, type PlatformId } from "@/lib/platforms";
import { Button, Field, Input, Select, cx } from "./ui";

export interface PlatformOption {
  id: PlatformId;
  available: boolean;
  reason: string | null;
  modelId: string;
}

const initialState: BrandFormState = { error: null, saved: false };

export function BrandForm({
  brand,
  platformOptions,
  submitLabel,
}: {
  brand: Brand | null;
  platformOptions: PlatformOption[];
  submitLabel: string;
}) {
  const [state, action, pending] = useActionState(saveBrand, initialState);
  const selected = new Set(brand?.platforms ?? ["chatgpt", "perplexity", "gemini"]);

  return (
    <form action={action} className="space-y-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Brand name" htmlFor="name" hint="Exactly as AI answers would write it.">
          <Input id="name" name="name" required maxLength={120} defaultValue={brand?.name ?? ""} placeholder="Acme" autoFocus={!brand} />
        </Field>
        <Field label="Website" htmlFor="domain" hint="Used to detect citations of your own pages.">
          <Input id="domain" name="domain" required defaultValue={brand?.domain ?? ""} placeholder="acme.com" />
        </Field>
      </div>
      <Field label="Other spellings" htmlFor="aliases" hint="Comma-separated. Product names or old brand names also count as mentions.">
        <Input id="aliases" name="aliases" defaultValue={brand?.aliases.join(", ") ?? ""} placeholder="Acme Inc, Acme Analytics" />
      </Field>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Country" htmlFor="country" hint="Platforms answer as if searching from here.">
          <Select id="country" name="country" defaultValue={brand?.country ?? ""}>
            <option value="">Global</option>
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Language" htmlFor="language" hint="Leave empty to follow the question's language.">
          <Select id="language" name="language" defaultValue={brand?.language ?? ""}>
            <option value="">Same as the question</option>
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.name}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <fieldset>
        <legend className="text-sm font-medium text-ink">Platforms</legend>
        <p className="mt-0.5 text-xs text-ink-3">Each question is checked on every selected platform. Three platforms keep costs low; add more any time.</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {PLATFORM_IDS.map((id) => {
            const option = platformOptions.find((o) => o.id === id);
            const available = option?.available ?? false;
            return (
              <label
                key={id}
                className={cx(
                  "flex cursor-pointer items-start gap-3 rounded-lg border border-line px-3 py-2.5 text-sm hover:bg-paper-2",
                  !available && "opacity-60",
                )}
              >
                <input type="checkbox" name="platforms" value={id} defaultChecked={selected.has(id)} className="mt-0.5 accent-[var(--ink)]" />
                <span>
                  <span className="font-medium text-ink">{PLATFORMS[id].label}</span>
                  <span className="block text-xs text-ink-3">{available ? PLATFORMS[id].description : option?.reason ?? "Not available"}</span>
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>
      {state.error ? <p className="text-sm text-ink">{state.error}</p> : null}
      {state.saved ? <p className="text-sm text-ink-2">Saved.</p> : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : submitLabel}
      </Button>
    </form>
  );
}
