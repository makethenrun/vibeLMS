import { z } from "zod";

const loginField = z
  .string()
  .trim()
  .min(3, "Минимум 3 символа")
  .max(64, "Максимум 64 символа")
  .regex(/^[a-zA-Z0-9_.@-]+$/, "Только латиница, цифры и символы . _ - @");

const passwordField = z
  .string()
  .min(6, "Минимум 6 символов")
  .max(128, "Максимум 128 символов");

export const loginSchema = z.object({
  login: z.string().trim().min(1, "Введите логин").max(64),
  password: z.string().min(1, "Введите пароль").max(128),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    login: loginField,
    password: passwordField,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Пароли не совпадают",
    path: ["confirmPassword"],
  });
export type RegisterInput = z.infer<typeof registerSchema>;

export const credentialsSchema = z.object({
  login: loginField,
  password: passwordField,
});
export type CredentialsInput = z.infer<typeof credentialsSchema>;
