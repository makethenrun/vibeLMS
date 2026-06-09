import { z } from "zod";

const dateTimeString = z
  .string()
  .min(1, "Укажите дату и время")
  .refine((value) => !Number.isNaN(Date.parse(value)), "Некорректная дата");

export const lessonSchema = z
  .object({
    title: z.string().trim().min(2, "Минимум 2 символа").max(160, "Максимум 160 символов"),
    groupId: z.string().uuid("Выберите группу"),
    startTime: dateTimeString,
    endTime: dateTimeString,
    meetingUrl: z
      .string()
      .trim()
      .url("Некорректная ссылка")
      .max(500)
      .optional()
      .or(z.literal("")),
    status: z.enum(["SCHEDULED", "COMPLETED", "CANCELLED"]),
  })
  .refine((data) => Date.parse(data.endTime) > Date.parse(data.startTime), {
    message: "Окончание должно быть позже начала",
    path: ["endTime"],
  });
export type LessonInput = z.infer<typeof lessonSchema>;
