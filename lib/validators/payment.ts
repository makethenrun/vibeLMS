import { z } from "zod";

export const paymentSchema = z.object({
  studentId: z.string().uuid("Выберите ученика"),
  amount: z.coerce
    .number({ invalid_type_error: "Введите сумму" })
    .positive("Сумма должна быть больше 0")
    .max(100_000_000, "Слишком большая сумма"),
  paymentDate: z
    .string()
    .min(1, "Укажите дату")
    .refine((value) => !Number.isNaN(Date.parse(value)), "Некорректная дата"),
  comment: z.string().trim().max(500, "Максимум 500 символов").optional().or(z.literal("")),
});
export type PaymentInput = z.infer<typeof paymentSchema>;

/** A student's own payment submission: amount + number of lessons. */
export const studentPaymentSchema = z.object({
  amount: z.coerce
    .number({ invalid_type_error: "Введите сумму" })
    .positive("Сумма должна быть больше 0")
    .max(100_000_000, "Слишком большая сумма"),
  lessons: z.coerce
    .number({ invalid_type_error: "Введите количество" })
    .int("Целое число")
    .min(1, "Минимум 1 занятие")
    .max(1000, "Слишком много"),
});
export type StudentPaymentInput = z.infer<typeof studentPaymentSchema>;
