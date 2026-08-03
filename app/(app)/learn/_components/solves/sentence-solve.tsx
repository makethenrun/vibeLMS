"use client";

import type { SentenceTaskContent } from "@/lib/validators";
import { MatchPairsSolve } from "./match-pairs-solve";
import { OrderSolve } from "./order-solve";
import { SortColumnsSolve } from "./sort-columns-solve";
import { WordLettersSolve } from "./word-letters-solve";

interface Props {
  itemId: string;
  content: SentenceTaskContent;
  initialScore: number | null | undefined;
}

export function SentenceSolve({ itemId, content, initialScore }: Props) {
  const prompt = content.prompt ? <p className="text-sm">{content.prompt}</p> : null;

  switch (content.variant) {
    case "WORD_ORDER":
      return <div className="space-y-2">{prompt}<OrderSolve itemId={itemId} content={content} tokens={content.words} initialScore={initialScore} /></div>;
    case "SENTENCE_ORDER":
      return <div className="space-y-2">{prompt}<OrderSolve itemId={itemId} content={content} tokens={content.sentences} initialScore={initialScore} /></div>;
    case "WORD_FROM_LETTERS":
      return <div className="space-y-2">{prompt}<WordLettersSolve itemId={itemId} content={content} word={content.word} extraLetters={content.extraLetters} initialScore={initialScore} /></div>;
    case "SORT_COLUMNS":
      return <div className="space-y-2">{prompt}<SortColumnsSolve itemId={itemId} content={content} initialScore={initialScore} /></div>;
    case "MATCH_PAIRS":
      return <div className="space-y-2">{prompt}<MatchPairsSolve itemId={itemId} content={content} pairs={content.pairs} initialScore={initialScore} /></div>;
  }
}
