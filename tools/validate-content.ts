/**
 * Content validation. The dataset is the product here, so a defect in it is
 * worse than a bug in the UI: a learner memorising a wrong answer is the one
 * failure this app must not ship. Run with `npm run validate:content`.
 */
import { ALL_QUESTIONS } from "../data/questions";
import { CATEGORIES } from "../lib/categories";
import type { Question } from "../lib/types";

const EXPECTED_TOTAL = 150;
const EXPECTED_PER_PART = 30;
const ARABIC = /[؀-ۿ]/;

const errors: string[] = [];
const warnings: string[] = [];

function error(q: Question | null, message: string) {
  errors.push(q ? `${q.id} (${q.source}): ${message}` : message);
}

function warn(message: string) {
  warnings.push(message);
}

/* ---- per-question checks ---- */

const seenIds = new Set<string>();
const seenNumbers = new Set<number>();
const categoryIds = new Set(CATEGORIES.map((c) => c.id));

for (const q of ALL_QUESTIONS) {
  if (seenIds.has(q.id)) error(q, "duplicate question id");
  seenIds.add(q.id);

  if (seenNumbers.has(q.number)) error(q, `duplicate question number ${q.number}`);
  seenNumbers.add(q.number);

  if (q.number < 1 || q.number > EXPECTED_TOTAL) {
    error(q, `question number ${q.number} outside 1..${EXPECTED_TOTAL}`);
  }
  if (q.id !== `f${q.number}`) {
    error(q, `id should be "f${q.number}"`);
  }
  if (q.part < 1 || q.part > 5) {
    error(q, `part ${q.part} outside 1..5`);
  }
  // The source lays the parts out in blocks of 30 in question order.
  const expectedPart = Math.floor((q.number - 1) / EXPECTED_PER_PART) + 1;
  if (q.part !== expectedPart) {
    error(q, `question ${q.number} should be in Teil ${expectedPart}, not ${q.part}`);
  }
  if (!categoryIds.has(q.category)) {
    error(q, `unknown category "${q.category}"`);
  }

  if (!q.question.trim()) error(q, "question text is empty");
  if (!q.answer.trim()) error(q, "answer text is empty");
  if (!q.question.trim().endsWith("?")) {
    warn(`${q.id}: question does not end with a question mark`);
  }
  if (!q.source.trim()) error(q, "missing source");

  // The source PDF is bilingual; the app ships the German only. Any Arabic left
  // in a field means a transcription slipped through.
  if (ARABIC.test(q.question) || ARABIC.test(q.answer)) {
    error(q, "contains Arabic text, which this dataset must not carry");
  }
}

/* ---- set-level checks ---- */

if (ALL_QUESTIONS.length !== EXPECTED_TOTAL) {
  error(null, `expected ${EXPECTED_TOTAL} questions, found ${ALL_QUESTIONS.length}`);
}

for (let n = 1; n <= EXPECTED_TOTAL; n++) {
  if (!seenNumbers.has(n)) error(null, `question ${n} is missing`);
}

for (const part of [1, 2, 3, 4, 5]) {
  const count = ALL_QUESTIONS.filter((q) => q.part === part).length;
  if (count !== EXPECTED_PER_PART) {
    error(null, `Teil ${part}: expected ${EXPECTED_PER_PART} questions, found ${count}`);
  }
}

const emptyCategories = CATEGORIES.filter(
  (c) => !ALL_QUESTIONS.some((q) => q.category === c.id),
);
for (const category of emptyCategories) {
  warn(`category "${category.id}" has no questions and would show as empty`);
}

/* ---- report ---- */

console.log(`Questions:   ${ALL_QUESTIONS.length}`);
console.log(
  `Per Teil:    ${[1, 2, 3, 4, 5]
    .map((p) => ALL_QUESTIONS.filter((q) => q.part === p).length)
    .join(" / ")}`,
);
console.log("Per Thema:");
for (const category of CATEGORIES) {
  const count = ALL_QUESTIONS.filter((q) => q.category === category.id).length;
  console.log(`  ${String(count).padStart(3)}  ${category.label}`);
}
console.log("");

if (warnings.length) {
  console.log(`${warnings.length} warning(s):`);
  for (const w of warnings) console.log(`  - ${w}`);
  console.log("");
}

if (errors.length) {
  console.error(`${errors.length} error(s):`);
  for (const e of errors) console.error(`  x ${e}`);
  process.exit(1);
}

console.log("Content validation passed.");
