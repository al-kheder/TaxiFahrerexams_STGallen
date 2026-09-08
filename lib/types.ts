export type CategoryId =
  | "geltungsbereich"
  | "arbeitszeit"
  | "lenkzeit"
  | "arbeitspause"
  | "ruhezeit"
  | "fahrtschreiber"
  | "arbeitsbuch"
  | "kontrolle";

/**
 * One question from the 150-question ARV 2 set.
 *
 * The source poses open questions with a single written answer -- there are no
 * multiple-choice options to pick from. The app therefore works as a flashcard:
 * read the question, recall the answer, reveal it, and say whether you knew it.
 * Inventing plausible-but-wrong options to turn these into multiple choice
 * would mean authoring exam content that is not in the source, so we don't.
 */
export interface Question {
  /** Stable id, e.g. "f49". Used as the key for all stored progress. */
  id: string;
  /** Question number as printed in the source (1-150). */
  number: number;
  /** "Teil" the source groups this question under (1-5). */
  part: number;
  category: CategoryId;
  /** The question, verbatim from the source. */
  question: string;
  /** The answer, verbatim from the source (printed there as "Richtig: ..."). */
  answer: string;
  /** Provenance, e.g. "ARV 2 – 150 Prüfungsfragen, Frage 49". */
  source: string;
}

/** How the learner rated their own recall after revealing the answer. */
export type Recall = "knew" | "missed";
