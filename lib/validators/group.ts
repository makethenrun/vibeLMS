import { z } from "zod";

export const groupSchema = z.object({
  name: z.string().trim().min(2, "Минимум 2 символа").max(120, "Максимум 120 символов"),
});
export type GroupInput = z.infer<typeof groupSchema>;

export const groupMemberSchema = z.object({
  studentId: z.string().uuid("Выберите ученика"),
});
export type GroupMemberInput = z.infer<typeof groupMemberSchema>;
