"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { QuestionCard, type Reveal } from "./QuestionCard";
import { ProgressBar } from "./ProgressBar";
import { isCorrect } from "@/lib/quiz";
import { useProgress } from "@/lib/progress";
import type { OptionKey, Question } from "@/lib/types";

interface Props {
  questions: Question[];
  title: string;
  /**
   * "lernen" reveals the answer as soon as an option is picked -- the fastest
   * loop for memorising. "ueben" requires an explicit check first, which forces
   * the learner to commit before seeing the answer.
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
  const { progress, recordAnswer, toggleFavorite } = useProgress();
  const [index, setIndex] = useState(0);
  const [chosen, setChosen] = useState<OptionKey | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [tally, setTally] = useState({ correct: 0, wrong: 0, skipped: 0 });

  const question = questions[index];
  const finished = index >= questions.length;

  const reveal: Reveal = useMemo(
    () => (revealed ? { state: "revealed", chosen } : { state: "hidden" }),
    [revealed, chosen],
  );

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
        <dl className="mt-5 grid grid-cols-3 gap-3">
          <Stat label="Richtig" value={tally.correct} tone="correct" />
          <Stat label="Falsch" value={tally.wrong} tone="wrong" />
          <Stat label="Ungewertet" value={tally.skipped} tone="warn" />
        </dl>
        <div className="mt-6 flex flex-col gap-2">
          <button
            type="button"
            onClick={() => {
              setIndex(0);
              setChosen(null);
              setRevealed(false);
              setTally({ correct: 0, wrong: 0, skipped: 0 });
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

  function choose(key: OptionKey) {
    setChosen(key);
    if (variant === "lernen") check(key);
  }

  function check(key: OptionKey | null = chosen) {
    if (key === null) return;
    setRevealed(true);
    const verdict = isCorrect(question, key);
    if (verdict === null) {
      setTally((t) => ({ ...t, skipped: t.skipped + 1 }));
    } else {
      recordAnswer(question.id, key, verdict);
      setTally((t) =>
        verdict
          ? { ...t, correct: t.correct + 1 }
          : { ...t, wrong: t.wrong + 1 },
      );
    }
  }

  function next() {
    setIndex((i) => i + 1);
    setChosen(null);
    setRevealed(false);
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
        chosen={chosen}
        reveal={reveal}
        onChoose={choose}
        isFavorite={progress.favorites.includes(question.id)}
        onToggleFavorite={() => toggleFavorite(question.id)}
      />

      {!revealed ? (
        variant === "ueben" ? (
          <button
            type="button"
            disabled={chosen === null}
            onClick={() => check()}
            className="rounded-xl bg-brand px-4 py-3.5 font-semibold text-white disabled:opacity-40"
          >
            Antwort prüfen
          </button>
        ) : (
          <p className="text-center text-sm text-ink-muted">
            Wähle eine Antwort.
          </p>
        )
      ) : (
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
  tone: "correct" | "wrong" | "warn";
}) {
  const colour =
    tone === "correct"
      ? "text-correct"
      : tone === "wrong"
        ? "text-wrong"
        : "text-warn";
  return (
    <div className="rounded-xl bg-surface-sunken p-3">
      <dt className="text-xs text-ink-muted">{label}</dt>
      <dd className={`text-2xl font-bold tabular-nums ${colour}`}>{value}</dd>
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
