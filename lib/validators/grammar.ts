import { z } from "zod";

export const grammarSchema = z.object({
  title: z.string().trim().min(1, "Введите заголовок").max(200, "Максимум 200 символов"),
  body: z.string().max(20000, "Слишком длинный текст").default(""),
});
export type GrammarInput = z.infer<typeof grammarSchema>;
