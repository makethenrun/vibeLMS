import { z } from "zod";

export const dictionaryEntrySchema = z.object({
  term: z.string().trim().min(1, "Введите слово").max(200),
  translation: z.string().trim().min(1, "Введите перевод").max(500),
  pinyin: z.string().trim().max(200).optional().or(z.literal("")),
  note: z.string().trim().max(1000).optional().or(z.literal("")),
});
export type DictionaryEntryInput = z.infer<typeof dictionaryEntrySchema>;
