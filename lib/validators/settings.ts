import { z } from "zod";

export const settingsSchema = z.object({
  organizationName: z
    .string()
    .trim()
    .min(1, "Введите название")
    .max(160, "Максимум 160 символов"),
  logoUrl: z.string().trim().url("Некорректная ссылка").max(1000).optional().or(z.literal("")),
  enabledKeyboards: z.array(z.string().max(40)).max(20).default([]),
});
export type SettingsInput = z.infer<typeof settingsSchema>;
