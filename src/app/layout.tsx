import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "AI Visibility Tracker",
    template: "%s · AI Visibility Tracker",
  },
  description: "Track how ChatGPT, Perplexity, Gemini, Claude and Grok mention, cite and describe your brand.",
};

/** Every page reads the tracker database at request time. */
export const dynamic = "force-dynamic";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
