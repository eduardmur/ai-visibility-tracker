import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/login-form";
import { isAuthConfigured, isAuthenticated } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  if (await isAuthenticated()) redirect("/");
  const { next } = await searchParams;
  const target = next && next.startsWith("/") && !next.startsWith("//") ? next : "/";

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-xl font-semibold tracking-tight text-ink">AI Visibility Tracker</h1>
        <p className="mt-1 text-sm text-ink-2">Sign in with the admin password.</p>
        <div className="mt-6 rounded-xl border border-line bg-paper p-5">
          {isAuthConfigured() ? (
            <LoginForm next={target} />
          ) : (
            <p className="text-sm text-ink-2">
              Set <code className="rounded bg-paper-3 px-1">ADMIN_PASSWORD</code> in the environment and restart the app.
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
