import { describe, expect, it } from "vitest";
import { gradeExam, isCorrect, isGradable } from "./quiz";
import { ALL_QUESTIONS } from "@/data/questions";
import type { OptionKey, Question } from "./types";

function makeQuestion(overrides: Partial<Question> = {}): Question {
  return {
    id: "q1",
    testbogen: 1,
    number: 1,
    topicKey: "topic",
    category: "lenkzeit",
    questionAr: "سؤال تجريبي؟",
    options: [
      { key: "a", text: "A" },
      { key: "b", text: "B" },
      { key: "c", text: "C" },
    ],
    correct: "b",
    explanationAr: "شرح",
    source: "Testbogen 1, Frage 1",
    ...overrides,
  };
}

describe("isCorrect", () => {
  it("accepts the marked answer", () => {
    expect(isCorrect(makeQuestion(), "b")).toBe(true);
  });

  it("rejects any other answer", () => {
    expect(isCorrect(makeQuestion(), "a")).toBe(false);
    expect(isCorrect(makeQuestion(), "c")).toBe(false);
  });

  it("treats no answer as wrong, not as unscorable", () => {
    expect(isCorrect(makeQuestion(), null)).toBe(false);
  });

  it("refuses to score a question with no readable answer", () => {
    const q = makeQuestion({ correct: null, needsVerification: true });
    expect(isCorrect(q, "a")).toBeNull();
    expect(isCorrect(q, null)).toBeNull();
  });

  it("refuses to score a disputed question even though it has an answer", () => {
    // This is the rule that keeps a learner from being marked wrong against a
    // key that another Testbogen contradicts.
    const q = makeQuestion({ correct: "b", needsVerification: true });
    expect(isCorrect(q, "b")).toBeNull();
    expect(isCorrect(q, "a")).toBeNull();
  });
});

describe("isGradable", () => {
  it("excludes unreadable and disputed questions", () => {
    expect(isGradable(makeQuestion())).toBe(true);
    expect(isGradable(makeQuestion({ needsVerification: true }))).toBe(false);
    expect(
      isGradable(makeQuestion({ correct: null, needsVerification: true })),
    ).toBe(false);
  });
});

describe("gradeExam", () => {
  const questions = [
    makeQuestion({ id: "q1", correct: "a" }),
    makeQuestion({ id: "q2", correct: "b" }),
    makeQuestion({ id: "q3", correct: "c" }),
    makeQuestion({ id: "q4", correct: "a", needsVerification: true }),
  ];

  it("scores only the gradable questions", () => {
    const answers = new Map<string, OptionKey | null>([
      ["q1", "a"],
      ["q2", "a"],
      ["q3", "c"],
      ["q4", "a"],
    ]);
    const result = gradeExam(questions, answers);

    expect(result.scorable).toBe(3);
    expect(result.correct).toBe(2);
    expect(result.wrong).toBe(1);
    expect(result.excluded).toBe(1);
    expect(result.percentage).toBe(67);
  });

  it("counts unanswered questions but keeps them out of the excluded tally", () => {
    const result = gradeExam(questions, new Map());
    expect(result.unanswered).toBe(4);
    expect(result.excluded).toBe(1);
    expect(result.correct).toBe(0);
    expect(result.percentage).toBe(0);
  });

  it("never divides by zero when nothing is gradable", () => {
    const result = gradeExam(
      [makeQuestion({ needsVerification: true })],
      new Map([["q1", "b"]]),
    );
    expect(result.scorable).toBe(0);
    expect(result.percentage).toBe(0);
  });
});

describe("the real question set", () => {
  it("has 90 questions across three sheets", () => {
    expect(ALL_QUESTIONS).toHaveLength(90);
    for (const sheet of [1, 2, 3]) {
      expect(ALL_QUESTIONS.filter((q) => q.testbogen === sheet)).toHaveLength(30);
    }
  });

  it("gives every question three options and a resolvable answer", () => {
    for (const q of ALL_QUESTIONS) {
      expect(q.options.map((o) => o.key)).toEqual(["a", "b", "c"]);
      if (q.correct !== null) {
        expect(q.options.some((o) => o.key === q.correct)).toBe(true);
      } else {
        expect(q.needsVerification).toBe(true);
      }
    }
  });

  it("explains every question in Arabic", () => {
    for (const q of ALL_QUESTIONS) {
      expect(q.explanationAr).toMatch(/[؀-ۿ]/);
    }
  });

  it("describes every question in Arabic, before the answer is revealed", () => {
    for (const q of ALL_QUESTIONS) {
      expect(q.questionAr, `${q.id} needs an Arabic description`).toMatch(/[؀-ۿ]/);
      // Shown above the options on every card; must stay a single line.
      expect(q.questionAr.length, `${q.id} description too long`).toBeLessThan(111);
    }
  });

  it("documents every flagged question", () => {
    for (const q of ALL_QUESTIONS.filter((x) => x.needsVerification)) {
      expect(q.verificationNote, `${q.id} needs a note`).toBeTruthy();
    }
  });
});
