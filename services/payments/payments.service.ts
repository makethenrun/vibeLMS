import "server-only";

import type { Db } from "@/lib/db/supabase";
import type { PaymentInput } from "@/lib/validators";
import type { Payment, PaymentWithStudent } from "@/types";

function normalizeComment(comment: string | undefined): string | null {
  if (!comment) return null;
  const trimmed = comment.trim();
  return trimmed === "" ? null : trimmed;
}

export async function listPayments(
  db: Db,
  options: { studentId?: string } = {},
): Promise<PaymentWithStudent[]> {
  let query = db
    .from("payments")
    .select("*")
    .order("payment_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (options.studentId) query = query.eq("student_id", options.studentId);

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  const rows = data ?? [];
  if (rows.length === 0) return [];

  const studentIds = [...new Set(rows.map((row) => row.student_id))];
  const { data: students } = await db
    .from("students")
    .select("id, full_name")
    .in("id", studentIds);
  const nameById = new Map(
    (students ?? []).map((student) => [student.id, student.full_name] as const),
  );

  return rows.map((row) => ({ ...row, studentName: nameById.get(row.student_id) ?? "—" }));
}

export async function listPaymentsForStudent(db: Db, studentId: string): Promise<Payment[]> {
  const { data } = await db
    .from("payments")
    .select("*")
    .eq("student_id", studentId)
    .order("payment_date", { ascending: false });
  return data ?? [];
}

export async function getStudentPaidTotal(db: Db, studentId: string): Promise<number> {
  const { data } = await db.from("payments").select("amount").eq("student_id", studentId);
  return (data ?? []).reduce((sum, payment) => sum + Number(payment.amount), 0);
}

export async function createPayment(db: Db, input: PaymentInput): Promise<Payment> {
  const paymentDate = new Date(input.paymentDate).toISOString().slice(0, 10);
  const { data, error } = await db
    .from("payments")
    .insert({
      student_id: input.studentId,
      amount: input.amount,
      payment_date: paymentDate,
      comment: normalizeComment(input.comment),
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function deletePayment(db: Db, id: string): Promise<void> {
  const { error } = await db.from("payments").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
