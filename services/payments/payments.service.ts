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
  const { data } = await db
    .from("payments")
    .select("amount")
    .eq("student_id", studentId)
    .eq("status", "CONFIRMED");
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

/** A student submits a payment mark that a tutor/admin will confirm. */
export async function createStudentPayment(
  db: Db,
  studentId: string,
  input: { amount: number; lessons: number },
): Promise<Payment> {
  const { data, error } = await db
    .from("payments")
    .insert({
      student_id: studentId,
      amount: input.amount,
      lessons: input.lessons,
      status: "PENDING",
      payment_date: new Date().toISOString().slice(0, 10),
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function setPaymentStatus(db: Db, id: string, status: "CONFIRMED" | "REJECTED"): Promise<void> {
  const { error } = await db.from("payments").update({ status }).eq("id", id);
  if (error) throw new Error(error.message);
}

/**
 * A student's lesson balance. `consumed` counts past, non-cancelled lessons of
 * the groups the student belongs to (deducted per scheduled lesson regardless of
 * attendance); `remaining` = paid + manual adjustments − consumed.
 */
export interface LessonBalance {
  studentId: string;
  paid: number;
  consumed: number;
  adjustments: number;
  remaining: number;
}

function buildBalance(
  studentId: string,
  paid: number,
  consumed: number,
  adjustments: number,
): LessonBalance {
  return { studentId, paid, consumed, adjustments, remaining: paid + adjustments - consumed };
}

/** Lesson balances for every student that has any payment, adjustment or lesson. */
export async function listLessonBalances(db: Db): Promise<Map<string, LessonBalance>> {
  const nowIso = new Date().toISOString();

  const { data: pays } = await db
    .from("payments")
    .select("student_id, lessons")
    .eq("status", "CONFIRMED");
  const paidByStudent = new Map<string, number>();
  for (const p of pays ?? []) {
    if (p.lessons) paidByStudent.set(p.student_id, (paidByStudent.get(p.student_id) ?? 0) + Number(p.lessons));
  }

  const { data: adjs } = await db.from("lesson_adjustments").select("student_id, delta");
  const adjByStudent = new Map<string, number>();
  for (const a of adjs ?? []) {
    adjByStudent.set(a.student_id, (adjByStudent.get(a.student_id) ?? 0) + Number(a.delta));
  }

  const { data: lessons } = await db
    .from("lessons")
    .select("group_id, status, start_time")
    .neq("status", "CANCELLED")
    .lte("start_time", nowIso);
  const pastByGroup = new Map<string, number>();
  for (const l of lessons ?? []) {
    pastByGroup.set(l.group_id, (pastByGroup.get(l.group_id) ?? 0) + 1);
  }
  const { data: members } = await db.from("group_members").select("group_id, student_id");
  const consumedByStudent = new Map<string, number>();
  for (const m of members ?? []) {
    const c = pastByGroup.get(m.group_id) ?? 0;
    if (c) consumedByStudent.set(m.student_id, (consumedByStudent.get(m.student_id) ?? 0) + c);
  }

  const ids = new Set<string>([
    ...paidByStudent.keys(),
    ...adjByStudent.keys(),
    ...consumedByStudent.keys(),
  ]);
  const out = new Map<string, LessonBalance>();
  for (const id of ids) {
    out.set(
      id,
      buildBalance(id, paidByStudent.get(id) ?? 0, consumedByStudent.get(id) ?? 0, adjByStudent.get(id) ?? 0),
    );
  }
  return out;
}

/** Lesson balance for a single student. */
export async function getStudentLessonBalance(db: Db, studentId: string): Promise<LessonBalance> {
  const nowIso = new Date().toISOString();

  const { data: pays } = await db
    .from("payments")
    .select("lessons")
    .eq("student_id", studentId)
    .eq("status", "CONFIRMED");
  const paid = (pays ?? []).reduce((sum, p) => sum + Number(p.lessons ?? 0), 0);

  const { data: adjs } = await db.from("lesson_adjustments").select("delta").eq("student_id", studentId);
  const adjustments = (adjs ?? []).reduce((sum, a) => sum + Number(a.delta), 0);

  const { data: groups } = await db.from("group_members").select("group_id").eq("student_id", studentId);
  const groupIds = (groups ?? []).map((g) => g.group_id);
  let consumed = 0;
  if (groupIds.length > 0) {
    const { data: lessons } = await db
      .from("lessons")
      .select("id")
      .neq("status", "CANCELLED")
      .lte("start_time", nowIso)
      .in("group_id", groupIds);
    consumed = (lessons ?? []).length;
  }

  return buildBalance(studentId, paid, consumed, adjustments);
}

/** Manually credit (delta > 0) or debit (delta < 0) a student's lesson balance. */
export async function addLessonAdjustment(
  db: Db,
  studentId: string,
  delta: number,
  comment?: string | null,
): Promise<void> {
  const { error } = await db
    .from("lesson_adjustments")
    .insert({ student_id: studentId, delta, comment: comment ?? null });
  if (error) throw new Error(error.message);
}

/** Pending student submissions awaiting confirmation, with student names. */
export async function listPendingPayments(db: Db): Promise<PaymentWithStudent[]> {
  const { data } = await db
    .from("payments")
    .select("*")
    .eq("status", "PENDING")
    .order("created_at", { ascending: false });
  const rows = data ?? [];
  if (rows.length === 0) return [];
  const studentIds = [...new Set(rows.map((r) => r.student_id))];
  const { data: students } = await db.from("students").select("id, full_name").in("id", studentIds);
  const nameById = new Map((students ?? []).map((s) => [s.id, s.full_name] as const));
  return rows.map((r) => ({ ...r, studentName: nameById.get(r.student_id) ?? "—" }));
}
