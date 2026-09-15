"use client";

import { createContext, useContext, type ReactNode } from "react";

/** Enabled extra-keyboard ids (from Settings), available to any editor descendant. */
const EnabledKeyboardsContext = createContext<string[]>([]);

export function EnabledKeyboardsProvider({ value, children }: { value: string[]; children: ReactNode }) {
  return <EnabledKeyboardsContext.Provider value={value}>{children}</EnabledKeyboardsContext.Provider>;
}

export function useEnabledKeyboards(): string[] {
  return useContext(EnabledKeyboardsContext);
}
