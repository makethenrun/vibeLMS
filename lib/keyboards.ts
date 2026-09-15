// Registry of optional "extra keyboards" — symbol palettes a tutor can enable
// in Settings. Pure data so both client and server can import it. Add new
// keyboards here; enable them per-organisation via settings.enabled_keyboards.

export interface KeyboardGroup {
  title: string;
  symbols: string[];
}

export interface ExtraKeyboard {
  id: string;
  label: string;
  groups: KeyboardGroup[];
}

export const EXTRA_KEYBOARDS: ExtraKeyboard[] = [
  {
    id: "ipa",
    label: "IPA (транскрипция)",
    groups: [
      { title: "Гласные", symbols: ["i", "ɪ", "e", "ɛ", "æ", "ə", "ɜ", "ʌ", "ɑ", "ɒ", "ɔ", "o", "ʊ", "u", "ɐ", "ɘ", "ɤ", "ɯ", "y", "ø", "œ", "ɶ"] },
      { title: "Дифтонги", symbols: ["eɪ", "aɪ", "ɔɪ", "aʊ", "oʊ", "əʊ", "ɪə", "eə", "ʊə"] },
      { title: "Согласные", symbols: ["ʃ", "ʒ", "θ", "ð", "ŋ", "tʃ", "dʒ", "ʔ", "ɹ", "ɾ", "r", "ɫ", "ç", "x", "ɣ", "ʁ", "ɲ", "ʎ", "ɸ", "β", "ʝ", "ɡ", "ʍ", "w", "j"] },
      { title: "Ударение и долгота", symbols: ["ˈ", "ˌ", "ː", "ˑ", "̃", "̥", "̩"] },
    ],
  },
  {
    id: "fr",
    label: "Французская",
    groups: [
      { title: "Строчные", symbols: ["à", "â", "ä", "æ", "ç", "é", "è", "ê", "ë", "î", "ï", "ô", "œ", "ù", "û", "ü", "ÿ"] },
      { title: "Прописные", symbols: ["À", "Â", "Ä", "Æ", "Ç", "É", "È", "Ê", "Ë", "Î", "Ï", "Ô", "Œ", "Ù", "Û", "Ü", "Ÿ"] },
      { title: "Знаки", symbols: ["«", "»", "€", "‘", "’", "…"] },
    ],
  },
  {
    id: "es",
    label: "Испанская",
    groups: [
      { title: "Строчные", symbols: ["á", "é", "í", "ó", "ú", "ü", "ñ"] },
      { title: "Прописные", symbols: ["Á", "É", "Í", "Ó", "Ú", "Ü", "Ñ"] },
      { title: "Знаки", symbols: ["¿", "¡", "«", "»", "€"] },
    ],
  },
  {
    id: "it",
    label: "Итальянская",
    groups: [
      { title: "Строчные", symbols: ["à", "è", "é", "ì", "í", "î", "ò", "ó", "ù", "ú"] },
      { title: "Прописные", symbols: ["À", "È", "É", "Ì", "Í", "Î", "Ò", "Ó", "Ù", "Ú"] },
      { title: "Знаки", symbols: ["«", "»", "€", "…"] },
    ],
  },
  {
    id: "de",
    label: "Немецкая",
    groups: [
      { title: "Строчные", symbols: ["ä", "ö", "ü", "ß"] },
      { title: "Прописные", symbols: ["Ä", "Ö", "Ü", "ẞ"] },
      { title: "Знаки", symbols: ["„", "“", "«", "»", "€"] },
    ],
  },
];

/** Ids that are always available in the picker (used by the settings form). */
export const ALL_KEYBOARD_IDS = EXTRA_KEYBOARDS.map((k) => k.id);
