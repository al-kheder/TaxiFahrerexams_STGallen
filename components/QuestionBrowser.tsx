"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CATEGORIES, categoryLabel } from "@/lib/categories";
import { searchQuestions } from "@/lib/repository";
import { isAnswered, isMistake, useProgress } from "@/lib/progress";
import type { CategoryId, Question } from "@/lib/types";

type StatusFilter = "alle" | "offen" | "gewusst" | "nicht" | "gemerkt";

export function QuestionBrowser() {
  const { progress, toggleFavorite } = useProgress();
  const [text, setText] = useState("");
  const [category, setCategory] = useState<CategoryId | "all">("all");
  const [part, setPart] = useState<number | "all">("all");
  const [status, setStatus] = useState<StatusFilter>("alle");

  const results = useMemo(() => {
    const base = searchQuestions({ text, category, part });
    return base.filter((q) => {
      switch (status) {
        case "offen":
          return !isAnswered(progress, q.id);
        case "gewusst":
          return isAnswered(progress, q.id) && !isMistake(progress, q.id);
        case "nicht":
          return isMistake(progress, q.id);
        case "gemerkt":
          return progress.favorites.includes(q.id);
        default:
          return true;
      }
    });
  }, [text, category, part, status, progress]);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Link href="/" className="text-sm font-medium text-brand no-underline">
          ← Startseite
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-ink">Alle Fragen</h1>
      </div>

      <input
        type="search"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="In Frage und Antwort suchen …"
        aria-label="Fragen durchsuchen"
        className="w-full rounded-xl border border-border bg-surface px-3.5 py-3 text-[15px] text-ink placeholder:text-ink-muted"
      />

      <div className="flex flex-col gap-2">
        <FilterRow label="Thema">
          <Chip active={category === "all"} onClick={() => setCategory("all")}>
            Alle
          </Chip>
          {CATEGORIES.map((c) => (
            <Chip
              key={c.id}
              active={category === c.id}
              onClick={() => setCategory(c.id)}
            >
              {c.label}
            </Chip>
          ))}
        </FilterRow>

        <FilterRow label="Teil">
          <Chip active={part === "all"} onClick={() => setPart("all")}>
            Alle
          </Chip>
          {[1, 2, 3, 4, 5].map((p) => (
            <Chip key={p} active={part === p} onClick={() => setPart(p)}>
              {p}
            </Chip>
          ))}
        </FilterRow>

        <FilterRow label="Status">
          {(
            [
              ["alle", "Alle"],
              ["offen", "Unbearbeitet"],
              ["gewusst", "Gewusst"],
              ["nicht", "Nicht gewusst"],
              ["gemerkt", "Gemerkt"],
            ] as [StatusFilter, string][]
          ).map(([value, label]) => (
            <Chip
              key={value}
              active={status === value}
              onClick={() => setStatus(value)}
            >
              {label}
            </Chip>
          ))}
        </FilterRow>
      </div>

      <p className="text-sm text-ink-muted">
        {results.length} {results.length === 1 ? "Frage" : "Fragen"}
      </p>

      <ul className="flex flex-col gap-2">
        {results.map((q) => (
          <li key={q.id}>
            <QuestionRow
              question={q}
              favorite={progress.favorites.includes(q.id)}
              onToggleFavorite={() => toggleFavorite(q.id)}
            />
          </li>
        ))}
      </ul>

      {results.length === 0 && (
        <p className="rounded-xl border border-border bg-surface p-5 text-center text-sm text-ink-muted">
          Keine Fragen für diese Filter.
        </p>
      )}
    </div>
  );
}

function FilterRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
        {label}
      </p>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full border px-3 py-1.5 text-[13px] font-medium ${
        active
          ? "border-brand bg-brand text-white"
          : "border-border bg-surface text-ink-muted"
      }`}
    >
      {children}
    </button>
  );
}

function QuestionRow({
  question,
  favorite,
  onToggleFavorite,
}: {
  question: Question;
  favorite: boolean;
  onToggleFavorite: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-xl border border-border bg-surface">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-start gap-3 px-3.5 py-3 text-left"
      >
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-1.5 text-[11px]">
            <span className="rounded-full bg-surface-sunken px-2 py-0.5 font-medium text-ink-muted">
              Frage {question.number}
            </span>
            <span className="rounded-full bg-brand-soft px-2 py-0.5 font-medium text-brand">
              {categoryLabel(question.category)}
            </span>
          </span>
          <span className="mt-1.5 block text-sm font-medium leading-snug text-ink">
            {question.question}
          </span>
        </span>
        <span aria-hidden className="mt-1 text-ink-muted">
          {open ? "▲" : "▼"}
        </span>
      </button>

      {open && (
        <div className="border-t border-border px-3.5 py-3">
          <p className="rounded-lg bg-correct-soft px-3 py-2.5 text-sm text-ink">
            {question.answer}
          </p>
          <p className="mt-2 text-[11px] text-ink-muted">{question.source}</p>
          <button
            type="button"
            onClick={onToggleFavorite}
            aria-pressed={favorite}
            className="mt-3 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-ink-muted"
          >
            {favorite ? "★ Gemerkt" : "☆ Merken"}
          </button>
        </div>
      )}
    </div>
  );
}
