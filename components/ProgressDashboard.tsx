"use client";

import Link from "next/link";
import { useState } from "react";
import { CATEGORIES } from "@/lib/categories";
import {
  allQuestions,
  gradableIds,
  questionsByCategory,
  questionsByTestbogen,
} from "@/lib/repository";
import { mistakeIds, statsFor, useProgress, type Stats } from "@/lib/progress";

export function ProgressDashboard() {
  const { progress, reset } = useProgress();
  const [confirmReset, setConfirmReset] = useState(false);

  const overall = statsFor(progress, gradableIds());
  const mistakes = mistakeIds(progress).length;

  const byCategory = CATEGORIES.map((category) => ({
    category,
    stats: statsFor(progress, gradableIds(questionsByCategory(category.id))),
  }));

  // "Strongest" and "needs work" only mean something once a category has
  // actually been practised, so unanswered categories are excluded.
  const rated = byCategory.filter((row) => row.stats.answered >= 3);
  const sorted = [...rated].sort((a, b) => b.stats.accuracy - a.stats.accuracy);
  const strongest = sorted[0];
  const weakest = sorted[sorted.length - 1];

  return (
    <div className="flex flex-col gap-5">
      <div>
        <Link href="/" className="text-sm font-medium text-brand no-underline">
          ← Startseite
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-ink">Mein Lernfortschritt</h1>
      </div>

      <section className="rounded-2xl border border-border bg-surface p-4">
        <dl className="grid grid-cols-2 gap-3">
          <Metric label="Gesamtfragen" value={overall.total} />
          <Metric label="Bearbeitet" value={overall.answered} />
          <Metric label="Richtig" value={overall.correct} tone="text-correct" />
          <Metric label="Falsch" value={overall.wrong} tone="text-wrong" />
        </dl>
        <div className="mt-4 border-t border-border pt-4">
          <p className="text-sm text-ink-muted">Genauigkeit</p>
          <p className="text-3xl font-bold tabular-nums text-ink">
            {overall.answered === 0
              ? "—"
              : `${Math.round(overall.accuracy * 100)}%`}
          </p>
        </div>
      </section>

      {overall.answered === 0 ? (
        <p className="rounded-xl border border-border bg-surface p-5 text-center text-sm text-ink-muted">
          Noch keine Antworten erfasst. Starte mit{" "}
          <Link href="/lernen" className="text-brand underline">
            Lernen
          </Link>
          .
        </p>
      ) : (
        <section className="grid gap-2">
          {strongest && strongest.stats.accuracy > 0 && (
            <Highlight
              tone="correct"
              icon="✓"
              title="Stärkstes Thema"
              text={`${strongest.category.label} — ${Math.round(strongest.stats.accuracy * 100)}%`}
            />
          )}
          {weakest && weakest !== strongest && (
            <Highlight
              tone="warn"
              icon="⚠"
              title="Verbesserung nötig"
              text={`${weakest.category.label} — ${Math.round(weakest.stats.accuracy * 100)}%`}
            />
          )}
          {mistakes > 0 && (
            <Link
              href="/fehler"
              className="rounded-xl border border-border bg-surface px-4 py-3 text-sm font-medium text-ink no-underline hover:bg-surface-sunken"
            >
              🔁 {mistakes} offene {mistakes === 1 ? "Fehlerfrage" : "Fehlerfragen"} üben
            </Link>
          )}
        </section>
      )}

      <Section title="Nach Thema">
        {byCategory.map(({ category, stats }) => (
          <Row key={category.id} label={category.label} stats={stats} />
        ))}
      </Section>

      <Section title="Nach Testbogen">
        {[1, 2, 3].map((sheet) => (
          <Row
            key={sheet}
            label={`Testbogen ${sheet}`}
            stats={statsFor(progress, gradableIds(questionsByTestbogen(sheet)))}
          />
        ))}
      </Section>

      <section className="rounded-2xl border border-border bg-surface p-4">
        <p className="text-sm text-ink">Fortschritt zurücksetzen</p>
        <p className="mt-1 text-xs text-ink-muted">
          Löscht alle Antworten und gemerkten Fragen auf diesem Gerät. Das lässt
          sich nicht rückgängig machen.
        </p>
        {confirmReset ? (
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => setConfirmReset(false)}
              className="flex-1 rounded-xl border border-border px-3 py-2.5 text-sm font-medium text-ink"
            >
              Abbrechen
            </button>
            <button
              type="button"
              onClick={() => {
                reset();
                setConfirmReset(false);
              }}
              className="flex-1 rounded-xl bg-wrong px-3 py-2.5 text-sm font-semibold text-white"
            >
              Wirklich löschen
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmReset(true)}
            className="mt-3 rounded-xl border border-border px-3 py-2 text-sm font-medium text-wrong"
          >
            Zurücksetzen
          </button>
        )}
      </section>
    </div>
  );
}

function Metric({
  label,
  value,
  tone = "text-ink",
}: {
  label: string;
  value: number;
  tone?: string;
}) {
  return (
    <div>
      <dt className="text-xs text-ink-muted">{label}</dt>
      <dd className={`text-2xl font-bold tabular-nums ${tone}`}>{value}</dd>
    </div>
  );
}

function Highlight({
  tone,
  icon,
  title,
  text,
}: {
  tone: "correct" | "warn";
  icon: string;
  title: string;
  text: string;
}) {
  const classes =
    tone === "correct"
      ? "border-correct/40 bg-correct-soft text-correct"
      : "border-warn/40 bg-warn-soft text-warn";
  return (
    <div className={`rounded-xl border px-4 py-3 ${classes}`}>
      <p className="text-xs font-semibold uppercase tracking-wide">
        <span aria-hidden>{icon}</span> {title}
      </p>
      <p className="mt-0.5 text-sm font-medium text-ink">{text}</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">
        {title}
      </h2>
      <div className="flex flex-col gap-1.5">{children}</div>
    </section>
  );
}

function Row({ label, stats }: { label: string; stats: Stats }) {
  const pct = stats.total === 0 ? 0 : (stats.answered / stats.total) * 100;
  return (
    <div className="rounded-xl border border-border bg-surface px-3.5 py-2.5">
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className="font-medium text-ink">{label}</span>
        <span className="shrink-0 text-xs tabular-nums text-ink-muted">
          {stats.answered}/{stats.total}
          {stats.answered > 0 && ` · ${Math.round(stats.accuracy * 100)}%`}
        </span>
      </div>
      <div
        aria-hidden
        className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-surface-sunken"
      >
        <div
          className="h-full rounded-full bg-brand"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
