import { z } from "zod";
import { itemContentSchema } from "./item-content";

const title = z.string().trim().min(2, "Минимум 2 символа").max(160, "Максимум 160 символов");

export const titleSchema = z.object({ title });
export type TitleInput = z.infer<typeof titleSchema>;

export const materialSchema = z.object({
  title,
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  coverUrl: z.string().trim().url("Некорректная ссылка").max(1000).optional().or(z.literal("")),
});
export type MaterialInput = z.infer<typeof materialSchema>;

export const itemUpsertSchema = z.object({ content: itemContentSchema });
export type ItemUpsertInput = z.infer<typeof itemUpsertSchema>;

export const itemMetaSchema = z.object({
  title: z.string().trim().max(160, "Максимум 160 символов").optional().or(z.literal("")),
  note: z.string().trim().max(2000, "Максимум 2000 символов").optional().or(z.literal("")),
  noteHidden: z.boolean().default(false),
});
export type ItemMetaInput = z.infer<typeof itemMetaSchema>;
