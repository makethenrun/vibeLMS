"use client";

import { FormattedText } from "@/components/shared/formatted-text";
import { getMatchTable, wordOrderTokens, type SentenceTaskContent } from "@/lib/validators";
import { MatchColumnsSolve } from "./match-columns-solve";
import { MultiOrderSolve } from "./multi-order-solve";
import { OrderSolve } from "./order-solve";
import { SortColumnsSolve } from "./sort-columns-solve";
import { WordLettersSolve } from "./word-letters-solve";

interface Props {
  itemId: string;
  content: SentenceTaskContent;
  initialScore: number | null | undefined;
  initialAnswer?: {
    order?: string[];
    orders?: string[][];
    letters?: string[];
    assign?: Record<string, number>;
    match?: Record<string, string>;
    table?: Record<string, string>;
  };
}

export function SentenceSolve({ itemId, content, initialScore, initialAnswer }: Props) {
  const prompt = content.prompt ? <p className="text-sm"><FormattedText text={content.prompt} /></p> : null;

  switch (content.variant) {
    case "WORD_ORDER":
      return <div className="space-y-2">{prompt}<MultiOrderSolve itemId={itemId} content={content} sentences={wordOrderTokens(content)} initialScore={initialScore} initialAnswer={initialAnswer} /></div>;
    case "SENTENCE_ORDER":
      return <div className="space-y-2">{prompt}<OrderSolve itemId={itemId} content={content} tokens={content.sentences} initialScore={initialScore} initialAnswer={initialAnswer} vertical /></div>;
    case "WORD_FROM_LETTERS":
      return <div className="space-y-2">{prompt}<WordLettersSolve itemId={itemId} content={content} word={content.word} extraLetters={content.extraLetters} initialScore={initialScore} initialAnswer={initialAnswer} /></div>;
    case "SORT_COLUMNS":
      return <div className="space-y-2">{prompt}<SortColumnsSolve itemId={itemId} content={content} initialScore={initialScore} initialAnswer={initialAnswer} /></div>;
    case "MATCH_PAIRS": {
      const table = getMatchTable({ columns: content.matchColumns, rows: content.matchRows, pairs: content.pairs });
      return <div className="space-y-2">{prompt}<MatchColumnsSolve itemId={itemId} content={content} columns={table.columns} rows={table.rows} initialScore={initialScore} initialAnswer={initialAnswer} /></div>;
    }
  }
}
