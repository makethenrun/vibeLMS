import type { GapsContent, ItemContent, MaterialQuestion, QuizContent } from "@/lib/validators";

const norm = (s: string): string => s.trim().toLowerCase();

// --- Answer shapes (as produced by the solve components) --------------------
export interface QuizAnswer {
  questions: { selected: string[]; text: string }[];
}
export interface GapsAnswer {
  blanks: Record<string, string>;
}
export interface FreeAnswer {
  text: string;
}

function scoreQuestion(q: MaterialQuestion, ans: { selected: string[]; text: string } | undefined): number {
  if (!ans) return 0;
  if (q.options.length > 0) {
    const correct = new Set(q.correctAnswers.map(norm));
    const selected = new Set(ans.selected.map(norm));
    if (q.grading === "STRICT") {
      const equal = correct.size === selected.size && [...correct].every((c) => selected.has(c));
      return equal ? 1 : 0;
    }
    // PARTIAL: (correct picked − wrong picked) / total correct, clamped to 0..1.
    const correctPicked = [...selected].filter((s) => correct.has(s)).length;
    const wrongPicked = [...selected].filter((s) => !correct.has(s)).length;
    if (correct.size === 0) return 0;
    return Math.max(0, Math.min(1, (correctPicked - wrongPicked) / correct.size));
  }
  return ans.text.trim() !== "" && norm(ans.text) === norm(q.correctAnswer) ? 1 : 0;
}

export function scoreQuiz(content: QuizContent, answer: QuizAnswer): number {
  if (content.questions.length === 0) return 0;
  const total = content.questions.reduce((sum, q, i) => sum + scoreQuestion(q, answer.questions[i]), 0);
  return Math.round((total / content.questions.length) * 100);
}

export function scoreGaps(content: GapsContent, answer: GapsAnswer): number {
  if (content.blanks.length === 0) return 0;
  const correct = content.blanks.reduce((sum, b) => {
    const filled = answer.blanks[String(b.index)] ?? "";
    const accepted = new Set(b.answers.map(norm));
    return sum + (accepted.has(norm(filled)) ? 1 : 0);
  }, 0);
  return Math.round((correct / content.blanks.length) * 100);
}

/**
 * Returns a 0..100 score, or null when the item is not auto-gradable
 * (FREE — manual grading) or not gradable in this phase.
 */
export function checkItem(content: ItemContent, answer: unknown): number | null {
  switch (content.type) {
    case "QUIZ":
      return scoreQuiz(content, answer as QuizAnswer);
    case "GAPS":
      return scoreGaps(content, answer as GapsAnswer);
    case "FREE":
      return null;
    default:
      return null;
  }
}
