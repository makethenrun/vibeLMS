import { z } from "zod";

const login = z
  .string()
  .trim()
  .min(3, "Минимум 3 символа")
  .max(64, "Максимум 64 символа")
  .regex(/^[a-zA-Z0-9_.@-]+$/, "Только латиница, цифры и символы . _ - @");
const password = z.string().min(6, "Минимум 6 символов").max(128, "Максимум 128 символов");
const fullName = z.string().trim().min(2, "Минимум 2 символа").max(120, "Максимум 120 символов");
const notes = z.string().trim().max(2000, "Максимум 2000 символов").optional().or(z.literal(""));

/** Creating an assistant: profile + login credentials in one step. */
export const assistantSchema = z.object({ fullName, login, password, notes });
export type AssistantInput = z.infer<typeof assistantSchema>;

/** Editing an assistant's profile (credentials are managed separately). */
export const assistantProfileSchema = z.object({ fullName, notes });
export type AssistantProfileInput = z.infer<typeof assistantProfileSchema>;
