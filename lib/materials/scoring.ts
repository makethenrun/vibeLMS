import type {
  GapsContent,
  ImageTaskContent,
  ItemContent,
  MatchContent,
  MaterialQuestion,
  QuizContent,
  SentenceTaskContent,
} from "@/lib/validators";

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
export interface ImageTaskAnswer {
  pairs?: Record<string, string>; // pair index → assigned word
  selected?: number[]; // SELECT_IMAGES: chosen image indices
}
export interface SentenceTaskAnswer {
  order?: string[]; // WORD_ORDER / SENTENCE_ORDER
  letters?: string[]; // WORD_FROM_LETTERS
  assign?: Record<string, number>; // SORT_COLUMNS: item → column index
  match?: Record<string, string>; // MATCH_PAIRS: left index → chosen right
}
export interface MatchAnswer {
  match: Record<string, string>; // left index → chosen right
}

const pct = (correct: number, total: number): number => (total === 0 ? 0 : Math.round((correct / total) * 100));

function orderScore(correctOrder: string[], studentOrder: string[]): number {
  const matches = correctOrder.reduce((s, w, i) => s + (norm(studentOrder[i] ?? "") === norm(w) ? 1 : 0), 0);
  return pct(matches, correctOrder.length);
}

function matchScore(pairs: { left: string; right: string }[], match: Record<string, string>): number {
  const correct = pairs.reduce((s, p, i) => s + (norm(match[String(i)] ?? "") === norm(p.right) ? 1 : 0), 0);
  return pct(correct, pairs.length);
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

export function scoreImageTask(content: ImageTaskContent, answer: ImageTaskAnswer): number {
  if (content.variant === "SELECT_IMAGES") {
    const selected = new Set(answer.selected ?? []);
    const correct = content.images.reduce((s, img, i) => s + (selected.has(i) === img.correct ? 1 : 0), 0);
    return pct(correct, content.images.length);
  }
  const ans = answer.pairs ?? {};
  const correct = content.pairs.reduce((s, p, i) => s + (norm(ans[String(i)] ?? "") === norm(p.word) ? 1 : 0), 0);
  return pct(correct, content.pairs.length);
}

export function scoreSentenceTask(content: SentenceTaskContent, answer: SentenceTaskAnswer): number {
  switch (content.variant) {
    case "WORD_ORDER":
      return orderScore(content.words, answer.order ?? []);
    case "SENTENCE_ORDER":
      return orderScore(content.sentences, answer.order ?? []);
    case "WORD_FROM_LETTERS":
      return norm((answer.letters ?? []).join("")) === norm(content.word) ? 100 : 0;
    case "SORT_COLUMNS": {
      const assign = answer.assign ?? {};
      const all = content.columns.flatMap((c) => c.items);
      const correct = content.columns.reduce(
        (s, col, ci) => s + col.items.filter((it) => Number(assign[it]) === ci).length,
        0,
      );
      return pct(correct, all.length);
    }
    case "MATCH_PAIRS":
      return matchScore(content.pairs, answer.match ?? {});
  }
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
    case "IMAGE_TASK":
      return scoreImageTask(content, answer as ImageTaskAnswer);
    case "SENTENCE_TASK":
      return scoreSentenceTask(content, answer as SentenceTaskAnswer);
    case "MATCH":
      return matchScore((content as MatchContent).pairs, (answer as MatchAnswer).match ?? {});
    case "FREE":
      return null;
    default:
      return null;
  }
}
