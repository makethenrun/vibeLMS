"use server";

import { revalidatePath } from "next/cache";

import { getManagerOrNull, getStudentOrNull, getTutorOrNull } from "@/lib/auth/guards";
import { createServerSupabaseClient } from "@/lib/db/supabase";
import { paymentSchema, studentPaymentSchema, type PaymentInput, type StudentPaymentInput } from "@/lib/validators";
import { fail, getErrorMessage, ok, type ActionResult } from "@/lib/utils/action-result";
import { createPayment, createStudentPayment, deletePayment, setPaymentStatus } from "@/services/payments/payments.service";

export async function createPaymentAction(input: PaymentInput): Promise<ActionResult> {
  const tutor = await getTutorOrNull();
  if (!tutor) return fail("Недостаточно прав");

  const parsed = paymentSchema.safeParse(input);
  if (!parsed.success) return fail("Проверьте поля", parsed.error.flatten().fieldErrors);

  const db = createServerSupabaseClient();
  try {
    await createPayment(db, parsed.data);
  } catch (error) {
    return fail(getErrorMessage(error));
  }

  revalidatePath("/payments");
  revalidatePath(`/students/${parsed.data.studentId}`);
  return ok();
}

/** Student submits a payment mark (amount + lessons) for confirmation. */
export async function createStudentPaymentAction(input: StudentPaymentInput): Promise<ActionResult> {
  const student = await getStudentOrNull();
  if (!student) return fail("Недостаточно прав");

  const parsed = studentPaymentSchema.safeParse(input);
  if (!parsed.success) return fail("Проверьте поля", parsed.error.flatten().fieldErrors);

  const db = createServerSupabaseClient();
  try {
    await createStudentPayment(db, student.studentId, parsed.data);
  } catch (error) {
    return fail(getErrorMessage(error));
  }
  revalidatePath("/payments");
  return ok();
}

/** Tutor/administrator confirms or rejects a pending payment. */
export async function setPaymentStatusAction(id: string, status: "CONFIRMED" | "REJECTED"): Promise<ActionResult> {
  const manager = await getManagerOrNull();
  if (!manager) return fail("Недостаточно прав");
  if (status !== "CONFIRMED" && status !== "REJECTED") return fail("Некорректный статус");

  const db = createServerSupabaseClient();
  try {
    await setPaymentStatus(db, id, status);
  } catch (error) {
    return fail(getErrorMessage(error));
  }
  revalidatePath("/payments");
  return ok();
}

export async function deletePaymentAction(id: string): Promise<ActionResult> {
  const tutor = await getTutorOrNull();
  if (!tutor) return fail("Недостаточно прав");

  const db = createServerSupabaseClient();
  try {
    await deletePayment(db, id);
  } catch (error) {
    return fail(getErrorMessage(error));
  }

  revalidatePath("/payments");
  return ok();
}
