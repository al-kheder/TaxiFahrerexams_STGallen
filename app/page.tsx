import Link from "next/link";
import { StatsStrip } from "@/components/StatsStrip";
import { allQuestions } from "@/lib/repository";

const MODES = [
  {
    href: "/lernen",
    title: "Lernen",
    description: "Frage lesen, Antwort aufdecken, weiter — ohne Bewertung",
    icon: "📖",
  },
  {
    href: "/ueben",
    title: "Üben",
    description: "Antwort erst abrufen, dann aufdecken und selbst beurteilen",
    icon: "✏️",
  },
  {
    href: "/pruefung",
    title: "Prüfungssimulation",
    description: "Ein langer Durchgang mit Auswertung am Schluss",
    icon: "🎯",
  },
  {
    href: "/fehler",
    title: "Zu wiederholen",
    description: "Nur Fragen, die du zuletzt nicht wusstest",
    icon: "🔁",
  },
  {
    href: "/favoriten",
    title: "Gemerkte Fragen",
    description: "Deine markierten Fragen",
    icon: "★",
  },
  {
    href: "/fragen",
    title: "Alle Fragen",
    description: "Durchsuchen und nach Thema filtern",
    icon: "🔍",
  },
];

export default function HomePage() {
  const total = allQuestions().length;

  return (
    <div className="flex flex-col gap-6">
      <section>
        <h1 className="text-2xl font-bold tracking-tight text-ink">
          ARV 2 — Taxi: {total} Prüfungsfragen
        </h1>
        <p className="mt-1.5 text-sm text-ink-muted">
          Kurze Lernfragen zu Arbeits-, Lenk- und Ruhezeit, in fünf Teile
          gegliedert.
        </p>
      </section>

      <StatsStrip />

      <nav aria-label="Lernmodi">
        <ul className="flex flex-col gap-2.5">
          {MODES.map((mode) => (
            <li key={mode.href}>
              <Link
                href={mode.href}
                className="flex items-center gap-3.5 rounded-2xl border border-border bg-surface px-4 py-3.5 no-underline transition-colors hover:bg-surface-sunken"
              >
                <span aria-hidden className="text-2xl">
                  {mode.icon}
                </span>
                <span className="min-w-0">
                  <span className="block font-semibold text-ink">
                    {mode.title}
                  </span>
                  <span className="block text-[13px] leading-snug text-ink-muted">
                    {mode.description}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <Link
        href="/fortschritt"
        className="rounded-2xl border border-border bg-surface px-4 py-3.5 text-center font-semibold text-ink no-underline hover:bg-surface-sunken"
      >
        Mein Lernfortschritt
      </Link>

      <p className="rounded-xl border border-border bg-surface px-3.5 py-3 text-[13px] leading-relaxed text-ink-muted">
        <strong className="text-ink">Zur Quelle:</strong> Die Fragen sind kurze
        Lernfragen zur ARV 2 (Stand 1. März 2025) und keine wortwörtliche Kopie
        eines bestimmten Prüfungsbuches. Für die Prüfung können kantonale oder
        kommunale Taxiregeln zusätzlich relevant sein.
      </p>
    </div>
  );
}
