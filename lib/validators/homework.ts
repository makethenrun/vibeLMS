import { z } from "zod";

export const quizQuestionSchema = z.object({
  question: z.string().trim().min(1, "Введите вопрос").max(500, "Максимум 500 символов"),
  correctAnswer: z.string().trim().min(1, "Введите ответ").max(300, "Максимум 300 символов"),
});
export type QuizQuestionInput = z.infer<typeof quizQuestionSchema>;

export const homeworkSchema = z
  .object({
    lessonId: z.string().uuid("Выберите занятие"),
    title: z.string().trim().min(2, "Минимум 2 символа").max(160, "Максимум 160 символов"),
    type: z.enum(["FILE", "QUIZ"]),
    deadline: z.string().optional().or(z.literal("")),
    questions: z.array(quizQuestionSchema).default([]),
  })
  .superRefine((data, ctx) => {
    if (data.deadline && Number.isNaN(Date.parse(data.deadline))) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Некорректная дата",
        path: ["deadline"],
      });
    }
    if (data.type === "QUIZ") {
      if (!data.questions || data.questions.length < 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Добавьте хотя бы один вопрос",
          path: ["questions"],
        });
      }
    }
  });
export type HomeworkInput = z.infer<typeof homeworkSchema>;

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
