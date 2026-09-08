import { describe, expect, it } from "vitest";
import { gradeSession, shuffle } from "./quiz";
import { ALL_QUESTIONS } from "@/data/questions";
import type { Question, Recall } from "./types";

function makeQuestion(overrides: Partial<Question> = {}): Question {
  return {
    id: "q1",
    number: 1,
    part: 1,
    category: "lenkzeit",
    question: "Testfrage?",
    answer: "Testantwort.",
    source: "Test",
    ...overrides,
  };
}

describe("gradeSession", () => {
  const questions = [
    makeQuestion({ id: "q1" }),
    makeQuestion({ id: "q2" }),
    makeQuestion({ id: "q3" }),
    makeQuestion({ id: "q4" }),
  ];

  it("counts self-rated recall", () => {
    const answers = new Map<string, Recall | null>([
      ["q1", "knew"],
      ["q2", "knew"],
      ["q3", "missed"],
    ]);
    const result = gradeSession(questions, answers);

    expect(result.total).toBe(4);
    expect(result.knew).toBe(2);
    expect(result.missed).toBe(1);
    expect(result.skipped).toBe(1);
    expect(result.percentage).toBe(50);
  });

  it("treats an unrated question as skipped, not as missed", () => {
    const result = gradeSession(questions, new Map());
    expect(result.skipped).toBe(4);
    expect(result.missed).toBe(0);
    expect(result.percentage).toBe(0);
  });

  it("never divides by zero on an empty session", () => {
    const result = gradeSession([], new Map());
    expect(result.total).toBe(0);
    expect(result.percentage).toBe(0);
  });
});

describe("shuffle", () => {
  it("keeps every element exactly once", () => {
    const input = Array.from({ length: 50 }, (_, i) => i);
    const out = shuffle(input);
    expect(out).toHaveLength(input.length);
    expect([...out].sort((a, b) => a - b)).toEqual(input);
  });

  it("does not mutate the input", () => {
    const input = [1, 2, 3, 4, 5];
    shuffle(input);
    expect(input).toEqual([1, 2, 3, 4, 5]);
  });
});

describe("the real question set", () => {
  it("has 150 questions across five parts", () => {
    expect(ALL_QUESTIONS).toHaveLength(150);
    for (const part of [1, 2, 3, 4, 5]) {
      expect(ALL_QUESTIONS.filter((q) => q.part === part)).toHaveLength(30);
    }
  });

  it("numbers the questions 1..150 without gaps or duplicates", () => {
    const numbers = ALL_QUESTIONS.map((q) => q.number).sort((a, b) => a - b);
    expect(numbers).toEqual(Array.from({ length: 150 }, (_, i) => i + 1));
  });

  it("gives every question a non-empty question and answer", () => {
    for (const q of ALL_QUESTIONS) {
      expect(q.question.trim().length, `${q.id} question`).toBeGreaterThan(0);
      expect(q.answer.trim().length, `${q.id} answer`).toBeGreaterThan(0);
      expect(q.question.trim().endsWith("?"), `${q.id} should be a question`).toBe(true);
    }
  });

  it("carries no leftover Arabic from the source document", () => {
    for (const q of ALL_QUESTIONS) {
      expect(q.question, `${q.id} question`).not.toMatch(/[؀-ۿ]/);
      expect(q.answer, `${q.id} answer`).not.toMatch(/[؀-ۿ]/);
    }
  });

  it("uses unique ids", () => {
    expect(new Set(ALL_QUESTIONS.map((q) => q.id)).size).toBe(150);
  });
});
