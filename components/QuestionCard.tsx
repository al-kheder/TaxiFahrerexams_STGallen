"use client";

import { QUESTION_PROMPT, type OptionKey, type Question } from "@/lib/types";
import { categoryLabel } from "@/lib/categories";
import { isGradable } from "@/lib/quiz";

export type Reveal =
  | { state: "hidden" }
  | { state: "revealed"; chosen: OptionKey | null };

interface Props {
  question: Question;
  chosen: OptionKey | null;
  reveal: Reveal;
  onChoose: (key: OptionKey) => void;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
}

/**
 * Renders one question. Correct/incorrect is never signalled by colour alone --
 * each state also carries an icon and a word, which is what makes the feedback
 * usable for colour-blind learners and readable in bright sunlight (this app is
 * used by people sitting in a parked taxi).
 */
export function QuestionCard({
  question,
  chosen,
  reveal,
  onChoose,
  isFavorite,
  onToggleFavorite,
}: Props) {
  const revealed = reveal.state === "revealed";
  // Use the engine's own rule, so the card can never claim "richtig" for a
  // question the grader refuses to score.
  const gradable = isGradable(question);

  return (
    <section className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
        <span className="rounded-full bg-surface-sunken px-2.5 py-1 font-medium text-ink-muted">
          {question.source}
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

      {question.needsVerification ? (
        <p className="mb-3 rounded-xl border border-warn/40 bg-warn-soft px-3 py-2 text-sm text-warn">
          <strong>⚠ Zu prüfen:</strong> {question.verificationNote} Diese Frage
          wird nicht gewertet.
        </p>
      ) : (
        question.verificationNote && (
          <p className="mb-3 rounded-xl bg-surface-sunken px-3 py-2 text-xs text-ink-muted">
            <strong>Hinweis zur Quelle:</strong> {question.verificationNote}
          </p>
        )
      )}

      <h2 className="text-lg font-semibold text-ink">{QUESTION_PROMPT}</h2>
      <p className="arabic mb-4 mt-1.5 border-r-2 border-brand/40 pr-2.5 text-[15px] text-ink-muted">
        {question.questionAr}
      </p>

      <ul className="flex flex-col gap-2">
        {question.options.map((option) => {
          const isChosen = chosen === option.key;
          const isMarked = revealed && question.correct === option.key;
          // Only call a choice wrong when the question is actually scored.
          const isWrongChoice = revealed && gradable && isChosen && !isMarked;

          let tone = "border-border bg-surface hover:bg-surface-sunken";
          if (isMarked) {
            tone = gradable
              ? "border-correct bg-correct-soft"
              : "border-warn bg-warn-soft";
          } else if (isWrongChoice) tone = "border-wrong bg-wrong-soft";
          else if (isChosen && !revealed) tone = "border-brand bg-brand-soft";

          return (
            <li key={option.key}>
              <button
                type="button"
                disabled={revealed}
                onClick={() => onChoose(option.key)}
                aria-pressed={isChosen}
                className={`flex w-full items-start gap-3 rounded-xl border-2 px-3 py-3 text-left text-[15px] leading-snug transition-colors disabled:cursor-default ${tone}`}
              >
                <span
                  aria-hidden
                  className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold ${
                    isMarked
                      ? gradable
                        ? "border-correct text-correct"
                        : "border-warn text-warn"
                      : isWrongChoice
                        ? "border-wrong text-wrong"
                        : isChosen
                          ? "border-brand text-brand"
                          : "border-border text-ink-muted"
                  }`}
                >
                  {isMarked ? (gradable ? "✓" : "◆") : isWrongChoice ? "✗" : option.key}
                </span>
                <span className="text-ink">{option.text}</span>
              </button>
            </li>
          );
        })}
      </ul>

      {revealed && <Feedback question={question} chosen={reveal.chosen} />}
    </section>
  );
}

function Feedback({
  question,
  chosen,
}: {
  question: Question;
  chosen: OptionKey | null;
}) {
  const gradable = isGradable(question);
  const marked = question.options.find((o) => o.key === question.correct);
  const correct = gradable && chosen === question.correct;

  return (
    <div className="mt-4 border-t border-border pt-4">
      {!gradable ? (
        <div className="text-sm">
          <p className="flex items-center gap-2 font-semibold text-warn">
            <span aria-hidden>⚠</span> Wird nicht gewertet
          </p>
          <p className="mt-2 text-ink-muted">
            {marked ? (
              <>
                Auf diesem Bogen markiert:{" "}
                <strong className="text-ink">
                  {question.correct}) {marked.text}
                </strong>{" "}
                — diese Antwort ist jedoch unsicher (siehe Hinweis oben).
              </>
            ) : (
              "Die Antwort ist im Original nicht eindeutig lesbar."
            )}
          </p>
        </div>
      ) : correct ? (
        <p className="flex items-center gap-2 text-sm font-semibold text-correct">
          <span aria-hidden>✓</span> Richtig
        </p>
      ) : (
        <>
          <p className="flex items-center gap-2 text-sm font-semibold text-wrong">
            <span aria-hidden>✗</span> Falsch
          </p>
          <p className="mt-2 text-sm text-ink-muted">
            Richtige Antwort:{" "}
            <strong className="text-ink">
              {question.correct}){" "}
              {question.options.find((o) => o.key === question.correct)?.text}
            </strong>
          </p>
        </>
      )}

      <div className="mt-3 rounded-xl bg-surface-sunken p-3">
        <p className="mb-1 text-xs font-semibold tracking-wide text-ink-muted">
          الشرح بالعربية
        </p>
        <p className="arabic text-[15px] text-ink">{question.explanationAr}</p>
      </div>
    </div>
  );
}
