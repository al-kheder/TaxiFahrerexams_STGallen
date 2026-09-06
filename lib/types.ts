export type OptionKey = "a" | "b" | "c";

export type CategoryId =
  | "geltungsbereich"
  | "lenkzeit"
  | "arbeitszeit"
  | "arbeitspause"
  | "ruhezeit"
  | "kontrolle";

export interface AnswerOption {
  key: OptionKey;
  text: string;
}

export interface Question {
  /** Stable id, e.g. "t1-f16". Used as the key for all stored progress. */
  id: string;
  testbogen: 1 | 2 | 3;
  /** Question number as printed on the sheet (1-30). */
  number: number;
  /**
   * Groups questions that test the same underlying rule across the three
   * sheets. Lets progress single out a weak topic even though each sheet words
   * the rule differently, and lets the app surface disagreements between sheets.
   */
  topicKey: string;
  category: CategoryId;
  /**
   * One short Arabic line saying what this question is actually asking and what
   * separates the three options. Shown before answering, unlike explanationAr.
   *
   * Deliberately a description, not a translation of the German: the learner
   * has to sit the exam in German, so the app orients them without letting them
   * answer from the Arabic alone.
   */
  questionAr: string;
  options: AnswerOption[];
  /** null only when the marked answer could not be determined from the scan. */
  correct: OptionKey | null;
  /** Short Arabic explanation of why the marked option is the correct one. */
  explanationAr: string;
  /** Provenance, e.g. "Testbogen 1, Frage 16". */
  source: string;
  /**
   * True when the answer read off the scan is not trustworthy on its own --
   * a faint mark, or a sheet that disagrees with another sheet. The UI must
   * show this rather than presenting the answer as settled fact.
   */
  needsVerification?: boolean;
  /** Human-readable reason accompanying needsVerification. */
  verificationNote?: string;
}

/**
 * The sheets print no question stem: each numbered block is simply three
 * statements and the candidate marks the one that is correct. This is the
 * instruction the app shows in place of a stem -- it is presentation, not
 * source text, and is deliberately kept in one place so it never looks like an
 * extracted question.
 */
export const QUESTION_PROMPT = "Welche Aussage ist richtig?";
