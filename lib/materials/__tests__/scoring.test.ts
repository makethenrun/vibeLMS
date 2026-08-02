import { describe, expect, it } from "vitest";
import { checkItem } from "@/lib/materials/scoring";
import type { GapsContent, QuizContent } from "@/lib/validators";

const quiz: QuizContent = {
  type: "QUIZ",
  timerSeconds: null,
  questions: [
    { question: "2+2?", options: ["3", "4"], correctAnswers: ["4"], correctAnswer: "", grading: "STRICT" },
    { question: "Capital of France?", options: [], correctAnswers: [], correctAnswer: "Paris", grading: "STRICT" },
  ],
};

const gaps: GapsContent = {
  type: "GAPS",
  mode: "INPUT",
  text: "go → {{1}}, see → {{2}}",
  blanks: [
    { index: 1, answers: ["went"], options: null },
    { index: 2, answers: ["saw"], options: null },
  ],
  bank: [],
};

describe("checkItem", () => {
  it("scores a fully correct quiz as 100", () => {
    const score = checkItem(quiz, { questions: [{ selected: ["4"], text: "" }, { selected: [], text: "paris" }] });
    expect(score).toBe(100);
  });

  it("scores a half-correct quiz as 50", () => {
    const score = checkItem(quiz, { questions: [{ selected: ["3"], text: "" }, { selected: [], text: "Paris" }] });
    expect(score).toBe(50);
  });

  it("is case-insensitive for text answers", () => {
    const score = checkItem(quiz, { questions: [{ selected: ["4"], text: "" }, { selected: [], text: "  PARIS " }] });
    expect(score).toBe(100);
  });

  it("scores gaps by filled blanks", () => {
    expect(checkItem(gaps, { blanks: { "1": "went", "2": "saw" } })).toBe(100);
    expect(checkItem(gaps, { blanks: { "1": "Went", "2": "seen" } })).toBe(50);
    expect(checkItem(gaps, { blanks: {} })).toBe(0);
  });

  it("returns null for FREE (manual grading)", () => {
    expect(checkItem({ type: "FREE", prompt: "Опишите", sampleAnswer: null }, { text: "..." })).toBeNull();
  });

  it("PARTIAL grading gives partial credit for multi-choice", () => {
    const partial: QuizContent = {
      type: "QUIZ", timerSeconds: null,
      questions: [
        { question: "Pick vowels", options: ["a", "b", "e", "c"], correctAnswers: ["a", "e"], correctAnswer: "", grading: "PARTIAL" },
      ],
    };
    // one of two correct picked, no wrong → 50
    expect(checkItem(partial, { questions: [{ selected: ["a"], text: "" }] })).toBe(50);
  });
});
