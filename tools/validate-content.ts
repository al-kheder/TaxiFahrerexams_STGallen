/**
 * Content validation. The dataset is the product here, so a defect in it is
 * worse than a bug in the UI: a learner memorising a wrong answer is the one
 * failure this app must not ship. Run with `npm run validate:content`.
 */
import { ALL_QUESTIONS } from "../data/questions";
import { CATEGORIES } from "../lib/categories";
import type { Question } from "../lib/types";

const EXPECTED_PER_SHEET = 30;
const OPTION_KEYS = ["a", "b", "c"] as const;
const ARABIC = /[؀-ۿ]/;

const errors: string[] = [];
const warnings: string[] = [];

function error(q: Question | null, message: string) {
  errors.push(q ? `${q.id} (${q.source}): ${message}` : message);
}

function warn(message: string) {
  warnings.push(message);
}

/* ---- structural checks ---- */

const seenIds = new Set<string>();
const categoryIds = new Set(CATEGORIES.map((c) => c.id));

for (const q of ALL_QUESTIONS) {
  if (seenIds.has(q.id)) error(q, "duplicate question id");
  seenIds.add(q.id);

  if (q.number < 1 || q.number > EXPECTED_PER_SHEET) {
    error(q, `question number ${q.number} outside 1..${EXPECTED_PER_SHEET}`);
  }
  if (!categoryIds.has(q.category)) {
    error(q, `unknown category "${q.category}"`);
  }

  const keys = q.options.map((o) => o.key);
  if (keys.length !== 3 || OPTION_KEYS.some((k, i) => keys[i] !== k)) {
    error(q, `options must be exactly a, b, c -- got [${keys.join(", ")}]`);
  }
  for (const option of q.options) {
    if (!option.text.trim()) error(q, `option ${option.key} is empty`);
  }
  const texts = new Set(q.options.map((o) => o.text.trim()));
  if (texts.size !== q.options.length) {
    error(q, "two options have identical text");
  }

  if (q.correct !== null && !keys.includes(q.correct)) {
    error(q, `correct answer "${q.correct}" is not one of the options`);
  }
  if (q.correct === null && !q.needsVerification) {
    error(q, "has no correct answer but is not flagged needsVerification");
  }
  if (q.needsVerification && !q.verificationNote) {
    error(q, "flagged needsVerification without a verificationNote");
  }

  if (!ARABIC.test(q.explanationAr)) {
    error(q, "explanationAr contains no Arabic text");
  }
  if (q.explanationAr.length > 320) {
    warn(`${q.id}: Arabic explanation is long (${q.explanationAr.length} chars)`);
  }

  if (!ARABIC.test(q.questionAr)) {
    error(q, "questionAr contains no Arabic text");
  }
  // It is shown above the options on every card, so it has to stay one line.
  if (q.questionAr.length > 110) {
    warn(`${q.id}: Arabic question description is long (${q.questionAr.length} chars)`);
  }
  // A German key term in parentheses is deliberate -- it ties the Arabic back
  // to the word the learner will meet in the exam. Latin script anywhere else
  // means a description was left half-translated.
  const strayLatin = q.questionAr
    .replace(/\([^)]*\)/g, "")
    .replace(/ARV\s*2/g, "");
  if (/[A-Za-zÄÖÜäöüß]{4,}/.test(strayLatin)) {
    warn(`${q.id}: questionAr still contains German words outside parentheses`);
  }
  if (!q.source.trim()) error(q, "missing source");
}

/* ---- per-sheet completeness ---- */

for (const sheet of [1, 2, 3]) {
  const questions = ALL_QUESTIONS.filter((q) => q.testbogen === sheet);
  if (questions.length !== EXPECTED_PER_SHEET) {
    error(null, `Testbogen ${sheet}: expected ${EXPECTED_PER_SHEET} questions, found ${questions.length}`);
  }
  const numbers = new Set(questions.map((q) => q.number));
  for (let n = 1; n <= EXPECTED_PER_SHEET; n++) {
    if (!numbers.has(n)) error(null, `Testbogen ${sheet}: question ${n} is missing`);
  }
}

/* ---- cross-sheet agreement ----
   Questions sharing a topicKey test the same rule. Where two sheets disagree
   the app must say so, so every such group has to be flagged. */

const byTopic = new Map<string, Question[]>();
for (const q of ALL_QUESTIONS) {
  byTopic.set(q.topicKey, [...(byTopic.get(q.topicKey) ?? []), q]);
}

let topicGroups = 0;
for (const [topic, group] of byTopic) {
  if (group.length < 2) continue;
  topicGroups += 1;
  const flagged = group.filter((q) => q.needsVerification);
  if (flagged.length > 0 && flagged.length < group.length) {
    // Fine: one sheet is disputed, the others agree with each other.
    warn(
      `topic "${topic}": ${flagged.map((q) => q.id).join(", ")} flagged, ` +
        `others (${group.filter((q) => !q.needsVerification).map((q) => q.id).join(", ")}) agree`,
    );
  }
}

/* ---- report ---- */

const flaggedCount = ALL_QUESTIONS.filter((q) => q.needsVerification).length;

console.log(`Questions:      ${ALL_QUESTIONS.length}`);
console.log(`Testbogen:      ${[1, 2, 3].map((s) => ALL_QUESTIONS.filter((q) => q.testbogen === s).length).join(" / ")}`);
console.log(`Shared topics:  ${topicGroups}`);
console.log(`Needs review:   ${flaggedCount}`);
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
