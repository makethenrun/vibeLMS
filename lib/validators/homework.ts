import { z } from "zod";

// --- Server schema: authoritative, validated inside the Server Action -------
export const quizQuestionSchema = z
  .object({
    question: z.string().trim().min(1, "Введите вопрос").max(500, "Максимум 500 символов"),
    // Free-text answer — used when there are no options.
    correctAnswer: z.string().trim().max(300, "Максимум 300 символов").default(""),
    // Empty => free-text question; non-empty => multiple-choice options.
    options: z.array(z.string().trim().min(1).max(300)).max(8).default([]),
    // Correct option(s) for a CHOICE question.
    correctAnswers: z.array(z.string().trim().min(1).max(300)).max(8).default([]),
    grading: z.enum(["STRICT", "PARTIAL"]).default("STRICT"),
  })
  .superRefine((data, ctx) => {
    if (data.options.length > 0) {
      if (data.correctAnswers.length < 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Отметьте правильный вариант",
          path: ["correctAnswers"],
        });
        return;
      }
      const optionSet = new Set(data.options.map((option) => option.toLowerCase()));
      if (!data.correctAnswers.every((answer) => optionSet.has(answer.toLowerCase()))) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Правильные варианты должны быть среди вариантов ответа",
          path: ["correctAnswers"],
        });
      }
    } else if (data.correctAnswer.trim() === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Введите правильный ответ",
        path: ["correctAnswer"],
      });
    }
  });
export type QuizQuestionInput = z.infer<typeof quizQuestionSchema>;

export const homeworkSchema = z
  .object({
    lessonIds: z.array(z.string().uuid()).min(1, "Выберите хотя бы одно занятие"),
    title: z.string().trim().min(2, "Минимум 2 символа").max(160, "Максимум 160 символов"),
    type: z.enum(["FILE", "QUIZ"]),
    deadline: z.string().optional().or(z.literal("")),
    attachmentUrls: z
      .array(z.string().trim().url("Некорректная ссылка").max(1000))
      .max(5, "Не более 5 файлов")
      .default([]),
    maxAttempts: z.number().int().min(1).max(50).nullable().default(null),
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
    // For TEXT: the answer. For CHOICE: correct options, one per line.
    correctText: z.string().max(2000).default(""),
    optionsText: z.string().max(2000).default(""),
    grading: z.enum(["STRICT", "PARTIAL"]).default("STRICT"),
  })
  .superRefine((data, ctx) => {
    if (data.kind === "TEXT") {
      if (data.correctText.trim() === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Укажите правильный ответ",
          path: ["correctText"],
        });
      }
      return;
    }
    const splitLines = (value: string) =>
      value
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line !== "");
    const options = splitLines(data.optionsText);
    const correct = splitLines(data.correctText);
    if (options.length < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Добавьте минимум 2 варианта (по одному на строку)",
        path: ["optionsText"],
      });
    }
    if (correct.length < 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Укажите хотя бы один правильный вариант",
        path: ["correctText"],
      });
    } else {
      const optionSet = new Set(options.map((option) => option.toLowerCase()));
      if (!correct.every((value) => optionSet.has(value.toLowerCase()))) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Каждый правильный вариант должен быть в списке вариантов",
          path: ["correctText"],
        });
      }
    }
  });
export type HomeworkQuestionFormInput = z.infer<typeof homeworkQuestionFormSchema>;

export const homeworkFormSchema = z
  .object({
    lessonIds: z.array(z.string().uuid()).min(1, "Выберите хотя бы одно занятие"),
    title: z.string().trim().min(2, "Минимум 2 символа").max(160, "Максимум 160 символов"),
    type: z.enum(["FILE", "QUIZ"]),
    deadline: z.string().optional().or(z.literal("")),
    attachmentUrls: z
      .array(z.string().trim().url().max(1000))
      .max(5, "Не более 5 файлов")
      .default([]),
    maxAttemptsText: z.string().default(""),
    questions: z.array(homeworkQuestionFormSchema).default([]),
  })
  .superRefine((data, ctx) => {
    if (data.deadline && Number.isNaN(Date.parse(data.deadline))) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Некорректная дата", path: ["deadline"] });
    }
    if (data.maxAttemptsText.trim() !== "") {
      const value = Number(data.maxAttemptsText);
      if (!Number.isInteger(value) || value < 1 || value > 50) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Введите целое число от 1 до 50",
          path: ["maxAttemptsText"],
        });
      }
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
  fileUrls: z
    .array(z.string().trim().url("Прикрепите файл с решением"))
    .min(1, "Прикрепите хотя бы один файл")
    .max(5, "Не более 5 файлов"),
});
export type FileSubmissionInput = z.infer<typeof fileSubmissionSchema>;

export const quizSubmissionSchema = z.object({
  // Each question maps to the list of selected options (free-text => one item).
  answers: z.array(z.array(z.string().max(500))).min(1, "Ответьте на вопросы"),
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
