"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { QuestionCard } from "./QuestionCard";
import { allQuestions, questionsByTestbogen } from "@/lib/repository";
import { gradeExam, shuffle, type ExamResult } from "@/lib/quiz";
import { useProgress } from "@/lib/progress";
import type { OptionKey, Question } from "@/lib/types";

const EXAM_LENGTH = 30;

type Phase =
  | { name: "setup" }
  | { name: "running"; questions: Question[]; startedAt: number }
  | { name: "done"; questions: Question[]; result: ExamResult; seconds: number };

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
            questions: phase.questions,
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
    ...[1, 2, 3].map((sheet) => ({
      key: `t${sheet}`,
      title: `Testbogen ${sheet}`,
      description: "Die 30 Fragen dieses Bogens in Originalreihenfolge",
      build: () => questionsByTestbogen(sheet),
    })),
    {
      key: "mix",
      title: "Gemischt",
      description: `${EXAM_LENGTH} zufällige Fragen aus allen drei Bogen`,
      build: () => shuffle(allQuestions()).slice(0, EXAM_LENGTH),
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <div>
        <Link href="/" className="text-sm font-medium text-brand no-underline">
          ← Startseite
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-ink">Prüfungssimulation</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Die Antworten bleiben bis zum Schluss verborgen. Danach siehst du jede
          Frage mit der richtigen Antwort und der Erklärung.
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
        <strong className="text-ink">Kein Zeitlimit, keine Bestehensgrenze.</strong>{" "}
        Für die echte Prüfung liegt uns weder eine offizielle Zeitvorgabe noch
        eine Bestehensquote vor. Die Simulation zeigt darum nur dein Ergebnis.
        Sobald du uns die offiziellen Werte nennst, lassen sie sich ergänzen.
      </p>
    </div>
  );
}

function Running({
  questions,
  onSubmit,
}: {
  questions: Question[];
  onSubmit: (result: ExamResult) => void;
}) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Map<string, OptionKey | null>>(new Map());
  const [confirming, setConfirming] = useState(false);
  const { recordAnswer } = useProgress();

  const question = questions[index];
  const answered = questions.filter((q) => answers.get(q.id)).length;

  function choose(key: OptionKey) {
    setAnswers((prev) => new Map(prev).set(question.id, key));
  }

  function submit() {
    const result = gradeExam(questions, answers);
    // Feed exam answers into the same progress store as practice, so the
    // mistake queue and the dashboard reflect exam performance too.
    for (const graded of result.graded) {
      if (graded.correct !== null && graded.chosen !== null) {
        recordAnswer(graded.question.id, graded.chosen, graded.correct);
      }
    }
    onSubmit(result);
  }

  return (
    <div className="flex flex-col gap-4">
      <header className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-ink">
            Frage {index + 1} / {questions.length}
          </p>
          <p className="text-xs text-ink-muted">{answered} beantwortet</p>
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
        chosen={answers.get(question.id) ?? null}
        reveal={{ state: "hidden" }}
        onChoose={choose}
      />

      <div className="flex gap-2">
        <button
          type="button"
          disabled={index === 0}
          onClick={() => setIndex((i) => i - 1)}
          className="flex-1 rounded-xl border border-border px-4 py-3 font-medium text-ink disabled:opacity-40"
        >
          ← Zurück
        </button>
        {index + 1 < questions.length ? (
          <button
            type="button"
            onClick={() => setIndex((i) => i + 1)}
            className="flex-1 rounded-xl bg-brand px-4 py-3 font-semibold text-white"
          >
            Weiter →
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="flex-1 rounded-xl bg-brand px-4 py-3 font-semibold text-white"
          >
            Abgeben
          </button>
        )}
      </div>

      <QuestionGrid
        questions={questions}
        answers={answers}
        current={index}
        onJump={setIndex}
      />

      {answered < questions.length && (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="text-sm font-medium text-brand underline"
        >
          Prüfung jetzt abgeben
        </button>
      )}

      {confirming && (
        <ConfirmSubmit
          open={questions.length - answered}
          onCancel={() => setConfirming(false)}
          onConfirm={submit}
        />
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
          ? "Alle Fragen sind beantwortet. Prüfung abgeben?"
          : `Noch ${open} ${open === 1 ? "Frage ist" : "Fragen sind"} unbeantwortet. Trotzdem abgeben?`}
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
          Abgeben
        </button>
      </div>
    </div>
  );
}

function QuestionGrid({
  questions,
  answers,
  current,
  onJump,
}: {
  questions: Question[];
  answers: Map<string, OptionKey | null>;
  current: number;
  onJump: (index: number) => void;
}) {
  return (
    <nav aria-label="Fragenübersicht">
      <ul className="grid grid-cols-10 gap-1.5">
        {questions.map((q, i) => {
          const done = !!answers.get(q.id);
          return (
            <li key={q.id}>
              <button
                type="button"
                onClick={() => onJump(i)}
                aria-current={i === current ? "true" : undefined}
                aria-label={`Frage ${i + 1}${done ? ", beantwortet" : ", offen"}`}
                className={`h-8 w-full rounded-md border text-xs font-semibold tabular-nums ${
                  i === current
                    ? "border-brand bg-brand text-white"
                    : done
                      ? "border-brand/40 bg-brand-soft text-brand"
                      : "border-border bg-surface text-ink-muted"
                }`}
              >
                {i + 1}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
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
  result: ExamResult;
  seconds: number;
  onRestart: () => void;
}) {
  const wrongFirst = useMemo(
    () => [...result.graded].sort((a, b) => Number(a.correct) - Number(b.correct)),
    [result.graded],
  );

  return (
    <div className="flex flex-col gap-5">
      <section className="rounded-2xl border border-border bg-surface p-5 text-center">
        <h1 className="text-xl font-semibold text-ink">Ergebnis</h1>
        <p className="mt-3 text-5xl font-bold tabular-nums text-ink">
          {result.percentage}%
        </p>
        <p className="mt-1 text-sm text-ink-muted">
          {result.correct} von {result.scorable} gewerteten Fragen richtig
        </p>

        <dl className="mt-5 grid grid-cols-3 gap-2 text-center">
          <ResultStat label="Richtig" value={result.correct} tone="text-correct" />
          <ResultStat label="Falsch" value={result.wrong} tone="text-wrong" />
          <ResultStat
            label="Offen"
            value={result.unanswered}
            tone="text-ink-muted"
          />
        </dl>

        <p className="mt-4 text-xs text-ink-muted">
          Dauer {formatDuration(seconds)}
          {result.excluded > 0 &&
            ` · ${result.excluded} Frage(n) nicht gewertet, weil die Antwort im Original unklar ist`}
        </p>
        <p className="mt-3 rounded-xl bg-surface-sunken px-3 py-2 text-xs leading-relaxed text-ink-muted">
          Es wird kein „bestanden“ angezeigt: die offizielle Bestehensgrenze der
          ARV-2-Prüfung liegt uns nicht vor, und eine geschätzte Grenze wäre
          irreführend.
        </p>
      </section>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onRestart}
          className="flex-1 rounded-xl bg-brand px-4 py-3 font-semibold text-white"
        >
          Neue Prüfung
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
          Auswertung — falsche zuerst
        </h2>
        <ul className="flex flex-col gap-2">
          {wrongFirst.map(({ question, chosen, correct }) => (
            <li
              key={question.id}
              className="rounded-xl border border-border bg-surface p-3"
            >
              <div className="flex items-start gap-2">
                <span
                  aria-hidden
                  className={
                    correct === null
                      ? "text-warn"
                      : correct
                        ? "text-correct"
                        : "text-wrong"
                  }
                >
                  {correct === null ? "⚠" : correct ? "✓" : "✗"}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-ink-muted">
                    {question.source}
                  </p>
                  <p className="mt-1 text-sm text-ink">
                    {!question.correct
                      ? "Antwort im Original nicht eindeutig lesbar"
                      : correct === null
                        ? `Nicht gewertet — auf dem Bogen markiert: ${question.correct}) ${
                            question.options.find((o) => o.key === question.correct)?.text
                          }`
                        : `Richtig: ${question.correct}) ${
                            question.options.find((o) => o.key === question.correct)?.text
                          }`}
                  </p>
                  {chosen && correct !== null && chosen !== question.correct && (
                    <p className="mt-1 text-sm text-wrong">
                      Deine Antwort: {chosen}){" "}
                      {question.options.find((o) => o.key === chosen)?.text}
                    </p>
                  )}
                  {!chosen && (
                    <p className="mt-1 text-sm text-ink-muted">
                      Nicht beantwortet
                    </p>
                  )}
                  <p className="arabic mt-2 rounded-lg bg-surface-sunken px-2.5 py-2 text-sm text-ink">
                    {question.explanationAr}
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
