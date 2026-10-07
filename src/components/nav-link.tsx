"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export function NavLink({ href, children }: { href: string; children: ReactNode }) {
  const pathname = usePathname();
  const active = href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={
        active
          ? "rounded-md bg-paper-3 px-3 py-1.5 text-sm font-medium text-ink"
          : "rounded-md px-3 py-1.5 text-sm text-ink-2 hover:bg-paper-2 hover:text-ink"
      }
    >
      {children}
    </Link>
  );
}
