"use client";

import { createContext } from "react";

import { checkItem } from "@/lib/materials/scoring";
import type { ItemContent } from "@/lib/validators";
import type { Json } from "@/types";
import { submitItemAction } from "../actions";

export type SubmitItemFn = (itemId: string, answer: Json, content: ItemContent) => Promise<number | null>;

/** Default: persist via the server action (student mode). */
const serverSubmit: SubmitItemFn = async (itemId, answer) => {
  const result = await submitItemAction(itemId, answer);
  if (!result.success) throw new Error(result.error);
  return result.data.score;
};

/** Teacher preview: score locally, nothing is saved. */
export const localSubmit: SubmitItemFn = async (_itemId, answer, content) => checkItem(content, answer);

export const SubmitContext = createContext<SubmitItemFn>(serverSubmit);

/** True when a teacher is viewing/previewing (no timer, answers shown read-only). */
export const ReviewContext = createContext(false);
