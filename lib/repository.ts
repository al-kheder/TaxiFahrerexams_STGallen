import { ALL_QUESTIONS } from "@/data/questions";
import { isGradable } from "./quiz";
import type { CategoryId, Question } from "./types";

/**
 * Read-only access to the question set. Everything above this layer -- the quiz
 * engine, the screens -- goes through these helpers rather than importing the
 * data files, so the content can later move to a CMS or an API without
 * touching the UI.
 */

const BY_ID = new Map(ALL_QUESTIONS.map((q) => [q.id, q]));

export function allQuestions(): Question[] {
  return ALL_QUESTIONS;
}

export function questionById(id: string): Question | undefined {
  return BY_ID.get(id);
}

export function questionsByTestbogen(testbogen: number): Question[] {
  return ALL_QUESTIONS.filter((q) => q.testbogen === testbogen);
}

export function questionsByCategory(category: CategoryId): Question[] {
  return ALL_QUESTIONS.filter((q) => q.category === category);
}

export function questionsByIds(ids: string[]): Question[] {
  return ids.map((id) => BY_ID.get(id)).filter((q): q is Question => !!q);
}

/** Questions whose answer could not be read off the scan with confidence. */
export function flaggedQuestions(): Question[] {
  return ALL_QUESTIONS.filter((q) => q.needsVerification);
}

/**
 * Ids of the questions that can actually be scored. Progress percentages use
 * these as the denominator, so "bearbeitet" can genuinely reach 100% instead of
 * stalling on questions the app deliberately refuses to grade.
 */
export function gradableIds(questions: Question[] = ALL_QUESTIONS): string[] {
  return questions.filter(isGradable).map((q) => q.id);
}

/**
 * The other sheets' questions about the same rule. Used by the review screen so
 * a learner can see how the same rule is worded elsewhere -- and, where the
 * sheets disagree, see that for themselves.
 */
export function relatedQuestions(question: Question): Question[] {
  return ALL_QUESTIONS.filter(
    (q) => q.topicKey === question.topicKey && q.id !== question.id,
  );
}

export interface SearchFilters {
  text?: string;
  category?: CategoryId | "all";
  testbogen?: number | "all";
}

export function searchQuestions({
  text,
  category = "all",
  testbogen = "all",
}: SearchFilters): Question[] {
  const needle = text?.trim().toLowerCase();
  return ALL_QUESTIONS.filter((q) => {
    if (category !== "all" && q.category !== category) return false;
    if (testbogen !== "all" && q.testbogen !== testbogen) return false;
    if (!needle) return true;
    return (
      q.options.some((o) => o.text.toLowerCase().includes(needle)) ||
      q.source.toLowerCase().includes(needle) ||
      q.questionAr.includes(needle) ||
      q.explanationAr.includes(needle)
    );
  });
}

export function countsByCategory(): Map<CategoryId, number> {
  const counts = new Map<CategoryId, number>();
  for (const q of ALL_QUESTIONS) {
    counts.set(q.category, (counts.get(q.category) ?? 0) + 1);
  }
  return counts;
}
