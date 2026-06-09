"use server";

import { revalidatePath } from "next/cache";

import { getTutorOrNull } from "@/lib/auth/guards";
import { hashPassword } from "@/lib/auth/password";
import { createServerSupabaseClient } from "@/lib/db/supabase";
import {
  credentialsSchema,
  studentSchema,
  type CredentialsInput,
  type StudentInput,
} from "@/lib/validators";
import { fail, getErrorMessage, ok, type ActionResult } from "@/lib/utils/action-result";
import {
  createStudent,
  getStudent,
  getUserIdByLogin,
  issueStudentCredentials,
  setStudentArchived,
  updateStudent,
} from "@/services/students/students.service";

export async function createStudentAction(input: StudentInput): Promise<ActionResult> {
  const tutor = await getTutorOrNull();
  if (!tutor) return fail("Недостаточно прав");

  const parsed = studentSchema.safeParse(input);
  if (!parsed.success) return fail("Проверьте поля", parsed.error.flatten().fieldErrors);

  const db = createServerSupabaseClient();
  try {
    await createStudent(db, parsed.data);
  } catch (error) {
    return fail(getErrorMessage(error));
  }

  revalidatePath("/students");
  return ok();
}

export async function updateStudentAction(
  id: string,
  input: StudentInput,
): Promise<ActionResult> {
  const tutor = await getTutorOrNull();
  if (!tutor) return fail("Недостаточно прав");

  const parsed = studentSchema.safeParse(input);
  if (!parsed.success) return fail("Проверьте поля", parsed.error.flatten().fieldErrors);

  const db = createServerSupabaseClient();
  try {
    await updateStudent(db, id, parsed.data);
  } catch (error) {
    return fail(getErrorMessage(error));
  }

  revalidatePath("/students");
  revalidatePath(`/students/${id}`);
  return ok();
}

export async function archiveStudentAction(
  id: string,
  archived: boolean,
): Promise<ActionResult> {
  const tutor = await getTutorOrNull();
  if (!tutor) return fail("Недостаточно прав");

  const db = createServerSupabaseClient();
  try {
    await setStudentArchived(db, id, archived);
  } catch (error) {
    return fail(getErrorMessage(error));
  }

  revalidatePath("/students");
  revalidatePath(`/students/${id}`);
  return ok();
}

export async function issueCredentialsAction(
  studentId: string,
  input: CredentialsInput,
): Promise<ActionResult> {
  const tutor = await getTutorOrNull();
  if (!tutor) return fail("Недостаточно прав");

  const parsed = credentialsSchema.safeParse(input);
  if (!parsed.success) return fail("Проверьте поля", parsed.error.flatten().fieldErrors);

  const db = createServerSupabaseClient();
  const login = parsed.data.login.toLowerCase();

  const student = await getStudent(db, studentId);
  if (!student) return fail("Ученик не найден");

  const existingUserId = await getUserIdByLogin(db, login);
  if (existingUserId && existingUserId !== student.user_id) {
    return fail("Такой логин уже занят", { login: ["Такой логин уже занят"] });
  }

  const passwordHash = await hashPassword(parsed.data.password);
  try {
    await issueStudentCredentials(db, { studentId, login, passwordHash });
  } catch (error) {
    return fail(getErrorMessage(error));
  }

  revalidatePath("/students");
  revalidatePath(`/students/${studentId}`);
  return ok();
}
