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
];

/** Ids that are always available in the picker (used by the settings form). */
export const ALL_KEYBOARD_IDS = EXTRA_KEYBOARDS.map((k) => k.id);
