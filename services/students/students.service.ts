import "server-only";

import type { Db } from "@/lib/db/supabase";
import type { StudentInput } from "@/lib/validators";
import type { Student, StudentWithAccount } from "@/types";

function normalizeNotes(notes: string | undefined): string | null {
  if (!notes) return null;
  const trimmed = notes.trim();
  return trimmed === "" ? null : trimmed;
}

export interface ListStudentsParams {
  includeArchived?: boolean;
  search?: string;
}

export async function listStudents(
  db: Db,
  params: ListStudentsParams = {},
): Promise<StudentWithAccount[]> {
  let query = db
    .from("students")
    .select("id, user_id, full_name, notes, is_archived, created_at")
    .order("full_name", { ascending: true });

  if (!params.includeArchived) query = query.eq("is_archived", false);
  if (params.search && params.search.trim() !== "") {
    query = query.ilike("full_name", `%${params.search.trim()}%`);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  const students = data ?? [];
  const userIds = students
    .map((student) => student.user_id)
    .filter((id): id is string => id !== null);

  const loginByUserId = new Map<string, string>();
  if (userIds.length > 0) {
    const { data: users } = await db.from("users").select("id, login").in("id", userIds);
    for (const user of users ?? []) loginByUserId.set(user.id, user.login);
  }

  return students.map((student) => ({
    ...student,
    login: student.user_id ? (loginByUserId.get(student.user_id) ?? null) : null,
  }));
}

export async function getStudent(db: Db, id: string): Promise<StudentWithAccount | null> {
  const { data } = await db.from("students").select("*").eq("id", id).maybeSingle();
  if (!data) return null;

  let login: string | null = null;
  if (data.user_id) {
    const { data: user } = await db
      .from("users")
      .select("login")
      .eq("id", data.user_id)
      .maybeSingle();
    login = user?.login ?? null;
  }

  return { ...data, login };
}

export async function createStudent(db: Db, input: StudentInput): Promise<Student> {
  const { data, error } = await db
    .from("students")
    .insert({ full_name: input.fullName, notes: normalizeNotes(input.notes) })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function updateStudent(db: Db, id: string, input: StudentInput): Promise<Student> {
  const { data, error } = await db
    .from("students")
    .update({ full_name: input.fullName, notes: normalizeNotes(input.notes) })
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function setStudentArchived(db: Db, id: string, archived: boolean): Promise<void> {
  const { error } = await db.from("students").update({ is_archived: archived }).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function getUserIdByLogin(db: Db, login: string): Promise<string | null> {
  const { data } = await db.from("users").select("id").eq("login", login).maybeSingle();
  return data?.id ?? null;
}

/** Creates or updates the login account for a student. */
export async function issueStudentCredentials(
  db: Db,
  params: { studentId: string; login: string; passwordHash: string },
): Promise<void> {
  const { data: student } = await db
    .from("students")
    .select("id, user_id")
    .eq("id", params.studentId)
    .maybeSingle();
  if (!student) throw new Error("Ученик не найден");

  if (student.user_id) {
    const { error } = await db
      .from("users")
      .update({ login: params.login, password_hash: params.passwordHash })
      .eq("id", student.user_id);
    if (error) throw new Error(error.message);
    return;
  }

  const { data: user, error } = await db
    .from("users")
    .insert({ login: params.login, password_hash: params.passwordHash, role: "STUDENT" })
    .select("id")
    .single();
  if (error || !user) throw new Error(error?.message ?? "Не удалось создать аккаунт");

  const { error: linkError } = await db
    .from("students")
    .update({ user_id: user.id })
    .eq("id", params.studentId);
  if (linkError) throw new Error(linkError.message);
}
