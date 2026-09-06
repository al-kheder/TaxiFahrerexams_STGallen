import Link from "next/link";
import { StatsStrip } from "@/components/StatsStrip";
import { allQuestions, flaggedQuestions } from "@/lib/repository";

const MODES = [
  {
    href: "/lernen",
    title: "Lernen",
    description: "Frage für Frage mit sofortiger Antwort und arabischer Erklärung",
    icon: "📖",
  },
  {
    href: "/ueben",
    title: "Üben",
    description: "Erst antworten, dann prüfen — mit direktem Feedback",
    icon: "✏️",
  },
  {
    href: "/pruefung",
    title: "Prüfungssimulation",
    description: "30 Fragen am Stück, Auswertung erst am Schluss",
    icon: "🎯",
  },
  {
    href: "/fehler",
    title: "Meine Fehler",
    description: "Nur Fragen, die zuletzt falsch beantwortet wurden",
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
  const flagged = flaggedQuestions().length;

  return (
    <div className="flex flex-col gap-6">
      <section>
        <h1 className="text-2xl font-bold tracking-tight text-ink">
          Berufsmässiger Personentransport ARV 2
        </h1>
        <p className="mt-1.5 text-sm text-ink-muted">
          {total} Fragen aus drei Original-Testbogen, mit kurzen Erklärungen auf
          Arabisch.
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

      {flagged > 0 && (
        <p className="rounded-xl border border-warn/40 bg-warn-soft px-3.5 py-3 text-[13px] leading-relaxed text-warn">
          <strong>Hinweis:</strong> Bei {flagged} von {total} Fragen ist die im
          Original markierte Antwort nicht eindeutig oder widerspricht einem
          anderen Testbogen. Diese Fragen sind gekennzeichnet und zählen in der
          Prüfungssimulation nicht.{" "}
          <Link href="/fragen?nurPruefen=1" className="underline">
            Betroffene Fragen ansehen
          </Link>
        </p>
      )}
    </div>
  );
}
