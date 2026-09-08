"use client";

import type { Question, Recall } from "@/lib/types";
import { categoryLabel } from "@/lib/categories";

interface Props {
  question: Question;
  /** Whether the answer is currently shown. */
  revealed: boolean;
  onReveal: () => void;
  /** Omitted in study mode, where the learner is not rating themselves. */
  onRate?: (recall: Recall) => void;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
}

/**
 * One flashcard: the question, then the answer once revealed.
 *
 * The source poses open questions, so there is nothing to click "right" or
 * "wrong" -- the learner recalls the answer, reveals it, and rates themselves.
 * The rating buttons carry words and icons, not just colour, so the states stay
 * readable for colour-blind users and in bright sunlight.
 */
export function QuestionCard({
  question,
  revealed,
  onReveal,
  onRate,
  isFavorite,
  onToggleFavorite,
}: Props) {
  return (
    <section className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
        <span className="rounded-full bg-surface-sunken px-2.5 py-1 font-medium text-ink-muted">
          Frage {question.number}
        </span>
        <span className="rounded-full bg-brand-soft px-2.5 py-1 font-medium text-brand">
          {categoryLabel(question.category)}
        </span>
        {onToggleFavorite && (
          <button
            type="button"
            onClick={onToggleFavorite}
            aria-pressed={isFavorite}
            className="ml-auto rounded-full border border-border px-2.5 py-1 font-medium text-ink-muted hover:bg-surface-sunken"
          >
            {isFavorite ? "★ Gemerkt" : "☆ Merken"}
          </button>
        )}
      </div>

      <h2 className="text-lg font-semibold leading-snug text-ink">
        {question.question}
      </h2>

      {revealed ? (
        <div className="mt-4 rounded-xl border-2 border-correct bg-correct-soft p-3.5">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-correct">
            Richtig
          </p>
          <p className="text-[15px] leading-relaxed text-ink">{question.answer}</p>
        </div>
      ) : (
        <button
          type="button"
          onClick={onReveal}
          className="mt-4 w-full rounded-xl border-2 border-dashed border-border py-5 text-sm font-medium text-ink-muted hover:bg-surface-sunken"
        >
          Antwort anzeigen
        </button>
      )}

      {revealed && onRate && (
        <div className="mt-4 border-t border-border pt-4">
          <p className="mb-2 text-xs text-ink-muted">Wusstest du die Antwort?</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onRate("missed")}
              className="flex-1 rounded-xl border-2 border-wrong bg-wrong-soft px-3 py-3 text-sm font-semibold text-wrong"
            >
              <span aria-hidden>✗</span> Nicht gewusst
            </button>
            <button
              type="button"
              onClick={() => onRate("knew")}
              className="flex-1 rounded-xl border-2 border-correct bg-correct-soft px-3 py-3 text-sm font-semibold text-correct"
            >
              <span aria-hidden>✓</span> Gewusst
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
