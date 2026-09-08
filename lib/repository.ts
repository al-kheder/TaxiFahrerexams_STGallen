import { ALL_QUESTIONS } from "@/data/questions";
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

export function questionsByPart(part: number): Question[] {
  return ALL_QUESTIONS.filter((q) => q.part === part);
}

export function questionsByCategory(category: CategoryId): Question[] {
  return ALL_QUESTIONS.filter((q) => q.category === category);
}

export function questionsByIds(ids: string[]): Question[] {
  return ids.map((id) => BY_ID.get(id)).filter((q): q is Question => !!q);
}

export function idsOf(questions: Question[]): string[] {
  return questions.map((q) => q.id);
}

export interface SearchFilters {
  text?: string;
  category?: CategoryId | "all";
  part?: number | "all";
}

export function searchQuestions({
  text,
  category = "all",
  part = "all",
}: SearchFilters): Question[] {
  const needle = text?.trim().toLowerCase();
  return ALL_QUESTIONS.filter((q) => {
    if (category !== "all" && q.category !== category) return false;
    if (part !== "all" && q.part !== part) return false;
    if (!needle) return true;
    return (
      q.question.toLowerCase().includes(needle) ||
      q.answer.toLowerCase().includes(needle) ||
      q.source.toLowerCase().includes(needle)
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
