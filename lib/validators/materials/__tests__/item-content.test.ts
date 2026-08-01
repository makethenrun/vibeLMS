import { describe, expect, it } from "vitest";
import { itemContentSchema, defaultContentFor } from "@/lib/validators/materials/item-content";

describe("itemContentSchema", () => {
  it("accepts a QUIZ with a choice question", () => {
    const r = itemContentSchema.safeParse({
      type: "QUIZ",
      questions: [
        { question: "2+2?", options: ["3", "4"], correctAnswers: ["4"], correctAnswer: "", grading: "STRICT" },
      ],
    });
    expect(r.success).toBe(true);
  });

  it("accepts a QUIZ with a free-text question", () => {
    const r = itemContentSchema.safeParse({
      type: "QUIZ",
      questions: [{ question: "Столица?", options: [], correctAnswers: [], correctAnswer: "Москва", grading: "STRICT" }],
    });
    expect(r.success).toBe(true);
  });

  it("rejects a QUIZ choice question whose correct answer isn't an option", () => {
    const r = itemContentSchema.safeParse({
      type: "QUIZ",
      questions: [{ question: "q", options: ["a", "b"], correctAnswers: ["z"], correctAnswer: "", grading: "STRICT" }],
    });
    expect(r.success).toBe(false);
  });

  it("rejects a QUIZ with zero questions", () => {
    expect(itemContentSchema.safeParse({ type: "QUIZ", questions: [] }).success).toBe(false);
  });

  it("accepts a QUIZ with a timer", () => {
    const r = itemContentSchema.safeParse({
      type: "QUIZ",
      timerSeconds: 300,
      questions: [{ question: "q", options: [], correctAnswers: [], correctAnswer: "a", grading: "STRICT" }],
    });
    expect(r.success).toBe(true);
  });

  it("accepts GAPS SELECT when answers are within per-blank options", () => {
    const r = itemContentSchema.safeParse({
      type: "GAPS", mode: "SELECT", text: "a {{1}}",
      blanks: [{ index: 1, answers: ["went"], options: ["went", "goed"] }], bank: [],
    });
    expect(r.success).toBe(true);
  });

  it("rejects GAPS SELECT when a blank has no options", () => {
    const r = itemContentSchema.safeParse({
      type: "GAPS", mode: "SELECT", text: "a {{1}}",
      blanks: [{ index: 1, answers: ["went"], options: null }], bank: [],
    });
    expect(r.success).toBe(false);
  });

  it("accepts GAPS DRAG when every answer is in the bank", () => {
    const r = itemContentSchema.safeParse({
      type: "GAPS", mode: "DRAG", text: "a {{1}} b {{2}}",
      blanks: [{ index: 1, answers: ["went"], options: null }, { index: 2, answers: ["saw"], options: null }],
      bank: ["went", "saw", "run"],
    });
    expect(r.success).toBe(true);
  });

  it("rejects GAPS DRAG when an answer is missing from the bank", () => {
    const r = itemContentSchema.safeParse({
      type: "GAPS", mode: "DRAG", text: "a {{1}}",
      blanks: [{ index: 1, answers: ["went"], options: null }], bank: ["saw"],
    });
    expect(r.success).toBe(false);
  });

  it("accepts an audio-only AUDIO item", () => {
    expect(itemContentSchema.safeParse({ type: "AUDIO", audioUrl: "https://example.com/a.mp3" }).success).toBe(true);
  });

  it("accepts an IMAGE_TASK (pairs variant) and select-images variant", () => {
    expect(itemContentSchema.safeParse({
      type: "IMAGE_TASK", variant: "TYPE_WORD", prompt: null,
      pairs: [{ imageUrl: "https://ex.com/a.png", word: "apple" }], distractors: [], images: [],
    }).success).toBe(true);
    expect(itemContentSchema.safeParse({
      type: "IMAGE_TASK", variant: "SELECT_IMAGES", prompt: "Выберите",
      pairs: [], distractors: [], images: [{ imageUrl: "https://ex.com/a.png", correct: true }],
    }).success).toBe(true);
  });

  it("accepts VIDEO / IMAGE / CAROUSEL / LINK", () => {
    expect(itemContentSchema.safeParse({ type: "VIDEO", url: "https://youtu.be/x" }).success).toBe(true);
    expect(itemContentSchema.safeParse({ type: "IMAGE", url: "https://ex.com/i.png", caption: null }).success).toBe(true);
    expect(itemContentSchema.safeParse({ type: "CAROUSEL", images: [{ url: "https://ex.com/i.png", caption: "1" }] }).success).toBe(true);
    expect(itemContentSchema.safeParse({ type: "LINK", url: "https://ex.com", label: "Открыть" }).success).toBe(true);
  });

  it("accepts GAPS with matching blank indices", () => {
    const r = itemContentSchema.safeParse({
      type: "GAPS",
      text: "go -> {{1}}, see -> {{2}}",
      blanks: [
        { index: 1, answers: ["went"], options: null },
        { index: 2, answers: ["saw"], options: ["saw", "seen"] },
      ],
    });
    expect(r.success).toBe(true);
  });

  it("rejects GAPS when a placeholder has no matching blank", () => {
    const r = itemContentSchema.safeParse({
      type: "GAPS", text: "a {{1}} b {{2}}",
      blanks: [{ index: 1, answers: ["x"], options: null }],
    });
    expect(r.success).toBe(false);
  });

  it("accepts MATCH with >=1 pair", () => {
    const r = itemContentSchema.safeParse({
      type: "MATCH", prompt: null, pairs: [{ left: "dog", right: "собака" }],
    });
    expect(r.success).toBe(true);
  });

  it("rejects MATCH with zero pairs", () => {
    expect(itemContentSchema.safeParse({ type: "MATCH", prompt: null, pairs: [] }).success).toBe(false);
  });

  it("accepts FREE with optional sample", () => {
    expect(itemContentSchema.safeParse({ type: "FREE", prompt: "Опишите", sampleAnswer: null }).success).toBe(true);
  });

  it("accepts INFO with a doc object", () => {
    expect(itemContentSchema.safeParse({ type: "INFO", doc: { type: "doc", content: [] } }).success).toBe(true);
  });

  it("defaultContentFor returns valid content for each type", () => {
    for (const t of ["INFO", "QUIZ", "GAPS", "FREE", "MATCH", "AUDIO", "VIDEO", "IMAGE", "CAROUSEL", "LINK", "IMAGE_TASK"] as const) {
      expect(itemContentSchema.safeParse(defaultContentFor(t)).success).toBe(true);
    }
  });
});
