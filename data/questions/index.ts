import type { Question } from "@/lib/types";
import { testbogen1 } from "./testbogen-1";
import { testbogen2 } from "./testbogen-2";
import { testbogen3 } from "./testbogen-3";

/**
 * All extracted questions, in sheet order. Adding a fourth Testbogen means
 * adding one file and one entry here -- nothing in the UI needs to change.
 */
export const ALL_QUESTIONS: Question[] = [
  ...testbogen1,
  ...testbogen2,
  ...testbogen3,
];

export const TESTBOGEN_NUMBERS = [1, 2, 3] as const;

export { testbogen1, testbogen2, testbogen3 };
