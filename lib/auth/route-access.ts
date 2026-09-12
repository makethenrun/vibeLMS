/**
 * Lightweight route-access helpers shared by middleware (Edge runtime) and the
 * app. Intentionally free of heavy imports so the Edge bundle stays small.
 */
export const AUTH_ROUTES = ["/login", "/register"] as const;

// Paths students may not open. (/payments is intentionally excluded — students
// have their own payments view; role access is enforced by the page itself.)
export const TUTOR_ONLY_PREFIXES = [
  "/students",
  "/assistants",
  "/groups",
  "/materials",
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
