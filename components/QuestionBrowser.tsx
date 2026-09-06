"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CATEGORIES, categoryLabel } from "@/lib/categories";
import { relatedQuestions, searchQuestions } from "@/lib/repository";
import { isAnswered, isMistake, useProgress } from "@/lib/progress";
import { QUESTION_PROMPT, type CategoryId, type Question } from "@/lib/types";

type StatusFilter = "alle" | "offen" | "richtig" | "falsch" | "gemerkt" | "pruefen";

export function QuestionBrowser({ initialOnlyFlagged }: { initialOnlyFlagged: boolean }) {
  const { progress, toggleFavorite } = useProgress();
  const [text, setText] = useState("");
  const [category, setCategory] = useState<CategoryId | "all">("all");
  const [sheet, setSheet] = useState<number | "all">("all");
  const [status, setStatus] = useState<StatusFilter>(
    initialOnlyFlagged ? "pruefen" : "alle",
  );

  const results = useMemo(() => {
    const base = searchQuestions({ text, category, testbogen: sheet });
    return base.filter((q) => {
      switch (status) {
        case "offen":
          return !isAnswered(progress, q.id);
        case "richtig":
          return isAnswered(progress, q.id) && !isMistake(progress, q.id);
        case "falsch":
          return isMistake(progress, q.id);
        case "gemerkt":
          return progress.favorites.includes(q.id);
        case "pruefen":
          return !!q.needsVerification;
        default:
          return true;
      }
    });
  }, [text, category, sheet, status, progress]);

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
        placeholder="Im Fragetext suchen …"
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

        <FilterRow label="Testbogen">
          <Chip active={sheet === "all"} onClick={() => setSheet("all")}>
            Alle
          </Chip>
          {[1, 2, 3].map((s) => (
            <Chip key={s} active={sheet === s} onClick={() => setSheet(s)}>
              {s}
            </Chip>
          ))}
        </FilterRow>

        <FilterRow label="Status">
          {(
            [
              ["alle", "Alle"],
              ["offen", "Unbearbeitet"],
              ["richtig", "Richtig"],
              ["falsch", "Falsch"],
              ["gemerkt", "Gemerkt"],
              ["pruefen", "Zu prüfen"],
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
  const related = relatedQuestions(question);

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
              {question.source}
            </span>
            <span className="rounded-full bg-brand-soft px-2 py-0.5 font-medium text-brand">
              {categoryLabel(question.category)}
            </span>
            {question.needsVerification && (
              <span className="rounded-full bg-warn-soft px-2 py-0.5 font-medium text-warn">
                ⚠ zu prüfen
              </span>
            )}
          </span>
          <span className="arabic mt-1.5 block text-sm leading-relaxed text-ink">
            {question.questionAr}
          </span>
          <span className="mt-1 block text-[13px] leading-snug text-ink-muted">
            {question.correct
              ? question.options.find((o) => o.key === question.correct)?.text
              : QUESTION_PROMPT}
          </span>
        </span>
        <span aria-hidden className="mt-1 text-ink-muted">
          {open ? "▲" : "▼"}
        </span>
      </button>

      {open && (
        <div className="border-t border-border px-3.5 py-3">
          <ul className="flex flex-col gap-1.5">
            {question.options.map((option) => {
              const marked = option.key === question.correct;
              const trusted = marked && !question.needsVerification;
              return (
                <li
                  key={option.key}
                  className={`flex gap-2 rounded-lg px-2.5 py-2 text-sm ${
                    trusted
                      ? "bg-correct-soft text-ink"
                      : marked
                        ? "bg-warn-soft text-ink"
                        : "text-ink-muted"
                  }`}
                >
                  <span
                    className={
                      trusted
                        ? "font-bold text-correct"
                        : marked
                          ? "font-bold text-warn"
                          : ""
                    }
                  >
                    {trusted ? "✓" : marked ? "◆" : option.key}
                  </span>
                  <span>{option.text}</span>
                </li>
              );
            })}
          </ul>

          <p className="arabic mt-3 rounded-lg bg-surface-sunken px-3 py-2.5 text-sm text-ink">
            {question.explanationAr}
          </p>

          {related.length > 0 && (
            <p className="mt-3 text-xs text-ink-muted">
              Gleiche Regel auch in:{" "}
              {related.map((r) => r.source).join(", ")}
            </p>
          )}

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
