"use client";

import { useState } from "react";
import Link from "next/link";
import { PracticeSession } from "./PracticeSession";
import { CATEGORIES } from "@/lib/categories";
import {
  allQuestions,
  idsOf,
  questionsByCategory,
  questionsByPart,
} from "@/lib/repository";
import { statsFor, useProgress } from "@/lib/progress";
import type { CategoryId, Question } from "@/lib/types";

type Scope =
  | { kind: "alle" }
  | { kind: "teil"; part: number }
  | { kind: "kategorie"; category: CategoryId };

function resolve(scope: Scope): { questions: Question[]; label: string } {
  switch (scope.kind) {
    case "teil":
      return { questions: questionsByPart(scope.part), label: `Teil ${scope.part}` };
    case "kategorie": {
      const category = CATEGORIES.find((c) => c.id === scope.category);
      return {
        questions: questionsByCategory(scope.category),
        label: category?.label ?? scope.category,
      };
    }
    default:
      return { questions: allQuestions(), label: "Alle Fragen" };
  }
}

export function ScopedPractice({
  variant,
  heading,
  intro,
}: {
  variant: "lernen" | "ueben";
  heading: string;
  intro: string;
}) {
  const [scope, setScope] = useState<Scope | null>(null);

  if (scope) {
    const { questions, label } = resolve(scope);
    return (
      <div className="flex flex-col gap-4">
        <button
          type="button"
          onClick={() => setScope(null)}
          className="self-start text-sm font-medium text-brand"
        >
          ← Auswahl ändern
        </button>
        <PracticeSession
          questions={questions}
          title={`${heading} — ${label}`}
          variant={variant}
        />
      </div>
    );
  }

  return <ScopePicker heading={heading} intro={intro} onPick={setScope} />;
}

function ScopePicker({
  heading,
  intro,
  onPick,
}: {
  heading: string;
  intro: string;
  onPick: (scope: Scope) => void;
}) {
  const { progress } = useProgress();

  return (
    <div className="flex flex-col gap-5">
      <div>
        <Link href="/" className="text-sm font-medium text-brand no-underline">
          ← Startseite
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-ink">{heading}</h1>
        <p className="mt-1 text-sm text-ink-muted">{intro}</p>
      </div>

      <Group title="Ganzer Satz">
        <ScopeButton
          onClick={() => onPick({ kind: "alle" })}
          title="Alle Fragen"
          meta={`${allQuestions().length} Fragen`}
          progress={statsFor(progress, idsOf(allQuestions()))}
        />
      </Group>

      <Group title="Nach Teil">
        {[1, 2, 3, 4, 5].map((part) => {
          const questions = questionsByPart(part);
          const first = questions[0]?.number;
          const last = questions[questions.length - 1]?.number;
          return (
            <ScopeButton
              key={part}
              onClick={() => onPick({ kind: "teil", part })}
              title={`Teil ${part}`}
              meta={`Fragen ${first}–${last}`}
              progress={statsFor(progress, idsOf(questions))}
            />
          );
        })}
      </Group>

      <Group title="Nach Thema">
        {CATEGORIES.map((category) => {
          const questions = questionsByCategory(category.id);
          return (
            <ScopeButton
              key={category.id}
              onClick={() => onPick({ kind: "kategorie", category: category.id })}
              title={category.label}
              meta={`${questions.length} Fragen · ${category.description}`}
              progress={statsFor(progress, idsOf(questions))}
            />
          );
        })}
      </Group>
    </div>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">
        {title}
      </h2>
      <div className="flex flex-col gap-2">{children}</div>
    </section>
  );
}

function ScopeButton({
  onClick,
  title,
  meta,
  progress,
}: {
  onClick: () => void;
  title: string;
  meta: string;
  progress: { answered: number; total: number; accuracy: number };
}) {
  const pct = progress.total === 0 ? 0 : (progress.answered / progress.total) * 100;
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-2xl border border-border bg-surface px-4 py-3 text-left hover:bg-surface-sunken"
    >
      <span className="flex items-baseline justify-between gap-3">
        <span className="font-semibold text-ink">{title}</span>
        <span className="shrink-0 text-xs tabular-nums text-ink-muted">
          {progress.answered}/{progress.total}
        </span>
      </span>
      <span className="mt-0.5 block text-[13px] leading-snug text-ink-muted">
        {meta}
      </span>
      <span
        aria-hidden
        className="mt-2 block h-1.5 w-full overflow-hidden rounded-full bg-surface-sunken"
      >
        <span
          className="block h-full rounded-full bg-brand"
          style={{ width: `${pct}%` }}
        />
      </span>
    </button>
  );
}
