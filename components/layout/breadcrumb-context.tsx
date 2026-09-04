"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

import type { Breadcrumb } from "@/types";

/** Quick-jump navigation attached to a material breadcrumb. */
export interface MaterialNav {
  /** href of the breadcrumb the dropdown attaches to (the material crumb). */
  anchorHref: string;
  sections: { title: string; lessons: { title: string; href: string }[] }[];
}

interface Ctx {
  crumbs: Breadcrumb[] | null;
  nav: MaterialNav | null;
  set: (c: Breadcrumb[] | null, nav?: MaterialNav | null) => void;
}

const BreadcrumbCtx = createContext<Ctx>({ crumbs: null, nav: null, set: () => {} });

export function BreadcrumbProvider({ children }: { children: ReactNode }) {
  const [crumbs, setCrumbs] = useState<Breadcrumb[] | null>(null);
  const [nav, setNav] = useState<MaterialNav | null>(null);
  const set = (c: Breadcrumb[] | null, n: MaterialNav | null = null) => {
    setCrumbs(c);
    setNav(n);
  };
  return <BreadcrumbCtx.Provider value={{ crumbs, nav, set }}>{children}</BreadcrumbCtx.Provider>;
}

export function useBreadcrumbOverride() {
  return useContext(BreadcrumbCtx);
}

/** Render inside a page to override the header breadcrumbs (cleared on unmount). */
export function PageBreadcrumbs({ crumbs, materialNav }: { crumbs: Breadcrumb[]; materialNav?: MaterialNav }) {
  const { set } = useBreadcrumbOverride();
  const key = JSON.stringify({ crumbs, materialNav });
  useEffect(() => {
    set(crumbs, materialNav ?? null);
    return () => set(null, null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return null;
}
