// Shared answer-normalisation + feedback styling used by the solve components
// to colour answers green (correct) / red (wrong) after checking.

// Inline formatting tags ([b]/[i]/[u]/[c=…]) must not affect correctness.
const FORMAT_TAG = /\[\/?(?:b|i|u)\]|\[c=#[0-9a-fA-F]{3,8}\]|\[\/c\]/g;

export const normAnswer = (s: string): string => s.replace(FORMAT_TAG, "").trim().toLowerCase();

/** True if `value` matches any of the accepted answers. */
export function isCorrect(value: string | undefined | null, accepted: string[]): boolean {
  const v = normAnswer(value ?? "");
  return accepted.some((a) => normAnswer(a) === v);
}

export const CORRECT_CLASS = "border-green-500 bg-green-50 text-green-900";
export const WRONG_CLASS = "border-red-500 bg-red-50 text-red-900";

/** Tailwind classes for answer feedback; empty string until `locked` (checked). */
export function feedbackClass(locked: boolean, correct: boolean): string {
  if (!locked) return "";
  return correct ? CORRECT_CLASS : WRONG_CLASS;
}
