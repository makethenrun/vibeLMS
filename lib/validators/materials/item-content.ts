import { z } from "zod";
import type { MaterialItemType } from "@/lib/db/database.types";

const nonEmpty = z.string().trim().min(1, "Заполните поле");

// --- Shared question mechanic (mirrors the homework quiz) --------------------
// A question is free-text when `options` is empty, otherwise multiple-choice.
export const materialQuestionSchema = z
  .object({
    question: z.string().trim().min(1, "Введите вопрос").max(500),
    correctAnswer: z.string().trim().max(300).default(""),
    options: z.array(nonEmpty.max(300)).max(8).default([]),
    correctAnswers: z.array(nonEmpty.max(300)).max(8).default([]),
    grading: z.enum(["STRICT", "PARTIAL"]).default("STRICT"),
  })
  .superRefine((data, ctx) => {
    if (data.options.length > 0) {
      if (data.correctAnswers.length < 1) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Отметьте правильный вариант", path: ["correctAnswers"] });
        return;
      }
      const optionSet = new Set(data.options.map((o) => o.toLowerCase()));
      if (!data.correctAnswers.every((a) => optionSet.has(a.toLowerCase()))) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Правильные варианты должны быть среди вариантов", path: ["correctAnswers"] });
      }
    } else if (data.correctAnswer.trim() === "") {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Введите правильный ответ", path: ["correctAnswer"] });
    }
  });
export type MaterialQuestion = z.infer<typeof materialQuestionSchema>;

// --- Item content types -----------------------------------------------------
// Discriminated-union members must be plain ZodObjects (no top-level
// .superRefine); cross-field checks live in the union's .superRefine below.
export const infoContentSchema = z.object({
  type: z.literal("INFO"),
  doc: z.record(z.unknown()), // Tiptap JSON document
});

export const quizContentSchema = z.object({
  type: z.literal("QUIZ"),
  // null = no timer; otherwise the student's time limit in seconds.
  timerSeconds: z.number().int().positive().max(7200).nullable().default(null),
  questions: z.array(materialQuestionSchema).min(1, "Добавьте хотя бы один вопрос"),
});

export const audioContentSchema = z.object({
  type: z.literal("AUDIO"),
  audioUrl: z.string().trim().max(1000),
});

export const videoContentSchema = z.object({
  type: z.literal("VIDEO"),
  url: z.string().trim().max(1000),
});

export const imageContentSchema = z.object({
  type: z.literal("IMAGE"),
  url: z.string().trim().max(1000),
  caption: z.string().trim().max(500).nullable(),
});

export const carouselContentSchema = z.object({
  type: z.literal("CAROUSEL"),
  images: z
    .array(z.object({ url: nonEmpty.max(1000), caption: z.string().trim().max(500).nullable() }))
    .max(20),
});

export const linkContentSchema = z.object({
  type: z.literal("LINK"),
  url: z.string().trim().max(1000),
  label: z.string().trim().max(200).nullable(),
});

const blankSchema = z.object({
  index: z.number().int().positive(),
  answers: z.array(nonEmpty.max(200)).min(1, "Укажите ответ"),
  options: z.array(nonEmpty.max(200)).min(2).nullable(),
});

export const gapsContentSchema = z.object({
  type: z.literal("GAPS"),
  // INPUT: student types · SELECT: per-blank dropdown · DRAG: shared word bank.
  mode: z.enum(["INPUT", "SELECT", "DRAG"]).default("INPUT"),
  text: nonEmpty.max(4000),
  blanks: z.array(blankSchema).min(1, "Добавьте хотя бы один пропуск"),
  // Shared pool of draggable words (answers + distractors) for DRAG mode.
  bank: z.array(nonEmpty.max(200)).max(30).default([]),
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
    quizContentSchema,
    audioContentSchema,
    videoContentSchema,
    imageContentSchema,
    carouselContentSchema,
    linkContentSchema,
    gapsContentSchema,
    freeContentSchema,
    matchContentSchema,
  ])
  .superRefine((v, ctx) => {
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

      if (v.mode === "SELECT") {
        for (const b of v.blanks) {
          if (!b.options || b.options.length < 2) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: `Пропуск ${b.index}: укажите минимум 2 варианта`, path: ["blanks"] });
          } else {
            const set = new Set(b.options.map((o) => o.toLowerCase()));
            if (!b.answers.every((a) => set.has(a.toLowerCase()))) {
              ctx.addIssue({ code: z.ZodIssueCode.custom, message: `Пропуск ${b.index}: ответ должен быть среди вариантов`, path: ["blanks"] });
            }
          }
        }
      }

      if (v.mode === "DRAG") {
        if (v.bank.length === 0) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Добавьте слова в банк для перетаскивания", path: ["bank"] });
        } else {
          const set = new Set(v.bank.map((w) => w.toLowerCase()));
          for (const b of v.blanks) {
            if (!b.answers.every((a) => set.has(a.toLowerCase()))) {
              ctx.addIssue({ code: z.ZodIssueCode.custom, message: `Пропуск ${b.index}: все ответы должны быть в банке слов`, path: ["bank"] });
            }
          }
        }
      }
    }
  });

export type InfoContent = z.infer<typeof infoContentSchema>;
export type QuizContent = z.infer<typeof quizContentSchema>;
export type AudioContent = z.infer<typeof audioContentSchema>;
export type VideoContent = z.infer<typeof videoContentSchema>;
export type ImageContent = z.infer<typeof imageContentSchema>;
export type CarouselContent = z.infer<typeof carouselContentSchema>;
export type LinkContent = z.infer<typeof linkContentSchema>;
export type GapsContent = z.infer<typeof gapsContentSchema>;
export type FreeContent = z.infer<typeof freeContentSchema>;
export type MatchContent = z.infer<typeof matchContentSchema>;
export type ItemContent = z.infer<typeof itemContentSchema>;

function defaultQuestion(): MaterialQuestion {
  return { question: "Вопрос", options: ["Вариант 1", "Вариант 2"], correctAnswers: ["Вариант 1"], correctAnswer: "", grading: "STRICT" };
}

export function defaultContentFor(type: MaterialItemType): ItemContent {
  switch (type) {
    case "INFO":
      return { type: "INFO", doc: { type: "doc", content: [{ type: "paragraph" }] } };
    case "QUIZ":
      return { type: "QUIZ", timerSeconds: null, questions: [defaultQuestion()] };
    case "AUDIO":
      return { type: "AUDIO", audioUrl: "" };
    case "VIDEO":
      return { type: "VIDEO", url: "" };
    case "IMAGE":
      return { type: "IMAGE", url: "", caption: null };
    case "CAROUSEL":
      return { type: "CAROUSEL", images: [] };
    case "LINK":
      return { type: "LINK", url: "", label: null };
    case "GAPS":
      return { type: "GAPS", mode: "INPUT", text: "Пример с {{1}}.", blanks: [{ index: 1, answers: ["ответ"], options: null }], bank: [] };
    case "FREE":
      return { type: "FREE", prompt: "Задание", sampleAnswer: null };
    case "MATCH":
      return { type: "MATCH", prompt: null, pairs: [{ left: "A", right: "Б" }] };
  }
}
