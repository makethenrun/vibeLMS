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
