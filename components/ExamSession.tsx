"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { QuestionCard } from "./QuestionCard";
import { allQuestions, questionsByPart } from "@/lib/repository";
import { gradeSession, shuffle, type SessionResult } from "@/lib/quiz";
import { useProgress } from "@/lib/progress";
import type { Question, Recall } from "@/lib/types";

const EXAM_LENGTH = 30;

type Phase =
  | { name: "setup" }
  | { name: "running"; questions: Question[]; startedAt: number }
  | { name: "done"; result: SessionResult; seconds: number };

export function ExamSession() {
  const [phase, setPhase] = useState<Phase>({ name: "setup" });

  if (phase.name === "setup") {
    return (
      <Setup
        onStart={(questions) =>
          setPhase({ name: "running", questions, startedAt: Date.now() })
        }
      />
    );
  }

  if (phase.name === "running") {
    return (
      <Running
        questions={phase.questions}
        onSubmit={(result) =>
          setPhase({
            name: "done",
            result,
            seconds: Math.round((Date.now() - phase.startedAt) / 1000),
          })
        }
      />
    );
  }

  return (
    <Result
      result={phase.result}
      seconds={phase.seconds}
      onRestart={() => setPhase({ name: "setup" })}
    />
  );
}

function Setup({ onStart }: { onStart: (questions: Question[]) => void }) {
  const options = [
    {
      key: "mix30",
      title: `${EXAM_LENGTH} zufällige Fragen`,
      description: "Gemischt aus allen fünf Teilen",
      build: () => shuffle(allQuestions()).slice(0, EXAM_LENGTH),
    },
    {
      key: "mix50",
      title: "50 zufällige Fragen",
      description: "Längerer Durchgang, gemischt",
      build: () => shuffle(allQuestions()).slice(0, 50),
    },
    ...[1, 2, 3, 4, 5].map((part) => ({
      key: `teil${part}`,
      title: `Teil ${part}`,
      description: "Die 30 Fragen dieses Teils in Originalreihenfolge",
      build: () => questionsByPart(part),
    })),
  ];

  return (
    <div className="flex flex-col gap-5">
      <div>
        <Link href="/" className="text-sm font-medium text-brand no-underline">
          ← Startseite
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-ink">Prüfungssimulation</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Frage für Frage ohne Rückmeldung. Am Schluss siehst du alle Antworten
          und was du dir noch anschauen solltest.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        {options.map((option) => (
          <button
            key={option.key}
            type="button"
            onClick={() => onStart(option.build())}
            className="rounded-2xl border border-border bg-surface px-4 py-3.5 text-left hover:bg-surface-sunken"
          >
            <span className="block font-semibold text-ink">{option.title}</span>
            <span className="mt-0.5 block text-[13px] text-ink-muted">
              {option.description}
            </span>
          </button>
        ))}
      </div>

      <p className="rounded-xl border border-border bg-surface px-3.5 py-3 text-[13px] leading-relaxed text-ink-muted">
        <strong className="text-ink">Selbsteinschätzung, kein echtes Prüfen.</strong>{" "}
        Die Fragen sind offen gestellt — die App kann eine frei formulierte
        Antwort nicht bewerten. Du liest die Frage, rufst die Antwort ab und
        beurteilst selbst, ob du sie wusstest. Es gibt darum weder Zeitlimit noch
        Bestehensgrenze.
      </p>
    </div>
  );
}

function Running({
  questions,
  onSubmit,
}: {
  questions: Question[];
  onSubmit: (result: SessionResult) => void;
}) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Map<string, Recall | null>>(new Map());
  const [revealed, setRevealed] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const { recordRecall } = useProgress();

  const question = questions[index];
  const rated = questions.filter((q) => answers.get(q.id)).length;

  function rate(recall: Recall) {
    setAnswers((prev) => new Map(prev).set(question.id, recall));
    // Feed the same store as practice, so the mistake queue and the dashboard
    // reflect exam performance too.
    recordRecall(question.id, recall);
    if (index + 1 < questions.length) {
      setIndex((i) => i + 1);
      setRevealed(false);
    } else {
      setConfirming(true);
    }
  }

  function submit() {
    onSubmit(gradeSession(questions, answers));
  }

  return (
    <div className="flex flex-col gap-4">
      <header className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-ink">
            Frage {index + 1} / {questions.length}
          </p>
          <p className="text-xs text-ink-muted">{rated} beurteilt</p>
        </div>
        <Stopwatch />
      </header>

      <div
        className="h-1.5 w-full overflow-hidden rounded-full bg-surface-sunken"
        role="progressbar"
        aria-valuenow={index + 1}
        aria-valuemin={1}
        aria-valuemax={questions.length}
      >
        <div
          className="h-full rounded-full bg-brand"
          style={{ width: `${((index + 1) / questions.length) * 100}%` }}
        />
      </div>

      <QuestionCard
        key={question.id}
        question={question}
        revealed={revealed}
        onReveal={() => setRevealed(true)}
        onRate={rate}
      />

      <div className="flex gap-2">
        <button
          type="button"
          disabled={index === 0}
          onClick={() => {
            setIndex((i) => i - 1);
            setRevealed(false);
          }}
          className="flex-1 rounded-xl border border-border px-4 py-3 font-medium text-ink disabled:opacity-40"
        >
          ← Zurück
        </button>
        <button
          type="button"
          onClick={() => {
            if (index + 1 < questions.length) {
              setIndex((i) => i + 1);
              setRevealed(false);
            } else {
              setConfirming(true);
            }
          }}
          className="flex-1 rounded-xl border border-border px-4 py-3 font-medium text-ink"
        >
          {index + 1 < questions.length ? "Überspringen →" : "Abschliessen"}
        </button>
      </div>

      {confirming && (
        <ConfirmSubmit
          open={questions.length - rated}
          onCancel={() => setConfirming(false)}
          onConfirm={submit}
        />
      )}

      {!confirming && rated < questions.length && (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="text-sm font-medium text-brand underline"
        >
          Durchgang jetzt beenden
        </button>
      )}
    </div>
  );
}

function ConfirmSubmit({
  open,
  onCancel,
  onConfirm,
}: {
  open: number;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="rounded-2xl border border-warn/40 bg-warn-soft p-4">
      <p className="text-sm text-ink">
        {open === 0
          ? "Alle Fragen sind beurteilt. Auswertung anzeigen?"
          : `Noch ${open} ${open === 1 ? "Frage ist" : "Fragen sind"} nicht beurteilt. Trotzdem auswerten?`}
      </p>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-xl border border-border bg-surface px-4 py-2.5 font-medium text-ink"
        >
          Weiter bearbeiten
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="flex-1 rounded-xl bg-brand px-4 py-2.5 font-semibold text-white"
        >
          Auswerten
        </button>
      </div>
    </div>
  );
}

/** Elapsed time only. The real exam's time limit is unknown, so nothing counts down. */
function Stopwatch() {
  const [seconds, setSeconds] = useState(0);
  const start = useRef(Date.now());

  useEffect(() => {
    const id = window.setInterval(
      () => setSeconds(Math.round((Date.now() - start.current) / 1000)),
      1000,
    );
    return () => window.clearInterval(id);
  }, []);

  return (
    <p className="text-right">
      <span className="block text-sm font-semibold tabular-nums text-ink">
        {formatDuration(seconds)}
      </span>
      <span className="block text-[11px] text-ink-muted">nur Information</span>
    </p>
  );
}

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function Result({
  result,
  seconds,
  onRestart,
}: {
  result: SessionResult;
  seconds: number;
  onRestart: () => void;
}) {
  const order = { missed: 0, null: 1, knew: 2 } as const;
  const reviewFirst = useMemo(
    () =>
      [...result.graded].sort(
        (a, b) =>
          order[String(a.recall) as keyof typeof order] -
          order[String(b.recall) as keyof typeof order],
      ),
    [result.graded],
  );

  return (
    <div className="flex flex-col gap-5">
      <section className="rounded-2xl border border-border bg-surface p-5 text-center">
        <h1 className="text-xl font-semibold text-ink">Auswertung</h1>
        <p className="mt-3 text-5xl font-bold tabular-nums text-ink">
          {result.percentage}%
        </p>
        <p className="mt-1 text-sm text-ink-muted">
          {result.knew} von {result.total} Fragen selbst als gewusst beurteilt
        </p>

        <dl className="mt-5 grid grid-cols-3 gap-2 text-center">
          <ResultStat label="Gewusst" value={result.knew} tone="text-correct" />
          <ResultStat label="Nicht gewusst" value={result.missed} tone="text-wrong" />
          <ResultStat label="Offen" value={result.skipped} tone="text-ink-muted" />
        </dl>

        <p className="mt-4 text-xs text-ink-muted">Dauer {formatDuration(seconds)}</p>
        <p className="mt-3 rounded-xl bg-surface-sunken px-3 py-2 text-xs leading-relaxed text-ink-muted">
          Das Ergebnis beruht auf deiner eigenen Einschätzung, nicht auf einer
          Bewertung durch die App. Es wird darum kein „bestanden“ angezeigt.
        </p>
      </section>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onRestart}
          className="flex-1 rounded-xl bg-brand px-4 py-3 font-semibold text-white"
        >
          Neuer Durchgang
        </button>
        <Link
          href="/"
          className="flex-1 rounded-xl border border-border px-4 py-3 text-center font-medium text-ink no-underline"
        >
          Startseite
        </Link>
      </div>

      <section>
        <h2 className="mb-2 text-sm font-semibold text-ink">
          Alle Fragen — offene zuerst
        </h2>
        <ul className="flex flex-col gap-2">
          {reviewFirst.map(({ question, recall }) => (
            <li
              key={question.id}
              className="rounded-xl border border-border bg-surface p-3"
            >
              <div className="flex items-start gap-2">
                <span
                  aria-hidden
                  className={
                    recall === "knew"
                      ? "text-correct"
                      : recall === "missed"
                        ? "text-wrong"
                        : "text-ink-muted"
                  }
                >
                  {recall === "knew" ? "✓" : recall === "missed" ? "✗" : "–"}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-ink-muted">
                    Frage {question.number}
                  </p>
                  <p className="mt-1 text-sm font-medium text-ink">
                    {question.question}
                  </p>
                  <p className="mt-1.5 rounded-lg bg-surface-sunken px-2.5 py-2 text-sm text-ink">
                    {question.answer}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function ResultStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: string;
}) {
  return (
    <div className="rounded-xl bg-surface-sunken p-2.5">
      <dd className={`text-xl font-bold tabular-nums ${tone}`}>{value}</dd>
      <dt className="text-[11px] text-ink-muted">{label}</dt>
    </div>
  );
}
