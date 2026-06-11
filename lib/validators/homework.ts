import { z } from "zod";

// --- Server schema: authoritative, validated inside the Server Action -------
export const quizQuestionSchema = z
  .object({
    question: z.string().trim().min(1, "Введите вопрос").max(500, "Максимум 500 символов"),
    correctAnswer: z.string().trim().min(1, "Введите ответ").max(300, "Максимум 300 символов"),
    // Empty => free-text question; non-empty => multiple-choice options.
    options: z.array(z.string().trim().min(1).max(300)).max(8).default([]),
  })
  .superRefine((data, ctx) => {
    if (data.options.length > 0) {
      const normalized = data.options.map((option) => option.toLowerCase());
      if (!normalized.includes(data.correctAnswer.toLowerCase())) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Правильный ответ должен совпадать с одним из вариантов",
          path: ["correctAnswer"],
        });
      }
    }
  });
export type QuizQuestionInput = z.infer<typeof quizQuestionSchema>;

export const homeworkSchema = z
  .object({
    lessonIds: z.array(z.string().uuid()).min(1, "Выберите хотя бы одно занятие"),
    title: z.string().trim().min(2, "Минимум 2 символа").max(160, "Максимум 160 символов"),
    type: z.enum(["FILE", "QUIZ"]),
    deadline: z.string().optional().or(z.literal("")),
    attachmentUrl: z
      .string()
      .trim()
      .url("Некорректная ссылка")
      .max(1000)
      .optional()
      .or(z.literal("")),
    questions: z.array(quizQuestionSchema).default([]),
  })
  .superRefine((data, ctx) => {
    if (data.deadline && Number.isNaN(Date.parse(data.deadline))) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Некорректная дата", path: ["deadline"] });
    }
    if (data.type === "QUIZ" && data.questions.length < 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Добавьте хотя бы один вопрос",
        path: ["questions"],
      });
    }
  });
export type HomeworkInput = z.infer<typeof homeworkSchema>;

// --- Client form schema: drives the create dialog, transformed before submit ---
export const homeworkQuestionFormSchema = z
  .object({
    question: z.string().trim().min(1, "Введите вопрос").max(500, "Максимум 500 символов"),
    kind: z.enum(["TEXT", "CHOICE"]),
    correctAnswer: z
      .string()
      .trim()
      .min(1, "Укажите правильный ответ")
      .max(300, "Максимум 300 символов"),
    optionsText: z.string().max(2000).default(""),
  })
  .superRefine((data, ctx) => {
    if (data.kind !== "CHOICE") return;
    const options = data.optionsText
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line !== "");
    if (options.length < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Добавьте минимум 2 варианта (по одному на строку)",
        path: ["optionsText"],
      });
    } else if (
      !options.some((option) => option.toLowerCase() === data.correctAnswer.trim().toLowerCase())
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Правильный ответ должен совпадать с одним из вариантов",
        path: ["correctAnswer"],
      });
    }
  });
export type HomeworkQuestionFormInput = z.infer<typeof homeworkQuestionFormSchema>;

export const homeworkFormSchema = z
  .object({
    lessonIds: z.array(z.string().uuid()).min(1, "Выберите хотя бы одно занятие"),
    title: z.string().trim().min(2, "Минимум 2 символа").max(160, "Максимум 160 символов"),
    type: z.enum(["FILE", "QUIZ"]),
    deadline: z.string().optional().or(z.literal("")),
    attachmentUrl: z
      .string()
      .trim()
      .url("Некорректная ссылка")
      .max(1000)
      .optional()
      .or(z.literal("")),
    questions: z.array(homeworkQuestionFormSchema).default([]),
  })
  .superRefine((data, ctx) => {
    if (data.deadline && Number.isNaN(Date.parse(data.deadline))) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Некорректная дата", path: ["deadline"] });
    }
    if (data.type === "QUIZ" && data.questions.length < 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Добавьте хотя бы один вопрос",
        path: ["questions"],
      });
    }
  });
export type HomeworkFormInput = z.infer<typeof homeworkFormSchema>;

export const fileSubmissionSchema = z.object({
  answer: z.string().trim().url("Прикрепите файл с решением"),
});
export type FileSubmissionInput = z.infer<typeof fileSubmissionSchema>;

export const quizSubmissionSchema = z.object({
  answers: z.array(z.string().max(500)).min(1, "Ответьте на вопросы"),
});
export type QuizSubmissionInput = z.infer<typeof quizSubmissionSchema>;

export const gradeSubmissionSchema = z.object({
  score: z.coerce
    .number({ invalid_type_error: "Введите число" })
    .min(0, "Минимум 0")
    .max(100, "Максимум 100"),
  comment: z.string().trim().max(1000, "Максимум 1000 символов").optional().or(z.literal("")),
});
export type GradeSubmissionInput = z.infer<typeof gradeSubmissionSchema>;
