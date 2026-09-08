import type { Question, Recall } from "./types";

/**
 * Quiz engine: pure functions over a question list. No React, no storage, so
 * the rules can be unit-tested and reused by any screen.
 *
 * The source has open questions with a written answer rather than options to
 * choose from, so scoring is self-assessed: the learner reveals the answer and
 * says whether they knew it. That is honest about what the app can actually
 * measure -- it cannot mark free recall on its own.
 */

export type Mode = "lernen" | "ueben" | "pruefung";

export interface SessionAnswer {
  questionId: string;
  /** null when the learner skipped the question without revealing it. */
  recall: Recall | null;
}

export interface GradedAnswer {
  question: Question;
  recall: Recall | null;
}

export interface SessionResult {
  graded: GradedAnswer[];
  total: number;
  knew: number;
  missed: number;
  skipped: number;
  /** Share of the questions the learner rated as known, 0-100. */
  percentage: number;
}

export function gradeSession(
  questions: Question[],
  answers: Map<string, Recall | null>,
): SessionResult {
  const graded: GradedAnswer[] = questions.map((question) => ({
    question,
    recall: answers.get(question.id) ?? null,
  }));

  const knew = graded.filter((g) => g.recall === "knew").length;
  const missed = graded.filter((g) => g.recall === "missed").length;
  const skipped = graded.filter((g) => g.recall === null).length;

  return {
    graded,
    total: questions.length,
    knew,
    missed,
    skipped,
    percentage:
      questions.length === 0 ? 0 : Math.round((knew / questions.length) * 100),
  };
}

/** Fisher-Yates. Used for shuffled practice and exam order. */
export function shuffle<T>(items: T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
