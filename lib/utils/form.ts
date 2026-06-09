import type { FieldValues, Path, UseFormSetError } from "react-hook-form";

import type { FieldErrors } from "@/lib/utils/action-result";

/** Maps server-side field errors from an ActionResult onto a react-hook-form. */
export function applyFieldErrors<T extends FieldValues>(
  setError: UseFormSetError<T>,
  fieldErrors?: FieldErrors,
): void {
  if (!fieldErrors) return;
  for (const [name, messages] of Object.entries(fieldErrors)) {
    if (messages && messages.length > 0) {
      setError(name as Path<T>, { message: messages[0] });
    }
  }
}
