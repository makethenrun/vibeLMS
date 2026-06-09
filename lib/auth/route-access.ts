/**
 * Lightweight route-access helpers shared by middleware (Edge runtime) and the
 * app. Intentionally free of heavy imports so the Edge bundle stays small.
 */
export const AUTH_ROUTES = ["/login", "/register"] as const;

export const TUTOR_ONLY_PREFIXES = [
  "/students",
  "/groups",
  "/payments",
  "/statistics",
  "/settings",
] as const;

export function isAuthRoute(pathname: string): boolean {
  return AUTH_ROUTES.some((route) => pathname === route);
}

export function isTutorOnlyPath(pathname: string): boolean {
  return TUTOR_ONLY_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}
