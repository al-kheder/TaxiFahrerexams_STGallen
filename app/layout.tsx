import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "ARV 2 Lernplattform — Taxiprüfung St. Gallen",
  description:
    "150 Lernfragen zur ARV 2 (berufsmässiger Personentransport) mit Lern-, Übungs- und Prüfungsmodus.",
};

export const viewport: Viewport = {
  themeColor: "#1d4ed8",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de">
      <body>
        <a
          href="#inhalt"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-lg focus:bg-surface focus:px-4 focus:py-2 focus:text-brand"
        >
          Zum Inhalt springen
        </a>
        <div className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col">
          <header className="border-b border-border bg-surface px-4 py-3">
            <Link href="/" className="flex items-baseline gap-2 no-underline">
              <span className="text-base font-semibold text-ink">ARV 2</span>
              <span className="text-sm text-ink-muted">
                Taxiprüfung St. Gallen
              </span>
            </Link>
          </header>
          <main id="inhalt" className="flex-1 px-4 py-5">
            {children}
          </main>
          <footer className="border-t border-border px-4 py-4 text-xs text-ink-muted">
            150 Lernfragen zur ARV 2 (Stand 1. März 2025). Keine wortwörtliche
            Kopie eines Prüfungsbuches; kantonale und kommunale Taxiregeln können
            zusätzlich gelten.
          </footer>
        </div>
      </body>
    </html>
  );
}
