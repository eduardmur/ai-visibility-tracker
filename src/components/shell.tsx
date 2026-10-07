import Link from "next/link";
import type { ReactNode } from "react";
import { logout } from "@/app/actions/auth";
import { startRun } from "@/app/actions/runs";
import type { Brand, Run } from "@/lib/db/schema";
import { Button, LinkButton } from "./ui";
import { NavLink } from "./nav-link";

const NAV = [
  { href: "/", label: "Overview" },
  { href: "/questions", label: "Questions" },
  { href: "/answers", label: "Answers" },
  { href: "/competitors", label: "Competitors" },
  { href: "/settings", label: "Settings" },
];

export function Shell({ brand, running, children }: { brand: Brand; running: Run | null; children: ReactNode }) {
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[220px_1fr]">
      <aside className="border-b border-line bg-paper-2 lg:border-r lg:border-b-0">
        <div className="flex items-center justify-between gap-3 px-4 py-4 lg:block lg:px-5">
          <div className="min-w-0">
            <Link href="/" className="block truncate text-sm font-semibold text-ink">
              {brand.name}
            </Link>
            <p className="truncate text-xs text-ink-3">{brand.domain}</p>
          </div>
          <div className="lg:mt-4">
            {running ? (
              <LinkButton href={`/runs/${running.id}`} variant="secondary" className="w-full">
                <span className="inline-block size-1.5 animate-pulse rounded-full bg-ink" aria-hidden />
                Checking…
              </LinkButton>
            ) : (
              <form action={startRun}>
                <Button type="submit" className="w-full">
                  Run now
                </Button>
              </form>
            )}
          </div>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:px-3" aria-label="Main">
          {NAV.map((item) => (
            <NavLink key={item.href} href={item.href}>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="hidden px-5 pb-5 text-xs text-ink-3 lg:absolute lg:bottom-0 lg:block lg:w-[220px]">
          <p>
            Open source by{" "}
            <a href="https://searcherries.com?utm_source=ai-visibility-tracker&utm_medium=app" className="underline-offset-2 hover:text-ink hover:underline" target="_blank" rel="noreferrer">
              Searcherries
            </a>
          </p>
          <form action={logout} className="mt-2">
            <button type="submit" className="underline-offset-2 hover:text-ink hover:underline">
              Log out
            </button>
          </form>
        </div>
      </aside>
      <main className="min-w-0 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
    </div>
  );
}
