/**
 * Discriminated result type returned by every Server Action so the client can
 * render success toasts or field-level validation errors without throwing.
 */
export type FieldErrors = Record<string, string[]>;

export type ActionResult<T = undefined> =
  | { success: true; data: T }
  | { success: false; error: string; fieldErrors?: FieldErrors };

export function ok<T = undefined>(data: T = undefined as T): ActionResult<T> {
  return { success: true, data };
}

export function fail(error: string, fieldErrors?: FieldErrors): ActionResult<never> {
  return { success: false, error, fieldErrors };
}

export function getErrorMessage(
  error: unknown,
  fallback = "Произошла ошибка. Попробуйте ещё раз.",
): string {
  return error instanceof Error && error.message ? error.message : fallback;
}
