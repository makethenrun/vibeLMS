import { z } from "zod";

export const materialSchema = z.object({
  title: z.string().trim().min(2, "Минимум 2 символа").max(160, "Максимум 160 символов"),
  materialType: z.enum(["PDF", "DOCX", "JPG", "PNG", "WEBP", "VIDEO_LINK"], {
    errorMap: () => ({ message: "Выберите тип материала" }),
  }),
  fileUrl: z
    .string()
    .trim()
    .min(1, "Загрузите файл или укажите ссылку")
    .url("Некорректная ссылка")
    .max(1000),
});
export type MaterialInput = z.infer<typeof materialSchema>;
