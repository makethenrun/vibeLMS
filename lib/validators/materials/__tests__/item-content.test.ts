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

  it("accepts an AUDIO with url and questions", () => {
    const r = itemContentSchema.safeParse({
      type: "AUDIO",
      audioUrl: "https://example.com/a.mp3",
      questions: [{ question: "q", options: ["a", "b"], correctAnswers: ["a"], correctAnswer: "", grading: "STRICT" }],
    });
    expect(r.success).toBe(true);
  });

  it("accepts an AUDIO with empty url (draft) and no questions", () => {
    expect(itemContentSchema.safeParse({ type: "AUDIO", audioUrl: "", questions: [] }).success).toBe(true);
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
    for (const t of ["INFO", "QUIZ", "GAPS", "FREE", "MATCH", "AUDIO"] as const) {
      expect(itemContentSchema.safeParse(defaultContentFor(t)).success).toBe(true);
    }
  });
});
