import { z } from "zod";
import type { MaterialItemType } from "@/lib/db/database.types";

const nonEmpty = z.string().trim().min(1, "Заполните поле");

// Discriminated-union members must be plain ZodObjects (no .superRefine), so
// cross-field checks live in a single .superRefine on the union below.
export const infoContentSchema = z.object({
  type: z.literal("INFO"),
  doc: z.record(z.unknown()), // Tiptap JSON document
});

export const choiceContentSchema = z.object({
  type: z.literal("CHOICE"),
  question: nonEmpty.max(1000),
  options: z.array(nonEmpty.max(500)).min(2, "Минимум 2 варианта").max(10),
  correct: z.array(z.number().int().nonnegative()).min(1, "Отметьте правильный ответ"),
  multiple: z.boolean(),
  grading: z.enum(["STRICT", "PARTIAL"]),
});

const blankSchema = z.object({
  index: z.number().int().positive(),
  answers: z.array(nonEmpty.max(200)).min(1, "Укажите ответ"),
  options: z.array(nonEmpty.max(200)).min(2).nullable(),
});

export const gapsContentSchema = z.object({
  type: z.literal("GAPS"),
  text: nonEmpty.max(4000),
  blanks: z.array(blankSchema).min(1, "Добавьте хотя бы один пропуск"),
});

export const freeContentSchema = z.object({
  type: z.literal("FREE"),
  prompt: nonEmpty.max(2000),
  sampleAnswer: z.string().trim().max(4000).nullable(),
});

export const matchContentSchema = z.object({
  type: z.literal("MATCH"),
  prompt: z.string().trim().max(1000).nullable(),
  pairs: z.array(z.object({ left: nonEmpty.max(300), right: nonEmpty.max(300) })).min(1, "Добавьте пару").max(20),
});

export const itemContentSchema = z
  .discriminatedUnion("type", [
    infoContentSchema,
    choiceContentSchema,
    gapsContentSchema,
    freeContentSchema,
    matchContentSchema,
  ])
  .superRefine((v, ctx) => {
    if (v.type === "CHOICE") {
      if (v.correct.some((i) => i >= v.options.length)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Правильный ответ вне списка", path: ["correct"] });
      }
      if (!v.multiple && v.correct.length !== 1) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Для одиночного выбора ровно один ответ", path: ["correct"] });
      }
    }
    if (v.type === "GAPS") {
      const placeholders = [...v.text.matchAll(/\{\{(\d+)\}\}/g)].map((m) => Number(m[1]));
      const blankIndices = new Set(v.blanks.map((b) => b.index));
      for (const p of placeholders) {
        if (!blankIndices.has(p)) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: `Пропуск {{${p}}} без ответа`, path: ["blanks"] });
        }
      }
      for (const b of v.blanks) {
        if (!placeholders.includes(b.index)) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: `Ответ ${b.index} без пропуска в тексте`, path: ["blanks"] });
        }
      }
    }
  });

export type InfoContent = z.infer<typeof infoContentSchema>;
export type ChoiceContent = z.infer<typeof choiceContentSchema>;
export type GapsContent = z.infer<typeof gapsContentSchema>;
export type FreeContent = z.infer<typeof freeContentSchema>;
export type MatchContent = z.infer<typeof matchContentSchema>;
export type ItemContent = z.infer<typeof itemContentSchema>;

export function defaultContentFor(type: MaterialItemType): ItemContent {
  switch (type) {
    case "INFO":
      return { type: "INFO", doc: { type: "doc", content: [{ type: "paragraph" }] } };
    case "CHOICE":
      return { type: "CHOICE", question: "Вопрос", options: ["Вариант 1", "Вариант 2"], correct: [0], multiple: false, grading: "STRICT" };
    case "GAPS":
      return { type: "GAPS", text: "Пример с {{1}}.", blanks: [{ index: 1, answers: ["ответ"], options: null }] };
    case "FREE":
      return { type: "FREE", prompt: "Задание", sampleAnswer: null };
    case "MATCH":
      return { type: "MATCH", prompt: null, pairs: [{ left: "A", right: "Б" }] };
  }
}
