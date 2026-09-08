"use client";

import Link from "next/link";
import { useState } from "react";
import { QuestionCard } from "./QuestionCard";
import { ProgressBar } from "./ProgressBar";
import { useProgress } from "@/lib/progress";
import type { Question, Recall } from "@/lib/types";

interface Props {
  questions: Question[];
  title: string;
  /**
   * "lernen" is study mode: reveal the answer and move on, nothing is rated.
   * "ueben" asks the learner to rate their recall, which feeds the mistake
   * queue and the progress dashboard.
   */
  variant: "lernen" | "ueben";
  emptyMessage?: string;
}

export function PracticeSession({
  questions,
  title,
  variant,
  emptyMessage,
}: Props) {
  const { progress, recordRecall, toggleFavorite } = useProgress();
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [tally, setTally] = useState({ knew: 0, missed: 0 });

  const question = questions[index];
  const finished = index >= questions.length;

  if (questions.length === 0) {
    return (
      <EmptyState
        title={title}
        message={emptyMessage ?? "Für diese Auswahl gibt es keine Fragen."}
      />
    );
  }

  if (finished) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-5 text-center">
        <h1 className="text-xl font-semibold text-ink">Durchgang beendet</h1>
        <p className="mt-2 text-sm text-ink-muted">{title}</p>
        {variant === "ueben" ? (
          <dl className="mt-5 grid grid-cols-2 gap-3">
            <Stat label="Gewusst" value={tally.knew} tone="text-correct" />
            <Stat label="Nicht gewusst" value={tally.missed} tone="text-wrong" />
          </dl>
        ) : (
          <p className="mt-4 text-sm text-ink-muted">
            {questions.length} Fragen durchgearbeitet.
          </p>
        )}
        <div className="mt-6 flex flex-col gap-2">
          <button
            type="button"
            onClick={() => {
              setIndex(0);
              setRevealed(false);
              setTally({ knew: 0, missed: 0 });
            }}
            className="rounded-xl bg-brand px-4 py-3 font-semibold text-white"
          >
            Nochmals üben
          </button>
          <Link
            href="/"
            className="rounded-xl border border-border px-4 py-3 text-center font-medium text-ink no-underline"
          >
            Zur Startseite
          </Link>
        </div>
      </div>
    );
  }

  function next() {
    setIndex((i) => i + 1);
    setRevealed(false);
  }

  function rate(recall: Recall) {
    recordRecall(question.id, recall);
    setTally((t) =>
      recall === "knew" ? { ...t, knew: t.knew + 1 } : { ...t, missed: t.missed + 1 },
    );
    next();
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="mb-2 text-sm font-medium text-ink-muted">{title}</h1>
        <ProgressBar
          value={index + 1}
          max={questions.length}
          label={`Frage ${index + 1} / ${questions.length}`}
        />
      </div>

      <QuestionCard
        key={question.id}
        question={question}
        revealed={revealed}
        onReveal={() => setRevealed(true)}
        onRate={variant === "ueben" ? rate : undefined}
        isFavorite={progress.favorites.includes(question.id)}
        onToggleFavorite={() => toggleFavorite(question.id)}
      />

      {variant === "lernen" && revealed && (
        <button
          type="button"
          onClick={next}
          autoFocus
          className="rounded-xl bg-brand px-4 py-3.5 font-semibold text-white"
        >
          {index + 1 === questions.length ? "Abschliessen" : "Weiter →"}
        </button>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: string;
}) {
  return (
    <div className="rounded-xl bg-surface-sunken p-3">
      <dt className="text-xs text-ink-muted">{label}</dt>
      <dd className={`text-2xl font-bold tabular-nums ${tone}`}>{value}</dd>
    </div>
  );
}

function EmptyState({ title, message }: { title: string; message: string }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-6 text-center">
      <h1 className="text-lg font-semibold text-ink">{title}</h1>
      <p className="mt-2 text-sm text-ink-muted">{message}</p>
      <Link
        href="/"
        className="mt-5 inline-block rounded-xl border border-border px-4 py-2.5 font-medium text-ink no-underline"
      >
        Zur Startseite
      </Link>
    </div>
  );
}
