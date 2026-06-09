import { z } from "zod";

export const studentSchema = z.object({
  fullName: z.string().trim().min(2, "Минимум 2 символа").max(120, "Максимум 120 символов"),
  notes: z.string().trim().max(2000, "Максимум 2000 символов").optional().or(z.literal("")),
});
export type StudentInput = z.infer<typeof studentSchema>;
