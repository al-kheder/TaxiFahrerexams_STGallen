import type { OptionKey, Question } from "./types";

/**
 * Quiz engine: pure functions over a question list. No React, no storage, so
 * the grading rules can be unit-tested and reused by any screen.
 */

export type Mode = "lernen" | "ueben" | "pruefung";

export interface ExamAnswer {
  questionId: string;
  chosen: OptionKey | null;
}

export interface GradedAnswer {
  question: Question;
  chosen: OptionKey | null;
  /**
   * null when the question is unscorable -- its answer could not be read off
   * the scan. These are excluded from the score instead of being counted
   * wrong, which would punish the learner for a defect in the source.
   */
  correct: boolean | null;
}

export interface ExamResult {
  graded: GradedAnswer[];
  /** Questions that carried a readable answer and could therefore be scored. */
  scorable: number;
  correct: number;
  wrong: number;
  unanswered: number;
  /** Excluded from scoring because the source answer is unverified. */
  excluded: number;
  percentage: number;
}

/**
 * null means "not scorable": either no answer could be read off the scan, or
 * the answer that was read is disputed by another Testbogen. Grading a learner
 * against an answer we do not trust would be worse than not grading them, so
 * these questions are shown and explained but never counted right or wrong.
 */
export function isCorrect(question: Question, chosen: OptionKey | null): boolean | null {
  if (question.correct === null || question.needsVerification) return null;
  if (chosen === null) return false;
  return question.correct === chosen;
}

/** Questions that carry a trustworthy answer and can therefore be scored. */
export function isGradable(question: Question): boolean {
  return question.correct !== null && !question.needsVerification;
}

export function gradeExam(
  questions: Question[],
  answers: Map<string, OptionKey | null>,
): ExamResult {
  const graded: GradedAnswer[] = questions.map((question) => {
    const chosen = answers.get(question.id) ?? null;
    return { question, chosen, correct: isCorrect(question, chosen) };
  });

  const scorableAnswers = graded.filter((g) => g.correct !== null);
  const correct = scorableAnswers.filter((g) => g.correct).length;
  const unanswered = graded.filter((g) => g.chosen === null).length;

  return {
    graded,
    scorable: scorableAnswers.length,
    correct,
    wrong: scorableAnswers.length - correct,
    unanswered,
    excluded: graded.length - scorableAnswers.length,
    percentage:
      scorableAnswers.length === 0
        ? 0
        : Math.round((correct / scorableAnswers.length) * 100),
  };
}

/** Fisher-Yates, seeded from Math.random. Used only for exam question order. */
export function shuffle<T>(items: T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
