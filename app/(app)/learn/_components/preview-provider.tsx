"use client";

import type { ReactNode } from "react";

import { ReviewContext, SubmitContext, localSubmit } from "./submit-context";

/** Wraps the player for teacher preview/review: score locally (no save), no timer. */
export function PreviewProvider({ children }: { children: ReactNode }) {
  return (
    <SubmitContext.Provider value={localSubmit}>
      <ReviewContext.Provider value={true}>{children}</ReviewContext.Provider>
    </SubmitContext.Provider>
  );
}
