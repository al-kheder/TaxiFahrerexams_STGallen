import type { Question } from "@/lib/types";
import { teil1 } from "./teil-1";
import { teil2 } from "./teil-2";
import { teil3 } from "./teil-3";
import { teil4 } from "./teil-4";
import { teil5 } from "./teil-5";

/**
 * All 150 questions in source order. Adding a further Teil means adding one
 * file and one entry here -- nothing in the UI needs to change.
 */
export const ALL_QUESTIONS: Question[] = [
  ...teil1,
  ...teil2,
  ...teil3,
  ...teil4,
  ...teil5,
];

export const PARTS = [1, 2, 3, 4, 5] as const;

export { teil1, teil2, teil3, teil4, teil5 };
