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

  it("scores IMAGE_TASK pair variants and select-images", () => {
    const pairTask = {
      type: "IMAGE_TASK" as const, variant: "TYPE_WORD" as const, prompt: null,
      pairs: [{ imageUrl: "a", word: "apple" }, { imageUrl: "b", word: "banana" }], distractors: [], images: [],
    };
    expect(checkItem(pairTask, { pairs: { "0": "apple", "1": "banana" } })).toBe(100);
    expect(checkItem(pairTask, { pairs: { "0": "apple", "1": "cherry" } })).toBe(50);

    const selTask = {
      type: "IMAGE_TASK" as const, variant: "SELECT_IMAGES" as const, prompt: null,
      pairs: [], distractors: [],
      images: [{ imageUrl: "a", correct: true }, { imageUrl: "b", correct: false }, { imageUrl: "c", correct: true }],
    };
    expect(checkItem(selTask, { selected: [0, 2] })).toBe(100);
    expect(checkItem(selTask, { selected: [0, 1, 2] })).toBe(67); // one wrong pick
  });

  it("scores SENTENCE_TASK variants", () => {
    const base = { type: "SENTENCE_TASK" as const, prompt: null, words: [] as string[], sentences: [] as string[], word: "", extraLetters: "", columns: [] as { title: string; items: string[] }[], pairs: [] as { left: string; right: string }[] };
    expect(checkItem({ ...base, variant: "WORD_ORDER", words: ["I", "like", "tea"] }, { order: ["I", "like", "tea"] })).toBe(100);
    expect(checkItem({ ...base, variant: "WORD_ORDER", words: ["I", "like", "tea"] }, { order: ["like", "I", "tea"] })).toBe(33);
    expect(checkItem({ ...base, variant: "WORD_FROM_LETTERS", word: "cat" }, { letters: ["c", "a", "t"] })).toBe(100);
    expect(checkItem({ ...base, variant: "MATCH_PAIRS", pairs: [{ left: "dog", right: "собака" }] }, { match: { "0": "собака" } })).toBe(100);
    expect(checkItem(
      { ...base, variant: "SORT_COLUMNS", columns: [{ title: "V", items: ["run"] }, { title: "N", items: ["cat"] }] },
      { assign: { run: 0, cat: 1 } },
    )).toBe(100);
  });

  it("scores old MATCH", () => {
    expect(checkItem(
      { type: "MATCH", prompt: null, pairs: [{ left: "a", right: "b" }] },
      { match: { "0": "b" } },
    )).toBe(100);
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
