import { describe, expect, it } from "vitest";
import { itemContentSchema, defaultContentFor } from "@/lib/validators/materials/item-content";

describe("itemContentSchema", () => {
  it("accepts a valid CHOICE", () => {
    const r = itemContentSchema.safeParse({
      type: "CHOICE",
      question: "2+2?",
      options: ["3", "4"],
      correct: [1],
      multiple: false,
      grading: "STRICT",
    });
    expect(r.success).toBe(true);
  });

  it("rejects CHOICE with a correct index out of range", () => {
    const r = itemContentSchema.safeParse({
      type: "CHOICE", question: "q", options: ["a", "b"],
      correct: [5], multiple: false, grading: "STRICT",
    });
    expect(r.success).toBe(false);
  });

  it("rejects CHOICE with no correct answer", () => {
    const r = itemContentSchema.safeParse({
      type: "CHOICE", question: "q", options: ["a", "b"],
      correct: [], multiple: false, grading: "STRICT",
    });
    expect(r.success).toBe(false);
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
    const r = itemContentSchema.safeParse({ type: "MATCH", prompt: null, pairs: [] });
    expect(r.success).toBe(false);
  });

  it("accepts FREE with optional sample", () => {
    expect(itemContentSchema.safeParse({ type: "FREE", prompt: "Опишите", sampleAnswer: null }).success).toBe(true);
  });

  it("accepts INFO with a doc object", () => {
    expect(itemContentSchema.safeParse({ type: "INFO", doc: { type: "doc", content: [] } }).success).toBe(true);
  });

  it("defaultContentFor returns valid content for each type", () => {
    for (const t of ["INFO", "CHOICE", "GAPS", "FREE", "MATCH"] as const) {
      expect(itemContentSchema.safeParse(defaultContentFor(t)).success).toBe(true);
    }
  });
});
