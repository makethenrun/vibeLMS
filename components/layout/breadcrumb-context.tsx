"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

import type { Breadcrumb } from "@/types";

interface Ctx {
  crumbs: Breadcrumb[] | null;
  set: (c: Breadcrumb[] | null) => void;
}

const BreadcrumbCtx = createContext<Ctx>({ crumbs: null, set: () => {} });

export function BreadcrumbProvider({ children }: { children: ReactNode }) {
  const [crumbs, setCrumbs] = useState<Breadcrumb[] | null>(null);
  return <BreadcrumbCtx.Provider value={{ crumbs, set: setCrumbs }}>{children}</BreadcrumbCtx.Provider>;
}

export function useBreadcrumbOverride() {
  return useContext(BreadcrumbCtx);
}

/** Render inside a page to override the header breadcrumbs (cleared on unmount). */
export function PageBreadcrumbs({ crumbs }: { crumbs: Breadcrumb[] }) {
  const { set } = useBreadcrumbOverride();
  const key = JSON.stringify(crumbs);
  useEffect(() => {
    set(crumbs);
    return () => set(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return null;
}
