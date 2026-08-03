"use client";

import type { ReactNode } from "react";

import { SubmitContext, localSubmit } from "./submit-context";

/** Wraps the player so exercises score locally without saving (teacher preview). */
export function PreviewProvider({ children }: { children: ReactNode }) {
  return <SubmitContext.Provider value={localSubmit}>{children}</SubmitContext.Provider>;
}
