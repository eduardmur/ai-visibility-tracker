import Link from "next/link";
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={cx("rounded-xl border border-line bg-paper", className)}>{children}</section>;
}

export function CardHeader({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-5 py-4">
      <div>
        <h2 className="text-sm font-semibold text-ink">{title}</h2>
        {description ? <p className="mt-0.5 text-sm text-ink-2">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  );
}

export function Stat({ label, value, delta, hint }: { label: string; value: string; delta?: string | null; hint?: string }) {
  return (
    <div className="rounded-xl border border-line bg-paper px-5 py-4">
      <p className="text-sm text-ink-2">{label}</p>
      <p className="num mt-1 text-3xl font-semibold tracking-tight text-ink">{value}</p>
      {delta || hint ? (
        <p className="mt-1 text-xs text-ink-3">
          {delta ? <span className="text-ink-2">{delta}</span> : null}
          {delta && hint ? " · " : null}
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function Badge({ children, variant = "outline", className }: { children: ReactNode; variant?: "solid" | "outline" | "muted"; className?: string }) {
  const styles = {
    solid: "bg-ink text-paper border-ink",
    outline: "border-line text-ink",
    muted: "border-transparent bg-paper-3 text-ink-2",
  }[variant];
  return (
    <span className={cx("inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap", styles, className)}>
      {children}
    </span>
  );
}

const buttonBase =
  "inline-flex items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";
const buttonVariants = {
  primary: "bg-ink text-paper hover:opacity-90",
  secondary: "border border-line bg-paper text-ink hover:bg-paper-2",
  ghost: "text-ink-2 hover:bg-paper-2 hover:text-ink",
  danger: "text-ink-2 hover:text-ink hover:bg-paper-2",
};
export type ButtonVariant = keyof typeof buttonVariants;

export function Button({ variant = "primary", className, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  return <button className={cx(buttonBase, buttonVariants[variant], className)} {...props} />;
}

export function LinkButton({ href, variant = "secondary", className, children }: { href: string; variant?: ButtonVariant; className?: string; children: ReactNode }) {
  return (
    <Link href={href} className={cx(buttonBase, buttonVariants[variant], className)}>
      {children}
    </Link>
  );
}

const controlBase =
  "w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink placeholder:text-ink-3 focus:border-ink focus:outline-none";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cx(controlBase, className)} {...props} />;
}

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cx(controlBase, "pr-8", className)} {...props} />;
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cx(controlBase, "min-h-28", className)} {...props} />;
}

export function Field({ label, hint, children, htmlFor }: { label: string; hint?: string; children: ReactNode; htmlFor?: string }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-sm font-medium text-ink">
        {label}
      </label>
      {children}
      {hint ? <p className="text-xs text-ink-3">{hint}</p> : null}
    </div>
  );
}

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">{title}</h1>
        {description ? <p className="mt-1 text-sm text-ink-2">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function EmptyState({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <p className="text-base font-medium text-ink">{title}</p>
      {description ? <p className="mt-1 max-w-md text-sm text-ink-2">{description}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function Notice({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx("rounded-lg border border-line bg-paper-2 px-4 py-3 text-sm text-ink-2", className)}>{children}</div>;
}

export const table = {
  wrap: "overflow-x-auto",
  table: "w-full text-sm",
  th: "px-5 py-2.5 text-left text-xs font-medium text-ink-3 first:pl-5",
  thRight: "px-5 py-2.5 text-right text-xs font-medium text-ink-3",
  tr: "border-t border-line",
  td: "px-5 py-3 align-top text-ink",
  tdRight: "num px-5 py-3 text-right align-top text-ink",
  tdMuted: "px-5 py-3 align-top text-ink-2",
};

/** Period switch rendered as links so it works without JavaScript. */
export function PeriodSelect({ current, basePath, params }: { current: string; basePath: string; params?: Record<string, string | undefined> }) {
  const periods = [
    { key: "7d", label: "7d" },
    { key: "30d", label: "30d" },
    { key: "90d", label: "90d" },
  ];
  return (
    <div className="inline-flex rounded-lg border border-line p-0.5" role="group" aria-label="Period">
      {periods.map((p) => {
        const search = new URLSearchParams({ ...stripUndefined(params), period: p.key });
        const active = p.key === current;
        return (
          <Link
            key={p.key}
            href={`${basePath}?${search.toString()}`}
            className={cx("num rounded-md px-3 py-1 text-xs font-medium", active ? "bg-ink text-paper" : "text-ink-2 hover:text-ink")}
            aria-current={active ? "true" : undefined}
          >
            {p.label}
          </Link>
        );
      })}
    </div>
  );
}

function stripUndefined(params?: Record<string, string | undefined>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(params ?? {})) if (value) out[key] = value;
  return out;
}
