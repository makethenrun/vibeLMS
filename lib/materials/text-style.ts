import type { CSSProperties } from "react";

/** Font-family choices for per-exercise styling. `value: null` = default. */
export const ITEM_FONTS: { label: string; value: string | null }[] = [
  { label: "Стандартный", value: null },
  { label: "Serif (Georgia)", value: "Georgia, 'Times New Roman', serif" },
  { label: "SimSun 宋体", value: "SimSun, '宋体', serif" },
];

/** Font-size choices (CSS values). `value: null` = default. */
export const ITEM_SIZES: { label: string; value: string | null }[] = [
  { label: "Обычный", value: null },
  ...[14, 16, 18, 20, 24, 28, 32].map((n) => ({ label: `${n}px`, value: `${n}px` })),
];

/** Build an inline style from an item's persisted font family/size. */
export function itemTextStyle(
  fontFamily: string | null,
  fontSize: string | null,
): CSSProperties | undefined {
  if (!fontFamily && !fontSize) return undefined;
  return {
    ...(fontFamily ? { fontFamily } : {}),
    ...(fontSize ? { fontSize } : {}),
  };
}
